# EPIC-03. Metadata extraction (EXIF + dates + camera)

**Status:** complete
**Branch:** `claude/continue-epic-3-ZZ7jR`
**Depends on:** EPIC-01
**Last updated:** 2026-05-09

## Goal

Read EXIF from photos, container metadata from videos, and produce a unified `Metadata` value: capture date, GPS coordinates, and camera make / model. The output is consumed by EPIC-05 (planner).

## Decisions

### Crate — **`nom-exif`** (single crate for both photo and video)

`nom-exif 2.x` covers photos (JPEG / HEIC / TIFF / RAW: CR2 / CR3 / NEF / ARW / DNG / RAF) and videos (MP4 / MOV / M4V QuickTime atoms) through a single API (`MediaParser` + `MediaSource`). The alternatives (`kamadak-exif` for photos plus a hand-rolled MP4 parser) would have meant two error contracts and two test strategies for no real win. Full rationale lives in `docs/discoveries/metadata-crate-choice.md`.

### Date fallback — **EXIF only, otherwise `Unknown`**

If EXIF has no capture date we do not fall back to file `mtime` / `birthtime`. The file lands in the "no date" bucket explicitly so the user can see EXIF is missing and react deliberately. `DateSource::Mtime` from `domain/` is preserved for a future strategy (a settings option), but `metadata::extract` does not emit it.

### Timezone — **always system local time**

`OffsetTimeOriginal` is ignored. We read EXIF `DateTimeOriginal` as a `chrono::NaiveDateTime`, interpret it in `chrono::Local`, and convert to `Utc` for storage. This is less accurate for smartphone photos (which write a TZ tag) but eliminates an entire class of edge cases and keeps behaviour predictable. A higher-fidelity mode is a future settings toggle.

### Video — **in MVP, via `nom-exif`**

For `mov`, `mp4`, `m4v` we parse `TrackInfo` from QuickTime atoms (creation date, GPS, make, model). If `nom-exif` doesn't recognise the track, we return `Metadata::default()` and the planner sends the file to "no date".

### RAW — **best-effort through the same crate**

`nom-exif` declares CR2 / CR3 / NEF / ARW / DNG / RAF support. If a particular RAW doesn't yield EXIF, we treat it the same as a photo with no EXIF (empty `Metadata`). No RAW-specific code path.

### XMP sidecars — **ignored in MVP**

We don't read `.xmp` files alongside RAW. That's a separate Lightroom-style feature for later.

### Performance — **`rayon::par_iter` from day one**

Batch extract runs in parallel via rayon: `files.par_iter().map(|f| extract(&f.path, f.kind))`. Each rayon worker allocates its own `MediaParser` (the parser isn't `Send`-safe to share). Single-file extract stays synchronous — the Tauri command that eventually calls it will wrap in `tokio::task::spawn_blocking`.

## Scope

- `src-tauri/src/metadata/` (new feature module):
  - `service.rs` — `extract(path, kind) -> AppResult<Metadata>`, `extract_batch(files) -> Vec<(PathBuf, AppResult<Metadata>)>`
  - `mod.rs` — barrel
- No `command.rs` / `dto.rs` — EPIC-03 doesn't expose IPC. Consumer is the EPIC-05 planner.
- Helper: `From<nom_exif::Error>` mapping is local to `metadata/` so the shared `error.rs` doesn't acquire a dependency-specific import.

## IPC contract

(none — internal service)

## Subtasks

- [x] Discovery: pick a crate (`nom-exif` 2.8)
- [x] Discovery: video approach (`nom-exif` `TrackInfo`)
- [x] Record decision in `docs/discoveries/metadata-crate-choice.md`
- [x] Lock open questions in this file
- [x] Add `nom-exif` and `rayon` to `Cargo.toml`
- [x] Service `metadata::extract(path, kind) -> Metadata`
- [x] Batch variant via rayon
- [x] Unit tests: corrupt files, unsupported, missing fields
- ~~Integration with planner — moved to EPIC-05 scope~~

## Resolved questions

1. **Date fallback** → EXIF only, otherwise `Unknown`.
2. **Timezone** → always system local time.
3. **Video in MVP** → yes, via `nom-exif`.
4. **RAW** → best-effort through the same crate.
5. **XMP sidecar** → ignored in MVP.
6. **Performance** → `rayon` parallel from day one.

## Out of scope

- Tauri command for metadata (internal service)
- XMP sidecar reader
- Smart timezone (per-photo `OffsetTimeOriginal`)
- Reverse-geocoding GPS → place name (EPIC-04)
- Error reporting details in the UI (EPIC-08 progress events)
