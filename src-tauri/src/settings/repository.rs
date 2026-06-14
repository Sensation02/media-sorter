use std::sync::Arc;

use serde_json::{json, Value};
use tauri::{AppHandle, Runtime};
use tauri_plugin_store::{Store, StoreExt};

use crate::domain::{AppSettings, DateFolderFormat, SessionMemo};
use crate::error::{AppError, AppResult};

use super::defaults::{
    default_settings, DEFAULT_HISTORY_RETENTION_DAYS, DEFAULT_REMEMBER_LAST_DESTINATION,
    DEFAULT_REMEMBER_LAST_SORT_RULE, KEY_DATE_FORMAT, KEY_HISTORY_RETENTION_DAYS, KEY_MEMO,
    KEY_REMEMBER_LAST_DESTINATION, KEY_REMEMBER_LAST_SORT_RULE, KEY_UI_LANGUAGE,
    KEY_UNKNOWN_DATE_FOLDER_NAME, SETTINGS_STORE_FILE,
};

pub trait StoreReader {
    fn get(&self, key: &str) -> Option<Value>;
}

impl<R: Runtime> StoreReader for Arc<Store<R>> {
    fn get(&self, key: &str) -> Option<Value> {
        Store::get(self, key)
    }
}

pub trait StoreWriter {
    fn set(&self, key: &str, value: Value);
}

impl<R: Runtime> StoreWriter for Arc<Store<R>> {
    fn set(&self, key: &str, value: Value) {
        Store::set(self, key, value);
    }
}

pub fn load_settings<R: Runtime>(app: &AppHandle<R>) -> AppResult<AppSettings> {
    let store = open_store(app)?;

    Ok(build_settings_from_store(&store))
}

fn build_settings_from_store(reader: &dyn StoreReader) -> AppSettings {
    let fallback = default_settings();

    AppSettings {
        remember_last_sort_rule: read_bool(reader, KEY_REMEMBER_LAST_SORT_RULE)
            .unwrap_or(DEFAULT_REMEMBER_LAST_SORT_RULE),
        remember_last_destination: read_bool(reader, KEY_REMEMBER_LAST_DESTINATION)
            .unwrap_or(DEFAULT_REMEMBER_LAST_DESTINATION),
        unknown_date_folder_name: read_optional_string(reader, KEY_UNKNOWN_DATE_FOLDER_NAME),
        history_retention_days: read_u16(reader, KEY_HISTORY_RETENTION_DAYS)
            .unwrap_or(DEFAULT_HISTORY_RETENTION_DAYS),
        ui_language: read_string(reader, KEY_UI_LANGUAGE).unwrap_or(fallback.ui_language),
        date_format: read_date_format(reader, KEY_DATE_FORMAT).unwrap_or_default(),
        memo: read_memo(reader),
    }
}

pub fn save_settings<R: Runtime>(app: &AppHandle<R>, settings: &AppSettings) -> AppResult<()> {
    let store = open_store(app)?;

    write_settings_to_store(&store, settings)?;

    persist(&store)
}

