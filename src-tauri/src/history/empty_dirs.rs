use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

pub fn cleanup_empty_dirs(targets: &[PathBuf], root: &Path) -> Vec<PathBuf> {
    let mut removed = Vec::new();
    let mut visited: HashSet<PathBuf> = HashSet::new();

    for target in targets {
        walk_up(target.parent(), root, &mut visited, &mut removed);
    }

    removed
}

fn walk_up(
    start: Option<&Path>,
    root: &Path,
    visited: &mut HashSet<PathBuf>,
    removed: &mut Vec<PathBuf>,
) {
    let mut current = start;

    while let Some(dir) = current {
        if dir == root || !dir.starts_with(root) {
            return;
        }

        if !visited.insert(dir.to_path_buf()) {
            return;
        }

        if fs::remove_dir(dir).is_err() {
            return;
        }

        removed.push(dir.to_path_buf());
        current = dir.parent();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    fn make_dir(path: &Path) {
        fs::create_dir_all(path).expect("create dir");
    }

    fn make_file(path: &Path) {
        if let Some(parent) = path.parent() {
            make_dir(parent);
        }
        File::create(path).expect("create file");
    }

    #[test]
    fn single_empty_directory_is_removed() {
        let dir = tempdir().expect("tempdir");
        let root = dir.path();
        let leaf = root.join("Feb 2024").join("Paris");
        make_dir(&leaf);
        let target = leaf.join("IMG.jpg");

        let removed = cleanup_empty_dirs(&[target], root);

        assert!(!leaf.exists());
        assert!(removed.contains(&leaf));
    }

    #[test]
    fn nested_empty_directories_all_removed() {
        let dir = tempdir().expect("tempdir");
        let root = dir.path();
        let leaf = root.join("Feb 2024").join("Paris");
        make_dir(&leaf);
        let target = leaf.join("IMG.jpg");

        let removed = cleanup_empty_dirs(&[target], root);

        let month = root.join("Feb 2024");
        assert!(!leaf.exists());
        assert!(!month.exists());
        assert!(removed.contains(&leaf));
        assert!(removed.contains(&month));
    }

    #[test]
    fn non_empty_directory_blocks_walk_upward() {
        let dir = tempdir().expect("tempdir");
        let root = dir.path();
        let month = root.join("Feb 2024");
        let paris = month.join("Paris");
        make_dir(&paris);
        make_file(&month.join("user-notes.txt"));
        let target = paris.join("IMG.jpg");

        let removed = cleanup_empty_dirs(&[target], root);

        assert!(!paris.exists());
        assert!(month.exists());
        assert!(removed.contains(&paris));
        assert!(!removed.contains(&month));
    }

    #[test]
    fn root_directory_is_never_removed() {
        let dir = tempdir().expect("tempdir");
        let root = dir.path();
        let target = root.join("IMG.jpg");

        let removed = cleanup_empty_dirs(&[target], root);

        assert!(root.exists());
        assert!(removed.is_empty());
    }

    #[test]
    fn target_outside_root_does_not_walk() {
        let dir = tempdir().expect("tempdir");
        let root = dir.path().join("dest");
        make_dir(&root);
        let outside_dir = dir.path().join("other").join("Paris");
        make_dir(&outside_dir);
        let target = outside_dir.join("IMG.jpg");

        let removed = cleanup_empty_dirs(&[target], &root);

        assert!(outside_dir.exists());
        assert!(removed.is_empty());
    }

    #[test]
    fn shared_parent_only_attempted_once() {
        let dir = tempdir().expect("tempdir");
        let root = dir.path();
        let paris = root.join("Feb 2024").join("Paris");
        make_dir(&paris);
        let target_a = paris.join("a.jpg");
        let target_b = paris.join("b.jpg");

        let removed = cleanup_empty_dirs(&[target_a, target_b], root);

        let unique_paris: Vec<&PathBuf> = removed.iter().filter(|p| **p == paris).collect();
        assert_eq!(unique_paris.len(), 1);
    }
}
