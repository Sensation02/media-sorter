# EPIC-07. History &amp; Undo

**Status:** 🟡 in progress
**Branch:** `feat/epic-07-history` (PR1 of 2)
**Depends on:** EPIC-01, EPIC-06
**Last updated:** 2026-05-10

## Goal

After every sort, persist a per-job summary so the user sees the job in the
History screen and can revert it. Revert reads the move log written by
EPIC-06 and reverses every entry; safe under Article I (never overwrites
unrelated content; idempotent if a file was already restored manually).

## Clarifications

### Assumptions

- The move log produced by EPIC-06 (`app_data_dir/jobs/<jobId>.jsonl`) is
  durable and complete by the time `revert_job` runs.
- `JobId` is timestamp-based, so it doubles as `started_at_ms` and is
  unique enough for filename keys.
- One job runs at a time (no concurrent revert against an in-flight sort).
- Disk usage of summary files is negligible (~200 bytes per job).

### Resolved questions

| #   | Question                                                        | Resolution                                                                  |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Q1  | How much history to keep?                                        | **No disk-level GC.** `list_history` returns the latest 50; older summaries stay on disk so revert by `jobId` still works. Real GC parked for EPIC-09 if needed. |
| Q2  | Revert when files were manually changed?                         | **Skip + log + summary.** One conflict does not abort. Mirror of EPIC-06 Q6. |
| Q3  | Hash files at move time for integrity?                           | **No.** Path-based revert; would require breaking `MoveOp` format change.   |
| Q4  | Per-file undo within a job?                                       | **Whole-job only.**                                                         |
| Q5  | Storage location?                                                 | **Two files per job** under `app_data_dir/jobs/`: `<jobId>.jsonl` (already exists) + `<jobId>.summary.json` (new). |
| Q6  | Empty folder cleanup after revert?                                | **Yes.** Walk dest tree leaf-up; `fs::remove_dir` succeeds only on empty dirs. |
| QA  | PR split?                                                         | **Two PRs:** PR1 backend, PR2 UI.                                           |
| QB  | What is `HistoryItem.name`?                                       | **Destination root path.** What the user picked and recognises.             |
| QC  | Domain extensions for `HistoryItem`?                              | **+ `state: JobStatus` + `errors: u64`.** Without these, the UI cannot show "cancelled" or "had errors". Adds `JobStatus::Reverted`. |

### Edge cases (must be covered by tests)

- Revert a job where every move is reversible → all `restored++`.
- Revert a job where one file was manually moved back → `skipped++`, no
  overwrite.
- Revert a job where one file was manually deleted → `errors++`, log it.
- Revert with both `from` and `to` present → `errors++`, do not overwrite.
- Revert across a directory the planner created → empty after revert,
  cleaned up.
- Revert with a sibling user file in the same directory → directory NOT
  removed.
- Re-revert same job twice → second pass is a no-op (every item now
  `skipped` or `error`).
- `list_history` with > 50 jobs on disk → returns 50, sorted DESC.
- `list_history` with corrupt summary file → entry skipped, others
  returned.

### Constraints

- Article I: revert MUST NOT overwrite an unrelated file; both-present
  case skips.
- Article III: no template DSL, no plug-in revert policies, no resume.
- Article V: external boundaries (filesystem) validate at entry; errors
  propagate as `Result<T, AppError>`.
- Article IX: integration tests in tmpdir cover the full revert pipeline,
  the per-item conflict matrix, and the empty-folder cleanup invariants.

## Scope

### PR1 (`feat/epic-07-history`) — `feat(history)`: backend

- New module `src-tauri/src/history/`:
  - `summary.rs` — atomic write of `<jobId>.summary.json` from
    `JobOutcome` (write to `.tmp` then rename, so partial writes don't
    corrupt the index).
  - `repository.rs` — list summary files (sorted DESC, capped at 50);
    read move log lines.
  - `service.rs` — revert orchestrator with per-item safety probe.
  - `empty_dirs.rs` — leaf-up directory cleanup walker.
  - `dto.rs` — `RevertOutcome { jobId, restored, skipped, errors }`.
- Domain bump: `HistoryItem` gains `state` + `errors`; `JobStatus` gains
  `Reverted`.
- `sorting/command.rs::start_sort` writes the summary at outcome.
- `history/command.rs` fills in `list_history` and `revert_job`.
- TS counterparts in `src/types/ipc.ts` (extended `HistoryItemDto`, new
  `RevertOutcomeDto`).
- Frontend `revertJob` wrapper updated to return the outcome.
- Integration tests in tmpdir.
- `STATUS.md` row → 🟡 **in progress**.
- `CHANGELOG.md` entry — single user-facing bullet covering the engine
  (PR2 ships the UI).

### PR2 (`feat/epic-07-history-ui`) — `feat(ui)`: HistoryScreen wiring

- `useHistory()` hook calling `listHistory()`.
- `HistoryScreen` consumes the real list; replaces `DEFAULT_HISTORY`
  mock.
