use std::path::{Component, Path};

use crate::error::{AppError, AppResult};

pub fn validate_target_within_root(target: &Path, root: &Path) -> AppResult<()> {
    if has_parent_component(target) {
        return Err(AppError::validation(format!(
            "target path contains '..' segment: {}",
            target.display()
        )));
    }

    if !starts_with_root(target, root) {
        return Err(AppError::validation(format!(
            "target {} escapes destination root {}",
            target.display(),
            root.display()
        )));
    }

    Ok(())
}

pub fn verify_disk_space(required_bytes: u64, available_bytes: u64) -> AppResult<()> {
    if required_bytes > available_bytes {
        return Err(AppError::validation(format!(
            "insufficient disk space: need {required_bytes} bytes, have {available_bytes}"
        )));
    }

    Ok(())
}

fn has_parent_component(path: &Path) -> bool {
    path.components()
        .any(|component| matches!(component, Component::ParentDir))
}

fn starts_with_root(path: &Path, root: &Path) -> bool {
    path.starts_with(root)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn target_within_root_passes() {
        let root = Path::new("/dest");
        let target = Path::new("/dest/Month/IMG.jpg");

        assert!(validate_target_within_root(target, root).is_ok());
    }

    #[test]
    fn target_outside_root_is_rejected() {
        let root = Path::new("/dest");
        let target = Path::new("/other/IMG.jpg");

        let result = validate_target_within_root(target, root);

        assert!(matches!(result, Err(AppError::Validation { .. })));
    }

    #[test]
    fn target_with_parent_segment_is_rejected_even_within_root() {
        let root = Path::new("/dest");
        let target = Path::new("/dest/../other/IMG.jpg");

        let result = validate_target_within_root(target, root);

        assert!(matches!(result, Err(AppError::Validation { .. })));
    }

    #[test]
    fn equal_required_and_available_is_accepted() {
        assert!(verify_disk_space(100, 100).is_ok());
    }

    #[test]
    fn required_below_available_is_accepted() {
        assert!(verify_disk_space(50, 1000).is_ok());
    }

    #[test]
    fn required_above_available_is_rejected() {
        let result = verify_disk_space(2_000, 1_000);

        assert!(matches!(result, Err(AppError::Validation { .. })));
    }
}
