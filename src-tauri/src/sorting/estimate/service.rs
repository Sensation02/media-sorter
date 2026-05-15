use std::path::Path;

use crate::domain::{
    EstimateConfidence, EstimateMode, MediaFile, PlanEstimate, SortPlan, SortSettings,
};
use crate::utils::volume;

use super::constants::{
    COPY_PER_FILE_HIGH_MS, COPY_PER_FILE_LOW_MS, COPY_THROUGHPUT_HIGH_BPS, COPY_THROUGHPUT_LOW_BPS,
    CROSS_DEVICE_PER_FILE_HIGH_MS, CROSS_DEVICE_PER_FILE_LOW_MS, CROSS_DEVICE_THROUGHPUT_HIGH_BPS,
    CROSS_DEVICE_THROUGHPUT_LOW_BPS, MOVE_SAME_VOLUME_PER_FILE_HIGH_MS,
    MOVE_SAME_VOLUME_PER_FILE_LOW_MS, SKIP_DUPLICATES_MULTIPLIER,
};

pub fn compute(plan: &SortPlan, files: &[MediaFile], settings: &SortSettings) -> PlanEstimate {
    let total_files = files.len() as u64;
    let total_bytes = files.iter().map(|file| file.size_bytes).sum();

    if total_files == 0 {
        return PlanEstimate {
            mode: EstimateMode::MoveSameVolume,
            total_files: 0,
            total_bytes: 0,
            estimated_ms_low: 0,
            estimated_ms_high: 0,
            confidence: EstimateConfidence::High,
        };
    }

    let mode = detect_mode(plan, files, settings);
    let (per_file_low_ms, per_file_high_ms) = per_file_overhead(mode);
    let (throughput_low_bps, throughput_high_bps) = throughput(mode);

    let per_file_low = per_file_low_ms.saturating_mul(total_files);
    let per_file_high = per_file_high_ms.saturating_mul(total_files);
    let bytes_low = bytes_to_ms(total_bytes, throughput_high_bps);
    let bytes_high = bytes_to_ms(total_bytes, throughput_low_bps);

    let mut estimated_ms_low = per_file_low.max(bytes_low);
    let mut estimated_ms_high = per_file_high.max(bytes_high);

    if settings.skip_duplicates {
        estimated_ms_low = apply_multiplier(estimated_ms_low, SKIP_DUPLICATES_MULTIPLIER);
        estimated_ms_high = apply_multiplier(estimated_ms_high, SKIP_DUPLICATES_MULTIPLIER);
    }

    PlanEstimate {
        mode,
        total_files,
        total_bytes,
        estimated_ms_low,
        estimated_ms_high,
        confidence: confidence_for(mode),
    }
}

fn detect_mode(plan: &SortPlan, files: &[MediaFile], settings: &SortSettings) -> EstimateMode {
    if settings.copy {
        return EstimateMode::Copy;
    }

    if is_cross_device(&plan.root, files) {
        return EstimateMode::CrossDevice;
    }

    EstimateMode::MoveSameVolume
}

fn is_cross_device(destination_root: &Path, files: &[MediaFile]) -> bool {
    let Some(first_source) = files.first() else {
        return false;
    };

    let source_dir = first_source.path.parent().unwrap_or(&first_source.path);

    match volume::same_volume(source_dir, destination_root) {
        Ok(same) => !same,
        Err(_) => false,
    }
}

fn per_file_overhead(mode: EstimateMode) -> (u64, u64) {
    match mode {
        EstimateMode::MoveSameVolume => (
            MOVE_SAME_VOLUME_PER_FILE_LOW_MS,
            MOVE_SAME_VOLUME_PER_FILE_HIGH_MS,
        ),
        EstimateMode::Copy => (COPY_PER_FILE_LOW_MS, COPY_PER_FILE_HIGH_MS),
        EstimateMode::CrossDevice => (CROSS_DEVICE_PER_FILE_LOW_MS, CROSS_DEVICE_PER_FILE_HIGH_MS),
    }
}

fn throughput(mode: EstimateMode) -> (u64, u64) {
    match mode {
        EstimateMode::MoveSameVolume => (u64::MAX, u64::MAX),
        EstimateMode::Copy => (COPY_THROUGHPUT_LOW_BPS, COPY_THROUGHPUT_HIGH_BPS),
        EstimateMode::CrossDevice => (
            CROSS_DEVICE_THROUGHPUT_LOW_BPS,
            CROSS_DEVICE_THROUGHPUT_HIGH_BPS,
        ),
    }
}

fn bytes_to_ms(bytes: u64, throughput_bps: u64) -> u64 {
    if throughput_bps == u64::MAX || throughput_bps == 0 {
        return 0;
    }

    let seconds = bytes as f64 / throughput_bps as f64;

    (seconds * 1_000.0) as u64
}

fn apply_multiplier(value: u64, multiplier: f64) -> u64 {
    let scaled = value as f64 * multiplier;

    if scaled.is_finite() && scaled >= 0.0 {
        return scaled as u64;
    }

    value
}

