# EPIC-14. Pre-flight ETA estimate

**Status:** 🟢 complete
**Branches:** `feat/epic-14-estimate-static` (PR-1 merged), `feat/epic-14-estimate-probe` (PR-2 merged), `feat/epic-14-estimate-ui` (PR-3, current)
**Depends on:** EPIC-05 (planner), EPIC-06 (fs-operations)
**Last updated:** 2026-05-15

## Goal

Before the user clicks **Start sort**, show a realistic estimate of how long
the job will take ("≈ 15 sec", "30 sec – 1 min", "> 1 min — cross-device").
Today the user only learns the runtime after the job already started; for a
copy of 200 GB to a slow disk that is too late.

## Clarifications

### Assumptions

- The planner already produces a complete `SortPlan` for the user-chosen
  rule in `preview_plan` ([`sorting::command::preview_plan`](../../src-tauri/src/sorting/command.rs)).
- Source files are colocated on a single source volume (typical case: SD card,
  external drive, or a single folder tree). Mixed-volume sources are
  detectable but not optimized for.
- The user does not change `settings.copy` between estimate and run; if they
  do, the estimate is invalidated and recomputed on next `preview_plan`.
- `fs::metadata` calls for `sum_source_sizes` are cheap (cached by OS after
  the EPIC-02 scan) — adding the same loop in estimate mode does not require
  a second pass over the disk.
- The destination root is writable when we run the optional bandwidth probe.
- Reported duration is wall-clock, not CPU time. The estimate's "low" matches
  warm-cache best case, "high" matches cold-cache worst case on the detected
  volume class.

### Resolved questions

| #   | Question                                                                                   | Decision                                                                                                                                                                                                                                | Resolved at |
| --- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Q1  | Should the bandwidth probe run on every `preview_plan`, or be cached per destination root? | Cache per `(destination_root, mode)` for the lifetime of the app process; invalidate on Settings change.                                                                                                                                | 2026-05-15  |
| Q2  | What sample size for the bandwidth probe (write + fsync + delete)?                         | 32 MiB. Big enough to drown out per-syscall noise, small enough to add < 500 ms on SD card.                                                                                                                                            | 2026-05-15  |
| Q3  | How do we detect cross-device moves before running the job?                                | Compare `metadata.dev` (Unix) / volume ID (Windows) between source root and destination root.                                                                                                                                          | 2026-05-15  |
| Q4  | Should "Skip duplicates" affect the estimate?                                              | Apply a 1.2× pessimistic multiplier when `settings.skip_duplicates` is on, since fingerprint adds ≈3-30 ms per collision and collisions are unknown ahead.                                                                              | 2026-05-15  |
| Q5  | What does the UI show — point or range?                                                    | Range with confidence pill. High → "≈ 15 sec"; Medium → "30 sec – 1 min"; Low → "> 1 min".                                                                                                                                              | 2026-05-15  |
| Q6  | Where does the estimate appear?                                                            | On `SetupScreen`, next to the **Start sort** button, refreshed whenever the rule, source folder, or copy/move toggle changes.                                                                                                          | 2026-05-15  |
| Q7  | Should the probe write inside the destination root, or in a sibling tmp dir?               | Destination root. Subdir `.media-sorter-probe` is created and removed atomically, so it never escapes Article I.                                                                                                                       | 2026-05-15  |
| Q8  | What if the probe fails (read-only volume, permission denied)?                             | Fall back to the static throughput table (low confidence). Surface a warning toast.                                                                                                                                                     | 2026-05-15  |
| Q9  | Where do file sizes come from for the estimate (since `SortPlanItem` does not carry them)? | Pass `&[MediaFile]` alongside the plan to `estimate::service::compute`. `MediaFile.size_bytes` is already produced by EPIC-02 scan and is available in `run_preview` via `session.files`. Zero changes to `SortPlanItem` or the planner. | 2026-05-15  |
| Q10 | How does `preview_plan` receive `SortSettings` (needed for copy/move mode detection)?      | Extend `PreviewPlanRequest` with a `sortSettings` field. The frontend already owns the current `IMMUTABLE_SORT_FLAGS` and passes them to `start_sort`; we make `preview_plan` symmetric.                                                | 2026-05-15  |
| Q11 | How does the new estimate payload reach the frontend?                                      | Breaking change to `preview_plan` response: `PreviewPlanResponse { plan, estimate }`. Single round-trip, synchronous refresh in the UI; alternative `estimate_plan` command rejected to avoid double latency.                            | 2026-05-15  |

### Edge cases

- Source folder is empty → estimate is `0 sec`, hide the pill.
- Mixed-volume source (some files on SSD, some on USB) → fall back to slower
  volume's throughput; emit `confidence: low`.
