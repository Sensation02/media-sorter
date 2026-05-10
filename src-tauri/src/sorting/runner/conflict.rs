use std::ffi::OsStr;
use std::path::{Path, PathBuf};

const MAX_SUFFIX: u32 = u32::MAX;

pub fn unique_target<F>(target: &Path, mut exists: F) -> PathBuf
where
    F: FnMut(&Path) -> bool,
{
    if !exists(target) {
        return target.to_path_buf();
    }

    let parent = target.parent().unwrap_or_else(|| Path::new(""));
    let stem = target.file_stem().unwrap_or_default();
    let extension = target.extension();

    for suffix in 1..=MAX_SUFFIX {
        let candidate = build_candidate(parent, stem, extension, suffix);

        if !exists(&candidate) {
            return candidate;
        }
    }

    target.to_path_buf()
}

fn build_candidate(parent: &Path, stem: &OsStr, extension: Option<&OsStr>, suffix: u32) -> PathBuf {
    let mut name = stem.to_os_string();
    name.push(format!(" ({suffix})"));

    if let Some(ext) = extension {
        name.push(".");
        name.push(ext);
    }

    parent.join(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    fn make_probe(taken: &[&Path]) -> impl FnMut(&Path) -> bool {
        let owned: HashSet<PathBuf> = taken.iter().map(|p| p.to_path_buf()).collect();
        move |path: &Path| owned.contains(path)
    }

    #[test]
    fn no_collision_returns_target_unchanged() {
        let target = Path::new("/dest/IMG.jpg");

        let result = unique_target(target, make_probe(&[]));

        assert_eq!(result, target);
    }

    #[test]
    fn single_collision_appends_one_suffix() {
        let target = Path::new("/dest/IMG.jpg");

        let result = unique_target(target, make_probe(&[Path::new("/dest/IMG.jpg")]));

        assert_eq!(result, Path::new("/dest/IMG (1).jpg"));
    }

    #[test]
    fn multiple_collisions_walk_until_free_suffix() {
        let target = Path::new("/dest/IMG.jpg");
        let taken = [
            Path::new("/dest/IMG.jpg"),
            Path::new("/dest/IMG (1).jpg"),
            Path::new("/dest/IMG (2).jpg"),
        ];

        let result = unique_target(target, make_probe(&taken));

        assert_eq!(result, Path::new("/dest/IMG (3).jpg"));
    }

    #[test]
    fn file_without_extension_appends_suffix_to_stem() {
        let target = Path::new("/dest/notes");

        let result = unique_target(target, make_probe(&[Path::new("/dest/notes")]));

        assert_eq!(result, Path::new("/dest/notes (1)"));
    }

    #[test]
    fn file_with_multiple_dots_appends_before_last_extension() {
        let target = Path::new("/dest/archive.tar.gz");

        let result = unique_target(target, make_probe(&[Path::new("/dest/archive.tar.gz")]));

        assert_eq!(result, Path::new("/dest/archive.tar (1).gz"));
    }

    #[test]
    fn dotfile_appends_suffix_after_full_name() {
        let target = Path::new("/dest/.gitignore");

        let result = unique_target(target, make_probe(&[Path::new("/dest/.gitignore")]));

        assert_eq!(result, Path::new("/dest/.gitignore (1)"));
    }

    #[test]
    fn closure_backed_probe_can_observe_each_candidate_once() {
        let target = Path::new("/dest/IMG.jpg");
        let mut seen: Vec<PathBuf> = Vec::new();

        let result = unique_target(target, |path: &Path| {
            seen.push(path.to_path_buf());
            path == Path::new("/dest/IMG.jpg") || path == Path::new("/dest/IMG (1).jpg")
        });

        assert_eq!(result, Path::new("/dest/IMG (2).jpg"));
        assert_eq!(seen.len(), 3);
    }
}
