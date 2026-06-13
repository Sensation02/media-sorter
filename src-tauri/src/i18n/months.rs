use crate::domain::DateFolderFormat;

pub const MONTH_NAMES_EN: [&str; 12] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

pub const MONTH_NAMES_UK: [&str; 12] = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень",
];

pub fn format_month_year(year: i32, month0: usize, lang: &str) -> String {
    format!("{} {}", month_name(month0, lang), year)
}

pub fn month_name(month0: usize, lang: &str) -> &'static str {
    month_names_for(lang)[month0]
}

pub fn date_folder_segments(
    year: i32,
    month1: u32,
    day: u32,
    format: DateFolderFormat,
    lang: &str,
) -> Vec<String> {
    let month0 = (month1 - 1) as usize;

    match format {
        DateFolderFormat::LocalizedMonthYear => vec![format_month_year(year, month0, lang)],
        DateFolderFormat::YearLocalizedMonth => {
            vec![format!("{year:04}"), month_name(month0, lang).to_string()]
        }
        DateFolderFormat::IsoMonth => vec![format!("{year:04}-{month1:02}")],
        DateFolderFormat::IsoMonthNested => vec![format!("{year:04}"), format!("{month1:02}")],
        DateFolderFormat::IsoDayNested => vec![
            format!("{year:04}"),
            format!("{month1:02}"),
            format!("{day:02}"),
        ],
        DateFolderFormat::IsoMonthLocalized => {
            vec![format!(
                "{year:04}-{month1:02} {}",
                month_name(month0, lang)
            )]
        }
    }
}

fn month_names_for(lang: &str) -> [&'static str; 12] {
    match lang {
        super::LANGUAGE_CODE_UK => MONTH_NAMES_UK,
        super::LANGUAGE_CODE_EN => MONTH_NAMES_EN,
        _ => MONTH_NAMES_EN,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn en_january() {
        assert_eq!(format_month_year(2024, 0, "en"), "January 2024");
    }

    #[test]
    fn uk_february() {
        assert_eq!(format_month_year(2024, 1, "uk"), "Лютий 2024");
    }

    #[test]
    fn year_boundary_december() {
        assert_eq!(format_month_year(2024, 11, "en"), "December 2024");
        assert_eq!(format_month_year(2024, 11, "uk"), "Грудень 2024");
    }

    #[test]
    fn unknown_lang_falls_back_to_en() {
        assert_eq!(format_month_year(2024, 0, "xx"), "January 2024");
        assert_eq!(format_month_year(2024, 0, ""), "January 2024");
    }

    #[test]
    fn iso_month_zero_pads_single_digit() {
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::IsoMonth, "en"),
            vec!["2024-02"]
        );
    }

    #[test]
    fn iso_month_nested_two_segments() {
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::IsoMonthNested, "en"),
            vec!["2024", "02"]
        );
    }

    #[test]
    fn iso_day_nested_three_padded_segments() {
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::IsoDayNested, "en"),
            vec!["2024", "02", "15"]
        );
        assert_eq!(
            date_folder_segments(2024, 2, 5, DateFolderFormat::IsoDayNested, "en"),
            vec!["2024", "02", "05"]
        );
    }

    #[test]
    fn iso_month_localized_en_and_uk() {
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::IsoMonthLocalized, "en"),
            vec!["2024-02 February"]
        );
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::IsoMonthLocalized, "uk"),
            vec!["2024-02 Лютий"]
        );
    }

    #[test]
    fn year_localized_month_en_and_uk() {
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::YearLocalizedMonth, "en"),
            vec!["2024", "February"]
        );
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::YearLocalizedMonth, "uk"),
            vec!["2024", "Лютий"]
        );
    }

    #[test]
    fn localized_month_year_delegates_to_existing() {
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::LocalizedMonthYear, "en"),
            vec!["February 2024"]
        );
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::LocalizedMonthYear, "uk"),
            vec!["Лютий 2024"]
        );
    }

    #[test]
    fn unknown_lang_falls_back_to_en_for_localized_variants() {
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::YearLocalizedMonth, "xx"),
            vec!["2024", "February"]
        );
        assert_eq!(
            date_folder_segments(2024, 2, 15, DateFolderFormat::IsoMonth, "xx"),
            vec!["2024-02"]
        );
    }

    #[test]
    fn december_boundary_all_formats() {
        assert_eq!(
            date_folder_segments(2024, 12, 31, DateFolderFormat::IsoMonth, "en"),
            vec!["2024-12"]
        );
        assert_eq!(
            date_folder_segments(2024, 12, 31, DateFolderFormat::IsoMonthNested, "en"),
            vec!["2024", "12"]
        );
        assert_eq!(
            date_folder_segments(2024, 12, 31, DateFolderFormat::IsoDayNested, "en"),
            vec!["2024", "12", "31"]
        );
        assert_eq!(
            date_folder_segments(2024, 12, 31, DateFolderFormat::IsoMonthLocalized, "en"),
            vec!["2024-12 December"]
        );
        assert_eq!(
            date_folder_segments(2024, 12, 31, DateFolderFormat::IsoMonthLocalized, "uk"),
            vec!["2024-12 Грудень"]
        );
        assert_eq!(
            date_folder_segments(2024, 12, 31, DateFolderFormat::YearLocalizedMonth, "en"),
            vec!["2024", "December"]
        );
        assert_eq!(
            date_folder_segments(2024, 12, 31, DateFolderFormat::LocalizedMonthYear, "en"),
            vec!["December 2024"]
        );
    }

    #[test]
    fn january_lower_bound_zero_pads() {
        assert_eq!(
            date_folder_segments(2024, 1, 1, DateFolderFormat::IsoMonth, "en"),
            vec!["2024-01"]
        );
        assert_eq!(
            date_folder_segments(2024, 1, 1, DateFolderFormat::IsoDayNested, "en"),
            vec!["2024", "01", "01"]
        );
    }

    #[test]
    fn no_segment_contains_a_separator() {
        let formats = [
            DateFolderFormat::LocalizedMonthYear,
            DateFolderFormat::YearLocalizedMonth,
            DateFolderFormat::IsoMonth,
            DateFolderFormat::IsoMonthNested,
            DateFolderFormat::IsoDayNested,
            DateFolderFormat::IsoMonthLocalized,
        ];

        for format in formats {
            for lang in ["en", "uk"] {
                let segments = date_folder_segments(2024, 2, 15, format, lang);

                for segment in segments {
                    assert!(!segment.contains('/'), "{segment:?} contains '/'");
                    assert!(!segment.contains('\\'), "{segment:?} contains '\\\\'");
                }
            }
        }
    }
}
