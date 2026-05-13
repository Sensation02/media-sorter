pub const LANGUAGE_CODE_EN: &str = "en";
pub const LANGUAGE_CODE_UK: &str = "uk";

pub struct LanguageEntry {
    pub code: &'static str,
    pub native_name: &'static str,
    pub unknown_date_folder: &'static str,
}

pub const SUPPORTED_LANGUAGES: &[LanguageEntry] = &[
    LanguageEntry {
        code: LANGUAGE_CODE_EN,
        native_name: "English",
        unknown_date_folder: "Misc",
    },
    LanguageEntry {
        code: LANGUAGE_CODE_UK,
        native_name: "Українська",
        unknown_date_folder: "Різне",
    },
];

pub const DEFAULT_LANGUAGE_CODE: &str = LANGUAGE_CODE_EN;

pub fn validate_language_code(raw: &str) -> Option<&'static LanguageEntry> {
    SUPPORTED_LANGUAGES.iter().find(|entry| entry.code == raw)
}

pub fn unknown_date_folder_for(lang: &str) -> &'static str {
    validate_language_code(lang)
        .map(|entry| entry.unknown_date_folder)
        .unwrap_or_else(|| {
            validate_language_code(DEFAULT_LANGUAGE_CODE)
                .map(|entry| entry.unknown_date_folder)
                .unwrap_or("Misc")
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_known_language() {
        assert!(validate_language_code("en").is_some());
        assert!(validate_language_code("uk").is_some());
    }

    #[test]
    fn validate_unknown_language() {
        assert!(validate_language_code("xx").is_none());
        assert!(validate_language_code("").is_none());
    }

    #[test]
    fn unknown_date_folder_returns_locale_value() {
        assert_eq!(unknown_date_folder_for("en"), "Misc");
        assert_eq!(unknown_date_folder_for("uk"), "Різне");
    }

    #[test]
    fn unknown_date_folder_falls_back_to_english() {
        assert_eq!(unknown_date_folder_for("xx"), "Misc");
    }
}
