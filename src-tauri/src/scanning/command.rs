use std::path::PathBuf;

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::domain::ScanSummary;
use crate::error::{AppError, AppResult};

use super::dto::{RevealRequest, ScanSourceRequest};

#[tauri::command]
pub async fn pick_source_dir(app: AppHandle) -> AppResult<Option<PathBuf>> {
    let picked = app.dialog().file().blocking_pick_folder();

    let Some(file_path) = picked else {
        return Ok(None);
    };

    let path = file_path.into_path().map_err(AppError::internal)?;

    Ok(Some(path))
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
