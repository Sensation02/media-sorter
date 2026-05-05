use crate::domain::HistoryItem;
use crate::error::{AppError, AppResult};
use crate::sorting::dto::JobIdRequest;

#[tauri::command]
pub async fn list_history() -> AppResult<Vec<HistoryItem>> {
    Err(AppError::internal("list_history: not yet implemented"))
}

#[tauri::command]
pub async fn revert_job(request: JobIdRequest) -> AppResult<()> {
    let _ = request;
    Err(AppError::internal("revert_job: not yet implemented"))
}