- Revert button per row → `revertJob()` + toast displaying
  `restored / skipped / errors`.
- Empty state, loading state, error state.
- Vitest tests for the hook + screen.
- `STATUS.md` row → 🟢 **complete**.

## Decisions

### Two files per job — append-only log + atomic summary

The move log was already established in EPIC-06 as
`app_data_dir/jobs/<jobId>.jsonl`, written append-only during the job.
The summary is written **once** at job end, atomically: serialise
`HistoryItem` to JSON, write to `<jobId>.summary.json.tmp`, then
`fs::rename` to the final path. A crash mid-write leaves either no
summary or a complete one — never a half-written one.

### Per-item safety probe — never overwrite

Before reversing each `MoveOp`:

1. If `to` doesn't exist → skip. Either the user already restored it or
   deleted it; either way, nothing for us to do.
2. If `from` already exists → skip. The user (or a tool) put something
   at the original path; we don't risk overwriting.
3. Otherwise, `rename(to, from)` (with cross-device fallback identical
   to EPIC-06's mover).

Each skip increments either `skipped` (already-in-place) or `errors`
(both files present, or move failed). The revert never aborts on a
single failure — it accumulates and returns a `RevertOutcome`.

### Empty-folder cleanup — leaf-up, only-if-empty

After reverting, walk the destination tree from leaves up. For each
directory, attempt `fs::remove_dir`. The OS rejects the call if any
entry remains, which is the safety we want: a sibling user file (or a
sub-directory the user created) blocks removal automatically. Walk
stops at any non-empty directory or at the destination root.

### `list_history` caps the UI list, doesn't delete

`list_history` reads every `*.summary.json` in `app_data_dir/jobs/`,
sorts by `started_at_ms` DESC, and returns the first 50. Older entries
remain on disk and remain valid revert targets if the UI ever exposes
them. No file deletion happens at any point in this epic.

### `JobStatus::Reverted` and the domain bump

The summary is rewritten after a successful revert with
`state: Reverted`. This makes the History screen show clearly which
jobs have already been undone, and prevents the UI from offering
revert-again on a fully reverted job. Choosing a new variant rather
than re-using `Done` keeps the state machine explicit (Article V).

## IPC contract

| Command        | Input         | Output           | Notes                                             |
| -------------- | ------------- | ---------------- | ------------------------------------------------- |
| `list_history` | —             | `HistoryItem[]`  | Latest 50, sorted by `started_at_ms` DESC.        |
| `revert_job`   | `{ jobId }`   | `RevertOutcome`  | Returns the outcome instead of `()` for UI toast. |

DTO additions (PR1):

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RevertOutcome {
    pub job_id: JobId,
    pub restored: u64,
    pub skipped: u64,
    pub errors: u64,
}
```

```rust
pub struct HistoryItem {
    pub id: JobId,
    pub name: String,
    pub started_at_ms: i64,
    pub duration_ms: u64,
    pub moved: u64,
    pub skipped: u64,
    pub errors: u64,        // NEW
    pub state: JobStatus,   // NEW
}
```

## Subtasks

### PR1 — backend

- [ ] Lock decisions in this spec
- [ ] `JobStatus::Reverted` + `HistoryItem` extension
- [ ] `history/summary.rs` atomic writer
- [ ] `history/repository.rs` list + read
- [ ] `history/empty_dirs.rs` leaf-up cleanup
- [ ] `history/service.rs` revert orchestrator
- [ ] `history/dto.rs` `RevertOutcome`
- [ ] `sorting/command.rs::start_sort` writes summary at outcome
- [ ] `history/command.rs` fills in `list_history` and `revert_job`
- [ ] TS `HistoryItemDto` + `RevertOutcomeDto`; `revertJob` wrapper
- [ ] Integration tests in tmpdir
- [ ] STATUS.md row → 🟡 in progress
- [ ] CHANGELOG entry

### PR2 — UI

- [ ] `useHistory()` hook
- [ ] `HistoryScreen` consumes real list
- [ ] Revert button + toast with outcome
- [ ] Empty / loading / error states
- [ ] Vitest tests for hook + screen
- [ ] STATUS.md row → 🟢 complete

## Out of scope

- Disk-level GC / retention policy → EPIC-09 settings if real demand
  appears.
- Per-file undo within a job → post-MVP.
- Hash-based integrity verification → would require `MoveOp` format
  change; documented Article I trade-off.
- Resume / partial revert continuation → whole-job MVP.
- Multi-machine history sync → single-machine MVP.
- Live progress events during revert → batched into the completion
  outcome; mirrors EPIC-08's UI deferral.

## References

- Constitution articles touched: I (reversibility), III (simplicity), V
  (type safety), IX (tests).
- Related specs: [EPIC-01](epic-01-foundation.md),
  [EPIC-06](epic-06-fs-operations.md), [EPIC-09](epic-09-settings.md).
- Planning artifact (ephemeral, gitignored):
  `.artifacts/epic-07-plan-2026-05-10.html`.
