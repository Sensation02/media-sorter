use std::io;
use std::path::Path;

#[cfg(unix)]
pub fn volume_id(path: &Path) -> io::Result<u64> {
    use std::os::unix::fs::MetadataExt;

    let metadata = std::fs::metadata(path)?;

    Ok(metadata.dev())
}

#[cfg(windows)]
pub fn volume_id(path: &Path) -> io::Result<u64> {
    let canonical = path.canonicalize()?;
    let prefix = canonical
        .components()
        .next()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "empty path"))?;
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    std::hash::Hasher::write(&mut hasher, prefix.as_os_str().as_encoded_bytes());

    Ok(std::hash::Hasher::finish(&hasher))
}

#[cfg(not(any(unix, windows)))]
pub fn volume_id(_path: &Path) -> io::Result<u64> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "volume_id not supported on this platform",
    ))
}

pub fn same_volume(a: &Path, b: &Path) -> io::Result<bool> {
    Ok(volume_id(a)? == volume_id(b)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_volume_returns_true_for_paths_under_one_root() {
        let temp = std::env::temp_dir();

        assert!(same_volume(&temp, &temp).expect("volume id readable for temp dir"));
    }

    #[test]
    fn volume_id_errors_when_path_is_missing() {
        let missing = std::env::temp_dir().join("epic-14-volume-id-missing-fixture");
        let _ = std::fs::remove_dir_all(&missing);
        let _ = std::fs::remove_file(&missing);

        assert!(volume_id(&missing).is_err());
    }
}
