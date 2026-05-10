# EPIC-05. Sort planner (strategies)

**Status:** 🟡 in progress
**Branch:** `feat/epic-05-planner-strategies` (PR1 of 3)
**Depends on:** EPIC-01, EPIC-03, EPIC-04
**Last updated:** 2026-05-10

## Goal

Turn `(scan, rule)` into a deterministic `SortPlan { items: [{source, target}] }`. Pure function, no I/O. Consumed by EPIC-06 (filesystem operations) and the UI preview tree.

## Decisions

### Strategy set — **fixed enum, no user-defined templates in MVP**

Four strategies, matching the existing `SortRuleId` enum: `ByDate`, `ByDateAndPlace`, `ByType`, `ByCamera`. A composer / stack abstraction is **not** introduced — `ByDateAndPlace` already encodes the date + place stack the project description calls for. Custom templates (`{Year}/{Camera}/{Date}`) are deferred to a future epic; they require a template DSL, escaping, persistence, and UI editor that aren't justified yet (Constitution Article III, IV).

### Default rule in the SetupScreen — **`ByDateAndPlace`**

The headline use case for the project is `<Month Year>/<City, Country>/`. The UI default is the same. Falls back to `Misc/` when there is no capture date.

### Top-level fallback — **`Misc`**

When the **primary axis** of the chosen rule is missing (no capture date for `ByDate` / `ByDateAndPlace`, no make/model for `ByCamera`), the file lands directly in `<root>/Misc/<filename>`. No nested sub-bucket, even if a secondary axis is present — collapsing avoids a half-classified `<Year ?>/<City>/` tree.

### Sub-level fallback — **EPIC-04's `Unknown location` stays**

When `ByDateAndPlace` has a capture date but no GPS, the file lands in `<Month Year>/Unknown location/<filename>`. We do **not** swap this for `Misc/` — `Unknown location` was already locked in EPIC-04 as the placeholder owned by the planner. A user looking at `February 2024/Unknown location/` immediately understands that the date worked but the GPS was missing; `February 2024/Misc/` would lose that signal.

### Strategy pattern — **trait `SortStrategy`**

```rust
pub trait SortStrategy {
    fn folder_segments(
        &self,
        file: &MediaFile,
        metadata: &Metadata,
        geo: &mut GeoCache,
    ) -> Vec<String>;
}
```

Each implementation is a unit struct (`ByDate`, `ByDateAndPlace`, `ByType`, `ByCamera`). The trait returns folder path segments (no root, no filename) so `build_plan` controls path assembly. `GeoCache` is threaded through every call so `ByDateAndPlace` can use it; the other strategies ignore the parameter.

### Month/Year format — **`%B %Y` in system local timezone**

`captured_at.with_timezone(&Local).format("%B %Y").to_string()` → `February 2024`. English / system-locale rendering. Localized output (`лютий 2024`) is the responsibility of EPIC-10.

### Camera label — **`{make} {model}` with single-side fallback**

If both `Camera::make` and `Camera::model` are present → `format!("{make} {model}")`. If only one is present → that one. If neither → `Misc/`. We do **not** dedupe `Canon Canon EOS R5` artifacts — that's tidying for a later refinement.

### Type labels — **`Photos` / `Videos` / `RAW`**

Match the strings the existing UI in `src/features/sort/constants.ts` already showcases. Photos → `Photos`, Raw → `RAW`, Videos → `Videos`.

### Conflict resolution — **planner emits ideal targets; EPIC-06 deduplicates at write time**

Two source files with the same filename will produce identical `SortPlanItem.target`. The planner does not invent suffixes — it has no filesystem knowledge. EPIC-06's mover is responsible for `IMG_4821.jpg`, `IMG_4821 (1).jpg`, etc. Tests cover only the planner's pure mapping.

### ScanSession cache — **PR2 scope, not PR1**

PR1 ships only the pure `build_plan` function. PR2 adds the `ScanSession { files, metadata }` cache + `ScanId` + `preview_plan(scan_id, rule)` IPC; PR3 wires the UI tree.

