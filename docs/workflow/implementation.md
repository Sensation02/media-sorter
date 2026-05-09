# Implementation: Phases 1–3.5

> Planning, implementing, verifying, and self-improving code.
> Part of the workflow documentation suite. See also: `orchestration.md`, `delivery.md`.

---

> **Note:** Phases 1–5 below are **Workflow Phases** — the high-level flow for any task.
> Within Phase 2 (Implement), Strategy C and D use **Strategy Phases** (0–3):
> Phase 0 (Prep), Phase 1 (Parallel execution), Phase 2 (Integration), Phase 3 (Quality Gate).
> See `orchestration.md` for Strategy Phase details.

## Phase 1: PLAN (Team Lead / Architect)

**Goal:** Understand the task, break into subtasks, define scope.

1. Read the user's task
2. Identify which modules/files will be affected
3. Check existing code via codebase search
4. Create plan (in TodoWrite or as a structured output):

```markdown
# Plan: [task name]

## Task

[1-2 sentences]

## Strategy: [A/B/C/D]

[Why this strategy was chosen — 1-2 sentences explaining the reasoning
based on: file count, stack scope (Rust only / UI only / both), dependencies between subtasks]

## PR Split (if multi-PR)

[If the work is large enough for multiple PRs — define them here.
Each PR must: build independently, not break other PRs, have clear scope.]

### PR #1: `type(scope): title`

- Scope: [files/directories]
- Build safety: [why this PR builds independently]

## Subtasks

### Group 1 (parallel) — independent, can run in parallel

- [ ] 1.1 [Backend] Create ExifData domain type — `src-tauri/src/domain/exif.rs`
- [ ] 1.2 [Frontend] Create ExifData TS interface mirror — `src/types/ipc.ts`

### Group 2 (sequential, depends on Group 1)

- [ ] 2.1 [Backend] Implement extract_exif command — `src-tauri/src/commands/exif.rs`
- [ ] 2.2 [Frontend] Hook to invoke command — `src/hooks/useExif.ts`

### Group 3 (parallel) — tests

- [ ] 3.1 [Backend] Tests for exif parser — `#[cfg(test)] mod tests` in `domain/exif.rs`

## IPC Contract (for Strategy D)

Command: extract_exif
Rust: async fn extract_exif(path: String) -> Result<ExifData, AppError>
TS: invoke<ExifData>('extract_exif', { path })
Types: ExifData { taken_at: Option<DateTime<Utc>>, gps: Option<GpsCoords>, camera: Option<String> }

## Risks

- [risk description and mitigation]

## Files Changed

- `src-tauri/src/domain/exif.rs` (new)
- `src-tauri/src/commands/exif.rs` (new)
- `src/types/ipc.ts` (modified — add ExifData)
- `src/hooks/useExif.ts` (new)
```

5. **STOP and show the plan to the user** before proceeding to Phase 2

---

## Phase 2: IMPLEMENT (Backend & Frontend Developers)

### Agent Selection

Orchestrator determines which Developer is needed based on file scope:

| Files in scope                                             | Agent                                       |
| ---------------------------------------------------------- | ------------------------------------------- |
| `src-tauri/` — Rust modules, Tauri commands, FS/EXIF logic | Backend Developer                           |
| `src/` — components, pages, hooks, IPC mirrors             | Frontend Developer                          |
| Both stacks (full-stack feature)                           | Backend + Frontend in parallel (Strategy D) |

### Backend — sequential execution (Strategy B)

```
Task: "Read .claude/agents/backend-developer.md and follow those role instructions.

TASK: Create ExifData domain type with fields taken_at, gps, camera.

SPEC: docs/specs/2026-05-04-exif-extraction-design.md, section '1. Types'.

SCOPE: Create ONLY src-tauri/src/domain/exif.rs and add to src-tauri/src/domain/mod.rs.
DO NOT touch frontend code (src/).

VERIFICATION: cd src-tauri && cargo clippy --all-targets -- -D warnings && cargo test"
```

### Frontend — sequential execution

```
Task: "Read .claude/agents/frontend-developer.md and follow those role instructions.

TASK: Add EXIF panel that shows extracted metadata for the selected file.

SCOPE: Create ONLY files in src/components/ExifPanel/ and src/hooks/useExif.ts.
DO NOT touch backend code (src-tauri/).

IPC CONTRACT:
  Command: extract_exif
  invoke<ExifData>('extract_exif', { path: string }) → ExifData
  Errors: AppError variants serialized to a discriminated union

