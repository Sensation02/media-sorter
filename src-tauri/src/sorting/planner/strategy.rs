use chrono::{Datelike, Local};

use crate::domain::{Camera, MediaFile, MediaKind, Metadata, Place};
use crate::geo::GeoCache;
use crate::i18n::months;

pub const MISC_FOLDER: &str = "Misc";
pub const UNKNOWN_LOCATION: &str = "Unknown location";

const PHOTOS_FOLDER: &str = "Photos";
const RAW_FOLDER: &str = "RAW";
const VIDEOS_FOLDER: &str = "Videos";

pub trait SortStrategy {
    fn folder_segments(
        &self,
        file: &MediaFile,
        metadata: &Metadata,
        geo: &mut GeoCache,
        unknown_folder: &str,
        lang: &str,
    ) -> Vec<String>;
}

pub struct ByDate;

impl SortStrategy for ByDate {
    fn folder_segments(
        &self,
        _file: &MediaFile,
        metadata: &Metadata,
        _geo: &mut GeoCache,
        unknown_folder: &str,
        lang: &str,
    ) -> Vec<String> {
        match format_month_year(metadata, lang) {
            Some(month_year) => vec![month_year],
            None => vec![unknown_folder.to_string()],
        }
    }
}

pub struct ByDateAndPlace;

impl SortStrategy for ByDateAndPlace {
    fn folder_segments(
        &self,
        _file: &MediaFile,
        metadata: &Metadata,
        geo: &mut GeoCache,
        unknown_folder: &str,
        lang: &str,
    ) -> Vec<String> {
        let Some(month_year) = format_month_year(metadata, lang) else {
            return vec![unknown_folder.to_string()];
        };

        let location = resolve_location(metadata, geo);

        vec![month_year, location]
    }
}

pub struct ByType;

impl SortStrategy for ByType {
    fn folder_segments(
        &self,
        file: &MediaFile,
        _metadata: &Metadata,
        _geo: &mut GeoCache,
        _unknown_folder: &str,
        _lang: &str,
    ) -> Vec<String> {
        vec![type_label(file.kind).to_string()]
    }
}

pub struct ByCamera;

impl SortStrategy for ByCamera {
    fn folder_segments(
        &self,
        _file: &MediaFile,
        metadata: &Metadata,
        _geo: &mut GeoCache,
        unknown_folder: &str,
        _lang: &str,
    ) -> Vec<String> {
        match format_camera(metadata.camera.as_ref()) {
            Some(label) => vec![label],
            None => vec![unknown_folder.to_string()],
        }
    }
}

fn format_month_year(metadata: &Metadata, lang: &str) -> Option<String> {
    let capture = metadata.capture.as_ref()?;
    let local = capture.at.with_timezone(&Local);
    let year = local.year();
    let month0 = (local.month() - 1) as usize;

    Some(months::format_month_year(year, month0, lang))
}

fn resolve_location(metadata: &Metadata, geo: &mut GeoCache) -> String {
    let Some(point) = metadata.geo.as_ref() else {
        return UNKNOWN_LOCATION.to_string();
    };

    match geo.lookup(point) {
        Some(place) => format_place(&place),
        None => UNKNOWN_LOCATION.to_string(),
    }
}

fn format_place(place: &Place) -> String {
    match &place.country {
        Some(country) => format!("{}, {}", place.name, country),
        None => place.name.clone(),
    }
}

fn type_label(kind: MediaKind) -> &'static str {
    match kind {
        MediaKind::Photo => PHOTOS_FOLDER,
        MediaKind::Raw => RAW_FOLDER,
        MediaKind::Video => VIDEOS_FOLDER,
    }
}

fn format_camera(camera: Option<&Camera>) -> Option<String> {
    let camera = camera?;
    let make = trim_non_empty(camera.make.as_deref());
    let model = trim_non_empty(camera.model.as_deref());

    match (make, model) {
        (Some(make), Some(model)) => Some(format!("{make} {model}")),
        (Some(only), None) | (None, Some(only)) => Some(only),
        (None, None) => None,
    }
}

