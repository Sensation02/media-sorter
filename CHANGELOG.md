# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features

- Refreshed UI: dark workbench layout for sort jobs (setup, progress, done, history, settings)
- Design system tokens extended (@theme): surface scale, fg scale, semantic colors (warning/success), radius scale
- Source folder scan engine: counts photo, RAW and video files in the chosen folder; skips hidden, system and symlinked entries (UI wiring lands in a follow-up release)
- Pick a source folder from Setup: Browse opens the system folder dialog and shows file count, total size and a photo / RAW / video breakdown for the chosen folder
- Inline scan progress and error toasts when reading the chosen source folder fails
- Reads capture date, GPS coordinates and camera make / model from photos (JPEG, HEIC, TIFF, RAW) and videos (MP4, MOV, M4V); files without metadata fall through to "Unknown date" so the rest of the batch is unaffected (used by the upcoming sort planner)
- Offline reverse geocoding turns photo and video GPS into a "City, Country" label (e.g. "Paris, France"), with a per-job in-memory cache so a burst from the same spot is looked up once; works without any internet connection (used by the upcoming sort planner)
- Sort planner core: builds a deterministic folder layout for each photo and video based on date, date and place, file type or camera, with "Misc" for files missing the chosen grouping (UI preview and execution wiring land in follow-up releases)
- Folder scan now extracts photo and video metadata up front and caches the result on the app side, so previewing a sort layout is instant when switching between rules; the visual preview tree lands in a follow-up release
- Setup screen now shows a real preview tree of the chosen sorting layout for the scanned folder, with file counts per destination directory; "By date and place" is the new default rule and matches the project's headline use case

### Bug Fixes

- "Browse…" no longer freezes the app on macOS when picking a source folder

### Performance

### Reverts