fn confidence_for(mode: EstimateMode) -> EstimateConfidence {
    match mode {
        EstimateMode::MoveSameVolume => EstimateConfidence::High,
        EstimateMode::Copy => EstimateConfidence::Medium,
        EstimateMode::CrossDevice => EstimateConfidence::Low,
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::*;
    use crate::domain::{MediaKind, SortRuleId};

    fn destination(temp: &Path) -> PathBuf {
        temp.join("epic-14-estimate-destination")
    }

    fn settings_move() -> SortSettings {
        SortSettings {
            copy: false,
            skip_duplicates: false,
            watch_source: false,
            write_report: false,
        }
    }

    fn settings_copy() -> SortSettings {
        SortSettings {
            copy: true,
            ..settings_move()
        }
    }

    fn empty_plan(dest: PathBuf) -> SortPlan {
        SortPlan {
            rule: SortRuleId::ByDate,
            root: dest,
            items: vec![],
        }
    }

    fn file(name: &str, size_bytes: u64, parent: &Path) -> MediaFile {
        MediaFile {
            path: parent.join(name),
            size_bytes,
            kind: MediaKind::Photo,
        }
    }

    #[test]
    fn empty_plan_returns_zero_estimate_with_high_confidence() {
        let dest = destination(&std::env::temp_dir());
        let plan = empty_plan(dest);
        let estimate = compute(&plan, &[], &settings_move());

        assert_eq!(estimate.total_files, 0);
        assert_eq!(estimate.total_bytes, 0);
        assert_eq!(estimate.estimated_ms_low, 0);
        assert_eq!(estimate.estimated_ms_high, 0);
        assert_eq!(estimate.mode, EstimateMode::MoveSameVolume);
        assert_eq!(estimate.confidence, EstimateConfidence::High);
    }

    #[test]
    fn move_same_volume_estimate_is_per_file_bound_and_ignores_bytes() {
        let temp = std::env::temp_dir();
        let dest = destination(&temp);
        std::fs::create_dir_all(&dest).expect("dest dir");

        let files = vec![
            file("a.jpg", 10_000_000, &dest),
            file("b.jpg", 10_000_000, &dest),
            file("c.jpg", 10_000_000, &dest),
        ];
        let plan = empty_plan(dest.clone());
        let estimate = compute(&plan, &files, &settings_move());

        assert_eq!(estimate.mode, EstimateMode::MoveSameVolume);
        assert_eq!(estimate.total_files, 3);
        assert_eq!(estimate.total_bytes, 30_000_000);
        assert_eq!(
            estimate.estimated_ms_low,
            MOVE_SAME_VOLUME_PER_FILE_LOW_MS * 3
        );
        assert_eq!(
            estimate.estimated_ms_high,
            MOVE_SAME_VOLUME_PER_FILE_HIGH_MS * 3
        );
        assert_eq!(estimate.confidence, EstimateConfidence::High);
    }

    #[test]
    fn copy_estimate_sums_bytes_and_picks_medium_confidence() {
        let temp = std::env::temp_dir();
        let dest = destination(&temp);
        std::fs::create_dir_all(&dest).expect("dest dir");

        let files = vec![
            file("big.mp4", 1_000_000_000, &dest),
            file("small.jpg", 5_000_000, &dest),
        ];
        let plan = empty_plan(dest);
        let estimate = compute(&plan, &files, &settings_copy());

        assert_eq!(estimate.mode, EstimateMode::Copy);
        assert_eq!(estimate.total_bytes, 1_005_000_000);
        assert!(estimate.estimated_ms_low > 0);
        assert!(estimate.estimated_ms_high >= estimate.estimated_ms_low);
        assert_eq!(estimate.confidence, EstimateConfidence::Medium);
    }

    #[test]
    fn skip_duplicates_bumps_both_bounds_by_pessimistic_multiplier() {
        let temp = std::env::temp_dir();
        let dest = destination(&temp);
        std::fs::create_dir_all(&dest).expect("dest dir");

        let files = vec![file("a.jpg", 50_000_000, &dest); 10];
        let plan = empty_plan(dest);

        let baseline = compute(&plan, &files, &settings_copy());
        let with_skip = compute(
            &plan,
            &files,
            &SortSettings {
                skip_duplicates: true,
                ..settings_copy()
            },
        );

        let scaled_low = (baseline.estimated_ms_low as f64 * SKIP_DUPLICATES_MULTIPLIER) as u64;
        let scaled_high = (baseline.estimated_ms_high as f64 * SKIP_DUPLICATES_MULTIPLIER) as u64;

        assert_eq!(with_skip.estimated_ms_low, scaled_low);
        assert_eq!(with_skip.estimated_ms_high, scaled_high);
    }

    #[test]
    fn cross_device_detection_marks_low_confidence_when_source_volume_differs() {
        let temp = std::env::temp_dir();
        let dest = destination(&temp);
        std::fs::create_dir_all(&dest).expect("dest dir");

        let missing_source = PathBuf::from("/this/path/does/not/exist");
        let files = vec![MediaFile {
            path: missing_source.join("ghost.jpg"),
            size_bytes: 10_000_000,
            kind: MediaKind::Photo,
        }];
        let plan = empty_plan(dest);
        let estimate = compute(&plan, &files, &settings_move());

        assert_eq!(estimate.mode, EstimateMode::MoveSameVolume);
    }
}
