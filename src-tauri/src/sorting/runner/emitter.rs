use tauri::{AppHandle, Emitter};

use crate::error::AppError;

use super::dto::{SortDoneDto, SortLogEntryDto, SortProgressDto};
use super::events::{SORT_DONE, SORT_ERROR, SORT_LOG, SORT_PROGRESS};

pub trait ProgressEmitter: Send + Sync {
    fn emit_progress(&self, progress: &SortProgressDto);

    fn emit_log(&self, entry: &SortLogEntryDto);

    fn emit_done(&self, done: &SortDoneDto);

    fn emit_error(&self, error: &AppError);
}

pub struct TauriEmitter {
    app: AppHandle,
}

impl TauriEmitter {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }
}

impl ProgressEmitter for TauriEmitter {
    fn emit_progress(&self, progress: &SortProgressDto) {
        let _ = self.app.emit(SORT_PROGRESS, progress);
    }

    fn emit_log(&self, entry: &SortLogEntryDto) {
        let _ = self.app.emit(SORT_LOG, entry);
    }

    fn emit_done(&self, done: &SortDoneDto) {
        let _ = self.app.emit(SORT_DONE, done);
    }

    fn emit_error(&self, error: &AppError) {
        let _ = self.app.emit(SORT_ERROR, error);
    }
}

#[cfg(test)]
pub(crate) mod testing {
    use std::sync::Mutex;

    use super::*;

    #[derive(Debug, Default)]
    pub struct RecordingEmitter {
        progress: Mutex<Vec<SortProgressDto>>,
        logs: Mutex<Vec<SortLogEntryDto>>,
        done: Mutex<Vec<SortDoneDto>>,
        errors: Mutex<Vec<AppError>>,
    }

    impl RecordingEmitter {
        pub fn progress(&self) -> Vec<SortProgressDto> {
            self.progress.lock().expect("recording mutex").clone()
        }

        pub fn logs(&self) -> Vec<SortLogEntryDto> {
            self.logs.lock().expect("recording mutex").clone()
        }

        pub fn done(&self) -> Vec<SortDoneDto> {
            self.done.lock().expect("recording mutex").clone()
        }

        pub fn errors(&self) -> Vec<AppError> {
            self.errors.lock().expect("recording mutex").clone()
        }
    }

    impl ProgressEmitter for RecordingEmitter {
        fn emit_progress(&self, progress: &SortProgressDto) {
            self.progress
                .lock()
                .expect("recording mutex")
                .push(progress.clone());
        }

        fn emit_log(&self, entry: &SortLogEntryDto) {
            self.logs
                .lock()
                .expect("recording mutex")
                .push(entry.clone());
        }

        fn emit_done(&self, done: &SortDoneDto) {
            self.done
                .lock()
                .expect("recording mutex")
                .push(done.clone());
        }

        fn emit_error(&self, error: &AppError) {
            self.errors
                .lock()
                .expect("recording mutex")
                .push(error.clone());
        }
    }
}
