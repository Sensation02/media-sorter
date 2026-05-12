use std::path::{Path, PathBuf};

use crate::domain::{MediaFile, Metadata, SortPlan, SortPlanItem, SortRuleId};
use crate::error::{AppError, AppResult};
use crate::geo::GeoCache;

use super::strategy::{ByCamera, ByDate, ByDateAndPlace, ByType, SortStrategy};

pub fn build_plan(
    root: &Path,
    rule: SortRuleId,
    files: &[MediaFile],
    metadata: &[Metadata],
    unknown_folder: &str,
) -> AppResult<SortPlan> {
    if files.len() != metadata.len() {
        return Err(AppError::validation(format!(
            "files and metadata length mismatch: {} vs {}",
            files.len(),
            metadata.len()
        )));
    }

    let strategy = strategy_for(rule);
    let mut geo = GeoCache::new();

    let items = files
        .iter()
        .zip(metadata.iter())
        .map(|(file, meta)| {
            build_item(
                root,
                strategy.as_ref(),
                file,
                meta,
                &mut geo,
                unknown_folder,
            )
        })
        .collect();

    Ok(SortPlan {
        rule,
        root: root.to_path_buf(),
        items,
    })
}

fn strategy_for(rule: SortRuleId) -> Box<dyn SortStrategy> {
    match rule {
        SortRuleId::ByDate => Box::new(ByDate),
        SortRuleId::ByDateAndPlace => Box::new(ByDateAndPlace),
        SortRuleId::ByType => Box::new(ByType),
        SortRuleId::ByCamera => Box::new(ByCamera),
    }
}

fn build_item(
    root: &Path,
    strategy: &dyn SortStrategy,
    file: &MediaFile,
    metadata: &Metadata,
    geo: &mut GeoCache,
    unknown_folder: &str,
) -> SortPlanItem {
    let segments = strategy.folder_segments(file, metadata, geo, unknown_folder);
    let target = build_target(root, &segments, &file.path);

    SortPlanItem {
        source: file.path.clone(),
        target,
    }
}

fn build_target(root: &Path, segments: &[String], source: &Path) -> PathBuf {
    let mut target = root.to_path_buf();

    for segment in segments {
        target.push(segment);
    }

    if let Some(file_name) = source.file_name() {
        target.push(file_name);
    }

    target
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use chrono::TimeZone;

    use super::*;
    use crate::domain::{CaptureDate, DateSource, GeoPoint, MediaKind};

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

    fn photo(name: &str) -> MediaFile {
        MediaFile {
            path: PathBuf::from(format!("/src/{name}")),
            size_bytes: 1024,
            kind: MediaKind::Photo,
        }
    }

    fn paris() -> GeoPoint {
        GeoPoint {
            latitude: 48.8566,
            longitude: 2.3522,
        }
    }

    #[test]
    fn build_plan_returns_validation_error_on_length_mismatch() {
        let files = vec![photo("IMG_001.jpg")];
        let metadata: Vec<Metadata> = vec![];

        let result = build_plan(
            Path::new("/dest"),
            SortRuleId::ByDate,
            &files,
            &metadata,
            "Misc",
        );

        assert!(matches!(result, Err(AppError::Validation { .. })));
    }

    #[test]
    fn build_plan_handles_empty_input() {
        let plan =
            build_plan(Path::new("/dest"), SortRuleId::ByDate, &[], &[], "Misc").expect("plan");

        assert_eq!(plan.rule, SortRuleId::ByDate);
        assert_eq!(plan.root, PathBuf::from("/dest"));
        assert!(plan.items.is_empty());
    }

    #[test]
    fn build_plan_routes_each_file_through_chosen_strategy() {
        let files = vec![photo("IMG_001.jpg"), photo("IMG_002.jpg")];
        let metadata = vec![
            Metadata {
                capture: Some(capture_at(2024, 2, 15)),
                geo: Some(paris()),
                ..Metadata::default()
            },
            Metadata {
                capture: Some(capture_at(2024, 8, 1)),
                ..Metadata::default()
            },
        ];

        let plan = build_plan(
            Path::new("/dest"),
            SortRuleId::ByDateAndPlace,
            &files,
            &metadata,
            "Misc",
        )
        .expect("plan");

        assert_eq!(plan.items.len(), 2);
        assert_eq!(
            plan.items[0].target,
            PathBuf::from("/dest/February 2024/Paris, France/IMG_001.jpg")
        );
        assert_eq!(
            plan.items[1].target,
            PathBuf::from("/dest/August 2024/Unknown location/IMG_002.jpg")
        );
    }

    #[test]
    fn build_plan_preserves_source_paths_unchanged() {
        let files = vec![photo("IMG_001.jpg")];
        let metadata = vec![Metadata::default()];

        let plan = build_plan(
            Path::new("/dest"),
            SortRuleId::ByDate,
            &files,
            &metadata,
            "Misc",
        )
        .expect("plan");

        assert_eq!(plan.items[0].source, PathBuf::from("/src/IMG_001.jpg"));
    }

    #[test]
    fn build_plan_emits_duplicate_targets_for_same_filename() {
        let files = vec![photo("IMG_001.jpg"), photo("IMG_001.jpg")];
        let metadata = vec![
            Metadata {
                capture: Some(capture_at(2024, 2, 15)),
                ..Metadata::default()
            },
            Metadata {
                capture: Some(capture_at(2024, 2, 15)),
                ..Metadata::default()
            },
        ];

        let plan = build_plan(
            Path::new("/dest"),
            SortRuleId::ByDate,
            &files,
            &metadata,
            "Misc",
        )
        .expect("plan");

        assert_eq!(plan.items[0].target, plan.items[1].target);
    }

    #[test]
    fn build_plan_uses_passed_unknown_folder_when_capture_missing() {
        let files = vec![photo("IMG_001.jpg")];
        let metadata = vec![Metadata::default()];

        let plan = build_plan(
            Path::new("/dest"),
            SortRuleId::ByDate,
            &files,
            &metadata,
            "Без дати",
        )
        .expect("plan");

        assert_eq!(
            plan.items[0].target,
            PathBuf::from("/dest/Без дати/IMG_001.jpg")
        );
    }

    #[test]
    fn build_plan_caches_geo_lookups_across_files() {
        let files = vec![photo("a.jpg"), photo("b.jpg"), photo("c.jpg")];
        let metadata = vec![
            Metadata {
                capture: Some(capture_at(2024, 2, 15)),
                geo: Some(paris()),
                ..Metadata::default()
            },
            Metadata {
                capture: Some(capture_at(2024, 2, 15)),
                geo: Some(GeoPoint {
                    latitude: 48.85661,
                    longitude: 2.35221,
                }),
                ..Metadata::default()
            },
            Metadata {
                capture: Some(capture_at(2024, 2, 15)),
                geo: Some(paris()),
                ..Metadata::default()
            },
        ];

        let plan = build_plan(
            Path::new("/dest"),
            SortRuleId::ByDateAndPlace,
            &files,
            &metadata,
            "Misc",
        )
        .expect("plan");

        for item in &plan.items {
            assert!(item.target.to_string_lossy().contains("Paris, France"));
        }
    }
}
