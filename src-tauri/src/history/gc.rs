use std::fs;
use std::path::Path;

use crate::domain::JobId;
use crate::error::{AppError, AppResult};
use crate::sorting::runner::job;

const MS_PER_DAY: i64 = 86_400_000;
const SUMMARY_SUFFIX: &str = ".summary.json";
const LOG_SUFFIX: &str = ".jsonl";

pub fn collect(jobs_dir: &Path, retention_days: u16, now_ms: i64) -> AppResult<u32> {
    if !jobs_dir.exists() {
        return Ok(0);
    }

    let cutoff_ms = now_ms.saturating_sub(i64::from(retention_days) * MS_PER_DAY);
    let entries = fs::read_dir(jobs_dir).map_err(AppError::from)?;
    let mut deleted = 0u32;

    for entry in entries.flatten() {
        let Some(job_id) = parse_summary_job_id(&entry.path()) else {
            continue;
        };

        if !should_delete(job_id, cutoff_ms, now_ms) {
            continue;
        }

        if delete_pair(jobs_dir, job_id) {
            deleted += 1;
        }
    }

    Ok(deleted)
}

fn should_delete(job_id: JobId, cutoff_ms: i64, now_ms: i64) -> bool {
    if job_id > now_ms {
        return false;
    }

    if job_id >= cutoff_ms {
        return false;
    }

    !job::is_active(job_id).unwrap_or(false)
}

fn parse_summary_job_id(path: &Path) -> Option<JobId> {
    let name = path.file_name()?.to_str()?;
    let stem = name.strip_suffix(SUMMARY_SUFFIX)?;

    stem.parse::<JobId>().ok()
}

fn delete_pair(jobs_dir: &Path, job_id: JobId) -> bool {
    let summary = jobs_dir.join(format!("{job_id}{SUMMARY_SUFFIX}"));
    let log = jobs_dir.join(format!("{job_id}{LOG_SUFFIX}"));

    let summary_removed = fs::remove_file(&summary).is_ok();
    let _ = fs::remove_file(&log);

    summary_removed
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;

    fn write_pair(jobs_dir: &Path, job_id: JobId) {
        let summary = jobs_dir.join(format!("{job_id}{SUMMARY_SUFFIX}"));
        let log = jobs_dir.join(format!("{job_id}{LOG_SUFFIX}"));
        File::create(&summary).unwrap().write_all(b"{}").unwrap();
        File::create(&log).unwrap().write_all(b"").unwrap();
    }

    fn pair_exists(jobs_dir: &Path, job_id: JobId) -> bool {
        jobs_dir.join(format!("{job_id}{SUMMARY_SUFFIX}")).exists()
    }

    #[test]
    fn collect_returns_zero_when_directory_missing() {
        let dir = tempdir().unwrap();
        let missing = dir.path().join("does-not-exist");

        let deleted = collect(&missing, 30, 1_000_000_000).unwrap();

        assert_eq!(deleted, 0);
    }

    #[test]
    fn collect_deletes_summary_log_pair_outside_retention_window() {
        let dir = tempdir().unwrap();
        let now = 30 * MS_PER_DAY;
        let old_job = 1_000;

        write_pair(dir.path(), old_job);

        let deleted = collect(dir.path(), 7, now).unwrap();

        assert_eq!(deleted, 1);
        assert!(!pair_exists(dir.path(), old_job));
        assert!(!dir.path().join(format!("{old_job}{LOG_SUFFIX}")).exists());
    }

    #[test]
    fn collect_keeps_summary_inside_retention_window() {
        let dir = tempdir().unwrap();
        let now = 30 * MS_PER_DAY;
        let recent_job = now - MS_PER_DAY;

        write_pair(dir.path(), recent_job);

        let deleted = collect(dir.path(), 7, now).unwrap();

        assert_eq!(deleted, 0);
        assert!(pair_exists(dir.path(), recent_job));
    }

    #[test]
    fn collect_refuses_to_delete_future_timestamps() {
        let dir = tempdir().unwrap();
        let now = 30 * MS_PER_DAY;
        let future_job = now + 1_000;

        write_pair(dir.path(), future_job);

        let deleted = collect(dir.path(), 7, now).unwrap();

        assert_eq!(deleted, 0);
        assert!(pair_exists(dir.path(), future_job));
    }

    #[test]
    fn collect_skips_active_job_even_if_old() {
        job::clear_all().unwrap();

        let dir = tempdir().unwrap();
        let now = 30 * MS_PER_DAY;
        let old_active_job: JobId = 500;

        write_pair(dir.path(), old_active_job);
        let _control = job::register(old_active_job).unwrap();

        let deleted = collect(dir.path(), 7, now).unwrap();

        assert_eq!(deleted, 0);
        assert!(pair_exists(dir.path(), old_active_job));

        job::finish(old_active_job).unwrap();
    }

    #[test]
    fn collect_ignores_non_summary_files_and_orphan_logs() {
        let dir = tempdir().unwrap();
        let now = 30 * MS_PER_DAY;

        File::create(dir.path().join("readme.txt"))
            .unwrap()
            .write_all(b"hello")
            .unwrap();
        File::create(dir.path().join("100.jsonl"))
            .unwrap()
            .write_all(b"")
            .unwrap();
        File::create(dir.path().join("100.summary.json.tmp"))
            .unwrap()
            .write_all(b"")
            .unwrap();
        File::create(dir.path().join("not-numeric.summary.json"))
            .unwrap()
            .write_all(b"{}")
            .unwrap();

        let deleted = collect(dir.path(), 7, now).unwrap();

        assert_eq!(deleted, 0);
        assert!(dir.path().join("readme.txt").exists());
        assert!(dir.path().join("100.jsonl").exists());
        assert!(dir.path().join("100.summary.json.tmp").exists());
        assert!(dir.path().join("not-numeric.summary.json").exists());
    }
}
