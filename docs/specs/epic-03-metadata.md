# EPIC-03. Metadata extraction (EXIF + dates + camera)

**Status:** pending
**Depends on:** EPIC-01

## Goal

Read EXIF from photos and metadata from videos to extract capture date + make/model + GPS.

## Subtasks

- [ ] Discovery: pick a crate for photos (candidates: `kamadak-exif`, `little_exif`, `nom-exif`)
- [ ] Discovery: approach for video (`nom-exif` for QuickTime atoms, MP4 box parsing)
- [ ] Record the decision in `docs/discoveries/`
- [ ] Service `metadata::extract(path) -> Metadata`
- [ ] Fallback strategy when EXIF is missing
- [ ] Unit tests: corrupted files, missing fields, multiple formats

## Open questions

1. **Date fallback:** if EXIF is empty — use the file `mtime`, `birthtime`, or mark as "no date" and route to a separate folder?
2. **Time zone:** EXIF dates usually have no TZ. Interpret as system local, as UTC, or read `OffsetTimeOriginal` when present?
3. **Video — priority:** ship in MVP or defer (in which case videos sort by `mtime` only)?
4. **RAW formats** (CR2, NEF, ARW, DNG) — full EXIF support or best-effort?
5. **XMP sidecar** files (RAW + XMP pair) — read XMP for the date, or ignore?
6. **Performance:** open each file synchronously vs. in parallel (rayon)?
