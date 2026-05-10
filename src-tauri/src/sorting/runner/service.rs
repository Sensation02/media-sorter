use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::domain::{JobId, JobStatus, MoveOp, SortPlan, SortPlanItem, SortSettings};
use crate::error::{AppError, AppResult};
use crate::utils::now_ms;

use super::conflict::unique_target;
use super::fingerprint::Fingerprint;
use super::fs_repo::FsRepo;
use super::job::JobControl;
use super::log::MoveLogWriter;
use super::preflight::{validate_target_within_root, verify_disk_space};

pub struct RunInput {
    pub job_id: JobId,
    pub plan: SortPlan,
    pub settings: SortSettings,
    pub dry_run: bool,
    pub fs_repo: Arc<dyn FsRepo>,
    pub log_path: PathBuf,
    pub control: Arc<JobControl>,
}

#[derive(Debug, Clone)]
pub struct JobOutcome {
    pub job_id: JobId,
    pub state: JobStatus,
    pub moved: u64,
    pub skipped: u64,
    pub errors: u64,
    pub duration_ms: u64,
}

pub fn run_sort(input: RunInput) -> JobOutcome {
    let started_at = now_ms();
    let mut counters = Counters::default();

    if let Err(_err) = run_preflight(&input) {
        return finalize(&input, JobStatus::Failed, counters, started_at);
    }

    let mut log_writer = match open_log_writer(&input) {
        Ok(writer) => writer,
        Err(_err) => return finalize(&input, JobStatus::Failed, counters, started_at),
    };

    for item in &input.plan.items {
        if input.control.is_cancelled() {
            return finalize(&input, JobStatus::Cancelled, counters, started_at);
        }

        if input.control.is_paused() {
            return finalize(&input, JobStatus::Paused, counters, started_at);
        }

        match process_item(item, &input, log_writer.as_mut()) {
            ItemOutcome::Moved => counters.moved += 1,
            ItemOutcome::Skipped => counters.skipped += 1,
            ItemOutcome::Failed => counters.errors += 1,
        }
    }

    finalize(&input, JobStatus::Done, counters, started_at)
}

#[derive(Debug, Default)]
struct Counters {
    moved: u64,
    skipped: u64,
    errors: u64,
}

#[derive(Debug)]
enum ItemOutcome {
    Moved,
    Skipped,
    Failed,
}

fn run_preflight(input: &RunInput) -> AppResult<()> {
    let root = &input.plan.root;

    for item in &input.plan.items {
        validate_target_within_root(&item.target, root)?;
    }

    if input.settings.copy && !input.dry_run {
        let required = sum_source_sizes(&input.plan.items, input.fs_repo.as_ref())?;
        let available = input
            .fs_repo
            .available_space(root)
            .map_err(AppError::from)?;
        verify_disk_space(required, available)?;
    }

    Ok(())
}

fn sum_source_sizes(items: &[SortPlanItem], fs_repo: &dyn FsRepo) -> AppResult<u64> {
    let mut total = 0_u64;

    for item in items {
        let metadata = fs_repo.metadata(&item.source).map_err(AppError::from)?;
        total = total.saturating_add(metadata.len());
    }

    Ok(total)
}

fn open_log_writer(input: &RunInput) -> AppResult<Option<MoveLogWriter>> {
    if input.dry_run {
        return Ok(None);
    }

    let writer = MoveLogWriter::open(&input.log_path).map_err(AppError::from)?;

    Ok(Some(writer))
}

fn process_item(
    item: &SortPlanItem,
    input: &RunInput,
    log_writer: Option<&mut MoveLogWriter>,
) -> ItemOutcome {
    let action = match resolve_action(item, &input.settings, input.fs_repo.as_ref()) {
        Ok(action) => action,
        Err(_) => return ItemOutcome::Failed,
    };

    match action {
        Action::Skip => ItemOutcome::Skipped,
        Action::Move { final_target } => execute_move(item, &final_target, input, log_writer),
    }
}

#[derive(Debug)]
enum Action {
    Skip,
    Move { final_target: PathBuf },
}

