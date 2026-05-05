use std::path::PathBuf;

use crate::domain::{HistoryItem, ScanSummary, SortPlan};
use crate::dto::{
    JobIdRequest, PreviewPlanRequest, RevealRequest, ScanSourceRequest, StartSortRequest,
    StartSortResponse,
};
use crate::error::{AppError, AppResult};

#[tauri::command]
pub async fn pick_source_dir() -> AppResult<Option<PathBuf>> {
    Err(AppError::internal("pick_source_dir: not yet implemented"))
}

#[tauri::command]
pub async fn scan_source(request: ScanSourceRequest) -> AppResult<ScanSummary> {
    let _ = request;
    Err(AppError::internal("scan_source: not yet implemented"))
}

#[tauri::command]
pub async fn preview_plan(request: PreviewPlanRequest) -> AppResult<SortPlan> {
    let _ = request;
    Err(AppError::internal("preview_plan: not yet implemented"))
}

#[tauri::command]
pub async fn start_sort(request: StartSortRequest) -> AppResult<StartSortResponse> {
    let _ = request;
    Err(AppError::internal("start_sort: not yet implemented"))
}

#[tauri::command]
pub async fn pause_sort(request: JobIdRequest) -> AppResult<()> {
    let _ = request;
    Err(AppError::internal("pause_sort: not yet implemented"))
}

#[tauri::command]
pub async fn cancel_sort(request: JobIdRequest) -> AppResult<()> {
    let _ = request;
    Err(AppError::internal("cancel_sort: not yet implemented"))
}

#[tauri::command]
pub async fn revert_job(request: JobIdRequest) -> AppResult<()> {
    let _ = request;
    Err(AppError::internal("revert_job: not yet implemented"))
}

#[tauri::command]
pub async fn list_history() -> AppResult<Vec<HistoryItem>> {
    Err(AppError::internal("list_history: not yet implemented"))
}

#[tauri::command]
pub async fn reveal_in_os(request: RevealRequest) -> AppResult<()> {
    let _ = request;
    Err(AppError::internal("reveal_in_os: not yet implemented"))
}