fn trim_non_empty(value: Option<&str>) -> Option<String> {
    let trimmed = value?.trim();

    if trimmed.is_empty() {
        return None;
    }

    Some(trimmed.to_string())
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use chrono::TimeZone;

    use super::*;
    use crate::domain::{CaptureDate, DateSource, GeoPoint};

    fn photo() -> MediaFile {
        MediaFile {
            path: PathBuf::from("/src/IMG_001.jpg"),
            size_bytes: 1024,
            kind: MediaKind::Photo,
        }
    }

    fn raw_file() -> MediaFile {
        MediaFile {
            path: PathBuf::from("/src/DSC_001.cr3"),
            size_bytes: 8192,
            kind: MediaKind::Raw,
        }
    }

    fn video() -> MediaFile {
        MediaFile {
            path: PathBuf::from("/src/MOV_001.mov"),
            size_bytes: 16384,
            kind: MediaKind::Video,
        }
    }

    fn capture_at(year: i32, month: u32, day: u32) -> CaptureDate {
        let utc = chrono::Utc
            .with_ymd_and_hms(year, month, day, 12, 0, 0)
            .single()
            .expect("valid utc datetime");

        CaptureDate {
            at: utc,
            source: DateSource::Exif,
        }
    }

    fn paris_point() -> GeoPoint {
        GeoPoint {
            latitude: 48.8566,
            longitude: 2.3522,
        }
    }

    #[test]
    fn by_date_uses_month_year_when_capture_present() {
        let metadata = Metadata {
            capture: Some(capture_at(2024, 2, 15)),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments = ByDate.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec!["February 2024"]);
    }

    #[test]
    fn by_date_uses_ukrainian_month_when_lang_is_uk() {
        let metadata = Metadata {
            capture: Some(capture_at(2024, 2, 14)),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments = ByDate.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "uk");

        assert_eq!(segments, vec!["Лютий 2024"]);
    }

    #[test]
    fn by_date_falls_back_to_misc_when_capture_missing() {
        let mut geo = GeoCache::new();

        let segments =
            ByDate.folder_segments(&photo(), &Metadata::default(), &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec![MISC_FOLDER]);
    }

    #[test]
    fn by_date_uses_custom_unknown_folder_when_capture_missing() {
        let mut geo = GeoCache::new();

        let segments =
            ByDate.folder_segments(&photo(), &Metadata::default(), &mut geo, "Різне", "en");

        assert_eq!(segments, vec!["Різне"]);
    }

    #[test]
    fn by_date_and_place_combines_month_year_and_resolved_place() {
        let metadata = Metadata {
            capture: Some(capture_at(2024, 8, 1)),
            geo: Some(paris_point()),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments =
            ByDateAndPlace.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec!["August 2024", "Paris, France"]);
    }

    #[test]
    fn by_date_and_place_falls_back_to_unknown_location_when_gps_missing() {
        let metadata = Metadata {
            capture: Some(capture_at(2024, 8, 1)),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments =
            ByDateAndPlace.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec!["August 2024", UNKNOWN_LOCATION]);
    }

    #[test]
    fn by_date_and_place_collapses_to_misc_when_capture_missing() {
        let metadata = Metadata {
            geo: Some(paris_point()),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments =
            ByDateAndPlace.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec![MISC_FOLDER]);
    }

    #[test]
    fn by_date_and_place_collapses_to_misc_when_both_missing() {
        let mut geo = GeoCache::new();

        let segments = ByDateAndPlace.folder_segments(
            &photo(),
            &Metadata::default(),
            &mut geo,
            MISC_FOLDER,
            "en",
        );

        assert_eq!(segments, vec![MISC_FOLDER]);
    }

    #[test]
    fn by_type_routes_each_kind_to_its_label() {
        let mut geo = GeoCache::new();
        let metadata = Metadata::default();

        assert_eq!(
            ByType.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en"),
            vec!["Photos"]
        );
        assert_eq!(
            ByType.folder_segments(&raw_file(), &metadata, &mut geo, MISC_FOLDER, "en"),
            vec!["RAW"]
        );
        assert_eq!(
            ByType.folder_segments(&video(), &metadata, &mut geo, MISC_FOLDER, "en"),
            vec!["Videos"]
        );
    }

    #[test]
    fn by_camera_combines_make_and_model_when_both_present() {
        let metadata = Metadata {
            camera: Some(Camera {
                make: Some("Sony".to_string()),
                model: Some("A7 IV".to_string()),
            }),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments = ByCamera.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec!["Sony A7 IV"]);
    }

    #[test]
    fn by_camera_uses_make_alone_when_model_missing() {
        let metadata = Metadata {
            camera: Some(Camera {
                make: Some("Canon".to_string()),
                model: None,
            }),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments = ByCamera.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec!["Canon"]);
    }

    #[test]
    fn by_camera_uses_model_alone_when_make_missing() {
        let metadata = Metadata {
            camera: Some(Camera {
                make: None,
                model: Some("iPhone 15 Pro".to_string()),
            }),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments = ByCamera.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec!["iPhone 15 Pro"]);
    }

    #[test]
    fn by_camera_falls_back_to_misc_when_camera_missing() {
        let mut geo = GeoCache::new();

        let segments =
            ByCamera.folder_segments(&photo(), &Metadata::default(), &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec![MISC_FOLDER]);
    }

    #[test]
    fn by_camera_falls_back_to_misc_when_make_and_model_blank() {
        let metadata = Metadata {
            camera: Some(Camera {
                make: Some("   ".to_string()),
                model: Some("".to_string()),
            }),
            ..Metadata::default()
        };
        let mut geo = GeoCache::new();

        let segments = ByCamera.folder_segments(&photo(), &metadata, &mut geo, MISC_FOLDER, "en");

        assert_eq!(segments, vec![MISC_FOLDER]);
    }
}