fn resolve_action(
    item: &SortPlanItem,
    settings: &SortSettings,
    fs_repo: &dyn FsRepo,
) -> AppResult<Action> {
    if !fs_repo.exists(&item.target) {
        return Ok(Action::Move {
            final_target: item.target.clone(),
        });
    }

    if settings.skip_duplicates && contents_match(&item.source, &item.target, fs_repo)? {
        return Ok(Action::Skip);
    }

    let final_target = unique_target(&item.target, |path| fs_repo.exists(path));

    Ok(Action::Move { final_target })
}

fn contents_match(source: &Path, target: &Path, fs_repo: &dyn FsRepo) -> AppResult<bool> {
    let source_meta = fs_repo.metadata(source).map_err(AppError::from)?;
    let target_meta = fs_repo.metadata(target).map_err(AppError::from)?;

    if source_meta.len() != target_meta.len() {
        return Ok(false);
    }

    let source_fp = Fingerprint::of(source).map_err(AppError::from)?;
    let target_fp = Fingerprint::of(target).map_err(AppError::from)?;

    Ok(source_fp == target_fp)
}

fn execute_move(
    item: &SortPlanItem,
    final_target: &Path,
    input: &RunInput,
    log_writer: Option<&mut MoveLogWriter>,
) -> ItemOutcome {
    if let Some(parent) = final_target.parent() {
        if input.fs_repo.create_dir_all(parent).is_err() {
            return ItemOutcome::Failed;
        }
    }

    if let Some(writer) = log_writer {
        if writer
            .append(&MoveOp {
                from: item.source.clone(),
                to: final_target.to_path_buf(),
                at_ms: now_ms(),
            })
            .is_err()
        {
            return ItemOutcome::Failed;
        }
    }

    if input.dry_run {
        return ItemOutcome::Moved;
    }

    if input.settings.copy {
        return run_copy(item, final_target, input);
    }

    run_move(item, final_target, input)
}

fn run_move(item: &SortPlanItem, final_target: &Path, input: &RunInput) -> ItemOutcome {
    match input.fs_repo.rename(&item.source, final_target) {
        Ok(_) => ItemOutcome::Moved,
        Err(error) if is_cross_device(&error) => fallback_move(item, final_target, input),
        Err(_) => ItemOutcome::Failed,
    }
}

fn fallback_move(item: &SortPlanItem, final_target: &Path, input: &RunInput) -> ItemOutcome {
    if input.fs_repo.copy(&item.source, final_target).is_err() {
        return ItemOutcome::Failed;
    }

    if input.fs_repo.remove_file(&item.source).is_err() {
        return ItemOutcome::Failed;
    }

    ItemOutcome::Moved
}

fn run_copy(item: &SortPlanItem, final_target: &Path, input: &RunInput) -> ItemOutcome {
    match input.fs_repo.copy(&item.source, final_target) {
        Ok(_) => ItemOutcome::Moved,
        Err(_) => ItemOutcome::Failed,
    }
}

fn is_cross_device(error: &io::Error) -> bool {
    error.kind() == io::ErrorKind::CrossesDevices
}

