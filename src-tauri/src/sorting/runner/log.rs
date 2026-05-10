use std::fs::{File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use crate::domain::MoveOp;

pub struct MoveLogWriter {
    file: File,
    path: PathBuf,
}

impl MoveLogWriter {
    pub fn open(path: &Path) -> io::Result<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let file = OpenOptions::new().create(true).append(true).open(path)?;

        Ok(Self {
            file,
            path: path.to_path_buf(),
        })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn append(&mut self, op: &MoveOp) -> io::Result<()> {
        let line = serde_json::to_string(op)
            .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err))?;

        self.file.write_all(line.as_bytes())?;
        self.file.write_all(b"\n")?;
        self.file.sync_all()?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use tempfile::tempdir;

    fn op(from: &str, to: &str, at_ms: i64) -> MoveOp {
        MoveOp {
            from: PathBuf::from(from),
            to: PathBuf::from(to),
            at_ms,
        }
    }

    #[test]
    fn open_creates_missing_parent_directories() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("nested/jobs/123.jsonl");

        let writer = MoveLogWriter::open(&path).expect("open");

        drop(writer);
        assert!(path.exists());
    }

    #[test]
    fn append_writes_one_line_per_op() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("log.jsonl");
        let mut writer = MoveLogWriter::open(&path).expect("open");

        writer
            .append(&op("/src/a.jpg", "/dest/a.jpg", 100))
            .expect("first");
        writer
            .append(&op("/src/b.jpg", "/dest/b.jpg", 200))
            .expect("second");

        drop(writer);
        let content = fs::read_to_string(&path).expect("read");
        let lines: Vec<&str> = content.lines().collect();

        assert_eq!(lines.len(), 2);
    }

    #[test]
    fn appended_lines_round_trip_through_serde() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("log.jsonl");
        let mut writer = MoveLogWriter::open(&path).expect("open");

        let original = op("/src/a.jpg", "/dest/a.jpg", 4242);
        writer.append(&original).expect("append");
        drop(writer);

        let content = fs::read_to_string(&path).expect("read");
        let parsed: MoveOp = serde_json::from_str(content.trim()).expect("parse");

        assert_eq!(parsed.from, original.from);
        assert_eq!(parsed.to, original.to);
        assert_eq!(parsed.at_ms, original.at_ms);
    }

    #[test]
    fn reopening_existing_log_appends_without_truncating() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("log.jsonl");

        let mut first = MoveLogWriter::open(&path).expect("first open");
        first
            .append(&op("/src/a.jpg", "/dest/a.jpg", 1))
            .expect("append 1");
        drop(first);

        let mut second = MoveLogWriter::open(&path).expect("reopen");
        second
            .append(&op("/src/b.jpg", "/dest/b.jpg", 2))
            .expect("append 2");
        drop(second);

        let content = fs::read_to_string(&path).expect("read");
        let lines: Vec<&str> = content.lines().collect();

        assert_eq!(lines.len(), 2);
    }
}
