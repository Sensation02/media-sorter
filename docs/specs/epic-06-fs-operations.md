# EPIC-06. Filesystem operations + dry-run + conflict resolution

**Status:** 🟡 in progress
**Branch:** `feat/epic-06-mover` (PR1 of 2)
**Depends on:** EPIC-01, EPIC-05
**Last updated:** 2026-05-10

## Goal

Turn a `SortPlan` into real moves on disk — safely, reversibly, with a per-job
log written before every operation. This is the riskiest part of the system
(Constitution Article I: _user files are sacred_) and the foundation for
EPIC-07 (revert) and EPIC-08 (live progress).

## Clarifications

### Assumptions

- A `SortPlan` reaches the runner already validated by `build_plan` (every
  `target` is rooted under a destination chosen by the user).
- The destination root exists and is writable; capability scopes are granted
  by the time `start_sort` is invoked.
- Only one job runs at a time per app process. Concurrent multi-job
  scheduling is out of scope.
- The local filesystem supports atomic rename within a device. Cross-device
  moves are detected via `io::ErrorKind::CrossesDevices` (or equivalent
  errno).
- Free disk space reported by `fs2::available_space` (or std equivalent on
  the chosen crate) is accurate enough for a coarse pre-flight check.

### Resolved questions

| #   | Question                                                            | Resolution                                                                    |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Q1  | Default operation: move or copy?                                    | **Move** — `DEFAULT_SETTINGS.copy: false` stays. Reversibility from EPIC-07.  |
| Q2  | Default conflict behavior at runtime?                               | **Auto-rename** (`IMG (1).jpg`, `IMG (2).jpg`). No mid-job dialogs.           |
| Q3  | Definition of "duplicate" for `skipDuplicates`?                     | Same name, same size, **and** matching SHA-256 over first 64 KB + last 64 KB. |
| Q4  | Cross-device moves?                                                 | **Allowed** via copy + delete fallback. Log between copy and delete.          |
| Q5  | Pause semantics?                                                    | **Finish current file, then stop.** Runner checks flag at loop top.           |
| Q6  | Permission denied mid-job?                                          | **Skip + log + summary.** Errors accumulate; no abort, no per-file modal.     |
| Q7  | Disk space pre-flight?                                              | **Yes**, abort with message. Sums sizes that need a real byte copy.           |
| QA  | Where does dry-run live? (derived)                                  | **Per-run flag** `dryRun: bool` on `StartSortRequest`. Never persisted.       |
| QB  | UI integration in this epic? (derived)                              | **No.** ProgressScreen wiring deferred to EPIC-08 with progress events.       |

### Edge cases (must be covered by tests)

- Two source files share the same `target` filename → second one auto-renamed.
- Existing destination file matches name + size + fingerprint AND
  `skipDuplicates: true` → skipped, counted, logged with `skipped`.
- Cross-device move on the second file in a job → fallback path executes; both
  files exist briefly; log written between copy and delete.
- Permission denied on one file mid-job → counted in `errors`, logged, loop
  continues with next item.
- Cancel pressed between iterations → next iteration sees the flag and exits.
  Move log is not truncated.
- Pause pressed → runner finishes the in-flight file, then exits with state
  `paused`.
- Free disk space below required for cross-device + copy-mode jobs →
  pre-flight refuses with a clear error before any move.
- `dryRun: true` → pipeline runs end-to-end, log not written, no bytes change.
- Source file disappears between scan and move (user manipulated outside the
  app) → counted in `errors`, logged.

### Constraints

- Article I: a move log MUST be persisted before the operation; original
  file MUST remain recoverable until user-confirmed cleanup.
- Article II: no network calls; SHA-256 computed locally.
- Article III: no template DSL, no plug-in conflict policies, no resume — the
  simplest engine that satisfies the safety contract.
- Article V: external boundaries (filesystem) validate at entry; errors
  propagate as `Result<T, AppError>`.
- Article IX: unit tests cover fingerprinting, conflict resolution, mover
  branches, pre-flight; integration tests cover end-to-end runs in a tmpdir.

## Scope

### PR1 (`feat/epic-06-mover`) — `feat(fs)`: mover module, no IPC wiring

