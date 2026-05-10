use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};

use crate::domain::JobId;
use crate::error::{AppError, AppResult};

#[derive(Debug)]
pub struct JobControl {
    cancel: AtomicBool,
    paused: AtomicBool,
}

impl JobControl {
    pub fn new() -> Self {
        Self {
            cancel: AtomicBool::new(false),
            paused: AtomicBool::new(false),
        }
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancel.load(Ordering::Relaxed)
    }

    pub fn is_paused(&self) -> bool {
        self.paused.load(Ordering::Relaxed)
    }

    pub fn request_cancel(&self) {
        self.cancel.store(true, Ordering::Relaxed);
    }

    pub fn request_pause(&self) {
        self.paused.store(true, Ordering::Relaxed);
    }
}

impl Default for JobControl {
    fn default() -> Self {
        Self::new()
    }
}

static REGISTRY: OnceLock<Mutex<HashMap<JobId, Arc<JobControl>>>> = OnceLock::new();

pub fn register(job_id: JobId) -> AppResult<Arc<JobControl>> {
    let control = Arc::new(JobControl::new());
    let mut jobs = registry().lock().map_err(poisoned)?;
    jobs.insert(job_id, control.clone());

    Ok(control)
}

pub fn cancel(job_id: JobId) -> AppResult<()> {
    let jobs = registry().lock().map_err(poisoned)?;
    let control = jobs
        .get(&job_id)
        .ok_or_else(|| AppError::validation(format!("job {job_id} not found")))?;

    control.request_cancel();

    Ok(())
}

pub fn pause(job_id: JobId) -> AppResult<()> {
    let jobs = registry().lock().map_err(poisoned)?;
    let control = jobs
        .get(&job_id)
        .ok_or_else(|| AppError::validation(format!("job {job_id} not found")))?;

    control.request_pause();

    Ok(())
}

pub fn finish(job_id: JobId) -> AppResult<()> {
    let mut jobs = registry().lock().map_err(poisoned)?;
    jobs.remove(&job_id);

    Ok(())
}

#[cfg(test)]
pub fn clear_all() -> AppResult<()> {
    let mut jobs = registry().lock().map_err(poisoned)?;
    jobs.clear();

    Ok(())
}

fn registry() -> &'static Mutex<HashMap<JobId, Arc<JobControl>>> {
    REGISTRY.get_or_init(|| Mutex::new(HashMap::new()))
}

fn poisoned<T>(_error: std::sync::PoisonError<T>) -> AppError {
    AppError::internal("job registry mutex poisoned")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn next_job_id() -> JobId {
        static COUNTER: std::sync::atomic::AtomicI64 = std::sync::atomic::AtomicI64::new(1);
        COUNTER.fetch_add(1, Ordering::Relaxed)
    }

    #[test]
    fn register_returns_fresh_control_with_flags_unset() {
        let job_id = next_job_id();

        let control = register(job_id).expect("register");

        assert!(!control.is_cancelled());
        assert!(!control.is_paused());

        finish(job_id).expect("finish");
    }

    #[test]
    fn cancel_sets_flag_observed_via_arc() {
        let job_id = next_job_id();
        let control = register(job_id).expect("register");

        cancel(job_id).expect("cancel");

        assert!(control.is_cancelled());
        finish(job_id).expect("finish");
    }

    #[test]
    fn pause_sets_paused_flag_independently_from_cancel() {
        let job_id = next_job_id();
        let control = register(job_id).expect("register");

        pause(job_id).expect("pause");

        assert!(control.is_paused());
        assert!(!control.is_cancelled());
        finish(job_id).expect("finish");
    }

    #[test]
    fn cancel_unknown_job_returns_validation_error() {
        let result = cancel(-9999);

        assert!(matches!(result, Err(AppError::Validation { .. })));
    }

    #[test]
    fn finish_removes_entry_so_subsequent_cancel_fails() {
        let job_id = next_job_id();
        let _control = register(job_id).expect("register");
        finish(job_id).expect("finish");

        let result = cancel(job_id);

        assert!(matches!(result, Err(AppError::Validation { .. })));
    }
}
