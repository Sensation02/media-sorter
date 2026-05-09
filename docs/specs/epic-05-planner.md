# EPIC-05. Sort planner (strategies)

**Status:** ⚪ pending
**Depends on:** EPIC-01, EPIC-03, EPIC-04 (for `ByDateAndPlace`)

## Goal

Input: a list of files with metadata. Output: a `SortPlan` mapping each file to a target path. Pure function, no I/O.

## Subtasks

- [ ] Trait `SortStrategy` (Strategy pattern)
- [ ] Implementations: `ByDate`, `ByDateAndPlace`, `ByType`, `ByCamera`
- [ ] Composer for strategies (if a stack is needed)
- [ ] Command `preview_plan(scan_id, rule) -> SortPlan` for the UI preview
- [ ] Unit tests per strategy (critical business logic)
- [ ] UI: real preview tree instead of the static `DEFAULT_RULES.preview`

## Open questions

1. **Composition:** does the user pick a single strategy (as `RuleSelector` does today), or a stack (`ByDate` + `ByPlace` together — which is exactly what the project description calls for)?
2. **Default rule** for MVP — which strategy gets priority?
3. **`ByCamera` for videos:** no make/model — where do those files go (`Unknown camera`)?
4. **UI preview** shows a real tree of the resulting folders (from `SortPlan`), or stays static like today?
5. **Custom strategies:** user-defined templates (e.g. `{Year}/{Camera}/{Date}`) — MVP or post-MVP?
