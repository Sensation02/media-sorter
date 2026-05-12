use std::sync::Arc;

use serde_json::{json, Value};
use tauri::{AppHandle, Runtime};
use tauri_plugin_store::{Store, StoreExt};

use crate::domain::{AppSettings, SessionMemo};
use crate::error::{AppError, AppResult};

use super::defaults::{
    default_settings, DEFAULT_HISTORY_RETENTION_DAYS, DEFAULT_REMEMBER_LAST_DESTINATION,
    DEFAULT_REMEMBER_LAST_SORT_RULE, KEY_HISTORY_RETENTION_DAYS, KEY_MEMO,
    KEY_REMEMBER_LAST_DESTINATION, KEY_REMEMBER_LAST_SORT_RULE, KEY_UI_LANGUAGE,
    KEY_UNKNOWN_DATE_FOLDER_NAME, SETTINGS_STORE_FILE,
};

pub fn load_settings<R: Runtime>(app: &AppHandle<R>) -> AppResult<AppSettings> {
    let store = open_store(app)?;
    let fallback = default_settings();

    let settings = AppSettings {
        remember_last_sort_rule: read_bool(&store, KEY_REMEMBER_LAST_SORT_RULE)
            .unwrap_or(DEFAULT_REMEMBER_LAST_SORT_RULE),
        remember_last_destination: read_bool(&store, KEY_REMEMBER_LAST_DESTINATION)
            .unwrap_or(DEFAULT_REMEMBER_LAST_DESTINATION),
        unknown_date_folder_name: read_optional_string(&store, KEY_UNKNOWN_DATE_FOLDER_NAME),
        history_retention_days: read_u16(&store, KEY_HISTORY_RETENTION_DAYS)
            .unwrap_or(DEFAULT_HISTORY_RETENTION_DAYS),
        ui_language: read_string(&store, KEY_UI_LANGUAGE).unwrap_or(fallback.ui_language),
        memo: read_memo(&store),
    };

    Ok(settings)
}

pub fn save_settings<R: Runtime>(app: &AppHandle<R>, settings: &AppSettings) -> AppResult<()> {
    let store = open_store(app)?;

    store.set(
        KEY_REMEMBER_LAST_SORT_RULE,
        json!(settings.remember_last_sort_rule),
    );
    store.set(
        KEY_REMEMBER_LAST_DESTINATION,
        json!(settings.remember_last_destination),
    );
    store.set(
        KEY_UNKNOWN_DATE_FOLDER_NAME,
        json!(settings.unknown_date_folder_name),
    );
    store.set(
        KEY_HISTORY_RETENTION_DAYS,
        json!(settings.history_retention_days),
    );
    store.set(KEY_UI_LANGUAGE, json!(settings.ui_language));
    store.set(
        KEY_MEMO,
        serde_json::to_value(&settings.memo).map_err(AppError::internal)?,
    );

    persist(&store)
}

pub fn save_memo<R: Runtime>(app: &AppHandle<R>, memo: &SessionMemo) -> AppResult<()> {
    let store = open_store(app)?;

    store.set(
        KEY_MEMO,
        serde_json::to_value(memo).map_err(AppError::internal)?,
    );

    persist(&store)
}

pub fn load_memo<R: Runtime>(app: &AppHandle<R>) -> AppResult<SessionMemo> {
    let store = open_store(app)?;

    Ok(read_memo(&store))
}

fn open_store<R: Runtime>(app: &AppHandle<R>) -> AppResult<Arc<Store<R>>> {
    app.store(SETTINGS_STORE_FILE)
        .map_err(|err| AppError::io(format!("could not open settings store: {err}")))
}

fn persist<R: Runtime>(store: &Arc<Store<R>>) -> AppResult<()> {
    store
        .save()
        .map_err(|err| AppError::io(format!("could not persist settings: {err}")))
}

fn read_bool<R: Runtime>(store: &Arc<Store<R>>, key: &str) -> Option<bool> {
    store.get(key).and_then(|v| v.as_bool())
}

fn read_u16<R: Runtime>(store: &Arc<Store<R>>, key: &str) -> Option<u16> {
    store
        .get(key)
        .and_then(|v| v.as_u64())
        .and_then(|n| u16::try_from(n).ok())
}

fn read_string<R: Runtime>(store: &Arc<Store<R>>, key: &str) -> Option<String> {
    store
        .get(key)
        .and_then(|v| v.as_str().map(|s| s.to_string()))
}

fn read_optional_string<R: Runtime>(store: &Arc<Store<R>>, key: &str) -> Option<String> {
    let value = store.get(key)?;

    match value {
        Value::Null => None,
        Value::String(s) if !s.is_empty() => Some(s),
        _ => None,
    }
}

fn read_memo<R: Runtime>(store: &Arc<Store<R>>) -> SessionMemo {
    store
        .get(KEY_MEMO)
        .and_then(|v| serde_json::from_value::<SessionMemo>(v).ok())
        .unwrap_or_default()
}
