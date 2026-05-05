use std::path::PathBuf;

use crate::domain::ScanSummary;
use crate::error::{AppError, AppResult};

use super::dto::{RevealRequest, ScanSourceRequest};

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
pub async fn reveal_in_os(request: RevealRequest) -> AppResult<()> {
    let _ = request;
    Err(AppError::internal("reveal_in_os: not yet implemented"))
}
