use tauri::AppHandle;

use crate::domain::{AppSettings, SessionMemo};
use crate::error::{AppError, AppResult};

use super::dto::{SetMemoRequest, SetSettingsRequest};
use super::service;

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> AppResult<AppSettings> {
    tauri::async_runtime::spawn_blocking(move || service::get_settings(&app))
        .await
        .map_err(AppError::internal)?
}

#[tauri::command]
pub async fn set_settings(app: AppHandle, request: SetSettingsRequest) -> AppResult<AppSettings> {
    let settings = request.settings;

    tauri::async_runtime::spawn_blocking(move || service::set_settings(&app, settings))
        .await
        .map_err(AppError::internal)?
}

#[tauri::command]
pub async fn reset_settings(app: AppHandle) -> AppResult<AppSettings> {
    tauri::async_runtime::spawn_blocking(move || service::reset_settings(&app))
        .await
        .map_err(AppError::internal)?
}

#[tauri::command]
pub async fn get_memo(app: AppHandle) -> AppResult<SessionMemo> {
    tauri::async_runtime::spawn_blocking(move || service::get_memo(&app))
        .await
        .map_err(AppError::internal)?
}

#[tauri::command]
pub async fn set_memo(app: AppHandle, request: SetMemoRequest) -> AppResult<()> {
    let memo = request.memo;

    tauri::async_runtime::spawn_blocking(move || service::set_memo(&app, memo))
        .await
        .map_err(AppError::internal)?
}
