# EPIC-19. Configurable date-folder formats

**Status:** 🟡 in progress
**Branches:** `feat/core-date-folder-formats` (current)
**Depends on:** EPIC-05 (planner), EPIC-09 (settings), EPIC-10 (i18n)
**Last updated:** 2026-06-13

## Goal

Let the user choose how the date-based sort groups files on disk. Until now the
`ByDate` / `ByDateAndPlace` rules produced a single fixed layout — a flat
`"<LocalizedMonth> <Year>"` segment (`February 2024` / `Лютий 2024`) with the
year last, which never sorts chronologically in a file manager. This epic adds a
curated set of six date-folder formats, selectable on the Setup screen alongside the
sort rule (shown only for date-based rules), while keeping the current style as the
default so existing libraries are untouched.

Grounded in `docs/discoveries/2026-06-13-folder-organization-schemes.md`
(directions #1 chronological-sort fix and #5 calendar granularity).

## Clarifications

### Assumptions

- The format is a **remembered preference** (`AppSettings`), read server-side in
  `preview_plan` exactly like `ui_language` — not a per-job choice.
- The capture timestamp is already extracted (EPIC-03) and bucketed via
  `with_timezone(&Local)`; this epic only **re-formats** the existing date — it
  does **not** change which timezone the bucket is computed in.
- Reversibility is independent of the format: `revert()` replays the recorded
  `MoveOp{from,to}` paths, so changing the format never threatens an undo
  (Article I).

### Resolved questions

| #   | Question                                          | Decision                                                                                                   | Resolved at |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- |
| Q1  | Replace the current layout, or add new options?   | **Add.** The default reproduces today's `February 2024` / `Лютий 2024` byte-for-byte → zero migration.    | 2026-06-13  |
| Q2  | A free-text template engine, or a fixed set?      | **Fixed closed enum** of 6 variants (Lightroom precedent: folders stay a curated dropdown). No free text. | 2026-06-13  |
| Q3  | Localize month names on disk, despite sort cost?  | **Yes, offer both** localized and numeric; the localized options carry a documented sort/idempotency caveat. | 2026-06-13 |
| Q4  | Close the latent path-segment safety gap now?     | **Yes** (user override) — sanitize every folder segment in `build_target` so an embedded separator cannot mis-nest. | 2026-06-13 |

## The six formats

For a capture of 2024-02-15, place "Paris, France" (`ByDateAndPlace` appends the
place after the date segments):

| Wire value (kebab-case) | Segments (en) | Segments (uk) |
| ----------------------- | ------------- | ------------- |
| `localized-month-year` **(default)** | `February 2024` | `Лютий 2024` |
| `year-localized-month`  | `2024 / February` | `2024 / Лютий` |
| `iso-month`             | `2024-02` | `2024-02` |
| `iso-month-nested`      | `2024 / 02` | `2024 / 02` |
| `iso-day-nested`        | `2024 / 02 / 15` | `2024 / 02 / 15` |
| `iso-month-localized`   | `2024-02 February` | `2024-02 Лютий` |

A `/` in a format becomes **separate folder levels**; every numeric part is
zero-padded. Numeric formats (`iso-*`) sort chronologically in every file
manager and locale; localized names sort by name (the documented trade-off).

## Scope

**In:** the `DateFolderFormat` domain enum + TS mirror + runtime guard; a
persisted `AppSettings.date_format` field (defensive store read: absent or
invalid → default, never panics); the format applied in `ByDate` /
`ByDateAndPlace` via `i18n::months::date_folder_segments`; per-segment path
sanitization in `build_target` (`utils::path_sanitize`) closing the latent
mis-nesting gap; a Setup-screen dropdown (under the sort rule, shown only for
date-based rules) with a live example per option; EN/UK labels; critical-path tests.

**Out (deliberately deferred):** timezone-offset correctness (the `Local`
bucketing is unchanged); the EXIF→mtime fallback ladder (the EPIC-03 "EXIF-only"
decision stands); new folder dimensions (Lens etc.); event/time-gap clustering;
a free-text template engine; ISO-week / quarter granularity.

## Caveats

- **Localized-on-disk idempotency:** re-sorting the same library after switching
  the UI language produces a divergent tree (`February 2024` vs `Лютий 2024`
  coexist). Undo itself is locale-independent (replays recorded paths).
- **Day-granularity sibling split:** `iso-day-nested` buckets per capture-day,
  and there is no sidecar / live-photo / RAW+JPEG pairing logic, so a companion
  file whose timestamp straddles midnight can land in a different day folder.
  No file is deleted and every move is reversible; sibling-grouping is a possible
  future epic.
- **Windows reserved names / trailing dot-or-space:** segments like `CON` or a
  trailing dot pass the sanitizer unchanged; on Windows they fail-closed (per-item
  write error, no data loss) and collide safely into the existing rename path.

## Acceptance criteria

1. Default (`localized-month-year`) reproduces `February 2024` / `Лютий 2024`
   byte-for-byte; existing planner/i18n tests stay green.
2. Each of the other five formats emits the segments in the table above, with
   zero-padded numeric parts and `/` mapped to separate levels.
3. `ByDateAndPlace` appends the resolved place after the date segments.
4. A file missing a capture date falls back to the unknown-date folder for every
   format.
5. A `settings.json` lacking or carrying an invalid `dateFormat` loads the
   default without error.
6. A folder segment containing a path separator is sanitized so the target keeps
   its intended nesting depth.
7. Selecting a format on the Setup screen (shown only for date rules) persists it and
   the live preview + the next sort use it.