- New module `src-tauri/src/sorting/runner/`:
  - `mod.rs` — barrel.
  - `fs_repo.rs` — `FsRepo` trait + `RealFsRepo` impl with atomic rename and
    cross-device copy + delete fallback.
  - `fingerprint.rs` — `Fingerprint { size, head_sha256, tail_sha256 }`
    helper, lazy: only computed when conflict + `skipDuplicates: true`.
  - `conflict.rs` — pure auto-rename helper that walks `IMG.jpg` →
    `IMG (1).jpg` → `IMG (2).jpg` against an existence probe.
  - `log.rs` — append-only JSON-Lines writer for per-job `MoveOp` entries
    under `app_data_dir/jobs/<jobId>.jsonl`.
  - `preflight.rs` — disk space check, target-path containment check.
- New cargo dependency: `sha2` (for the head/tail fingerprint).
- Unit tests for every module above. No Tauri context required.
- `STATUS.md` row → 🟡 **in progress**.
- No `CHANGELOG.md` entry: PR1 has no user-facing surface (no IPC, no UI).
  The user-visible bullet ships with PR2 when commands are wired.

### PR2 (`feat/epic-06-runner`) — `feat(sorting)`: runner + IPC commands

- `runner/job.rs` — `JobRegistry` keyed by `JobId`, holding per-job
  `Arc<JobControl>` (cancel `AtomicBool`, paused `AtomicBool`, oneshot
  finish channel returning `JobOutcome`).
- `runner/service.rs` — orchestrator: pre-flight → loop over plan items →
  conflict resolve → fingerprint check → log → mover → counters.
- `sorting/dto.rs` — `StartSortRequest` gains `dry_run: bool`.
- `sorting/command.rs` — fills in `start_sort`, `pause_sort`, `cancel_sort`.
- TS counterpart in `src/types/ipc.ts` — `StartSortRequest.dryRun: boolean`.
- Integration tests in tmpdir: full run, pause, cancel, `skipDuplicates`,
  mixed errors, dry-run, cross-device fallback (simulated via a mock
  `FsRepo` that returns `CrossesDevices`).
- `CHANGELOG.md` entry — single user-facing bullet covering the engine.
- `STATUS.md` row → 🟢 **complete**.

## Decisions

### Move log written **before** the move (Article I, literal)

