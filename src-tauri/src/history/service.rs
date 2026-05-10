use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use crate::domain::{HistoryItem, JobId, JobStatus, MoveOp};
use crate::error::{AppError, AppResult};

use super::dto::RevertOutcome;
use super::empty_dirs::cleanup_empty_dirs;
use super::repository::read_move_log;
use super::summary::write_summary;

pub fn revert(jobs_dir: &Path, job_id: JobId) -> AppResult<RevertOutcome> {
    let summary_path = summary_path(jobs_dir, job_id);
    let log_path = log_path(jobs_dir, job_id);

    let summary = load_summary(&summary_path)?;
    let move_ops = read_move_log(&log_path)?;

    let mut counters = Counters::default();
    let mut reverted_targets = Vec::new();

    for op in move_ops.iter().rev() {
        match revert_one(op) {
            ItemOutcome::Restored => {
                counters.restored += 1;
                reverted_targets.push(op.to.clone());
            }
            ItemOutcome::Skipped => counters.skipped += 1,
            ItemOutcome::Failed => counters.errors += 1,
        }
    }

    cleanup_empty_dirs(&reverted_targets, &summary.destination_root);

    let updated = HistoryItem {
        state: JobStatus::Reverted,
        ..summary
    };
    write_summary(&summary_path, &updated)?;

    Ok(RevertOutcome {
        job_id,
        restored: counters.restored,
        skipped: counters.skipped,
        errors: counters.errors,
    })
}

fn summary_path(jobs_dir: &Path, job_id: JobId) -> PathBuf {
    jobs_dir.join(format!("{job_id}.summary.json"))
}

fn log_path(jobs_dir: &Path, job_id: JobId) -> PathBuf {
    jobs_dir.join(format!("{job_id}.jsonl"))
}

fn load_summary(path: &Path) -> AppResult<HistoryItem> {
    let content = fs::read_to_string(path).map_err(AppError::from)?;

    serde_json::from_str(&content)
        .map_err(|err| AppError::validation(format!("malformed summary file: {err}")))
}

#[derive(Debug, Default)]
struct Counters {
    restored: u64,
    skipped: u64,
    errors: u64,
}

#[derive(Debug)]
enum ItemOutcome {
    Restored,
    Skipped,
    Failed,
}

fn revert_one(op: &MoveOp) -> ItemOutcome {
    if !op.to.exists() {
        return ItemOutcome::Skipped;
    }

    if op.from.exists() {
        return ItemOutcome::Failed;
    }

    if let Some(parent) = op.from.parent() {
        if fs::create_dir_all(parent).is_err() {
            return ItemOutcome::Failed;
        }
    }

    match fs::rename(&op.to, &op.from) {
        Ok(_) => ItemOutcome::Restored,
        Err(error) if is_cross_device(&error) => fallback_move(&op.to, &op.from),
        Err(_) => ItemOutcome::Failed,
    }
}

fn fallback_move(from: &Path, to: &Path) -> ItemOutcome {
    if fs::copy(from, to).is_err() {
        return ItemOutcome::Failed;
    }

    if fs::remove_file(from).is_err() {
        return ItemOutcome::Failed;
    }

    ItemOutcome::Restored
}

