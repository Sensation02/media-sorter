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
    let names = month_names_for(lang);

    format!("{} {}", names[month0], year)
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
}
