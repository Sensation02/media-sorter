use std::fs::{File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::Instant;

pub const PROBE_SAMPLE_BYTES: usize = 32 * 1024 * 1024;
const PROBE_FILE_NAME: &str = ".media-sorter-probe";

pub fn bandwidth_probe(destination_root: &Path) -> io::Result<u64> {
    std::fs::create_dir_all(destination_root)?;

    let probe_path = destination_root.join(PROBE_FILE_NAME);
    let _guard = ProbeFile::new(&probe_path);
    let payload = vec![0u8; PROBE_SAMPLE_BYTES];

    let started_at = Instant::now();

    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&probe_path)?;
    file.write_all(&payload)?;
    File::sync_all(&file)?;
    drop(file);

    let elapsed = started_at.elapsed();
    let elapsed_secs = elapsed.as_secs_f64();

    if elapsed_secs <= 0.0 {
        return Err(io::Error::other(
            "probe completed too quickly to measure bandwidth",
        ));
    }

    Ok((PROBE_SAMPLE_BYTES as f64 / elapsed_secs) as u64)
}

struct ProbeFile {
    path: PathBuf,
}

impl ProbeFile {
    fn new(path: &Path) -> Self {
        Self {
            path: path.to_path_buf(),
        }
    }
}

impl Drop for ProbeFile {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bandwidth_probe_returns_positive_throughput_on_writable_dir() {
        let dir = std::env::temp_dir().join("epic-14-probe-fixture-positive");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("create probe dir");

        let result = bandwidth_probe(&dir).expect("probe ran");

        assert!(result > 0, "throughput must be positive, got {result}");
    }

    #[test]
    fn bandwidth_probe_cleans_up_its_file_on_success() {
        let dir = std::env::temp_dir().join("epic-14-probe-fixture-cleanup");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("create probe dir");

        let _ = bandwidth_probe(&dir).expect("probe ran");

        let probe_file = dir.join(PROBE_FILE_NAME);
        assert!(
            !probe_file.exists(),
            "probe file must be removed after a successful run"
        );
    }

    #[test]
    fn bandwidth_probe_errors_on_unwritable_destination() {
        let missing = std::env::temp_dir().join("epic-14-probe-fixture-missing/sub/path");
        let _ = std::fs::remove_dir_all(&missing);

        let parent_marker = std::env::temp_dir().join("epic-14-probe-readonly-marker");
        std::fs::write(&parent_marker, b"sentinel").expect("write marker");
        let result = bandwidth_probe(&parent_marker);
        let _ = std::fs::remove_file(&parent_marker);

        assert!(result.is_err());
    }
}
