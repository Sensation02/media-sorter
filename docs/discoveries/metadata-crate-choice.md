# Discovery: metadata extraction crate

**Date:** 2026-05-07
**Author:** Claude (paired with project owner)
**Decision:** `nom-exif` 2.8 — single crate, photo + video.

## Question

Which Rust crate should we use to read EXIF from photos and QuickTime / MP4 metadata from videos in `metadata::extract` (EPIC-03)?

## Candidates

### `kamadak-exif`

- **Pros:** the most popular EXIF crate in the Rust ecosystem, stable API, good documentation, mature test suite.
- **Cons:**
  - Photos only. Video would require a second crate or a hand-rolled MP4 box parser.
  - HEIC support is partial / version-dependent.
  - The API hands back raw EXIF tag strings — the caller is fully responsible for parsing dates and GPS.

### `little_exif`

- **Pros:** simpler API than kamadak, oriented around read + write workflows.
- **Cons:**
  - Less mature; fewer formats.
  - Photos only; video is out of scope entirely.

### `nom-exif`

- **Pros:**
  - The only crate in the Rust ecosystem that declares both photo (JPEG / HEIC / HEIF / TIFF / RAW: CR2 / CR3 / NEF / ARW / DNG / RAF) and video (MP4 / MOV / M4V QuickTime atoms) support.
  - Unified API: `MediaParser` + `MediaSource`; `parse::<ExifIter>` for photos, `parse::<TrackInfo>` for videos.
  - Returns typed values (`EntryValue`, `chrono::NaiveDateTime + Option<FixedOffset>`).
  - Built-in `get_gps_info()` helper.
  - Streaming parser (for MOV files where metadata sits at the end of the file, the crate seeks rather than reads through).
- **Cons:**
  - Smaller community footprint compared to kamadak.
  - Async API is gated behind a feature flag (`async`); we use sync via `spawn_blocking`, so this is fine.
  - `MediaParser` is not `Send`-safe to share between threads — each rayon worker allocates its own (small overhead, see below).

## Decision

**`nom-exif` 2.8** is the pick. One crate, one error contract, one test strategy. If we eventually need something more specific (custom RAW parser, write-back), we'll add it surgically.

## Trade-offs accepted deliberately

1. Smaller community footprint — offset by an actively developed 2.x line and a cleaner API than the alternatives.
2. RAW support is best-effort. If `nom-exif` can't read EXIF from a particular RAW format, we return `Metadata::default()` and the file lands in "no date". We will not write a separate RAW parser.
3. XMP sidecars (`.xmp` next to RAW) are out of scope. Lightroom-style workflows are a future feature.

## Alternatives revisited if

- `nom-exif` proves slow or unstable on real-world libraries (10k+ files) — switch to `kamadak-exif` for photos plus a hand-rolled MP4 parser. This is documented duplication of code we accept only as an escape hatch.
- We need EXIF write-back — `little_exif`.

## References

- crates.io: <https://crates.io/crates/nom-exif>
- GitHub: <https://github.com/mindeng/nom-exif>
- Latest version at decision time: 2.8.0
