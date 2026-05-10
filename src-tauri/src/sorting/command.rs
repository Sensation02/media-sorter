use crate::domain::SortPlan;
use crate::error::{AppError, AppResult};
use crate::scanning::repository::get_session;

use super::dto::{JobIdRequest, PreviewPlanRequest, StartSortRequest, StartSortResponse};
use super::planner::build_plan;

#[tauri::command]
pub async fn preview_plan(request: PreviewPlanRequest) -> AppResult<SortPlan> {
    tauri::async_runtime::spawn_blocking(move || run_preview(request))
        .await
        .map_err(AppError::internal)?
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

fn run_preview(request: PreviewPlanRequest) -> AppResult<SortPlan> {
    let session = get_session(request.scan_id)?;

    build_plan(
        &session.root,
        request.rule,
        &session.files,
        &session.metadata,
    )
}
