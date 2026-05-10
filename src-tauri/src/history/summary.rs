use std::ffi::OsString;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

use crate::domain::HistoryItem;
use crate::error::{AppError, AppResult};

pub fn write_summary(path: &Path, item: &HistoryItem) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(AppError::from)?;
    }

    let json = serde_json::to_string_pretty(item)
        .map_err(|err| AppError::internal(format!("serialize summary: {err}")))?;

    let tmp_path = temp_path(path);

    write_and_fsync(&tmp_path, json.as_bytes())?;
    fs::rename(&tmp_path, path).map_err(AppError::from)?;

    Ok(())
}

fn write_and_fsync(path: &Path, bytes: &[u8]) -> AppResult<()> {
    let mut file = File::create(path).map_err(AppError::from)?;
    file.write_all(bytes).map_err(AppError::from)?;
    file.sync_all().map_err(AppError::from)?;

    Ok(())
}

fn temp_path(path: &Path) -> PathBuf {
    let mut name = OsString::from(path.as_os_str());
    name.push(".tmp");

    PathBuf::from(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{JobId, JobStatus};
    use std::path::PathBuf;
    use tempfile::tempdir;

    fn sample(id: JobId, state: JobStatus) -> HistoryItem {
        HistoryItem {
            id,
            name: "/Users/me/Pictures".to_string(),
            destination_root: PathBuf::from("/Users/me/Pictures"),
            started_at_ms: id,
            duration_ms: 1234,
            moved: 10,
            skipped: 1,
            errors: 0,
            state,
        }
    }

    #[test]
    fn write_creates_parent_directory_if_missing() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("nested/jobs/123.summary.json");

        write_summary(&path, &sample(123, JobStatus::Done)).expect("write");

        assert!(path.exists());
    }

    #[test]
    fn written_summary_round_trips_through_serde() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("123.summary.json");

        write_summary(&path, &sample(123, JobStatus::Done)).expect("write");

        let content = fs::read_to_string(&path).expect("read");
        let parsed: HistoryItem = serde_json::from_str(&content).expect("parse");

        assert_eq!(parsed.id, 123);
        assert_eq!(parsed.moved, 10);
        assert!(matches!(parsed.state, JobStatus::Done));
    }

    #[test]
    fn second_write_overwrites_first() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("123.summary.json");

        write_summary(&path, &sample(123, JobStatus::Done)).expect("write 1");
        write_summary(&path, &sample(123, JobStatus::Reverted)).expect("write 2");

        let content = fs::read_to_string(&path).expect("read");
        let parsed: HistoryItem = serde_json::from_str(&content).expect("parse");

        assert!(matches!(parsed.state, JobStatus::Reverted));
    }

    #[test]
    fn temp_file_is_removed_after_successful_write() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("123.summary.json");

        write_summary(&path, &sample(123, JobStatus::Done)).expect("write");

        let leftover = temp_path(&path);
        assert!(!leftover.exists());
    }
}
