use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

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

pub struct ThrottledEmitter {
    inner: Arc<dyn ProgressEmitter>,
    interval: Duration,
    state: Mutex<ThrottleState>,
}

#[derive(Debug, Default)]
struct ThrottleState {
    last_emit_at: Option<Instant>,
    pending: Option<SortProgressDto>,
}

impl ThrottledEmitter {
    pub fn new(inner: Arc<dyn ProgressEmitter>, interval_ms: u64) -> Self {
        Self {
            inner,
            interval: Duration::from_millis(interval_ms),
            state: Mutex::new(ThrottleState::default()),
        }
    }

    fn flush_pending(&self) {
        let pending = self.state.lock().expect("throttle mutex").pending.take();

        if let Some(progress) = pending {
            self.inner.emit_progress(&progress);
            self.state.lock().expect("throttle mutex").last_emit_at = Some(Instant::now());
        }
    }
}

impl ProgressEmitter for ThrottledEmitter {
    fn emit_progress(&self, progress: &SortProgressDto) {
        let now = Instant::now();
        let mut state = self.state.lock().expect("throttle mutex");

        let due = match state.last_emit_at {
            None => true,
            Some(last) => now.duration_since(last) >= self.interval,
        };

        if due {
            state.last_emit_at = Some(now);
            state.pending = None;
            drop(state);
            self.inner.emit_progress(progress);
            return;
        }

        state.pending = Some(progress.clone());
    }

    fn emit_log(&self, entry: &SortLogEntryDto) {
        self.flush_pending();
        self.inner.emit_log(entry);
    }

    fn emit_done(&self, done: &SortDoneDto) {
        self.flush_pending();
        self.inner.emit_done(done);
    }

    fn emit_error(&self, error: &AppError) {
        self.flush_pending();
        self.inner.emit_error(error);
    }
}

impl Drop for ThrottledEmitter {
    fn drop(&mut self) {
        self.flush_pending();
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

#[cfg(test)]
mod tests {
    use std::path::PathBuf;
    use std::thread;
    use std::time::Duration;

    use super::testing::RecordingEmitter;
    use super::*;
    use crate::sorting::runner::dto::SortLogLevelDto;

    const TEST_INTERVAL_MS: u64 = 50;

    fn sample_progress() -> SortProgressDto {
        SortProgressDto {
            total: 10,
            processed: 1,
            moved: 1,
            skipped: 0,
            folders: 1,
            current: String::from("a.jpg → 2024-01"),
        }
    }

    fn sample_log() -> SortLogEntryDto {
        SortLogEntryDto {
            time: String::from("00:00.0"),
            level: SortLogLevelDto::Ok,
            text: String::from("a.jpg"),
        }
    }

    fn sample_done() -> SortDoneDto {
        SortDoneDto {
            job_id: 1,
            duration_ms: 0,
            moved: 1,
            skipped: 0,
            folders: 1,
            destination: String::from("/dest"),
        }
    }

    fn sample_error() -> AppError {
        AppError::validation("boom")
    }

    fn sample_path_progress(processed: u64) -> SortProgressDto {
        SortProgressDto {
            total: 10,
            processed,
            moved: processed,
            skipped: 0,
            folders: 1,
            current: PathBuf::from("a.jpg").display().to_string(),
        }
    }

    #[test]
    fn two_progress_calls_within_interval_collapse_to_one() {
        let recorder = Arc::new(RecordingEmitter::default());
        let throttled = ThrottledEmitter::new(recorder.clone(), TEST_INTERVAL_MS);

        throttled.emit_progress(&sample_path_progress(1));
        throttled.emit_progress(&sample_path_progress(2));

        assert_eq!(recorder.progress().len(), 1);
    }

    #[test]
    fn progress_after_interval_passes_through() {
        let recorder = Arc::new(RecordingEmitter::default());
        let throttled = ThrottledEmitter::new(recorder.clone(), TEST_INTERVAL_MS);

        throttled.emit_progress(&sample_path_progress(1));
        thread::sleep(Duration::from_millis(TEST_INTERVAL_MS + 20));
        throttled.emit_progress(&sample_path_progress(2));

        assert_eq!(recorder.progress().len(), 2);
    }

    #[test]
    fn log_event_passes_through_immediately() {
        let recorder = Arc::new(RecordingEmitter::default());
        let throttled = ThrottledEmitter::new(recorder.clone(), TEST_INTERVAL_MS);

        throttled.emit_log(&sample_log());
        throttled.emit_log(&sample_log());

        assert_eq!(recorder.logs().len(), 2);
    }

    #[test]
    fn done_event_passes_through_immediately() {
        let recorder = Arc::new(RecordingEmitter::default());
        let throttled = ThrottledEmitter::new(recorder.clone(), TEST_INTERVAL_MS);

        throttled.emit_done(&sample_done());

        assert_eq!(recorder.done().len(), 1);
    }

    #[test]
    fn error_event_passes_through_immediately() {
        let recorder = Arc::new(RecordingEmitter::default());
        let throttled = ThrottledEmitter::new(recorder.clone(), TEST_INTERVAL_MS);

        throttled.emit_error(&sample_error());

        assert_eq!(recorder.errors().len(), 1);
    }

    #[test]
    fn pending_progress_flushes_before_terminal_event() {
        let recorder = Arc::new(RecordingEmitter::default());
        let throttled = ThrottledEmitter::new(recorder.clone(), TEST_INTERVAL_MS);

        throttled.emit_progress(&sample_progress());
        throttled.emit_progress(&sample_path_progress(99));
        throttled.emit_done(&sample_done());

        assert_eq!(recorder.progress().len(), 2);
        assert_eq!(recorder.progress()[1].processed, 99);
        assert_eq!(recorder.done().len(), 1);
    }

    #[test]
    fn pending_progress_flushes_on_drop() {
        let recorder = Arc::new(RecordingEmitter::default());

        {
            let throttled = ThrottledEmitter::new(recorder.clone(), TEST_INTERVAL_MS);
            throttled.emit_progress(&sample_path_progress(1));
            throttled.emit_progress(&sample_path_progress(2));
        }

        assert_eq!(recorder.progress().len(), 2);
    }
}
