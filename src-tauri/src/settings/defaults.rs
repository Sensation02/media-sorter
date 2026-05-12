use crate::domain::{AppSettings, SessionMemo};
use crate::i18n::{validate_language_code, DEFAULT_LANGUAGE_CODE};

pub const DEFAULT_REMEMBER_LAST_SORT_RULE: bool = true;
pub const DEFAULT_REMEMBER_LAST_DESTINATION: bool = true;
pub const DEFAULT_HISTORY_RETENTION_DAYS: u16 = 30;
pub const MIN_HISTORY_RETENTION_DAYS: u16 = 7;
pub const MAX_HISTORY_RETENTION_DAYS: u16 = 365;

pub const SETTINGS_STORE_FILE: &str = "settings.json";

pub const KEY_REMEMBER_LAST_SORT_RULE: &str = "rememberLastSortRule";
pub const KEY_REMEMBER_LAST_DESTINATION: &str = "rememberLastDestination";
pub const KEY_UNKNOWN_DATE_FOLDER_NAME: &str = "unknownDateFolderName";
pub const KEY_HISTORY_RETENTION_DAYS: &str = "historyRetentionDays";
pub const KEY_UI_LANGUAGE: &str = "uiLanguage";
pub const KEY_MEMO: &str = "memo";

pub const FORBIDDEN_FOLDER_NAME_CHARS: &[char] = &['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

pub fn default_settings() -> AppSettings {
    AppSettings {
        remember_last_sort_rule: DEFAULT_REMEMBER_LAST_SORT_RULE,
        remember_last_destination: DEFAULT_REMEMBER_LAST_DESTINATION,
        unknown_date_folder_name: None,
        history_retention_days: DEFAULT_HISTORY_RETENTION_DAYS,
        ui_language: detect_initial_language(),
        memo: SessionMemo::default(),
    }
}

pub fn detect_initial_language() -> String {
    let raw = sys_locale::get_locale().unwrap_or_default();
    let subtag = raw.split(['-', '_']).next().unwrap_or("");

    if validate_language_code(subtag).is_some() {
        subtag.to_string()
    } else {
        DEFAULT_LANGUAGE_CODE.to_string()
    }
}
