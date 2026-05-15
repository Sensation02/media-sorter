# EPIC-13. Reveal in Finder

**Status:** 🟢 complete
**Branch:** `feat/epic-13-reveal-in-finder`
**Owner:** Vasyl Kaminskyi
**Last updated:** 2026-05-15

## Goal

Make the "Reveal in Finder" button on the Done screen actually open the OS file manager (Finder on macOS, Explorer on Windows, default file manager on Linux) at the sort's destination folder. Currently the button is shown but does nothing — clicking it only writes `console.warn("[SortApp] onReveal not yet wired to Tauri")`, violating Article I (UX predictability) and Article III (don't ship UI that doesn't work).

## Clarifications

### Assumptions

- `@tauri-apps/plugin-opener@^2.5.4` is already an installed dependency and exposes the JS `revealItemInDir(path)` helper.
- `SortDoneDto.destination` is the absolute path of the destination folder and is still valid at the moment the user clicks `Reveal in Finder` (immediately after a successful sort, the folder has just been created/written).
- Tauri capabilities can be extended to allow `revealItemInDir` without compromising the existing security posture (no network, no arbitrary FS exposure beyond what the user already operates on).

### Open questions

| #   | Question                                                                                                | Proposed answer                                                                                                                                                                                                         | Status |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Q1  | Reveal the destination directory itself (open it) or one of its sorted files (highlight inside parent)? | Reveal the destination DIRECTORY. Highlighting a specific file would be arbitrary — the sort spreads files across many subfolders. Opening the root destination gives the user the full overview at one glance.         | open   |
| Q2  | What if the destination path no longer exists when the button is clicked (user deleted it manually)?    | Show an error toast via `toAppErrorView`; do not crash. Same pattern as other IPC error handling in `useSortOrchestration`.                                                                                             | open   |
| Q3  | Linux fallback when there is no standard "reveal at"?                                                   | `tauri-plugin-opener` already handles this — it falls back to `xdg-open` on the parent directory. We rely on the plugin's cross-platform behavior; no extra logic needed in our code.                                   | open   |
| Q4  | Should the button be disabled when destination is empty or missing?                                     | Optional polish. For MVP: button is always enabled when the screen renders (we only render this screen after a successful sort, so destination is guaranteed present at that moment). Defensive disable can come later. | open   |

### Edge cases

- Destination directory got deleted between sort completion and click → plugin returns an error, our handler shows an error toast.
- User on macOS with multiple Finder workspaces — `revealItemInDir` opens the user's default workspace; we do not control which one.
- Destination path contains spaces, unicode, or special chars — plugin handles them; no escaping needed on our side.
- Destination is a symlink — plugin follows it.

### Constraints

- Article I (user files sacred): this is a **read-only** operation. No file mutations possible via this command.
- Article II (privacy): no network calls — purely local OS API invocation.
- No new dependencies required (`tauri-plugin-opener` is already installed).
- A new Tauri capability entry will be needed in `src-tauri/capabilities/*.json` to authorize the `opener:allow-reveal-item-in-dir` permission (or whatever the plugin namespace is).

## Scope

What this PR ships:

- Tauri capability authorisation for the `opener` plugin's reveal-item-in-dir permission (already covered by `opener:default` in `src-tauri/capabilities/default.json`, no edits required).
- A thin Tauri command `reveal_directory` (Rust side) that validates the target exists and delegates to `tauri_plugin_opener::reveal_item_in_dir`, mapping plugin errors to `AppError::Io`.
- IPC binding `revealDirectory(path: string): Promise<void>` in `src/ipc/commands.ts` that invokes the Rust command (`invoke("reveal_directory", { request: { path } })`).
- `revealDestination` handler added to `useSortOrchestration` hook, with `try/catch` + `toAppErrorView` + `toast.error` on failure (matching the existing handler pattern for `pause`, `cancel`, `revert`).
- `SortApp.tsx` `onReveal` JSX prop forwards to `handlers.revealDestination(done.destination)`. The placeholder `console.warn` and the inline `// TODO(IPC):` comment are removed.
- Manual visual smoke on macOS (and Windows if a build is available) — Finder/Explorer should open with the destination folder visible.
- CHANGELOG entry under `## [Unreleased]` → `### Features` (user-visible).
- STATUS.md row flips ⚪ → 🟡 → 🟢 across the PR lifecycle.

