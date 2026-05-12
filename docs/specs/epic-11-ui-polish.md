# EPIC-11. UI Polish (rolling)

**Status:** 🟡 in progress
**Branch:** `feat/epic-11-ui-polish-*` (one PR per polish batch)
**Depends on:** EPIC-01..EPIC-09 (every screen the polish targets must already exist)
**Last updated:** 2026-05-12

## Goal

A living backlog of small, surgical visual and interaction tweaks
discovered by manually reviewing the running app screen-by-screen.
Each item is a single polish observation (spacing, color, copy, hover,
focus, micro-animation, alignment, empty state, etc.) with a one-PR
scope. The epic exists to keep these polish items off the feature
epics and out of drive-by edits inside unrelated PRs
(Article IV — Scope discipline).

## How this epic works

Unlike feature epics, the Scope and Subtasks here are NOT locked up
front. They are appended as the owner walks through the UI and flags
something worth changing. The rules:

- **One observation = one row in the Subtasks table.** Add the row in
  the same PR that ships the change, so spec and code stay in sync.
- **Append-only during review.** Once a row is added it is not
  deleted, only struck through (`~~slug~~`) if rejected during triage.
- **One PR per row** (or a small group if the rows touch the same
  file and ship together cheaply). Branch:
  `feat/epic-11-ui-polish-<slug>`.
- **No drive-by refactors.** A polish PR only touches what the row
  asks for. Surrounding code stays untouched (Working Protocol §3).
- **CHANGELOG entry only if user-visible.** Most polish is user-
  visible → entry under `### Features` or `### Bug Fixes` as
  appropriate. Pure internal token / theme cleanups → no entry.
- **Epic stays open** as long as polish items keep arriving; status
  flips to 🟢 only when the owner explicitly closes the rolling epic.

## Scope (areas open for polish)

Every screen in `src/features/sort/screens/`:

- `setup-screen/` — source folder picker, rule selector, preview tree
- `progress-screen/` — live job progress and activity log
- `done-screen/` — sort completion summary
- `history-screen/` — historical jobs list with Revert
- `settings-screen/` — persisted settings UI

Every shared component in `src/features/sort/components/`:

- `error-boundary/`, `preview-tree/`, `rule-selector/`,
  `scan-breakdown/`, `sidebar/`, `stat/`, `status-dot/`, `toolbar/`,
  `tree/`

Design-system surface in `src/styles/` and the `@theme` token scale
(surface, fg, semantic colors, radius) introduced in the workbench
refresh.

## Subtasks

> Append rows as they come up. Each row: short slug, target file(s),
> observation, decision. Status: `proposed` → `accepted` → `done`
> (or `~~rejected~~`).

| #   | Slug                  | Target                                                                          | Observation                                                                                                                                                | Decision                                                                                                                                                              | Status   |
| --- | --------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 01  | `toolbar-app-name`    | `src-tauri/tauri.conf.json` (`windows[0].title`); `src/.../toolbar/Toolbar.tsx` | OS title bar shows `media-sorter`; the in-app top-right monospace label shows `sort-my-media`. Two competing app-name sources.                             | Set `windows[0].title` to `sort-my-media`; drop the right-aligned label from `Toolbar.tsx`. `productName` (Applications bundle name) stays `media-sorter` for now.                                                  | done     |
| 02  | `setup-two-column`    | `src/.../screens/setup-screen/SetupScreen.tsx`; `src/.../components/rule-selector/RuleSelector.tsx` | At wide window widths the source folder and sorting rule each consume a full row — long eye travel, wasted horizontal space.                               | Wrap source/rule sections in `grid grid-cols-1 lg:grid-cols-2 gap-7`. As a side effect, retuned `RuleSelector` from `grid-cols-3` to `grid-cols-1 sm:grid-cols-2` — 4 rules now lay out as 2×2 (no more orphan row). | done     |
| 03  | `sidebar-status-dot`  | `src/.../components/sidebar/Sidebar.tsx`                                        | The dot at the top of the sidebar is hardcoded `status="idle"` and never changes — visual noise pretending to carry signal. Toolbar already shows status.  | Deleted the sidebar status dot and the now-unused `StatusDot` import. Toolbar remains the single source of job-status truth.                                                                                       | done     |
| 04  | `sidebar-icon-size`   | `src/.../components/sidebar/Sidebar.tsx`                                        | Sidebar nav icons render at `15px` inside `36×36` buttons — thin and visually under-weight against the workbench surface.                                  | Bumped glyph size from `15px` to `19px`. Kept current unicode glyphs; Lucide swap deferred to a future polish row.                                                                                                  | done     |
| 05  | `remove-save-preset`  | `src/.../screens/setup-screen/SetupScreen.tsx`                                  | "Save preset" has no `onClick` and there is no preset concept anywhere in the codebase — dead UI.                                                          | Removed the button and the `ml-auto` spacer; footer is now a single-action `justify-end` row with `Run sort →`. A real preset feature, if wanted later, becomes its own feature epic, not polish.                  | done     |

## Out of scope

- Functional changes (new commands, new fields, new flows) — those
  live in their own feature epic.
- Accessibility audit pass (keyboard nav coverage, screen-reader
  labels, contrast WCAG check) — large enough to warrant its own
  epic later.
- i18n string changes — owned by EPIC-10.
- Theme switching (dark / light) — out of scope until requested
  separately.
- New components or new screens — polish only refines existing
  surfaces.

## References

- Constitution articles touched: III (simplicity), IV (scope
  discipline), VI (reversibility — micro-PRs are trivially revertable)
- Working Protocol §3 (surgical changes)
- Related specs: every feature epic whose screen is being polished
  (EPIC-02..EPIC-09)
