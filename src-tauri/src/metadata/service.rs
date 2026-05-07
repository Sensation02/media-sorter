use std::fs::File;
use std::path::{Path, PathBuf};

use chrono::{DateTime, Local, LocalResult, NaiveDateTime, TimeZone, Utc};
use nom_exif::{
    Exif, ExifIter, ExifTag, GPSInfo, LatLng, MediaParser, MediaSource, TrackInfo, TrackInfoTag,
};
use rayon::prelude::*;

use crate::domain::{Camera, CaptureDate, DateSource, GeoPoint, MediaFile, MediaKind, Metadata};
use crate::error::{AppError, AppResult};

const LATITUDE_NEGATIVE_HEMISPHERE: char = 'S';
const LONGITUDE_NEGATIVE_HEMISPHERE: char = 'W';

pub fn extract(path: &Path, kind: MediaKind) -> AppResult<Metadata> {
    let file =
        File::open(path).map_err(|error| AppError::io(format!("{}: {error}", path.display())))?;

    let Ok(source) = MediaSource::file(file) else {
        return Ok(Metadata::default());
    };

    let mut parser = MediaParser::new();

    let metadata = match kind {
        MediaKind::Photo | MediaKind::Raw => extract_from_photo(&mut parser, source),
        MediaKind::Video => extract_from_video(&mut parser, source),
    };

    Ok(metadata)
}

pub fn extract_batch(files: &[MediaFile]) -> Vec<(PathBuf, AppResult<Metadata>)> {
    files
        .par_iter()
        .map(|file| (file.path.clone(), extract(&file.path, file.kind)))
        .collect()
}

fn extract_from_photo(parser: &mut MediaParser, source: MediaSource<File>) -> Metadata {
    if !source.has_exif() {
        return Metadata::default();
    }

    let Ok(iter): Result<ExifIter, _> = parser.parse(source) else {
        return Metadata::default();
    };

    metadata_from_exif(&iter.into())
}

fn extract_from_video(parser: &mut MediaParser, source: MediaSource<File>) -> Metadata {
    if !source.has_track() {
        return Metadata::default();
    }

    let Ok(track): Result<TrackInfo, _> = parser.parse(source) else {
        return Metadata::default();
    };

    metadata_from_track(&track)
}

fn metadata_from_exif(exif: &Exif) -> Metadata {
    Metadata {
        capture: capture_from_exif(exif),
        geo: geo_from_exif(exif),
        camera: camera_from_exif(exif),
    }
}

fn metadata_from_track(track: &TrackInfo) -> Metadata {
    Metadata {
        capture: capture_from_track(track),
        geo: geo_from_track(track),
        camera: camera_from_track(track),
    }
}

fn capture_from_exif(exif: &Exif) -> Option<CaptureDate> {
    let value = exif.get(ExifTag::DateTimeOriginal)?;
    let (naive, _offset) = value.as_time_components()?;

    Some(CaptureDate {
        at: naive_local_to_utc(naive)?,
        source: DateSource::Exif,
    })
}

fn capture_from_track(track: &TrackInfo) -> Option<CaptureDate> {
    let value = track.get(TrackInfoTag::CreateDate)?;
    let (naive, _offset) = value.as_time_components()?;

    Some(CaptureDate {
        at: naive_local_to_utc(naive)?,
        source: DateSource::Exif,
    })
}

fn naive_local_to_utc(naive: NaiveDateTime) -> Option<DateTime<Utc>> {
    match Local.from_local_datetime(&naive) {
        LocalResult::Single(dt) | LocalResult::Ambiguous(dt, _) => Some(dt.with_timezone(&Utc)),
        LocalResult::None => None,
    }
}

fn camera_from_exif(exif: &Exif) -> Option<Camera> {
    let make = exif.get(ExifTag::Make).and_then(|v| v.as_str()).map(trim);
    let model = exif.get(ExifTag::Model).and_then(|v| v.as_str()).map(trim);

    build_camera(make, model)
}

fn camera_from_track(track: &TrackInfo) -> Option<Camera> {
    let make = track
        .get(TrackInfoTag::Make)
        .and_then(|v| v.as_str())
        .map(trim);
    let model = track
        .get(TrackInfoTag::Model)
        .and_then(|v| v.as_str())
        .map(trim);

    build_camera(make, model)
}

fn build_camera(make: Option<String>, model: Option<String>) -> Option<Camera> {
    if make.is_none() && model.is_none() {
        return None;
    }

    Some(Camera { make, model })
}

fn geo_from_exif(exif: &Exif) -> Option<GeoPoint> {
    let gps = exif.get_gps_info().ok().flatten()?;

    gps_to_geo_point(&gps)
}

fn geo_from_track(track: &TrackInfo) -> Option<GeoPoint> {
    let gps = track.get_gps_info()?;

    gps_to_geo_point(gps)
}