fn finalize(input: &RunInput, state: JobStatus, counters: Counters, started_at: i64) -> JobOutcome {
    let duration_ms = u64::try_from(now_ms() - started_at).unwrap_or(0);

    JobOutcome {
        job_id: input.job_id,
        state,
        moved: counters.moved,
        skipped: counters.skipped,
        errors: counters.errors,
        duration_ms,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{SortRuleId, SortSettings};
    use crate::sorting::runner::fs_repo::RealFsRepo;
    use std::fs::{self, File};
    use std::io::Write;
    use std::sync::Arc;
    use tempfile::tempdir;

    struct Fixture {
        _root_keepalive: tempfile::TempDir,
        source_dir: PathBuf,
        dest_root: PathBuf,
        log_path: PathBuf,
    }

    fn fixture() -> Fixture {
        let dir = tempdir().expect("tempdir");
        let source_dir = dir.path().join("src");
        let dest_root = dir.path().join("dest");
        let log_path = dir.path().join("logs").join("job.jsonl");

        fs::create_dir_all(&source_dir).expect("source dir");
        fs::create_dir_all(&dest_root).expect("dest root");

        Fixture {
            _root_keepalive: dir,
            source_dir,
            dest_root,
            log_path,
        }
    }

    fn write_file(path: &Path, bytes: &[u8]) {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("parent");
        }
        let mut file = File::create(path).expect("create");
        file.write_all(bytes).expect("write");
    }

    fn settings(copy: bool, skip_duplicates: bool) -> SortSettings {
        SortSettings {
            copy,
            skip_duplicates,
            watch_source: false,
            write_report: false,
        }
    }

    fn input(
        fixture: &Fixture,
        items: Vec<SortPlanItem>,
        settings: SortSettings,
        dry_run: bool,
    ) -> RunInput {
        RunInput {
            job_id: 42,
            plan: SortPlan {
                rule: SortRuleId::ByDate,
                root: fixture.dest_root.clone(),
                items,
            },
            settings,
            dry_run,
            fs_repo: Arc::new(RealFsRepo::new()),
            log_path: fixture.log_path.clone(),
            control: Arc::new(JobControl::new()),
        }
    }

    #[test]
    fn empty_plan_completes_with_zero_counters() {
        let fixture = fixture();
        let outcome = run_sort(input(&fixture, vec![], settings(false, true), false));

        assert!(matches!(outcome.state, JobStatus::Done));
        assert_eq!(outcome.moved, 0);
        assert_eq!(outcome.skipped, 0);
        assert_eq!(outcome.errors, 0);
    }

    #[test]
    fn single_item_moves_file_and_writes_log_entry() {
        let fixture = fixture();
        let source = fixture.source_dir.join("a.jpg");
        let target = fixture.dest_root.join("Month").join("a.jpg");
        write_file(&source, b"hello");

        let outcome = run_sort(input(
            &fixture,
            vec![SortPlanItem {
                source: source.clone(),
                target: target.clone(),
            }],
            settings(false, true),
            false,
        ));

        assert!(matches!(outcome.state, JobStatus::Done));
        assert_eq!(outcome.moved, 1);
        assert!(!source.exists());
        assert!(target.exists());

        let log_content = fs::read_to_string(&fixture.log_path).expect("log");
        assert_eq!(log_content.lines().count(), 1);
    }

    #[test]
    fn dry_run_increments_moved_but_touches_nothing() {
        let fixture = fixture();
        let source = fixture.source_dir.join("a.jpg");
        let target = fixture.dest_root.join("Month").join("a.jpg");
        write_file(&source, b"hello");

        let outcome = run_sort(input(
            &fixture,
            vec![SortPlanItem {
                source: source.clone(),
                target: target.clone(),
            }],
            settings(false, true),
            true,
        ));

        assert!(matches!(outcome.state, JobStatus::Done));
        assert_eq!(outcome.moved, 1);
        assert!(source.exists());
        assert!(!target.exists());
        assert!(!fixture.log_path.exists());
    }

    #[test]
    fn auto_rename_handles_pre_existing_target_with_different_size() {
        let fixture = fixture();
        let source = fixture.source_dir.join("a.jpg");
        let target = fixture.dest_root.join("a.jpg");
        write_file(&source, b"new content");
        write_file(&target, b"old");

        let outcome = run_sort(input(
            &fixture,
            vec![SortPlanItem {
                source: source.clone(),
                target: target.clone(),
            }],
            settings(false, true),
            false,
        ));

        let renamed = fixture.dest_root.join("a (1).jpg");

        assert!(matches!(outcome.state, JobStatus::Done));
        assert_eq!(outcome.moved, 1);
        assert!(target.exists());
        assert!(renamed.exists());
        assert!(!source.exists());
    }

    #[test]
    fn skip_duplicates_skips_byte_identical_target() {
        let fixture = fixture();
        let source = fixture.source_dir.join("a.jpg");
        let target = fixture.dest_root.join("a.jpg");
        let bytes = b"identical bytes";
        write_file(&source, bytes);
        write_file(&target, bytes);

        let outcome = run_sort(input(
            &fixture,
            vec![SortPlanItem {
                source: source.clone(),
                target: target.clone(),
            }],
            settings(false, true),
            false,
        ));

        assert!(matches!(outcome.state, JobStatus::Done));
        assert_eq!(outcome.moved, 0);
        assert_eq!(outcome.skipped, 1);
        assert!(source.exists());
        assert!(target.exists());
    }

    #[test]
    fn copy_mode_keeps_source_intact() {
        let fixture = fixture();
        let source = fixture.source_dir.join("a.jpg");
        let target = fixture.dest_root.join("Month").join("a.jpg");
        write_file(&source, b"hello");

        let outcome = run_sort(input(
            &fixture,
            vec![SortPlanItem {
                source: source.clone(),
                target: target.clone(),
            }],
            settings(true, true),
            false,
        ));

        assert!(matches!(outcome.state, JobStatus::Done));
        assert_eq!(outcome.moved, 1);
        assert!(source.exists());
        assert!(target.exists());
    }

    #[test]
    fn cancel_before_first_item_returns_cancelled_state() {
        let fixture = fixture();
        let source = fixture.source_dir.join("a.jpg");
        let target = fixture.dest_root.join("a.jpg");
        write_file(&source, b"hello");

        let run = input(
            &fixture,
            vec![SortPlanItem {
                source: source.clone(),
                target,
            }],
            settings(false, true),
            false,
        );
        run.control.request_cancel();

        let outcome = run_sort(run);

        assert!(matches!(outcome.state, JobStatus::Cancelled));
        assert_eq!(outcome.moved, 0);
        assert!(source.exists());
    }

    #[test]
    fn pause_before_first_item_returns_paused_state() {
        let fixture = fixture();
        let source = fixture.source_dir.join("a.jpg");
        let target = fixture.dest_root.join("a.jpg");
        write_file(&source, b"hello");

        let run = input(
            &fixture,
            vec![SortPlanItem {
                source: source.clone(),
                target,
            }],
            settings(false, true),
            false,
        );
        run.control.request_pause();

        let outcome = run_sort(run);

        assert!(matches!(outcome.state, JobStatus::Paused));
        assert_eq!(outcome.moved, 0);
        assert!(source.exists());
    }

    #[test]
    fn missing_source_counts_as_error_and_loop_continues() {
        let fixture = fixture();
        let missing_source = fixture.source_dir.join("missing.jpg");
        let present_source = fixture.source_dir.join("present.jpg");
        let missing_target = fixture.dest_root.join("missing.jpg");
        let present_target = fixture.dest_root.join("present.jpg");
        write_file(&present_source, b"data");

        let outcome = run_sort(input(
            &fixture,
            vec![
                SortPlanItem {
                    source: missing_source,
                    target: missing_target,
                },
                SortPlanItem {
                    source: present_source.clone(),
                    target: present_target.clone(),
                },
            ],
            settings(false, true),
            false,
        ));

        assert!(matches!(outcome.state, JobStatus::Done));
        assert_eq!(outcome.errors, 1);
        assert_eq!(outcome.moved, 1);
        assert!(present_target.exists());
    }

    #[test]
    fn target_outside_destination_root_fails_preflight() {
        let fixture = fixture();
        let source = fixture.source_dir.join("a.jpg");
        let escaping_target = fixture._root_keepalive.path().join("escape.jpg");
        write_file(&source, b"data");

        let outcome = run_sort(input(
            &fixture,
            vec![SortPlanItem {
                source: source.clone(),
                target: escaping_target.clone(),
            }],
            settings(false, true),
            false,
        ));

        assert!(matches!(outcome.state, JobStatus::Failed));
        assert_eq!(outcome.moved, 0);
        assert!(source.exists());
        assert!(!escaping_target.exists());
    }
}
