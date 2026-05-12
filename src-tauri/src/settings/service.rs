use tauri::{AppHandle, Runtime};

use crate::domain::{AppSettings, SessionMemo};
use crate::error::AppResult;

use super::repository;
use super::validator::validate;

pub fn hydrate<R: Runtime>(app: &AppHandle<R>) -> AppResult<AppSettings> {
    let raw = repository::load_settings(app)?;
    let clean = validate(raw)?;

    repository::save_settings(app, &clean)?;

    Ok(clean)
}

pub fn get_settings<R: Runtime>(app: &AppHandle<R>) -> AppResult<AppSettings> {
    let raw = repository::load_settings(app)?;
    validate(raw)
}

pub fn set_settings<R: Runtime>(
    app: &AppHandle<R>,
    incoming: AppSettings,
) -> AppResult<AppSettings> {
    let validated = validate(incoming)?;

    repository::save_settings(app, &validated)?;

    Ok(validated)
}

pub fn reset_settings<R: Runtime>(app: &AppHandle<R>) -> AppResult<AppSettings> {
    let current = repository::load_settings(app)?;
    let preserved_memo = current.memo;

    let mut fresh = super::defaults::default_settings();
    fresh.memo = preserved_memo;

    repository::save_settings(app, &fresh)?;

    Ok(fresh)
}

pub fn get_memo<R: Runtime>(app: &AppHandle<R>) -> AppResult<SessionMemo> {
    repository::load_memo(app)
}

pub fn set_memo<R: Runtime>(app: &AppHandle<R>, memo: SessionMemo) -> AppResult<()> {
    repository::save_memo(app, &memo)
}
