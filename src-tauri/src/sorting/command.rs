use std::path::PathBuf;
use std::sync::Arc;

use tauri::{AppHandle, Manager};

use crate::domain::{JobId, SortPlan};
use crate::error::{AppError, AppResult};
use crate::scanning::repository::get_session;
use crate::utils::now_ms;

use super::dto::{JobIdRequest, PreviewPlanRequest, StartSortRequest, StartSortResponse};
use super::planner::build_plan;
use super::runner::fs_repo::RealFsRepo;
use super::runner::job;
use super::runner::service::{run_sort, RunInput};

#[tauri::command]
pub async fn preview_plan(request: PreviewPlanRequest) -> AppResult<SortPlan> {
    tauri::async_runtime::spawn_blocking(move || run_preview(request))
        .await
        .map_err(AppError::internal)?
}

#[tauri::command]
pub async fn start_sort(app: AppHandle, request: StartSortRequest) -> AppResult<StartSortResponse> {
    let job_id = now_ms();
    let log_path = job_log_path(&app, job_id)?;
    let control = job::register(job_id)?;

    let input = RunInput {
        job_id,
        plan: request.plan,
        settings: request.settings,
        dry_run: request.dry_run,
        fs_repo: Arc::new(RealFsRepo::new()),
        log_path,
        control,
    };

    tauri::async_runtime::spawn_blocking(move || {
        let outcome = run_sort(input);
        let _ = job::finish(outcome.job_id);
    });

    Ok(StartSortResponse { job_id })
}

#[tauri::command]
pub async fn pause_sort(request: JobIdRequest) -> AppResult<()> {
    job::pause(request.job_id)
}

#[tauri::command]
pub async fn cancel_sort(request: JobIdRequest) -> AppResult<()> {
    job::cancel(request.job_id)
}

fn run_preview(request: PreviewPlanRequest) -> AppResult<SortPlan> {
    let session = get_session(request.scan_id)?;

    build_plan(
        &session.root,
        request.rule,
        &session.files,
        &session.metadata,
    )
}

fn job_log_path(app: &AppHandle, job_id: JobId) -> AppResult<PathBuf> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|err| AppError::internal(format!("could not resolve app data dir: {err}")))?;

    Ok(data_dir.join("jobs").join(format!("{job_id}.jsonl")))
}
