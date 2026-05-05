# EPIC-01. Foundation: domain, IPC contract, capabilities

**Status:** in progress
**Branch:** `claude/core-functionality-lu8lu`

## Goal

Заскелетувати архітектуру до того, як писати логіку. Без цього паралельна робота backend/frontend ламається.

## Scope

- Доменні типи (Rust + TS-двійники)
- `AppError` enum (`thiserror`) за таблицею з `CLAUDE.md`
- IPC-контракт (Tauri commands input/output)
- Capabilities (FS + dialog)
- Тонкі IPC-обгортки на боці UI

## Decisions

### Folder naming (`<Month Year>`)

- Канон: **натуральний формат** — `лютий 2024` (UA), `February 2024` (EN).
- Локалізація — від UI-language setting (детально в EPIC-10), на старті обидві мови підтримуються в форматтері.
- Альтернатива на майбутнє (опція в settings): `2024-02 лютий` для хронологічного file-system sort.

### Path structure

`<destination-root>/<Month Year>/<Location>/<filename>`

Приклад: `~/Pictures/sorted/лютий 2024/Paris/IMG_4821.HEIC`.

Сегмент `<Location>` беремо з reverse-geocoding (EPIC-04). Поведінка для файлів без GPS — окреме питання в EPIC-04 (`Unknown location` тека або без піддерева).

Стратегії, які не використовують локацію (`ByDate`, `ByType`, `ByCamera`), формують 1-рівневу структуру: `<destination-root>/<group>/<filename>` — це визначає planner у EPIC-05.

### Media file definition (extensions)

Photos: `jpg`, `jpeg`, `png`, `heic`, `heif`, `webp`, `tiff`, `tif`, `bmp`, `gif`
RAW: `raw`, `cr2`, `cr3`, `nef`, `arw`, `dng`, `orf`, `rw2`, `pef`, `srw`, `raf`
Videos: `mov`, `mp4`, `m4v`, `avi`, `mkv`, `webm`, `mpg`, `mpeg`, `3gp`, `hevc`

Hidden files (`.DS_Store`, `Thumbs.db`, dotfiles) пропускаємо завжди.

### Primary key for history jobs

**Timestamp-based** (`i64`, UNIX epoch milliseconds at job start).

Підстава: природньо унікальний, sort-friendly, не потребує лічильника, дружній до append-only JSON store.

### Backend architecture

Стандартні шари (Clean / hexagonal-light, без надмірних абстракцій):

```
src-tauri/src/
├── main.rs             # entrypoint
├── lib.rs              # tauri::Builder, command registration
├── domain/             # types: MediaFile, SortPlan, SortJob, ...
│   └── mod.rs
├── error.rs            # AppError (thiserror)
├── dto/                # serde-сериалізовані IPC payload-и (барель)
│   └── mod.rs
├── commands/           # тонкі Tauri-команди (без бізнес-логіки)
│   └── mod.rs
├── services/           # бізнес-логіка (scan, metadata, geo, planner, mover, history)
│   └── mod.rs
├── repositories/       # FS access wrapper (Repository pattern, mockable)
│   └── mod.rs
└── utils/              # shared helpers (time, path)
    └── mod.rs
```

Frontend дзеркально:

```
src/
├── ipc/                # invoke + listen wrappers, типізовані
├── types/              # доменні TS-типи (зараз `sort.ts`)
├── features/sort/      # UI (вже є)
└── utils/
```

## Subtasks

- [x] Decide foundation specs (this file)
- [x] `domain/` types
- [x] `error.rs` — `AppError` enum
- [x] `dto/` — serde structs для всіх IPC payload-ів
- [x] TS-двійники в `src/types/ipc.ts`
- [x] `commands/` — stubs (повертають `AppError::Internal("not yet implemented")`)
- [ ] `capabilities/default.json` — додати `dialog:allow-open`, `fs:allow-read-dir`, `fs:scope` (відкладено до EPIC-02 коли підключатимемо `tauri-plugin-dialog`)
- [x] `src/ipc/` — `invoke` + `listen` обгортки

## IPC contract (draft)

| Command           | Input                  | Output            | Notes                       |
| ----------------- | ---------------------- | ----------------- | --------------------------- |
| `pick_source_dir` | —                      | `Option<PathBuf>` | Через `tauri-plugin-dialog` |
| `scan_source`     | `{ path }`             | `ScanSummary`     | EPIC-02                     |
| `preview_plan`    | `{ scanId, rule }`     | `SortPlan`        | EPIC-05                     |
| `start_sort`      | `{ planId, settings }` | `JobId`           | EPIC-06                     |
| `pause_sort`      | `{ jobId }`            | `()`              |                             |
| `cancel_sort`     | `{ jobId }`            | `()`              |                             |
| `revert_job`      | `{ jobId }`            | `()`              | EPIC-07                     |
| `list_history`    | —                      | `HistoryItem[]`   | EPIC-07                     |
| `reveal_in_os`    | `{ path }`             | `()`              | Через opener                |

Events (backend → frontend):

| Event           | Payload                   |
| --------------- | ------------------------- |
| `sort:progress` | `SortProgress`            |
| `sort:log`      | `SortLogEntry`            |
| `sort:done`     | `SortDone`                |
| `sort:error`    | `AppError` (serializable) |

## Resolved questions

1. **Folder naming format** — `лютий 2024` / `February 2024`, локалізовано.
2. **Path structure** — `<Month Year>/<Location>/file`.
3. **Extensions list** — див. вище.
4. **Primary key** — timestamp-based (`i64` ms).
5. **Backend architecture** — стандартні шари (domain / dto / commands / services / repositories / utils).

## Open questions

(none)

## Out of scope

- EXIF-витяг, geocoding, planner, FS-операції (окремі епіки).
- UI-зміни поза підключенням IPC-обгорток.
