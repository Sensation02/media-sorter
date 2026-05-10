use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::{Mutex, OnceLock};

use crate::domain::{MediaFile, Metadata, ScanId};
use crate::error::{AppError, AppResult};
use crate::utils::now_ms;

#[derive(Debug, Clone)]
pub struct ScanSession {
    pub root: PathBuf,
    pub files: Vec<MediaFile>,
    pub metadata: Vec<Metadata>,
}

static SESSIONS: OnceLock<Mutex<HashMap<ScanId, ScanSession>>> = OnceLock::new();
static NEXT_ID: OnceLock<AtomicI64> = OnceLock::new();

pub fn replace_session(session: ScanSession) -> AppResult<ScanId> {
    let mut sessions = sessions().lock().map_err(poisoned)?;
    sessions.clear();

    let id = next_scan_id();
    sessions.insert(id, session);

    Ok(id)
}

pub fn get_session(id: ScanId) -> AppResult<ScanSession> {
    let sessions = sessions().lock().map_err(poisoned)?;

    sessions
        .get(&id)
        .cloned()
        .ok_or_else(|| AppError::validation(format!("scan session {id} not found")))
}

#[cfg(test)]
pub fn clear_all() -> AppResult<()> {
    let mut sessions = sessions().lock().map_err(poisoned)?;
    sessions.clear();

    Ok(())
}

fn sessions() -> &'static Mutex<HashMap<ScanId, ScanSession>> {
    SESSIONS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn next_scan_id() -> ScanId {
    let counter = NEXT_ID.get_or_init(|| AtomicI64::new(now_ms()));

    counter.fetch_add(1, Ordering::Relaxed)
}

fn poisoned<T>(_error: std::sync::PoisonError<T>) -> AppError {
    AppError::internal("scan sessions mutex poisoned")
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::domain::MediaKind;

    fn sample_session(name: &str) -> ScanSession {
        ScanSession {
            root: PathBuf::from(format!("/tmp/{name}")),
            files: vec![MediaFile {
                path: PathBuf::from(format!("/tmp/{name}/a.jpg")),
                size_bytes: 1,
                kind: MediaKind::Photo,
            }],
            metadata: vec![Metadata::default()],
        }
    }

    #[test]
    fn session_lifecycle_replaces_and_evicts_sequentially() {
        clear_all().unwrap();

        assert!(matches!(get_session(0), Err(AppError::Validation { .. })));

        let first = replace_session(sample_session("alpha")).unwrap();
        let fetched_first = get_session(first).unwrap();
        assert_eq!(fetched_first.root, PathBuf::from("/tmp/alpha"));

        let second = replace_session(sample_session("beta")).unwrap();
        assert_ne!(first, second);

        assert!(matches!(
            get_session(first),
            Err(AppError::Validation { .. })
        ));
        let fetched_second = get_session(second).unwrap();
        assert_eq!(fetched_second.root, PathBuf::from("/tmp/beta"));
    }
}
