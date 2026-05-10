use std::fs;
use std::io;
use std::path::Path;

use fs4::available_space;

pub trait FsRepo: Send + Sync {
    fn exists(&self, path: &Path) -> bool;

    fn metadata(&self, path: &Path) -> io::Result<fs::Metadata>;

    fn rename(&self, from: &Path, to: &Path) -> io::Result<()>;

    fn copy(&self, from: &Path, to: &Path) -> io::Result<u64>;

    fn remove_file(&self, path: &Path) -> io::Result<()>;

    fn create_dir_all(&self, path: &Path) -> io::Result<()>;

    fn available_space(&self, path: &Path) -> io::Result<u64>;
}

pub struct RealFsRepo;

impl RealFsRepo {
    pub fn new() -> Self {
        Self
    }
}

impl Default for RealFsRepo {
    fn default() -> Self {
        Self::new()
    }
}

impl FsRepo for RealFsRepo {
    fn exists(&self, path: &Path) -> bool {
        path.exists()
    }

    fn metadata(&self, path: &Path) -> io::Result<fs::Metadata> {
        fs::metadata(path)
    }

    fn rename(&self, from: &Path, to: &Path) -> io::Result<()> {
        fs::rename(from, to)
    }

    fn copy(&self, from: &Path, to: &Path) -> io::Result<u64> {
        fs::copy(from, to)
    }

    fn remove_file(&self, path: &Path) -> io::Result<()> {
        fs::remove_file(path)
    }

    fn create_dir_all(&self, path: &Path) -> io::Result<()> {
        fs::create_dir_all(path)
    }

    fn available_space(&self, path: &Path) -> io::Result<u64> {
        available_space(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;

    fn write_file(path: &Path, bytes: &[u8]) {
        let mut file = File::create(path).expect("create file");
        file.write_all(bytes).expect("write bytes");
    }

    #[test]
    fn exists_reports_presence_correctly() {
        let dir = tempdir().expect("tempdir");
        let present = dir.path().join("present.txt");
        let missing = dir.path().join("missing.txt");
        write_file(&present, b"hi");

        let repo = RealFsRepo::new();
        assert!(repo.exists(&present));
        assert!(!repo.exists(&missing));
    }

    #[test]
    fn rename_moves_file_within_same_dir() {
        let dir = tempdir().expect("tempdir");
        let from = dir.path().join("a.txt");
        let to = dir.path().join("b.txt");
        write_file(&from, b"hello");

        RealFsRepo::new().rename(&from, &to).expect("rename");

        assert!(!from.exists());
        assert!(to.exists());
    }

    #[test]
    fn copy_then_remove_round_trip() {
        let dir = tempdir().expect("tempdir");
        let from = dir.path().join("a.txt");
        let to = dir.path().join("b.txt");
        write_file(&from, b"hello");

        let repo = RealFsRepo::new();
        let copied = repo.copy(&from, &to).expect("copy");
        repo.remove_file(&from).expect("remove");

        assert_eq!(copied, 5);
        assert!(!from.exists());
        assert!(to.exists());
    }

    #[test]
    fn metadata_reports_file_size() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("a.txt");
        write_file(&path, b"hello world");

        let metadata = RealFsRepo::new().metadata(&path).expect("metadata");

        assert_eq!(metadata.len(), 11);
    }

    #[test]
    fn create_dir_all_is_idempotent() {
        let dir = tempdir().expect("tempdir");
        let nested = dir.path().join("a/b/c");

        let repo = RealFsRepo::new();
        repo.create_dir_all(&nested).expect("first call");
        repo.create_dir_all(&nested).expect("second call");

        assert!(nested.is_dir());
    }

    #[test]
    fn available_space_returns_positive_for_tempdir() {
        let dir = tempdir().expect("tempdir");

        let space = RealFsRepo::new()
            .available_space(dir.path())
            .expect("available_space");

        assert!(space > 0);
    }
}