## Decisions

### Use plugin directly vs. custom Rust command

**Decision**: route through a Rust `reveal_directory` command that wraps `tauri_plugin_opener::reveal_item_in_dir`. Rationale:

- Every other IPC entry point in the project goes through a Rust command — keeping that pattern preserves architectural consistency and lets Pattern Guard treat the call site like any other handler.
- The Rust layer validates the path exists before delegating to the plugin and surfaces a typed `AppError::Io` to the frontend, matching the project's error contract (Article V) and the IPC contract documented below.
- A future need to log reveal events, scope them to known destinations, or enforce additional policy lives naturally on the backend without rewriting the call site.

The earlier JS-only proposal in this spec was reconsidered in favour of backend cohesion.

### Where the handler lives

**Decision**: `useSortOrchestration` hook (per AP-007). The hook already owns every other IPC handler — keeping `revealDestination` there preserves the pattern that `SortApp.tsx` is JSX-only and the hook owns all IPC orchestration.

## Subtasks

- [x] **S1** — Verified: `opener:default` (already in `src-tauri/capabilities/default.json`) includes `allow-reveal-item-in-dir`, so no capability edits were needed.
- [x] **S2a** — `reveal_directory` Rust command implemented in `src-tauri/src/scanning/command.rs`: checks the path exists (returns `AppError::Io` otherwise), then delegates to `tauri_plugin_opener::reveal_item_in_dir`, mapping plugin errors to `AppError::Io`. The pre-existing `reveal_in_os` stub was replaced (not retained as dead code).
- [x] **S2b** — `revealDirectory(path: string)` binding added in `src/ipc/commands.ts`; invokes the Rust command via `invoke("reveal_directory", { request: { path } })`.
- [x] **S3** — `revealDestination` handler added in `src/features/sort/hooks/use-sort-orchestration.ts`, following the existing `pause` / `cancel` / `revert` error-handling pattern (try → `toAppErrorView` → `toast.error`).
- [x] **S4** — `onReveal` in `SortApp.tsx` wired to `handlers.revealDestination(job.done.destination)`; placeholder `console.warn` and the `// EPIC-13` TODO comment removed.
- [ ] **S5** — Manual visual smoke on macOS to be performed by reviewer before merge: pick a small source, run sort, click `Reveal in Finder` → Finder opens at destination. Not yet executed in this PR session; lint, `tsc --noEmit`, `cargo check` and `cargo clippy` all pass.
- [x] **S6** — CHANGELOG bullet added under `## [Unreleased]` → `### Features`.
- [x] **S7** — EPIC-13 spec status flipped to 🟢 complete; `docs/specs/STATUS.md` row updated.

## IPC contract

| Command            | Input              | Output          | Notes                                                                                                                                                                                                                                     |
| ----------------- | ------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reveal_directory` | `{ path: string }` | `Promise<void>` | Validates `path` exists, then opens the OS file manager at the given absolute path via `tauri_plugin_opener::reveal_item_in_dir`. Rejects with `AppError::Io` on missing path or plugin failure (permission denied, unsupported platform). |

No new event types.

## Out of scope

- Revealing a SPECIFIC file inside the destination (e.g. the first sorted item) — this epic only opens the directory. Can be a follow-up if requested.
- Opening individual files in their default application (`openItem` style) — different feature, different epic.
- Customizing which file manager is invoked on Linux when multiple are installed — plugin uses xdg-open default; out of scope.
- Adding a "Reveal" affordance to any screen other than Done. The History screen could in theory have a per-row Reveal, but that is a separate UX question.

## References

- Constitution articles touched: I (user files sacred — read-only), III (predictable UX), VI (revertable PR)
- Related specs: EPIC-06 (fs-operations — where `destination` is set on the move plan), EPIC-12 (the foundations audit that flagged this TODO during the SortApp review)
- External docs: [`@tauri-apps/plugin-opener` README](https://github.com/tauri-apps/tauri-plugin-opener)
- Code reference: the live TODO is in [`SortApp.tsx`](../../src/features/sort/SortApp.tsx) inside the `<DoneScreen onReveal={...}>` prop wiring.
