# EPIC-08. Real-time progress (events)

**Status:** 🟢 complete
**Last updated:** 2026-05-10
**Depends on:** EPIC-01, EPIC-06

## Goal

The UI sees what's happening without polling.

## Subtasks

- [x] Events: `sort:progress`, `sort:log`, `sort:done`, `sort:error`
- [x] Backend emits via `app.emit`
- [x] Frontend: `useSortJob` hook with `listen()` and auto-cleanup
- [x] Throttle events (~10/sec max) so the webview isn't overwhelmed
- [x] Wire into `ProgressScreen` (currently `DEFAULT_PROGRESS`)

## Open questions

1. **Log granularity:** every file, or sampling (1 of N) for large jobs?
2. **Estimated time remaining:** simple extrapolation from the running average, or a more elaborate model?
3. **Behavior when the window is minimized:** keep emitting or pause?
4. **Backpressure:** if the UI is slow — drop events or buffer them?
5. **Log persistence after completion:** keep in memory, or write to a file (for the report)?
