use super::MediaKind;

const PHOTO_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "heic", "heif", "webp", "tiff", "tif", "bmp", "gif",
];

const RAW_EXTENSIONS: &[&str] = &[
    "raw", "cr2", "cr3", "nef", "arw", "dng", "orf", "rw2", "pef", "srw", "raf",
];

const VIDEO_EXTENSIONS: &[&str] = &[
    "mov", "mp4", "m4v", "avi", "mkv", "webm", "mpg", "mpeg", "3gp", "hevc",
];

/// Maps a file extension (without the leading dot) to its [`MediaKind`].
///
/// Comparison is case-insensitive; returns `None` for non-media or unknown
/// extensions.
pub fn classify_extension(extension: &str) -> Option<MediaKind> {
    let lowered = extension.to_ascii_lowercase();
    let candidate = lowered.as_str();

    if PHOTO_EXTENSIONS.contains(&candidate) {
        return Some(MediaKind::Photo);
    }

    if RAW_EXTENSIONS.contains(&candidate) {
        return Some(MediaKind::Raw);
    }

    if VIDEO_EXTENSIONS.contains(&candidate) {
        return Some(MediaKind::Video);
    }

    None
}
