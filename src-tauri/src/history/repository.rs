use std::cmp::Reverse;
use std::fs;
use std::path::Path;

use crate::domain::{HistoryItem, MoveOp};
use crate::error::{AppError, AppResult};

const SUMMARY_SUFFIX: &str = ".summary.json";
pub const HISTORY_LIMIT: usize = 50;

pub fn list_summaries(jobs_dir: &Path) -> AppResult<Vec<HistoryItem>> {
    if !jobs_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(jobs_dir).map_err(AppError::from)?;
    let mut items = collect_history_items(entries);

    items.sort_by_key(|item| Reverse(item.started_at_ms));
    items.truncate(HISTORY_LIMIT);

    Ok(items)
}

pub fn read_move_log(log_path: &Path) -> AppResult<Vec<MoveOp>> {
    let content = fs::read_to_string(log_path).map_err(AppError::from)?;

    let mut ops = Vec::new();
    for line in content.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let op: MoveOp = serde_json::from_str(line)
            .map_err(|err| AppError::internal(format!("malformed move log entry: {err}")))?;
        ops.push(op);
    }

    Ok(ops)
}

fn collect_history_items(entries: fs::ReadDir) -> Vec<HistoryItem> {
    entries
        .filter_map(|entry| entry.ok())
        .filter(|entry| is_summary_file(&entry.path()))
        .filter_map(|entry| parse_summary_file(&entry.path()))
        .collect()
}

fn is_summary_file(path: &Path) -> bool {
    path.is_file()
        && path
            .file_name()
            .and_then(|name| name.to_str())
            .map(|name| name.ends_with(SUMMARY_SUFFIX))
            .unwrap_or(false)
}

fn parse_summary_file(path: &Path) -> Option<HistoryItem> {
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{JobId, JobStatus};
    use std::fs::File;
    use std::io::Write;
    use std::path::PathBuf;
    use tempfile::tempdir;

    fn sample(id: JobId, started_at_ms: i64) -> HistoryItem {
        HistoryItem {
            id,
            name: format!("job-{id}"),
            destination_root: PathBuf::from(format!("/dest-{id}")),
            started_at_ms,
            duration_ms: 100,
            moved: 1,
            skipped: 0,
            errors: 0,
            state: JobStatus::Done,
        }
    }

    fn write_summary(dir: &Path, item: &HistoryItem) {
        let path = dir.join(format!("{}.summary.json", item.id));
        let json = serde_json::to_string_pretty(item).expect("serialize");
        fs::write(&path, json).expect("write");
    }

    fn write_raw(dir: &Path, name: &str, content: &str) {
        let mut file = File::create(dir.join(name)).expect("create");
        file.write_all(content.as_bytes()).expect("write");
    }

    #[test]
    fn list_returns_empty_when_directory_does_not_exist() {
        let dir = tempdir().expect("tempdir");
        let missing = dir.path().join("does-not-exist");

        let items = list_summaries(&missing).expect("list");

        assert!(items.is_empty());
    }

    #[test]
    fn list_returns_summaries_sorted_by_started_at_desc() {
        let dir = tempdir().expect("tempdir");
        write_summary(dir.path(), &sample(1, 100));
        write_summary(dir.path(), &sample(2, 300));
        write_summary(dir.path(), &sample(3, 200));

        let items = list_summaries(dir.path()).expect("list");

        assert_eq!(items.len(), 3);
        assert_eq!(items[0].id, 2);
        assert_eq!(items[1].id, 3);
        assert_eq!(items[2].id, 1);
    }

    #[test]
    fn list_caps_results_at_history_limit() {
        let dir = tempdir().expect("tempdir");
        for n in 0..(HISTORY_LIMIT + 5) {
            let id: JobId = n as JobId + 1;
            write_summary(dir.path(), &sample(id, id));
        }

        let items = list_summaries(dir.path()).expect("list");

        assert_eq!(items.len(), HISTORY_LIMIT);
    }

    #[test]
    fn list_skips_corrupt_summary_files() {
        let dir = tempdir().expect("tempdir");
        write_summary(dir.path(), &sample(1, 100));
        write_raw(dir.path(), "9.summary.json", "not valid json");

        let items = list_summaries(dir.path()).expect("list");

        assert_eq!(items.len(), 1);
        assert_eq!(items[0].id, 1);
    }

    #[test]
    fn list_ignores_non_summary_files() {
        let dir = tempdir().expect("tempdir");
        write_summary(dir.path(), &sample(1, 100));
        write_raw(dir.path(), "1.jsonl", "");
        write_raw(dir.path(), "1.summary.json.tmp", "");

        let items = list_summaries(dir.path()).expect("list");

        assert_eq!(items.len(), 1);
    }

    #[test]
    fn read_move_log_parses_jsonl_lines() {
        let dir = tempdir().expect("tempdir");
        let log = dir.path().join("1.jsonl");
        let line1 = serde_json::to_string(&MoveOp {
            from: PathBuf::from("/src/a.jpg"),
            to: PathBuf::from("/dest/a.jpg"),
            at_ms: 100,
        })
        .unwrap();
        let line2 = serde_json::to_string(&MoveOp {
            from: PathBuf::from("/src/b.jpg"),
            to: PathBuf::from("/dest/b.jpg"),
            at_ms: 200,
        })
        .unwrap();
        fs::write(&log, format!("{line1}\n{line2}\n")).expect("write log");

        let ops = read_move_log(&log).expect("read log");

        assert_eq!(ops.len(), 2);
        assert_eq!(ops[0].at_ms, 100);
        assert_eq!(ops[1].at_ms, 200);
    }

    #[test]
    fn read_move_log_handles_empty_file() {
        let dir = tempdir().expect("tempdir");
        let log = dir.path().join("1.jsonl");
        fs::write(&log, "").expect("write");

        let ops = read_move_log(&log).expect("read");

        assert!(ops.is_empty());
    }

    #[test]
    fn read_move_log_returns_error_for_missing_file() {
        let dir = tempdir().expect("tempdir");
        let missing = dir.path().join("missing.jsonl");

        let result = read_move_log(&missing);

        assert!(matches!(result, Err(AppError::Io { .. })));
    }
}