- Destination root does not exist yet → run probe after `create_dir_all`;
  if creation fails, surface as preflight error before estimate.
- User has < 32 MiB free on destination → skip the probe; use static table.
- Plan contains 1 huge video (10 GB) vs 100 K small images (40 GB total) →
  same total bytes, very different per-file overhead. Estimate must combine
  `N × per-file` and `S / bandwidth`, taking the max.
- User toggles `settings.copy` between `preview_plan` calls → recompute, no
  cached value reuse.
- Bandwidth probe finishes before user clicks Start, but the disk is now
  under load (Time Machine, another app) → estimate is stale; we do not
  refresh continuously, but the in-flight ETA in `useSortJob` will correct.

### Constraints

- **Article I — user files are sacred.** The probe writes only to the
  destination root, in a clearly-named tmp file, and is removed in a `Drop`
  guard so failures do not leave artifacts.
- **Article II — privacy by default.** No metadata sent to any external
  service. Probe is purely local IO.
- **Article III — KISS.** Confidence is a 3-level enum (`Low | Medium | High`),
  not a continuous percentage. No statistical models in v1.
- **Article V — strict typing.** No magic numbers in business logic; static
  throughput table goes into `constants.rs`.
- **Article VII — docs.** Add a CHANGELOG bullet (Features) and update
  `docs/workflow/anti-patterns.md` if any anti-pattern is uncovered while
  building.

## Scope

- New module `src-tauri/src/sorting/estimate/` with `service.rs`, `dto.rs`,
  `constants.rs`.
- New `domain::PlanEstimate`, `domain::EstimateMode`, `domain::EstimateConfidence`
  in `src-tauri/src/domain/mod.rs` (per CLAUDE.md Architecture rule 1 —
  entities centralized; current domain types like `SortPlan` and `SortSettings`
  live in the same file).
- Extend `PreviewPlanRequest` with `sort_settings: SortSettings`. Change
  `preview_plan` response to `PreviewPlanResponse { plan, estimate }`. Update
  frontend `ipc.ts`, `types/sort.ts`, and every `previewPlan(` caller.
- Frontend: a new component `screens/setup-screen/PlanEstimate.tsx` showing the
  confidence pill + range; new mapper `mappers/estimate-format.ts`.
- Volume-id detection helper `src-tauri/src/utils/volume.rs` (Unix
  `metadata.dev` + Windows `GetVolumeInformation` shim, `#[cfg]`-gated).
- Optional `bandwidth_probe` function gated by a settings toggle
  (`SortSettings::probe_bandwidth: bool`, default `true`) — PR-2 only.

**Out of scope for the estimator:** no change to `SortPlan` / `SortPlanItem`
shape; the estimator reads `MediaFile.size_bytes` from the scan session.

## Decisions

### IPC contract shape

- `PreviewPlanRequest` gains `sortSettings: SortSettings` — the frontend passes
  the same `IMMUTABLE_SORT_FLAGS` it already uses for `start_sort`, so estimate
  and run agree on `copy` and `skip_duplicates`.
- `preview_plan` returns `PreviewPlanResponse { plan: SortPlan, estimate: PlanEstimate }`.
  Breaking change; updated synchronously in `src/ipc/commands.ts`, `src/types/ipc.ts`,
  and every caller (search for `previewPlan(`).
- No separate `estimate_plan` command in v1 — keeps the UI to a single round-trip
  per refresh trigger.

### Where the estimate is computed

`sorting::estimate::service::compute(plan, files, settings) -> PlanEstimate`.
The estimator stays in the `sorting` feature module (alongside `planner` and
`runner`); it is called from `sorting::command::run_preview` after `build_plan`.
Sizes come from `session.files: &[MediaFile]` (already produced by EPIC-02),
so neither `SortPlan` nor `SortPlanItem` change shape.

### Static throughput table

Live in `sorting/estimate/constants.rs`. Values come from the analysis in
[file move flow artifact](../../.artifacts/file-move-flow-2026-05-13.html) §
"Очікувана продуктивність за сценаріями":

| Class               | Throughput  | Per-file overhead (move) |
| ------------------- | ----------- | ------------------------ |
| NVMe                | 2.5 GB/s    | 2 ms                     |
| SATA SSD            | 450 MB/s    | 4 ms                     |
| HDD                 | 110 MB/s    | 15 ms                    |
| USB 2.0 / SD class 10 | 35 MB/s   | 25 ms                    |

Detection: heuristic from `fs4` block size + a 1-block read latency probe.

### Estimate formula

```
ETA_low  = max(N × per_file_low,  S / throughput_high)
ETA_high = max(N × per_file_high, S / throughput_low)
```

For move mode same-volume, `S / throughput` term is dropped (rename does not
move bytes).

### Confidence assignment

