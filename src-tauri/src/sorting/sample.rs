use std::path::PathBuf;

use chrono::TimeZone;

use crate::domain::{
    Camera, CaptureDate, DateFolderFormat, DateSource, GeoPoint, MediaFile, MediaKind, Metadata,
    SortPlan, SortRuleId,
};
use crate::error::AppResult;

use super::planner::build_plan;

const SAMPLE_ROOT: &str = "sample";
const SAMPLE_FILE_SIZE_BYTES: u64 = 4096;

const PARIS_LATITUDE: f64 = 48.8566;
const PARIS_LONGITUDE: f64 = 2.3522;

const SAMPLE_HOUR: u32 = 12;
const SAMPLE_DAY: u32 = 15;

pub fn build_sample_plan(
    rule: SortRuleId,
    date_format: DateFolderFormat,
    unknown_folder: &str,
    lang: &str,
) -> AppResult<SortPlan> {
    let entries = sample_entries();

    let files: Vec<MediaFile> = entries.iter().map(|entry| entry.file.clone()).collect();
    let metadata: Vec<Metadata> = entries.iter().map(|entry| entry.metadata.clone()).collect();

    build_plan(
        &PathBuf::from(SAMPLE_ROOT),
        rule,
        &files,
        &metadata,
        unknown_folder,
        lang,
        date_format,
    )
}

struct SampleEntry {
    file: MediaFile,
    metadata: Metadata,
}

fn sample_entries() -> Vec<SampleEntry> {
    vec![
        feb_photo_with_place(),
        feb_photo(),
        mar_photo(),
        camera_photo(),
        sample_video(),
        undated_photo(),
    ]
}

fn feb_photo_with_place() -> SampleEntry {
    SampleEntry {
        file: photo("IMG_2317.jpg"),
        metadata: Metadata {
            capture: Some(capture_at(2024, 2)),
            geo: Some(paris_point()),
            ..Metadata::default()
        },
    }
}

fn feb_photo() -> SampleEntry {
    SampleEntry {
        file: photo("IMG_2318.jpg"),
        metadata: Metadata {
            capture: Some(capture_at(2024, 2)),
            ..Metadata::default()
        },
    }
}

fn mar_photo() -> SampleEntry {
    SampleEntry {
        file: photo("IMG_2402.jpg"),
        metadata: Metadata {
            capture: Some(capture_at(2024, 3)),
            ..Metadata::default()
        },
    }
}

fn camera_photo() -> SampleEntry {
    SampleEntry {
        file: photo("DSC_0091.jpg"),
        metadata: Metadata {
            capture: Some(capture_at(2024, 3)),
            camera: Some(Camera {
                make: Some("Sony".to_string()),
                model: Some("A7 IV".to_string()),
            }),
            ..Metadata::default()
        },
    }
}

fn sample_video() -> SampleEntry {
    SampleEntry {
        file: MediaFile {
            path: PathBuf::from("MOV_1043.mp4"),
            size_bytes: SAMPLE_FILE_SIZE_BYTES,
            kind: MediaKind::Video,
        },
        metadata: Metadata {
            capture: Some(capture_at(2024, 2)),
            ..Metadata::default()
        },
    }
}

fn undated_photo() -> SampleEntry {
    SampleEntry {
        file: photo("scan_0007.jpg"),
        metadata: Metadata::default(),
    }
}

fn photo(name: &str) -> MediaFile {
    MediaFile {
        path: PathBuf::from(name),
        size_bytes: SAMPLE_FILE_SIZE_BYTES,
        kind: MediaKind::Photo,
    }
}

fn capture_at(year: i32, month: u32) -> CaptureDate {
    // Inputs are compile-time sample constants (mid-month, noon), so the datetime is always valid.
    let at = chrono::Utc
        .with_ymd_and_hms(year, month, SAMPLE_DAY, SAMPLE_HOUR, 0, 0)
        .single()
        .expect("valid sample capture datetime");

    CaptureDate {
        at,
        source: DateSource::Exif,
    }
}

fn paris_point() -> GeoPoint {
    GeoPoint {
        latitude: PARIS_LATITUDE,
        longitude: PARIS_LONGITUDE,
    }
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use super::*;

    #[test]
    fn build_sample_plan_by_date_iso_month_nested_buckets_and_unknown_folder() {
        let plan = build_sample_plan(
            SortRuleId::ByDate,
            DateFolderFormat::IsoMonthNested,
            "Misc",
            "en",
        )
        .expect("sample plan");

        assert_eq!(plan.rule, SortRuleId::ByDate);
        assert!(!plan.items.is_empty());

        let targets: Vec<String> = plan
            .items
            .iter()
            .map(|item| item.target.to_string_lossy().to_string())
            .collect();

        assert!(targets
            .iter()
            .any(|target| target.contains("sample/2024/02/")));
        assert!(targets
            .iter()
            .any(|target| target.contains("sample/2024/03/")));

        let undated = plan
            .items
            .iter()
            .find(|item| item.source == Path::new("scan_0007.jpg"))
            .expect("undated sample item");

        assert_eq!(undated.target, PathBuf::from("sample/Misc/scan_0007.jpg"));
    }

    #[test]
    fn build_sample_plan_by_type_routes_video_and_photo() {
        let plan = build_sample_plan(
            SortRuleId::ByType,
            DateFolderFormat::LocalizedMonthYear,
            "Misc",
            "en",
        )
        .expect("sample plan");

        let video = plan
            .items
            .iter()
            .find(|item| item.source == Path::new("MOV_1043.mp4"))
            .expect("video sample item");
        assert_eq!(video.target, PathBuf::from("sample/Videos/MOV_1043.mp4"));

        let photo = plan
            .items
            .iter()
            .find(|item| item.source == Path::new("IMG_2317.jpg"))
            .expect("photo sample item");
        assert_eq!(photo.target, PathBuf::from("sample/Photos/IMG_2317.jpg"));
    }
}
