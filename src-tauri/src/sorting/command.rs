use crate::domain::SortPlan;
use crate::error::{AppError, AppResult};

use super::dto::{JobIdRequest, PreviewPlanRequest, StartSortRequest, StartSortResponse};

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