## Scope

### PR1 (this PR) — `feat(planner)`

- `src-tauri/src/sorting/planner/` (new module):
  - `mod.rs` — barrel
  - `strategy.rs` — `SortStrategy` trait + four unit-struct impls + `Misc` / `Unknown location` constants + format helpers
  - `service.rs` — `build_plan(root, rule, files, metadata) -> SortPlan`
- `src-tauri/src/sorting/mod.rs` — register `pub mod planner;`
- Unit tests covering every (rule × metadata-completeness) combination and `build_plan` integration
- `docs/specs/STATUS.md` — EPIC-05 row → 🟡 **in progress**

### PR2 — `feat(sorting)` — preview command + scan cache

- `ScanId` domain type (timestamp-based, like `JobId`)
- `ScanSession` in-memory cache (`Mutex<HashMap<ScanId, ScanSession>>`) in `scanning/`
- `scan_source` returns `ScanId` alongside `ScanSummary`
- Real `preview_plan(scan_id, rule)` IPC: pull session → build plan → return `SortPlan`
- Frontend IPC wrapper + types
- Stale-session pruning when a new scan starts

### PR3 — `feat(ui)` — real preview tree

- `usePlanPreview(scanId, ruleId)` hook → `previewPlan` IPC
- `PreviewTree` component derived from `SortPlan.items` (group by directory, count files)
- Replace `DEFAULT_RULES.preview` static fixtures
- SetupScreen default rule → `ByDateAndPlace`
- UI snapshot tests via Vitest

## IPC contract (PR2 only)

| Command        | Input              | Output                | Notes         |
| -------------- | ------------------ | --------------------- | ------------- |
| `scan_source`  | `{ path }`         | `{ scanId, summary }` | adds `scanId` |
| `preview_plan` | `{ scanId, rule }` | `SortPlan`            | replaces stub |

## Subtasks

### PR1

- [x] Lock decisions in this spec
- [ ] `SortStrategy` trait
- [ ] `ByDate`, `ByDateAndPlace`, `ByType`, `ByCamera` impls
- [ ] `format_month_year`, `format_place`, `format_camera` helpers
- [ ] `build_plan` orchestrator
- [ ] Per-strategy unit tests
- [ ] `build_plan` integration test
- [ ] STATUS.md row → 🟡 in progress

### PR2

- [ ] `ScanId` domain type
- [ ] `ScanSession` cache
- [ ] `scan_source` returns `{ scanId, summary }`
- [ ] `preview_plan` IPC implementation
- [ ] Frontend IPC types + wrapper
- [ ] Stale-session pruning

### PR3

- [ ] `usePlanPreview` hook
- [ ] `PreviewTree` component from `SortPlan.items`
- [ ] Default rule → `ByDateAndPlace`
- [ ] Remove static `DEFAULT_RULES.preview`
- [ ] UI snapshot tests
- [ ] STATUS.md row → 🟢 complete

## Resolved questions

1. **Composition** → fixed enum of 4 rules; `ByDateAndPlace` is the only composite, encoded directly. No generic composer.
2. **Default rule** → `ByDateAndPlace`.
3. **`ByCamera` for files without make/model** → `Misc/`.
4. **UI preview** → real tree derived from `SortPlan.items`, not static fixtures.
5. **Custom strategies** → post-MVP; not in EPIC-05.
6. **Top-level vs sub-level fallback names** → `Misc` for missing primary axis (collapses to root); `Unknown location` for missing secondary location only.

## Out of scope

- Custom template DSL
- Conflict resolution (rename / overwrite) — EPIC-06
- Locale-aware month names and folder labels — EPIC-10
- Move execution / undo log — EPIC-06 / EPIC-07
- Progress events — EPIC-08

## References

- Constitution articles touched: III (simplicity), IV (scope discipline), V (type safety), IX (tests on critical path).
- Related specs: [EPIC-01](epic-01-foundation.md), [EPIC-03](epic-03-metadata.md), [EPIC-04](epic-04-geo.md).