fn write_settings_to_store(writer: &dyn StoreWriter, settings: &AppSettings) -> AppResult<()> {
    writer.set(
        KEY_REMEMBER_LAST_SORT_RULE,
        json!(settings.remember_last_sort_rule),
    );
    writer.set(
        KEY_REMEMBER_LAST_DESTINATION,
        json!(settings.remember_last_destination),
    );
    writer.set(
        KEY_UNKNOWN_DATE_FOLDER_NAME,
        json!(settings.unknown_date_folder_name),
    );
    writer.set(
        KEY_HISTORY_RETENTION_DAYS,
        json!(settings.history_retention_days),
    );
    writer.set(KEY_UI_LANGUAGE, json!(settings.ui_language));
    writer.set(KEY_DATE_FORMAT, json!(settings.date_format));
    writer.set(
        KEY_MEMO,
        serde_json::to_value(&settings.memo).map_err(AppError::internal)?,
    );

    Ok(())
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

fn read_bool(reader: &dyn StoreReader, key: &str) -> Option<bool> {
    reader.get(key).and_then(|v| v.as_bool())
}

fn read_u16(reader: &dyn StoreReader, key: &str) -> Option<u16> {
    reader
        .get(key)
        .and_then(|v| v.as_u64())
        .and_then(|n| u16::try_from(n).ok())
}

fn read_string(reader: &dyn StoreReader, key: &str) -> Option<String> {
    reader
        .get(key)
        .and_then(|v| v.as_str().map(|s| s.to_string()))
}

fn read_optional_string(reader: &dyn StoreReader, key: &str) -> Option<String> {
    let value = reader.get(key)?;

    match value {
        Value::Null => None,
        Value::String(s) if !s.is_empty() => Some(s),
        _ => None,
    }
}

fn read_date_format(reader: &dyn StoreReader, key: &str) -> Option<DateFolderFormat> {
    reader
        .get(key)
        .and_then(|v| serde_json::from_value::<DateFolderFormat>(v).ok())
}

fn read_memo(reader: &dyn StoreReader) -> SessionMemo {
    reader
        .get(KEY_MEMO)
        .and_then(|v| serde_json::from_value::<SessionMemo>(v).ok())
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use std::cell::RefCell;
    use std::collections::HashMap;

    use super::*;
    use crate::settings::defaults::default_settings;

    #[derive(Default)]
    struct MapStore {
        values: RefCell<HashMap<String, Value>>,
    }

    impl MapStore {
        fn seed_full() -> Self {
            let store = MapStore::default();
            store.set(KEY_REMEMBER_LAST_SORT_RULE, json!(false));
            store.set(KEY_REMEMBER_LAST_DESTINATION, json!(false));
            store.set(KEY_HISTORY_RETENTION_DAYS, json!(45));
            store.set(KEY_UI_LANGUAGE, json!("uk"));
            store
        }
    }

    impl StoreReader for MapStore {
        fn get(&self, key: &str) -> Option<Value> {
            self.values.borrow().get(key).cloned()
        }
    }

    impl StoreWriter for MapStore {
        fn set(&self, key: &str, value: Value) {
            self.values.borrow_mut().insert(key.to_string(), value);
        }
    }

    #[test]
    fn app_settings_default_date_format_is_localized_month_year() {
        assert_eq!(
            default_settings().date_format,
            DateFolderFormat::LocalizedMonthYear
        );
    }

    #[test]
    fn settings_blob_without_date_format_deserializes_to_default() {
        let blob = json!({
            "rememberLastSortRule": true,
            "rememberLastDestination": true,
            "unknownDateFolderName": null,
            "historyRetentionDays": 30,
            "uiLanguage": "en",
            "memo": {}
        });

        let settings: AppSettings = serde_json::from_value(blob).expect("deserialize");

        assert_eq!(settings.date_format, DateFolderFormat::LocalizedMonthYear);
    }

    #[test]
    fn settings_store_load_without_date_format_key_returns_default() {
        let store = MapStore::seed_full();

        let settings = build_settings_from_store(&store);

        assert_eq!(settings.date_format, DateFolderFormat::LocalizedMonthYear);
    }

    #[test]
    fn settings_store_load_with_invalid_date_format_falls_back_to_default() {
        let store = MapStore::seed_full();
        store.set(KEY_DATE_FORMAT, json!("iso-week"));

        let settings = build_settings_from_store(&store);

        assert_eq!(settings.date_format, DateFolderFormat::LocalizedMonthYear);
        assert_eq!(settings.ui_language, "uk");
    }

    #[test]
    fn settings_store_load_reads_valid_date_format() {
        let store = MapStore::seed_full();
        store.set(KEY_DATE_FORMAT, json!("iso-day-nested"));

        let settings = build_settings_from_store(&store);

        assert_eq!(settings.date_format, DateFolderFormat::IsoDayNested);
    }

    #[test]
    fn settings_round_trip_preserves_date_format() {
        let settings = AppSettings {
            date_format: DateFolderFormat::IsoDayNested,
            ui_language: "uk".to_string(),
            ..default_settings()
        };
        let store = MapStore::default();

        write_settings_to_store(&store, &settings).expect("write settings");
        let loaded = build_settings_from_store(&store);

        assert_eq!(loaded.date_format, DateFolderFormat::IsoDayNested);
        assert_eq!(loaded.ui_language, "uk");
    }

    #[test]
    fn save_writes_date_format_key() {
        let settings = AppSettings {
            date_format: DateFolderFormat::IsoDayNested,
            ..default_settings()
        };
        let store = MapStore::default();

        write_settings_to_store(&store, &settings).expect("write settings");

        assert_eq!(store.get(KEY_DATE_FORMAT), Some(json!("iso-day-nested")));
    }
}