| Mode                       | Probe ran? | Confidence |
| -------------------------- | ---------- | ---------- |
| Move same-volume           | n/a        | High       |
| Copy / cross-device + probe| yes        | High       |
| Copy / cross-device static | no         | Medium     |
| Cross-device detected late | n/a        | Low        |

## Subtasks

> Atomic, ordered. Each item maps to one commit. Split into 3 PRs (see
> "PR split" below).

### PR-1 — domain types + static estimate

- [ ] Add `domain::PlanEstimate { mode, total_files, total_bytes, estimated_ms_low, estimated_ms_high, confidence }`.
- [ ] Add `domain::EstimateMode { MoveSameVolume, Copy, CrossDevice }`.
- [ ] Add `domain::EstimateConfidence { Low, Medium, High }`.
- [ ] Add `sorting::estimate::service::compute(plan, settings) -> PlanEstimate`.
- [ ] Add `sorting::estimate::constants` with the static throughput table.
- [ ] Extend `preview_plan` response to include `PlanEstimate`.
- [ ] Add `PlanEstimateDto` to `sorting::estimate::dto`.
- [ ] Frontend types in `src/types/sort.ts` mirror the DTO.
- [ ] Unit tests in `estimate/service.rs` for: empty plan, move-only,
      copy with size sum, cross-device detection.
- [ ] CHANGELOG entry under `### Features`.

### PR-2 — bandwidth probe

- [ ] Add `utils::probe::bandwidth_probe(root) -> io::Result<u64>` (bytes/s).
- [ ] Gate the call behind `SortSettings::probe_bandwidth` (default `true`).
- [ ] Drop-guard ensures the probe file is removed on every exit path.
- [ ] Wire the probe result into `compute()`; bump confidence to High.
- [ ] Cache the probe result per destination root for the app process
      lifetime (in-memory; cleared on Settings save).
- [ ] Unit test: probe on a tmpdir returns a positive number.
- [ ] Integration: re-run estimate on the same root; verify cache hit avoids
      a second probe.
- [ ] CHANGELOG entry (Features).

### PR-3 — UI integration

- [ ] New `screens/setup-screen/PlanEstimate.tsx` component.
- [ ] New mapper `mappers/estimate-format.ts` → `formatEstimateRange(low, high, confidence)`.
- [ ] Confidence pill styling: green (High), amber (Medium), gray (Low).
- [ ] Wire to `useSortOrchestration` so the estimate refreshes alongside
      `preview_plan`.
- [ ] Unit tests for `formatEstimateRange`.
- [ ] CHANGELOG entry (Features) — user-facing wording: e.g. _"Setup screen
      now shows an estimated run time before you start a sort."_
- [ ] Mark EPIC-14 done in this spec + STATUS.md.

## PR split

| #   | Branch                                | Scope                                            |
| --- | ------------------------------------- | ------------------------------------------------ |
| PR-1| `feat/epic-14-estimate-static`        | Domain types, static estimator, IPC contract     |
| PR-2| `feat/epic-14-estimate-probe`         | Bandwidth probe behind a settings toggle         |
| PR-3| `feat/epic-14-estimate-ui`            | SetupScreen integration + confidence pill        |

Each PR builds independently. PR-2 and PR-3 depend on PR-1; PR-3 does not
depend on PR-2 (without probe the pill simply shows Medium confidence).

## IPC contract

| Command        | Input                                                            | Output                                   | Notes                                                                                                                 |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `preview_plan` | `PreviewPlanRequest { scan_id, rule, sort_settings }` (extended) | `PreviewPlanResponse { plan, estimate }` | Breaking change on both request and response. Update `src/ipc/commands.ts`, `src/types/ipc.ts`, and every UI caller in lockstep. |

No new events. Estimate is request/response only; live ETA during a job is
already handled by `sort:progress` + `useSortJob` `formatEta`.

## Out of scope

- Continuous re-calibration during a job (in-flight ETA already exists in
  `use-sort-job.ts:262`).
- Predicting fingerprint cost from skip-duplicates collisions (pessimistic
  1.2× multiplier is enough for v1).
- Per-file ETA (only whole-job ETA).
- Probing read bandwidth of the source volume (only destination, which is
  the bottleneck for copy mode).
- A "smart" historical estimator that learns from past `JobOutcome` records.
  Possible v2 follow-up; tracked here as an open question.

## References

- Constitution articles touched: I (probe must clean up), II (no network),
  III (KISS — 3-level confidence), V (strict typing), VII (CHANGELOG).
- Related specs: EPIC-05 (planner produces the plan we estimate from),
  EPIC-06 (runner — actual numbers we are predicting),
  EPIC-08 (progress events — live ETA at runtime).
- Analysis: `.artifacts/file-move-flow-2026-05-13.html` § "Очікувана
  продуктивність за сценаріями".
