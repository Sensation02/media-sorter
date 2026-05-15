# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features

- Pre-flight ETA estimator: before a sort runs, the app now computes how long the job is expected to take based on file count, total size, and whether the destination is on the same volume as the source; the visible "≈ 15 sec" / "30 sec — 1 min" pill on the Setup screen lands in a follow-up release
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
- App now remembers your last session: when "Remember last sort rule" is on, the sort rule from your previous run is preselected on launch; when "Remember last destination" is on, the app re-scans the last folder you sorted automatically so you can jump straight into another pass
- Files without a capture date now land in a folder whose name comes from your settings (or the locale default — "Misc" in English, "Різне" in Ukrainian); changing the Unknown-date folder name in Settings is reflected the next time you preview a sort
- History retention now runs automatically at app startup: undo logs and summaries older than your configured window are removed so the app data folder doesn't grow indefinitely; active jobs and entries with future timestamps are never touched (Article I — user files are sacred)
- Sort setup now shows the source folder and the sorting rule side-by-side on wide windows, and the sorting rule cards lay out in a balanced 2×2 grid instead of leaving one card alone on its own row
- App window title now reads `sort-my-media`, matching the in-app branding (the duplicate label in the workbench header is gone)
- Sidebar navigation icons are larger and easier to scan
- Removed two non-functional UI elements from the sort setup: a "Save preset" button that did nothing, and an always-green decorative status dot at the top of the sidebar (the toolbar status dot remains and continues to reflect real sort status)
- Sorting rule is now a compact dropdown — the trigger shows the active rule, the open list shows each rule's name and what its folder layout looks like, replacing the previous 2×2 grid of cards
- History retention is now a dropdown with preset windows (1 week, 1 month, 3 / 6 / 12 months) instead of a free-text day count
- Photos and videos sorted with the Ukrainian UI now go into Ukrainian-named month folders (наприклад, "Лютий 2024" замість "February 2024")
- New language picker in Settings — switch between English and Ukrainian; takes effect immediately for the UI and for future sorts
- After a sort finishes the progress screen now stays on screen with the final counters, so quick jobs no longer flash past; tap "Continue" when you're ready to see the result summary
- Durations under one second now show as "0.4 s" (or "0,4 с" in Ukrainian) on the progress, done, and history screens instead of a stuck "00:00"
- Buttons now use the larger pill-style rounding everywhere by default for a more consistent look across screens
- "Reveal in Finder" on the Done screen now opens the destination folder in Finder (macOS), Explorer (Windows) or your default file manager (Linux); if the folder was removed between sort and click, an error toast appears instead

### Bug Fixes

- "Browse…" no longer freezes the app on macOS when picking a source folder

### Performance

### Reverts
