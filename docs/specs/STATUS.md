# Project Status

> Single source of truth for epic progress. Every epic spec carries its own
> `Status:` field; this file is the index that aggregates them. Update both
> places in the same PR — see `docs/workflow/delivery.md`, section
> _Epic Status Tracking_.

**Last reviewed:** 2026-05-12 (EPIC-09 closed)

## Status legend

- ⚪ **pending** — work not started; spec may still be a draft.
- 🟡 **in progress** — at least one subtask under way; PR open or partially merged.
- 🟢 **complete** — every in-scope subtask checked off; deferred items moved to
  another epic or to a follow-up note.

## Epics

| Epic                                  | Status      | Goal                                                         |
| ------------------------------------- | ----------- | ------------------------------------------------------------ |
| [EPIC-01](epic-01-foundation.md)      | 🟢 complete | Domain types, IPC contract, capabilities scaffolding         |
| [EPIC-02](epic-02-source-scan.md)     | 🟢 complete | Source folder selection and flat scanning                    |
| [EPIC-03](epic-03-metadata.md)        | 🟢 complete | EXIF / video metadata extraction (date, GPS, camera)         |
| [EPIC-04](epic-04-geo.md)             | 🟢 complete | Offline reverse geocoding (GPS → city / place name)          |
| [EPIC-05](epic-05-planner.md)         | 🟢 complete | Sort planner — turn a rule + scan into a move plan           |
| [EPIC-06](epic-06-fs-operations.md)   | 🟢 complete | Filesystem operations (move / copy with undo log)            |
| [EPIC-07](epic-07-history-undo.md)    | 🟢 complete | Job history and undo / revert                                |
| [EPIC-08](epic-08-progress-events.md) | 🟢 complete | Progress events (Tauri event channel from sort runner to UI) |
| [EPIC-09](epic-09-settings.md)        | 🟢 complete | Settings persistence and defaults                            |
| [EPIC-10](epic-10-i18n.md)            | ⚪ pending  | Internationalization (UA / EN folder names, UI strings)      |

## Active follow-ups

- Five Markdown files fail `prettier --check` on `staging`; tracked as a future
  `chore(docs): reformat` PR before wiring `make fmt-check` into `make check`.