fn is_cross_device(error: &io::Error) -> bool {
    error.kind() == io::ErrorKind::CrossesDevices
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::JobStatus;
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;

    struct Fixture {
        _root_keepalive: tempfile::TempDir,
        source_dir: PathBuf,
        dest_root: PathBuf,
        jobs_dir: PathBuf,
    }

    fn fixture() -> Fixture {
        let dir = tempdir().expect("tempdir");
        let source_dir = dir.path().join("src");
        let dest_root = dir.path().join("dest");
        let jobs_dir = dir.path().join("jobs");

        fs::create_dir_all(&source_dir).expect("source");
        fs::create_dir_all(&dest_root).expect("dest");
        fs::create_dir_all(&jobs_dir).expect("jobs");

        Fixture {
            _root_keepalive: dir,
            source_dir,
            dest_root,
            jobs_dir,
        }
    }

    fn write_file(path: &Path, bytes: &[u8]) {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("parent");
        }
        let mut file = File::create(path).expect("create");
        file.write_all(bytes).expect("write");
    }

    fn seed_job(fixture: &Fixture, job_id: JobId, ops: &[MoveOp]) {
        let log = fixture.jobs_dir.join(format!("{job_id}.jsonl"));
        let mut file = File::create(&log).expect("log");
        for op in ops {
            let line = serde_json::to_string(op).expect("serialize");
            writeln!(file, "{line}").expect("write line");
        }

        let summary = HistoryItem {
            id: job_id,
            name: fixture.dest_root.display().to_string(),
            destination_root: fixture.dest_root.clone(),
            started_at_ms: job_id,
            duration_ms: 100,
            moved: ops.len() as u64,
            skipped: 0,
            errors: 0,
            state: JobStatus::Done,
        };
        write_summary(
            &fixture.jobs_dir.join(format!("{job_id}.summary.json")),
            &summary,
        )
        .expect("seed summary");
    }

    fn op(from: &Path, to: &Path) -> MoveOp {
        MoveOp {
            from: from.to_path_buf(),
            to: to.to_path_buf(),
            at_ms: 0,
        }
    }

    #[test]
    fn revert_restores_every_file_in_a_clean_job() {
        let fixture = fixture();
        let from_a = fixture.source_dir.join("a.jpg");
        let to_a = fixture.dest_root.join("Feb 2024").join("a.jpg");
        let from_b = fixture.source_dir.join("b.jpg");
        let to_b = fixture.dest_root.join("Feb 2024").join("b.jpg");
        write_file(&to_a, b"alpha");
        write_file(&to_b, b"beta");
        seed_job(&fixture, 1, &[op(&from_a, &to_a), op(&from_b, &to_b)]);

        let outcome = revert(&fixture.jobs_dir, 1).expect("revert");

        assert_eq!(outcome.restored, 2);
        assert_eq!(outcome.skipped, 0);
        assert_eq!(outcome.errors, 0);
        assert!(from_a.exists());
        assert!(from_b.exists());
        assert!(!to_a.exists());
        assert!(!to_b.exists());
    }

    #[test]
    fn revert_marks_summary_state_as_reverted() {
        let fixture = fixture();
        let from = fixture.source_dir.join("a.jpg");
        let to = fixture.dest_root.join("a.jpg");
        write_file(&to, b"data");
        seed_job(&fixture, 1, &[op(&from, &to)]);

        revert(&fixture.jobs_dir, 1).expect("revert");

        let summary_path = fixture.jobs_dir.join("1.summary.json");
        let raw = fs::read_to_string(summary_path).expect("read");
        let summary: HistoryItem = serde_json::from_str(&raw).expect("parse");
        assert!(matches!(summary.state, JobStatus::Reverted));
    }

    #[test]
    fn revert_skips_when_destination_already_missing() {
        let fixture = fixture();
        let from = fixture.source_dir.join("a.jpg");
        let to = fixture.dest_root.join("a.jpg");
        seed_job(&fixture, 1, &[op(&from, &to)]);

        let outcome = revert(&fixture.jobs_dir, 1).expect("revert");

        assert_eq!(outcome.skipped, 1);
        assert_eq!(outcome.restored, 0);
    }

    #[test]
    fn revert_fails_when_source_path_already_present() {
        let fixture = fixture();
        let from = fixture.source_dir.join("a.jpg");
        let to = fixture.dest_root.join("a.jpg");
        write_file(&to, b"moved");
        write_file(&from, b"manually-restored");
        seed_job(&fixture, 1, &[op(&from, &to)]);

        let outcome = revert(&fixture.jobs_dir, 1).expect("revert");

        assert_eq!(outcome.errors, 1);
        assert_eq!(outcome.restored, 0);
        assert!(from.exists());
        assert!(to.exists());
    }

    #[test]
    fn second_revert_is_idempotent_no_op() {
        let fixture = fixture();
        let from = fixture.source_dir.join("a.jpg");
        let to = fixture.dest_root.join("a.jpg");
        write_file(&to, b"data");
        seed_job(&fixture, 1, &[op(&from, &to)]);

        let first = revert(&fixture.jobs_dir, 1).expect("first revert");
        let second = revert(&fixture.jobs_dir, 1).expect("second revert");

        assert_eq!(first.restored, 1);
        assert_eq!(second.restored, 0);
        assert_eq!(second.skipped, 1);
    }

    #[test]
    fn revert_cleans_empty_destination_directories() {
        let fixture = fixture();
        let from = fixture.source_dir.join("a.jpg");
        let nested_dir = fixture.dest_root.join("Feb 2024").join("Paris");
        let to = nested_dir.join("a.jpg");
        write_file(&to, b"data");
        seed_job(&fixture, 1, &[op(&from, &to)]);

        revert(&fixture.jobs_dir, 1).expect("revert");

        assert!(!nested_dir.exists());
        assert!(!fixture.dest_root.join("Feb 2024").exists());
        assert!(fixture.dest_root.exists());
    }

    #[test]
    fn revert_preserves_directories_that_still_have_user_content() {
        let fixture = fixture();
        let from = fixture.source_dir.join("a.jpg");
        let nested_dir = fixture.dest_root.join("Feb 2024").join("Paris");
        let to = nested_dir.join("a.jpg");
        write_file(&to, b"data");
        write_file(
            &fixture.dest_root.join("Feb 2024").join("notes.txt"),
            b"keep me",
        );
        seed_job(&fixture, 1, &[op(&from, &to)]);

        revert(&fixture.jobs_dir, 1).expect("revert");

        assert!(!nested_dir.exists());
        assert!(fixture.dest_root.join("Feb 2024").exists());
        assert!(fixture
            .dest_root
            .join("Feb 2024")
            .join("notes.txt")
            .exists());
    }

    #[test]
    fn revert_returns_validation_error_for_missing_summary() {
        let fixture = fixture();

        let result = revert(&fixture.jobs_dir, 999);

        assert!(matches!(result, Err(AppError::Io { .. })));
    }
}
