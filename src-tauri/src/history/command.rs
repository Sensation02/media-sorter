use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use crate::domain::HistoryItem;
use crate::error::{AppError, AppResult};
use crate::sorting::dto::JobIdRequest;

use super::dto::RevertOutcome;
use super::repository::list_summaries;
use super::service::revert;

#[tauri::command]
pub async fn list_history(app: AppHandle) -> AppResult<Vec<HistoryItem>> {
    let jobs_dir = jobs_dir(&app)?;

    tauri::async_runtime::spawn_blocking(move || list_summaries(&jobs_dir))
        .await
        .map_err(AppError::internal)?
}

#[tauri::command]
pub async fn revert_job(app: AppHandle, request: JobIdRequest) -> AppResult<RevertOutcome> {
    let jobs_dir = jobs_dir(&app)?;
    let job_id = request.job_id;

    tauri::async_runtime::spawn_blocking(move || revert(&jobs_dir, job_id))
        .await
        .map_err(AppError::internal)?
}

fn jobs_dir(app: &AppHandle) -> AppResult<PathBuf> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|err| AppError::internal(format!("could not resolve app data dir: {err}")))?;

    Ok(data_dir.join("jobs"))
}
