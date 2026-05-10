use std::fs::DirEntry;
use std::path::Path;

use crate::domain::extensions::classify_extension;
use crate::domain::{ByKind, MediaFile, MediaKind, ScanSummary};
use crate::error::{AppError, AppResult};

use super::filters::is_hidden;

#[derive(Debug, Clone)]
pub struct ScanResult {
    pub summary: ScanSummary,
    pub files: Vec<MediaFile>,
}

/// Scans the top-level entries of `path` and returns the aggregate counts
/// alongside the matching `MediaFile` records. Subdirectories, symlinks,
/// hidden files and non-media extensions are skipped.
pub fn scan_directory(path: &Path) -> AppResult<ScanResult> {
    validate_directory(path)?;

    let mut summary = empty_summary(path);
    let mut files = Vec::new();

    for entry in std::fs::read_dir(path)? {
        let entry = entry?;

        if let Some(media) = classify_entry(&entry)? {
            accumulate(&mut summary, media.kind, media.size_bytes);
            files.push(media);
        }
    }

    Ok(ScanResult { summary, files })
}

fn validate_directory(path: &Path) -> AppResult<()> {
    if !path.exists() {
        return Err(AppError::validation(format!(
            "path does not exist: {}",
            path.display()
        )));
    }

    if !path.is_dir() {
        return Err(AppError::validation(format!(
            "not a directory: {}",
            path.display()
        )));
    }

    Ok(())
}

fn empty_summary(path: &Path) -> ScanSummary {
    ScanSummary {
        root: path.to_path_buf(),
        file_count: 0,
        size_bytes: 0,
        by_kind: ByKind::default(),
    }
}

fn classify_entry(entry: &DirEntry) -> AppResult<Option<MediaFile>> {
    let file_type = entry.file_type()?;

    if file_type.is_symlink() || !file_type.is_file() {
        return Ok(None);
    }

    let raw_name = entry.file_name();
    let name = raw_name.to_string_lossy();

    if is_hidden(&name) {
        return Ok(None);
    }

    let path = entry.path();
    let Some(extension) = path.extension().and_then(|ext| ext.to_str()) else {
        return Ok(None);
    };

    let Some(kind) = classify_extension(extension) else {
        return Ok(None);
    };

    let size_bytes = entry.metadata()?.len();

    Ok(Some(MediaFile {
        path,
        size_bytes,
        kind,
    }))
}

fn accumulate(summary: &mut ScanSummary, kind: MediaKind, size: u64) {
    summary.file_count += 1;
    summary.size_bytes += size;

    match kind {
        MediaKind::Photo => summary.by_kind.photos += 1,
        MediaKind::Raw => summary.by_kind.raw += 1,
        MediaKind::Video => summary.by_kind.videos += 1,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::fs::File;
    use std::io::Write;
    use std::path::PathBuf;

    use tempfile::TempDir;

    fn write_file(dir: &Path, name: &str, bytes: &[u8]) -> PathBuf {
        let path = dir.join(name);
        let mut file = File::create(&path).expect("create file");
        file.write_all(bytes).expect("write file");
        path
    }

    #[test]
    fn classifies_photos_raw_and_videos() {
        let temp = TempDir::new().unwrap();
        write_file(temp.path(), "a.jpg", b"x");
        write_file(temp.path(), "b.HEIC", b"x");
        write_file(temp.path(), "c.cr3", b"x");
        write_file(temp.path(), "d.MP4", b"x");

        let result = scan_directory(temp.path()).unwrap();

        assert_eq!(result.summary.file_count, 4);
        assert_eq!(result.summary.by_kind.photos, 2);
        assert_eq!(result.summary.by_kind.raw, 1);
        assert_eq!(result.summary.by_kind.videos, 1);
        assert_eq!(result.files.len(), 4);
    }

    #[test]
    fn collects_media_files_with_kind_and_size() {
        let temp = TempDir::new().unwrap();
        write_file(temp.path(), "a.jpg", &[0u8; 100]);

        let result = scan_directory(temp.path()).unwrap();

        let file = result.files.first().expect("one file");
        assert_eq!(file.kind, MediaKind::Photo);
        assert_eq!(file.size_bytes, 100);
        assert!(file.path.ends_with("a.jpg"));
    }

    #[test]
    fn skips_hidden_and_system_files() {
        let temp = TempDir::new().unwrap();
        write_file(temp.path(), "real.jpg", b"x");
        write_file(temp.path(), ".DS_Store", b"x");
        write_file(temp.path(), "._real.jpg", b"x");
        write_file(temp.path(), "Thumbs.db", b"x");
        write_file(temp.path(), "desktop.ini", b"x");

        let result = scan_directory(temp.path()).unwrap();

        assert_eq!(result.summary.file_count, 1);
        assert_eq!(result.files.len(), 1);
    }

    #[test]
    fn skips_subdirectories_in_flat_mode() {
        let temp = TempDir::new().unwrap();
        write_file(temp.path(), "top.jpg", b"x");

        let nested = temp.path().join("nested");
        std::fs::create_dir(&nested).unwrap();
        write_file(&nested, "deep.jpg", b"x");

        let result = scan_directory(temp.path()).unwrap();

        assert_eq!(result.summary.file_count, 1);
    }

    #[test]
    fn skips_unknown_extensions() {
        let temp = TempDir::new().unwrap();
        write_file(temp.path(), "ok.jpg", b"x");
        write_file(temp.path(), "report.pdf", b"x");
        write_file(temp.path(), "notes.txt", b"x");
        write_file(temp.path(), "no_extension", b"x");

        let result = scan_directory(temp.path()).unwrap();

        assert_eq!(result.summary.file_count, 1);
    }

    #[test]
    fn aggregates_total_size_in_bytes() {
        let temp = TempDir::new().unwrap();
        write_file(temp.path(), "a.jpg", &[0u8; 100]);
        write_file(temp.path(), "b.jpg", &[0u8; 250]);

        let result = scan_directory(temp.path()).unwrap();

        assert_eq!(result.summary.size_bytes, 350);
    }

    #[test]
    fn errors_on_nonexistent_path() {
        let result = scan_directory(Path::new("/definitely/not/here/xyz"));
        assert!(matches!(result, Err(AppError::Validation { .. })));
    }

    #[test]
    fn errors_when_path_is_a_file() {
        let temp = TempDir::new().unwrap();
        let file = write_file(temp.path(), "lonely.jpg", b"x");

        let result = scan_directory(&file);
        assert!(matches!(result, Err(AppError::Validation { .. })));
    }

    #[cfg(unix)]
    #[test]
    fn skips_symlinks() {
        use std::os::unix::fs::symlink;

        let temp = TempDir::new().unwrap();
        let target = write_file(temp.path(), "target.jpg", b"x");
        symlink(&target, temp.path().join("link.jpg")).unwrap();

        let result = scan_directory(temp.path()).unwrap();

        assert_eq!(result.summary.file_count, 1);
    }
}
