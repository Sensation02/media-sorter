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
- Sort engine moves photos and videos into the planned folders with a per-job log written before every move so a future revert can roll the job back; same-name collisions get a `(1)`, `(2)` suffix automatically, identical files are detected by name, size and content fingerprint when "Skip duplicates" is on, and a one-off "Dry run" flag lets the engine rehearse a job without touching any file (UI wiring lands in a follow-up release)
- Job history backend records every completed sort with how many files were moved, skipped, errored and how long it took; `Revert` reverses every move from a chosen job back to its source path, skips conflicts safely (never overwrites a manually-restored or replaced file) and cleans up empty folders the sort created (HistoryScreen wiring lands in a follow-up release)
- History screen now lists real completed sorts from disk with a Revert button per row; clicking Revert reverses the job and shows a toast with how many files were restored, skipped or errored, and the row updates to show "Reverted" so it can't be undone twice by mistake
- Live progress and activity log during a sort run
- Real-time progress screen during sort runs
- Settings persistence engine remembers your last sort rule, destination folder, unknown-date folder name and history retention window across app launches; on first launch the app detects the language from your operating system (English or Ukrainian today), with the settings UI and runtime language switching landing in follow-up releases
- Settings screen now reads and writes real persisted values: toggles for "Remember last sort rule" and "Remember last destination", an editable Unknown-date folder name (with locale-aware placeholder), a History retention number input (7-365 days), a language indicator (switching arrives with EPIC-10), and a Reset to defaults button that preserves your last sort rule and destination

### Bug Fixes

- "Browse…" no longer freezes the app on macOS when picking a source folder

### Performance

### Reverts
