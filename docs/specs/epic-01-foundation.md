# EPIC-01. Foundation: domain, IPC contract, capabilities

**Status:** complete
**Branch:** `claude/core-functionality-lu8lu`
**Last updated:** 2026-05-09

## Goal

Skeleton the architecture before writing any logic. Without this, parallel backend/frontend work breaks down.

## Scope

- Domain types (Rust + TS counterparts)
- `AppError` enum (`thiserror`) following the table in `CLAUDE.md`
- IPC contract (Tauri commands input/output)
- Capabilities (FS + dialog)
- Thin IPC wrappers on the UI side

## Decisions

### Folder naming (`<Month Year>`)

- Canonical form: **natural format** — `лютий 2024` (UA), `February 2024` (EN). The Ukrainian sample is the localized output the app actually produces.
- Localization is driven by the UI language setting (details in EPIC-10); both languages are supported in the formatter from day one.
- Future alternative (settings toggle): `2024-02 лютий` for chronological filesystem sort.

### Path structure

`<destination-root>/<Month Year>/<Location>/<filename>`

Example: `~/Pictures/sorted/лютий 2024/Paris/IMG_4821.HEIC` (`лютий 2024` is the localized folder name produced by the app — equivalent to `February 2024`).

The `<Location>` segment comes from reverse geocoding (EPIC-04). Behavior for files without GPS is decided in EPIC-04 (`Unknown location` folder vs. no sub-tree).

Strategies that don't use location (`ByDate`, `ByType`, `ByCamera`) produce a single-level structure: `<destination-root>/<group>/<filename>` — the planner in EPIC-05 owns this.

### Media file definition (extensions)

Photos: `jpg`, `jpeg`, `png`, `heic`, `heif`, `webp`, `tiff`, `tif`, `bmp`, `gif`
RAW: `raw`, `cr2`, `cr3`, `nef`, `arw`, `dng`, `orf`, `rw2`, `pef`, `srw`, `raf`
Videos: `mov`, `mp4`, `m4v`, `avi`, `mkv`, `webm`, `mpg`, `mpeg`, `3gp`, `hevc`

Hidden files (`.DS_Store`, `Thumbs.db`, dotfiles) are always skipped.

### Primary key for history jobs

**Timestamp-based** (`i64`, UNIX epoch milliseconds at job start).

Rationale: naturally unique, sort-friendly, no counter required, and fits an append-only JSON store.

### Backend architecture

Standard layers (Clean / hexagonal-light, no over-abstraction):

```
src-tauri/src/
├── main.rs             # entrypoint
├── lib.rs              # tauri::Builder, command registration
├── domain/             # types: MediaFile, SortPlan, SortJob, ...
│   └── mod.rs
├── error.rs            # AppError (thiserror)
├── dto/                # serde-serialized IPC payloads (barrel)
│   └── mod.rs
├── commands/           # thin Tauri commands (no business logic)
│   └── mod.rs
├── services/           # business logic (scan, metadata, geo, planner, mover, history)
│   └── mod.rs
├── repositories/       # FS access wrapper (Repository pattern, mockable)
│   └── mod.rs
└── utils/              # shared helpers (time, path)
    └── mod.rs
```

Frontend mirrors the same shape:

```
src/
├── ipc/                # invoke + listen wrappers, typed
├── types/              # domain TS types (currently `sort.ts`)
├── features/sort/      # UI (already in place)
└── utils/
```

## Subtasks

- [x] Decide foundation specs (this file)
- [x] `domain/` types
- [x] `error.rs` — `AppError` enum
- [x] `dto/` — serde structs for every IPC payload
- [x] TS counterparts in `src/types/ipc.ts`
- [x] `commands/` — stubs (return `AppError::Internal("not yet implemented")`)
- [x] `capabilities/default.json` — add `dialog:allow-open` (delivered in EPIC-02; `fs:*` scopes still TBD when an epic actually needs them)
- [x] `src/ipc/` — `invoke` + `listen` wrappers

## IPC contract (draft)

| Command           | Input                  | Output            | Notes                       |
| ----------------- | ---------------------- | ----------------- | --------------------------- |
| `pick_source_dir` | —                      | `Option<PathBuf>` | Via `tauri-plugin-dialog`   |
| `scan_source`     | `{ path }`             | `ScanSummary`     | EPIC-02                     |
| `preview_plan`    | `{ scanId, rule }`     | `SortPlan`        | EPIC-05                     |
| `start_sort`      | `{ planId, settings }` | `JobId`           | EPIC-06                     |
| `pause_sort`      | `{ jobId }`            | `()`              |                             |
| `cancel_sort`     | `{ jobId }`            | `()`              |                             |
| `revert_job`      | `{ jobId }`            | `()`              | EPIC-07                     |
| `list_history`    | —                      | `HistoryItem[]`   | EPIC-07                     |
| `reveal_in_os`    | `{ path }`             | `()`              | Via opener                  |

Events (backend → frontend):

| Event           | Payload                   |
| --------------- | ------------------------- |
| `sort:progress` | `SortProgress`            |
| `sort:log`      | `SortLogEntry`            |
| `sort:done`     | `SortDone`                |
| `sort:error`    | `AppError` (serializable) |

## Resolved questions

1. **Folder naming format** — `лютий 2024` / `February 2024`, localized.
2. **Path structure** — `<Month Year>/<Location>/file`.
3. **Extensions list** — see above.
4. **Primary key** — timestamp-based (`i64` ms).
5. **Backend architecture** — standard layers (domain / dto / commands / services / repositories / utils).

## Open questions

(none)

## Out of scope

- EXIF extraction, geocoding, planner, FS operations (separate epics).
- UI changes beyond wiring up the IPC helpers.
