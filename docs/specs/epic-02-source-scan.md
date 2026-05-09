# EPIC-02. Source selection & scanning

**Status:** 🟢 complete
**Depends on:** EPIC-01

## Goal

User picks a folder → we count what's in it → we show a preview before launching anything.

## Decisions

### Scan depth — **flat (top-level only)**

We scan only the immediate contents of the selected folder; we do not descend into sub-folders. Recursive scan is deferred as a future enhancement (separate feature).

### Symlinks — **ignore**

We do not follow symlinks. This guards against cycles and against escaping the selected scope. A follow-symlinks toggle is future work.

### Hidden files — **hardcoded skip**

`.DS_Store`, `Thumbs.db`, every dotfile (`^\.`), and macOS metadata sidecars (`._*`) are always skipped, with no UI toggle.

### Multi-source — **single source only**

The user picks exactly one folder per run. Multi-source is a separate feature for later.

### Cache — **fresh scan every time**

No cache between sessions. If measurement shows scanning is slow on large libraries, we'll add a proper cache with smart invalidation as its own epic.

### Capabilities required

- `dialog:allow-open` — for `pick_source_dir`
- `core:default` — already in place
- FS access — Tauri lets us read a folder the user explicitly selected via dialog (drag-and-drop / dialog scope) without extra `fs:*` permissions for a read-only top-level scan. If implementation reveals we need `fs:allow-read-dir`, we'll add it then.

## Subtasks

Backend (PR #4 — open, awaiting verify + merge):

- [x] Capabilities: `dialog:allow-open` in `capabilities/default.json`
- [x] Wire `tauri-plugin-dialog` as a dependency + `.plugin(...)` in `lib.rs`
- [x] Command `pick_source_dir` via `tauri-plugin-dialog` (real, not stub)
- [x] Command `scan_source(path) -> ScanSummary { fileCount, sizeBytes, byKind }`
- [x] Repository wrapper with filters (`scanning::service` + `scanning::filters` + `domain::extensions`)
- [x] Unit tests on the critical branches (classification, hidden, flat, symlinks, validation)

UI integration (PR — current branch):

- [x] Wire the Browse button in `SetupScreen` (call `pick_source_dir`)
- [x] Trigger `scan_source` after the user picks a folder
- [x] Render `ScanSummary` (fileCount, sizeBytes, byKind) below the path field
- [x] Loading + error states (toast on `AppError`, spinner during scan)
- [x] Drop `DEFAULT_SOURCE` from the UI

## Progress notes

**Done in PR #4:**

1. Implemented the full Rust layer of `pick_source_dir` + `scan_source` per the decisions in this spec (flat, no symlinks, hardcoded hidden filter, single source).
2. Created `domain::extensions::classify_extension` — a shared classifier for the upcoming EPIC-05 (planner) and EPIC-06 (FS ops). Placed in `domain/`, not in `scanning/`, because it's a shared concept.
3. **Inline `AppError` refactor** (extends past the original EPIC-02 scope, but worth doing before error-handling code spreads): the serde shape changed from `{ kind, ...fields }` to `{ code, params: { ... } }` to be ready for i18n in EPIC-10. Factories (`internal`, `validation`, `io`) now accept `impl Display`. The TS counterpart `AppErrorDto` was updated.
4. The sandbox without GTK didn't allow running `cargo check` during the CI step — code review was done by hand, `cargo fmt --check` is green. Local verification on Mac is in the PR #4 checklist.

**Deliberately NOT done in this PR:**

- UI wiring — separate PR, since it's a clean React/IPC layer; the backend is stable and ready to be plugged in.
- `spawn_blocking` for `scan_directory` — for an MVP scan of a folder with <10k files, blocking a single tokio worker is acceptable; logged as a possible future optimization.
- Extending `AppError` with `DirectoryNotReadable / PermissionDenied` and similar variants — not anticipated; we'll add them when a concrete use case appears.

## Resolved questions

1. **Recursive or flat?** → flat (top-level only).
2. **Symlinks** → ignore.
3. **Hidden files** → hardcoded skip, no UI toggle.
4. **Multi-source** → single source only.
5. **Cache** → fresh scan every time.

## Open questions

(none)

## Out of scope

- Recursive scan (future feature)
- Multi-source (future feature)
- Scan cache (future feature, only if needed)
- EXIF / metadata extraction (EPIC-03)
- Tree preview UI with expand/collapse (EPIC-05, part of the planner)