Order per file: append `MoveOp { from, to, at_ms }` to the job log → `fsync`
→ attempt the move. If a crash happens between the log write and the move,
revert is idempotent: `from` exists, `to` does not, no-op. This is the only
ordering compatible with Article I clause 1 ("a move log persisted before
the operation").

### Conflict resolution — auto-rename only

Two source items targeting the same path get suffix `(1)`, `(2)`, … until the
filesystem reports the path is free. The planner emits ideal targets; the
runner is the only owner of suffixing. No interactive dialog, no settings
flag — the project's flagship UX is "click and trust the engine"; a power
user that wants to overwrite cleans the destination manually and re-runs.
This decision is durable; revisit only if user feedback shows a real need.

### Duplicate test — name + size + head/tail SHA-256 (64 KB each)

Triggered only when `skipDuplicates: true` AND a same-named file already
exists at the target. Steps: stat both → if sizes differ, **not** a duplicate
(auto-rename instead) → if sizes match, hash the first 64 KB and last 64 KB
of each file with SHA-256 → if both digests match, count as duplicate
(skip + log) — otherwise auto-rename. Full-file hashing is not used: it
would re-read every byte of every conflicting file, which dominates the
runtime on large libraries. Head + tail catches container-format edge cases
(e.g. EXIF rewrite of the same image yields different head bytes; a video
trimmed at the end yields different tail bytes).

For files smaller than 128 KB the head and tail regions overlap or coincide;
the fingerprint hashes whichever bytes actually exist (capped by file size).
This is harmless: matching size + matching content still implies duplicate.

### Cross-device move — copy + flush + log + remove

Detected via `io::ErrorKind::CrossesDevices` from `fs::rename`, or by
comparing source and target device IDs in `preflight`. The fallback flow:
`fs::copy` → `File::sync_all` → write log entry → `fs::remove_file`. A crash
between copy and remove leaves both files on disk; revert deletes the
destination, no bytes lost. Worst-case outcome is a duplicate, never data
loss.

### `FsRepo` trait + `RealFsRepo` impl

The runner depends on a `FsRepo` trait so unit tests inject a mock that
returns `CrossesDevices`, `PermissionDenied`, or `NotFound` deterministically.
`RealFsRepo` wraps `std::fs` and `fs2::available_space`. The trait is the
only filesystem-touching surface in the runner module — Article V boundary
validation lives here.

### Job lifecycle — `JobRegistry` with control flags + oneshot finish

- `start_sort` allocates a `JobId` (timestamp-based per EPIC-01), inserts a
  `JobControl { cancel, paused, finish_tx }` into the registry, and
  `tauri::async_runtime::spawn_blocking` runs the job.
- The runner thread checks `cancel` / `paused` at the top of every loop
  iteration. On cancel: emit `JobOutcome { state: Cancelled, … }`. On pause:
  emit `JobOutcome { state: Paused, … }`. On natural completion: emit
  `JobOutcome { state: Done, … }`.
- `pause_sort` and `cancel_sort` set their respective flags; both return
  immediately with `Ok(())`.
- The terminal `JobOutcome` flows to UI via EPIC-08 events. EPIC-06 stores
  it in the registry so EPIC-08 can replay it.

### Pre-flight checks

Three checks before any move runs:

1. **Path containment** — every `target` is under the user-chosen destination
   root and contains no `..` segments. Symlink-target follows are rejected.
2. **Disk space** — sum sizes of items that will require a real byte copy
   (every item if `copy: true`; cross-device items otherwise). Compare to
   `available_space(destination_root)`. Refuse with `AppError::Internal` if
   short.
3. **Source readability** — sample-check the first item's source via
   `fs::metadata` to surface obvious permission issues early.

### Dry-run — same pipeline, mover stubbed

`dryRun: true` swaps `RealFsRepo` for a `DryRunFsRepo` that pretends every
move succeeds. The log is **not** written. Counters increment normally so
the final `JobOutcome` shows what would have happened.

## IPC contract

| Command       | Input                            | Output       | Notes                                                   |
| ------------- | -------------------------------- | ------------ | ------------------------------------------------------- |
| `start_sort`  | `{ plan, settings, dryRun }`     | `{ jobId }`  | Registers a job, returns id, runs in `spawn_blocking`. |
| `pause_sort`  | `{ jobId }`                      | `()`         | Sets `paused` flag; runner stops at next loop top.      |
| `cancel_sort` | `{ jobId }`                      | `()`         | Sets `cancel` flag; runner exits after current file.    |

DTO change (PR2 only):

```rust
pub struct StartSortRequest {
    pub plan: SortPlan,
    pub settings: SortSettings,
    pub dry_run: bool,         // NEW
}
```

No new events in EPIC-06. Events `sort:progress` / `sort:done` / `sort:error`
ship in EPIC-08.

## Subtasks

### PR1 — mover module

- [ ] Lock decisions in this spec
- [ ] Add `sha2` to `src-tauri/Cargo.toml`
- [ ] `runner/mod.rs` barrel
- [ ] `runner/fs_repo.rs` — trait + `RealFsRepo`
- [ ] `runner/fingerprint.rs` — head/tail SHA-256 helper
- [ ] `runner/conflict.rs` — auto-rename helper
- [ ] `runner/log.rs` — append-only JSON-Lines writer
- [ ] `runner/preflight.rs` — disk space + path containment
- [ ] Unit tests per module
- [ ] `cargo fmt` + `cargo clippy` + `cargo test` clean
- [ ] STATUS.md row → 🟡 in progress

### PR2 — runner + IPC commands

- [ ] `runner/job.rs` — `JobRegistry` + `JobControl`
- [ ] `runner/service.rs` — orchestrator
- [ ] `sorting/dto.rs` — `StartSortRequest.dryRun`
- [ ] `sorting/command.rs` — fill `start_sort` / `pause_sort` / `cancel_sort`
- [ ] TS `StartSortRequest.dryRun`
- [ ] Integration tests in tmpdir
- [ ] CHANGELOG entry under `### Features`
- [ ] STATUS.md row → 🟢 complete

## Out of scope

- UI ProgressScreen wiring → EPIC-08
- Live progress events `sort:progress` / `sort:done` → EPIC-08
- `revert_job`, history list, GC of old logs → EPIC-07
- Persisted "default dry-run" setting → never (deliberate)
- User-facing conflict policy (skip / overwrite / rename per file) → not in
  MVP
- Resume after pause → not in MVP (pause = stop)
- Background watch of source folder → EPIC-09 settings
- Multi-job concurrency → not in MVP (one job at a time)

## References

- Constitution articles touched: I (reversibility), III (simplicity), IV
  (scope discipline), V (type safety), IX (tests).
- Related specs: [EPIC-01](epic-01-foundation.md),
  [EPIC-05](epic-05-planner.md), [EPIC-07](epic-07-history-undo.md),
  [EPIC-08](epic-08-progress-events.md).
- Planning artifact (ephemeral, gitignored):
  `.artifacts/epic-06-plan-2026-05-10.html`.
