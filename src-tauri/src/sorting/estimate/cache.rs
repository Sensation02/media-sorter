use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

static PROBE_CACHE: OnceLock<Mutex<HashMap<PathBuf, u64>>> = OnceLock::new();

fn cache() -> &'static Mutex<HashMap<PathBuf, u64>> {
    PROBE_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn get(destination_root: &Path) -> Option<u64> {
    let guard = cache().lock().ok()?;

    guard.get(destination_root).copied()
}

pub fn put(destination_root: &Path, throughput_bps: u64) {
    let Ok(mut guard) = cache().lock() else {
        return;
    };

    guard.insert(destination_root.to_path_buf(), throughput_bps);
}

#[cfg(test)]
pub fn reset() {
    if let Ok(mut guard) = cache().lock() {
        guard.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn put_then_get_returns_the_stored_value() {
        reset();
        let root = std::env::temp_dir().join("epic-14-cache-fixture-put-get");

        put(&root, 12_345_678);

        assert_eq!(get(&root), Some(12_345_678));
    }

    #[test]
    fn get_returns_none_for_unknown_root() {
        reset();
        let unknown = std::env::temp_dir().join("epic-14-cache-fixture-unknown");

        assert_eq!(get(&unknown), None);
    }
}