VERIFICATION: pnpm lint && pnpm build"
```

### Full-stack — parallel execution (Strategy D)

Orchestrator first defines the IPC contract, then launches the full team. Each parallel agent runs in the same directory with strict file scope separation.

```
Orchestrator defined IPC contract for "EXIF extraction" feature:

  Command: extract_exif
    Rust:  #[tauri::command] async fn extract_exif(path: String) -> Result<ExifData, AppError>
    Types: ExifData { taken_at: Option<DateTime<Utc>>, gps: Option<GpsCoords>, camera: Option<String> }
           GpsCoords { lat: f64, lon: f64 }
    Errors: AppError::FileNotFound, AppError::Unsupported, AppError::ParseFailed

Phase 0 (PREP):
  → Agent (sequential): shared types — src-tauri/src/types.rs and src/types/ipc.ts mirror

Phase 1 (PARALLEL — run_in_background):
  Agent(run_in_background: true) Backend: "Implement extract_exif command and parser"
  Agent(run_in_background: true) Frontend: "Build ExifPanel + useExif hook"
  Agent(run_in_background: true) Tester: "Unit tests for the EXIF parser"

Phase 2 (INTEGRATION):
  → Orchestrator: integration check — does frontend call the correct command with correct args, does Rust serialize matching shape

Phase 3 (QUALITY GATE — run_in_background):
  → Agent: Reviewer
  → Agent: Pattern Guard
  → Orchestrator: triage findings, delegate fixes
```

**IMPORTANT for parallel tasks:**

- Each parallel agent uses `run_in_background: true` in the same working directory
- File scope separation enforced: Backend → `src-tauri/`, Frontend → `src/`, Tester → test files only
- Shared resources (Rust ↔ TS type mirror) prepared by sequential agent in Phase 0 (before parallel launch)
- Possible conflict — IPC contract mismatch (Orchestrator checks in Phase 2)
- Quality Gate is mandatory (Phase 3)

---

## Phase 3: VERIFY (Reviewer)

Delegate via the `Agent` tool:

```
Task: "Read .claude/agents/reviewer.md and follow those role instructions.

Check all changes made as part of the task [name].

EXECUTE IN ORDER:
1. git diff --name-only — list changed files
2. pnpm lint — UI linter
3. cd src-tauri && cargo clippy --all-targets -- -D warnings — Rust linter
4. pnpm test — UI tests
5. cd src-tauri && cargo test — Rust tests
6. Spot-check: Tauri commands return Result<T, AppError> (no unwrap/expect without comment)
7. Spot-check: filesystem-destructive operations have a dry-run / undo path

OUTPUT:
- What passed verification
- What needs fixing (with specific files and lines)
- Warnings (non-critical, but worth attention)"
```

If Reviewer found issues → Orchestrator returns to Phase 2 for specific files.

### App verification (UI changes)

When the task includes user-visible changes, run the actual app:

```bash
pnpm tauri dev
```

Walk the affected flow manually. Repeatable webview automation will be set up later (`tauri-driver` / WebDriver — flag as a follow-up if you start needing it).

---

## Phase 3.5: SELF-IMPROVEMENT LOOP

**Goal:** Catch errors the Reviewer missed, fix typos, and document learnings to prevent recurring mistakes.

This phase runs AFTER Phase 3 (Verify) and BEFORE Phase 4 (Deliver). It is **mandatory** — never skip it.

### What to Check

```
1. Re-read all changed files yourself (not via Reviewer)
2. Check for:
   - Typos in variable names, strings, log messages
   - Naming inconsistencies (camelCase vs snake_case at the IPC boundary)
   - Missing imports / unused imports / unused `use` paths
   - Copy-paste artifacts (leftover code from another module)
   - Magic numbers/strings not extracted to constants
   - Defensive parsing missing at boundaries (untyped JSON from EXIF, GPS coords NaN-unsafe)
   - Empty string fallbacks instead of meaningful defaults ("Unknown location" / "Unknown date")
   - `unwrap()` / `expect()` without an invariant comment in Rust
   - `.unwrap()` chained on a serde Value in Rust — sign of missing typed deserialization
3. Run lint + tests one more time after fixes
4. Document learnings (see below)
```

### Document Learnings

If you discover a **recurring pattern** — an error you've made before or a gotcha that's not obvious — save it to memory or to `docs/workflow/anti-patterns.md` (as a candidate AP-XXX) so it doesn't happen again.

**What to document:**

- Recurring typos or naming mistakes
- Framework gotchas (Tauri serde renaming, Vite module resolution, Tailwind v4 syntax)
- Project-specific patterns that are easy to forget
- False positive patterns from review tools

**What NOT to document:**

- One-off mistakes that won't recur
- Information already in CLAUDE.md or specs
- Session-specific context

### Loop Behavior

```
Self-improvement is a loop, not a single pass:

  Re-read code → found issues? → fix → re-read again → clean? → proceed to Phase 4
                                   ↑                       ↓
                                   └── still issues ←──────┘
```

The loop exits when a full re-read finds no issues. Typically 1–2 iterations.
