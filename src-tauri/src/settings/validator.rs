use crate::domain::AppSettings;
use crate::error::{AppError, AppResult};
use crate::i18n::{validate_language_code, DEFAULT_LANGUAGE_CODE};

use super::defaults::{
    FORBIDDEN_FOLDER_NAME_CHARS, MAX_HISTORY_RETENTION_DAYS, MIN_HISTORY_RETENTION_DAYS,
};

pub fn validate(input: AppSettings) -> AppResult<AppSettings> {
    let history_retention_days = clamp_retention(input.history_retention_days);
    let unknown_date_folder_name = normalize_folder_name(input.unknown_date_folder_name)?;
    let ui_language = normalize_language(input.ui_language);

    Ok(AppSettings {
        remember_last_sort_rule: input.remember_last_sort_rule,
        remember_last_destination: input.remember_last_destination,
        unknown_date_folder_name,
        history_retention_days,
        ui_language,
        memo: input.memo,
    })
}

fn clamp_retention(days: u16) -> u16 {
    days.clamp(MIN_HISTORY_RETENTION_DAYS, MAX_HISTORY_RETENTION_DAYS)
}

fn normalize_folder_name(raw: Option<String>) -> AppResult<Option<String>> {
    let Some(value) = raw else {
        return Ok(None);
    };

    let trimmed = value.trim();

    if trimmed.is_empty() {
        return Ok(None);
    }

    if trimmed
        .chars()
        .any(|c| FORBIDDEN_FOLDER_NAME_CHARS.contains(&c))
    {
        return Err(AppError::validation(
            "Unknown-date folder name contains forbidden path characters",
        ));
    }

    Ok(Some(trimmed.to_string()))
}

fn normalize_language(raw: String) -> String {
    if validate_language_code(&raw).is_some() {
        raw
    } else {
        DEFAULT_LANGUAGE_CODE.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::SessionMemo;

    fn base_settings() -> AppSettings {
        AppSettings {
            remember_last_sort_rule: true,
            remember_last_destination: true,
            unknown_date_folder_name: None,
            history_retention_days: 30,
            ui_language: "en".into(),
            memo: SessionMemo::default(),
        }
    }

    #[test]
    fn clamps_retention_below_minimum() {
        let mut input = base_settings();
        input.history_retention_days = 1;

        let result = validate(input).unwrap();

        assert_eq!(result.history_retention_days, MIN_HISTORY_RETENTION_DAYS);
    }

    #[test]
    fn clamps_retention_above_maximum() {
        let mut input = base_settings();
        input.history_retention_days = 9999;

        let result = validate(input).unwrap();

        assert_eq!(result.history_retention_days, MAX_HISTORY_RETENTION_DAYS);
    }

    #[test]
    fn empty_folder_name_becomes_none() {
        let mut input = base_settings();
        input.unknown_date_folder_name = Some("   ".into());

        let result = validate(input).unwrap();

        assert!(result.unknown_date_folder_name.is_none());
    }

    #[test]
    fn folder_name_with_forbidden_chars_rejected() {
        let mut input = base_settings();
        input.unknown_date_folder_name = Some("bad/name".into());

        let result = validate(input);

        assert!(matches!(result, Err(AppError::Validation { .. })));
    }

    #[test]
    fn folder_name_trimmed() {
        let mut input = base_settings();
        input.unknown_date_folder_name = Some("  Different  ".into());

        let result = validate(input).unwrap();

        assert_eq!(
            result.unknown_date_folder_name.as_deref(),
            Some("Different")
        );
    }

    #[test]
    fn unknown_language_falls_back_to_default() {
        let mut input = base_settings();
        input.ui_language = "xx".into();

        let result = validate(input).unwrap();

        assert_eq!(result.ui_language, DEFAULT_LANGUAGE_CODE);
    }
}