fn gps_to_geo_point(gps: &GPSInfo) -> Option<GeoPoint> {
    let latitude = decimal_degrees(
        &gps.latitude,
        gps.latitude_ref,
        LATITUDE_NEGATIVE_HEMISPHERE,
    )?;
    let longitude = decimal_degrees(
        &gps.longitude,
        gps.longitude_ref,
        LONGITUDE_NEGATIVE_HEMISPHERE,
    )?;

    Some(GeoPoint {
        latitude,
        longitude,
    })
}

fn decimal_degrees(coord: &LatLng, hemisphere: char, negative: char) -> Option<f64> {
    let degrees = coord.0.as_float() + coord.1.as_float() / 60.0 + coord.2.as_float() / 3600.0;

    if !degrees.is_finite() {
        return None;
    }

    match hemisphere.to_ascii_uppercase() {
        h if h == negative => Some(-degrees),
        'N' | 'E' => Some(degrees),
        _ => None,
    }
}

fn trim(value: &str) -> String {
    value.trim().to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::fs::File;
    use std::io::Write;

    use tempfile::TempDir;

    fn write_file(dir: &Path, name: &str, bytes: &[u8]) -> PathBuf {
        let path = dir.join(name);
        let mut file = File::create(&path).expect("create file");
        file.write_all(bytes).expect("write file");

        path
    }

    #[test]
    fn returns_io_error_for_missing_file() {
        let result = extract(
            Path::new("/definitely/not/here/missing.jpg"),
            MediaKind::Photo,
        );

        assert!(
            matches!(result, Err(AppError::Io { .. })),
            "expected Io error, got {result:?}"
        );
    }

    #[test]
    fn returns_empty_metadata_for_unrecognized_format() {
        let temp = TempDir::new().unwrap();
        let path = write_file(temp.path(), "fake.jpg", b"this is not a jpeg");

        let metadata = extract(&path, MediaKind::Photo).unwrap();

        assert!(metadata.capture.is_none());
        assert!(metadata.geo.is_none());
        assert!(metadata.camera.is_none());
    }

    #[test]
    fn returns_empty_metadata_for_empty_file() {
        let temp = TempDir::new().unwrap();
        let path = write_file(temp.path(), "empty.jpg", b"");

        let metadata = extract(&path, MediaKind::Photo).unwrap();

        assert!(metadata.capture.is_none());
        assert!(metadata.geo.is_none());
        assert!(metadata.camera.is_none());
    }

    #[test]
    fn returns_empty_metadata_for_corrupt_video() {
        let temp = TempDir::new().unwrap();
        let path = write_file(temp.path(), "broken.mp4", b"\x00\x00\x00\x18ftypbad ");

        let metadata = extract(&path, MediaKind::Video).unwrap();

        assert!(metadata.capture.is_none());
        assert!(metadata.geo.is_none());
        assert!(metadata.camera.is_none());
    }

    #[test]
    fn returns_empty_metadata_for_raw_without_exif() {
        let temp = TempDir::new().unwrap();
        let path = write_file(temp.path(), "fake.cr3", b"not a real RAW file");

        let metadata = extract(&path, MediaKind::Raw).unwrap();

        assert!(metadata.capture.is_none());
    }

    #[test]
    fn batch_collects_one_result_per_file() {
        let temp = TempDir::new().unwrap();
        let photo = write_file(temp.path(), "a.jpg", b"not a jpeg");
        let video = write_file(temp.path(), "b.mp4", b"not a video");

        let files = vec![
            MediaFile {
                path: photo.clone(),
                size_bytes: 0,
                kind: MediaKind::Photo,
            },
            MediaFile {
                path: video.clone(),
                size_bytes: 0,
                kind: MediaKind::Video,
            },
        ];

        let results = extract_batch(&files);

        assert_eq!(results.len(), 2);
        assert!(results.iter().all(|(_, r)| r.is_ok()));
        let paths: Vec<_> = results.into_iter().map(|(p, _)| p).collect();
        assert!(paths.contains(&photo));
        assert!(paths.contains(&video));
    }

    #[test]
    fn batch_surfaces_io_error_per_file() {
        let temp = TempDir::new().unwrap();
        let real = write_file(temp.path(), "real.jpg", b"junk");
        let missing = temp.path().join("missing.jpg");

        let files = vec![
            MediaFile {
                path: real,
                size_bytes: 0,
                kind: MediaKind::Photo,
            },
            MediaFile {
                path: missing.clone(),
                size_bytes: 0,
                kind: MediaKind::Photo,
            },
        ];

        let results = extract_batch(&files);
        let missing_result = results
            .into_iter()
            .find(|(p, _)| *p == missing)
            .map(|(_, r)| r)
            .unwrap();

        assert!(matches!(missing_result, Err(AppError::Io { .. })));
    }

    #[test]
    fn naive_local_to_utc_round_trips_known_instant() {
        let naive = NaiveDateTime::parse_from_str("2024-02-15 12:30:00", "%Y-%m-%d %H:%M:%S")
            .expect("parse naive");

        let utc = naive_local_to_utc(naive).expect("convert");

        let local_back = utc.with_timezone(&Local).naive_local();
        assert_eq!(local_back, naive);
    }
}
