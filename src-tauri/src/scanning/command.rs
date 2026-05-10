use std::path::PathBuf;

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tokio::sync::oneshot;

use crate::domain::{MediaFile, Metadata};
use crate::error::{AppError, AppResult};
use crate::metadata;

use super::dto::{RevealRequest, ScanResponse, ScanSourceRequest};
use super::repository::{replace_session, ScanSession};
use super::service::scan_directory;

#[tauri::command]
pub async fn pick_source_dir(app: AppHandle) -> AppResult<Option<PathBuf>> {
    let (sender, receiver) = oneshot::channel();

    app.dialog().file().pick_folder(move |path| {
        let _ = sender.send(path);
    });

    let picked = receiver
        .await
        .map_err(|_| AppError::internal("dialog channel closed before user response"))?;

    let Some(file_path) = picked else {
        return Ok(None);
    };

    let path = file_path.into_path().map_err(AppError::internal)?;

    Ok(Some(path))
}

#[tauri::command]
pub async fn scan_source(request: ScanSourceRequest) -> AppResult<ScanResponse> {
    tauri::async_runtime::spawn_blocking(move || run_scan(request.path))
        .await
        .map_err(AppError::internal)?
}

#[tauri::command]
pub async fn reveal_in_os(request: RevealRequest) -> AppResult<()> {
    let _ = request;
    Err(AppError::internal("reveal_in_os: not yet implemented"))
}

fn run_scan(path: PathBuf) -> AppResult<ScanResponse> {
    let scan = scan_directory(&path)?;
    let metadata = extract_all_metadata(&scan.files);

    let session = ScanSession {
        root: scan.summary.root.clone(),
        files: scan.files,
        metadata,
    };
    let scan_id = replace_session(session)?;

    Ok(ScanResponse {
        scan_id,
        summary: scan.summary,
    })
}

fn extract_all_metadata(files: &[MediaFile]) -> Vec<Metadata> {
    metadata::extract_batch(files)
        .into_iter()
        .map(|(_, result)| result.unwrap_or_default())
        .collect()
}
