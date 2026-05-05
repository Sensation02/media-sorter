# Orchestration: Agents, Strategies & Rules

> Agent roles, strategy selection, delegation templates, conflict resolution, and anti-patterns.
> Part of the workflow documentation suite. See also: `implementation.md`, `delivery.md`.

---

## Agent Roles

The project uses up to 10 agents. The main Claude Code session acts as the **Orchestrator** and delegates work to sub-agents via the `Agent` tool.

```
                       ┌─────────────────────┐
                       │     USER TASK       │
                       └─────────┬───────────┘
                                 ▼
                       ┌─────────────────────┐
                       │    ORCHESTRATOR     │  ← main Claude Code session
                       │  Plans, coordinates,│
                       │  delegates, enforces│
                       │  quality            │
                       └─────────┬───────────┘
                                 │
   ┌────────┬─────────┬──────────┼──────────┬─────────┬─────────┐
   ▼        ▼         ▼          ▼          ▼         ▼         ▼
TEAM      RESEARCHER BACKEND   FRONTEND  REVIEWER  PATTERN   TESTER /
LEAD                 (Rust)   (React)              GUARD     SECURITY /
                                                              REFACTOR /
                                                              DOCS
```

### Orchestrator (you — the main session)

This is NOT a separate sub-agent but the role of the main Claude Code session.

**Responsibilities:**

- Receives task from user
- Assesses task complexity (simple / complex / multi-stack)
- Chooses execution strategy (A / B / C / D)
- Prepares shared resources before parallel work (Phase 0)
- Delegates subtasks to sub-agents
- Resolves conflicts between sub-agent results
- Enforces quality through mandatory Quality Gate (Phase 3)
- Verifies the final result

**Orchestrator Rules:**

- ALWAYS start by analyzing task complexity
- NEVER delegate a task you don't understand yourself
- If a sub-agent failed — understand why before restarting
- Maintain context of all subtasks — sub-agents do NOT have it

### Team Lead (sub-agent, Phase 1)

**Scope:** planning only — never writes code.

**Responsibilities:**

- Analyzes codebase (file search, dependencies)
- Breaks task into atomic subtasks
- Identifies dependencies between subtasks
- Labels subtasks as `parallel` or `sequential`
- Defines IPC contract for full-stack tasks (Strategy D) before launch

### Researcher Agent (sub-agent, on-demand)

**Scope:** research and discovery only — does not write implementation code.

**When to delegate:**

- Task lacks clear requirements or acceptance criteria
- Need to compare libraries (e.g., choosing between EXIF parser crates)
- Need offline-database options for reverse geocoding
- GitHub Issue is too vague for direct implementation

**Delegation template:**

```
Task: "Read .claude/agents/researcher.md and follow those role instructions.

TASK: [vague task description or research question].
CONTEXT: [any additional context]."
```

### Backend Developer Agent (sub-agent, Phase 2)

**Scope:** everything inside `src-tauri/` — Rust modules, Tauri commands, state, EXIF/FS logic.

**Responsibilities:**

- Reads the relevant spec from `docs/specs/`
- Implements ONE specific backend subtask
- Does not exceed subtask scope
- Does not touch frontend code

**Delegation template:**

```
Task: "Read .claude/agents/backend-developer.md and follow those role instructions.

TASK: [description].
SPEC: docs/specs/[relevant].md (if any)
SCOPE: only files in src-tauri/ — [file list].
DO NOT touch frontend code (src/).

IPC CONTRACT (if applicable):
  Command: <name>
  Rust input: <struct>
  Rust output: Result<<struct>, AppError>
  TS-side type: <interface>
VERIFICATION: cd src-tauri && cargo clippy --all-targets -- -D warnings && cargo test"
```

### Frontend Developer Agent (sub-agent, Phase 2)

**Scope:** everything inside `src/` — React components, pages, hooks, IPC type mirrors, styles.

**Responsibilities:**

- Implements ONE specific frontend subtask
- Does not exceed subtask scope
- Does not touch backend code

**Delegation template:**

```
Task: "Read .claude/agents/frontend-developer.md and follow those role instructions.

TASK: [description].
SCOPE: only files in src/ — [file list].
DO NOT touch backend code (src-tauri/).

IPC CONTRACT:
  Command: <name>
  invoke<<TS type>>('<command>', <args>) → <return type>
  Errors: <variants>
VERIFICATION: pnpm lint && pnpm build"
```

**Strategy D MUST run as a parallel team.** Orchestrator defines the IPC contract upfront and launches all relevant sub-agents simultaneously with `run_in_background: true` — Backend + Frontend, plus Tester or any other specialist required. Sequential full-stack execution is never acceptable.

### Reviewer Agent (sub-agent, Phase 3 — Quality Gate)

**Responsibilities:**

- Checks types, tests, linter
- Verifies compliance with the plan
- Looks for anti-patterns
- Flags silent failures (`unwrap()` without invariant comment, ignored `Result`, empty catch)

### Pattern Guard Agent (sub-agent, Quality Gate)

**Scope:** read-only scan of changed files against `docs/workflow/anti-patterns.md`.

**Agent definition:** `.claude/agents/pattern-guard.md`

### Tester / Security Auditor / Refactoring Specialist / Documentation Writer

Specialist sub-agents invoked when their domain matches the task:

- **Tester** — write/extend tests (Rust unit/integration; UI tests)
- **Security Auditor** — when capability config, IPC inputs, or filesystem-destructive code changes
- **Refactoring Specialist** — pure structural refactor with behavior preservation
- **Documentation Writer** — when `docs/` needs updates

Each has its own `.claude/agents/<name>.md` definition.

---

## File System Safety for Parallel Agents

When multiple agents run in parallel (Strategy C and D), they share the same working directory. File scope separation prevents conflicts.

### How It Works

Parallel agents are dispatched via the `Agent` tool with `run_in_background: true` (without `isolation: "worktree"`). Each agent runs as a background subagent. The Orchestrator receives a notification when each agent completes.

### File Scope Rules

| Agent              | Read access                                                           | Write access                                                                                                          | Forbidden writes                 |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Backend Developer  | `src-tauri/`, shared specs, `src/types/ipc.ts` (read for type mirror) | `src-tauri/`                                                                                                          | `src/`                           |
| Frontend Developer | `src/`, shared specs                                                  | `src/`                                                                                                                | `src-tauri/`                     |
| Tester             | `src-tauri/`, `src/`                                                  | Rust `#[cfg(test)]` blocks, `src-tauri/tests/`, `*.test.tsx` only                                                     | Production code                  |
| Phase 0/2 Agent    | Full project                                                          | Shared resources as delegated (typically: `src/types/ipc.ts`, `src-tauri/src/types.rs`, barrel `index.ts` / `mod.rs`) | Anything outside delegated scope |

### Shared Resource Rules

Shared resources (IPC types on both sides, constants, barrel exports) are created/updated ONLY by a dedicated sequential agent in Strategy Phase 0 or Phase 2.

If a parallel agent needs a shared resource that doesn't exist:

1. **Prevention (primary):** Orchestrator analyzes all subtask scopes and pre-creates required shared resources in Phase 0.
2. **Fallback:** Agent completes what it can, documents the gap in its completion report. Orchestrator creates the resource via sequential agent and re-runs the affected subtask.

### Orchestrator Role

**Strategy A:** Orchestrator may write code directly (simple tasks, <3 files).
**Strategy B/C/D:** Orchestrator coordinates, decides, delegates. Does NOT edit files directly. Orchestrator is the brain; agents are the hands.

---

## Strategy Selection

Orchestrator chooses a strategy based on task complexity:

### Strategy A: SIMPLE (1 module, <3 files, single side of the stack)

Orchestrator does everything itself, no delegation.

```
USER TASK → [Orchestrator plans + codes + verifies] → DONE
```

**When:** bug fix, minor refactoring, adding a field to an IPC struct on one side, fixing component styles.

### Strategy B: SEQUENTIAL (2+ modules, has dependencies, single side of the stack)

Orchestrator delegates subtasks sequentially.

    Phase 0: PREP (only if shared resources needed)
      Orchestrator → decides if shared types/constants are needed across subtasks
      → Agent (sequential): creates shared resources (skip if not needed)

    Phase 1: SEQUENTIAL
      → Agent: subtask 1 (e.g., domain type)
      → Agent: subtask 2 (e.g., service — depends on 1)
      → Agent: subtask 3 (e.g., command handler — depends on 2)

    Phase 2: INTEGRATION (only if needed)
      Orchestrator → decides if module registration / barrel exports needed
      → Agent (sequential): updates as needed

    Phase 3: QUALITY GATE (run_in_background)
      → Agent: Reviewer
      → Agent: Pattern Guard

**When:** new feature in a single Rust module that spans multiple layers, or a single React feature with multiple components.

### Strategy C: PARALLEL (2+ independent modules, single side of the stack)

Orchestrator launches independent subtasks in parallel via `run_in_background`.

    USER TASK
      → Phase 0: PREP
          Orchestrator → decides what shared resources are needed
          → Agent (sequential): creates shared types/constants/barrel exports
      → Phase 1: IN PARALLEL (run_in_background)
          Agent: Rust module A (scoped to src-tauri/src/<a>/)
          Agent: Rust module B (scoped to src-tauri/src/<b>/)
      → Phase 2: INTEGRATION
          Orchestrator → decides what integration is needed
          → Agent (sequential): barrel exports, mod registration
      → Phase 3: QUALITY GATE (run_in_background)
          Agent: Reviewer
          Agent: Pattern Guard
      → Orchestrator: triage findings, delegate fixes

**When:** multiple independent Rust modules, mass refactoring, test generation across modules.

### Strategy D: FULL-STACK (parallel team)

Orchestrator defines the **IPC contract** and launches a parallel team. Each agent runs in the same directory with strict file scope separation.

    USER TASK (full-stack feature)
      → Phase 0: PREP
          Orchestrator → defines IPC contract + assembles team
          → Agent (sequential): creates shared types (Rust + TS), constants
      → Phase 1: IN PARALLEL (run_in_background)
          Agent: Backend (src-tauri/ only — implements commands)
          Agent: Frontend (src/ only — consumes commands via invoke())
          Agent: Tester (test files only — when scoped in plan)
      → Phase 2: INTEGRATION
          Orchestrator → decides what integration is needed
          → Agent (sequential): integration checks, barrel exports
      → Phase 3: QUALITY GATE (run_in_background)
          Agent: Reviewer
          Agent: Pattern Guard
      → Orchestrator: triage findings, delegate fixes

**When:** new feature requiring both Tauri commands and UI.

### Mandatory Quality Gate

Quality Gate is a mandatory final step for ALL strategies:

| Strategy      | Quality Gate                                                 |
| ------------- | ------------------------------------------------------------ |
| A: Simple     | Minimum: Pattern Guard (single background agent)             |
| B: Sequential | Full: Reviewer + Pattern Guard (parallel, run_in_background) |
| C: Parallel   | Full: Reviewer + Pattern Guard (parallel, run_in_background) |
| D: Full-Stack | Full: Reviewer + Pattern Guard (parallel, run_in_background) |

Both agents run in parallel. The Orchestrator triages findings from both: duplicate findings count as one, disagreements are resolved by the Orchestrator.

### IPC Contract format (Strategy D — passed to all agents)

```
IPC CONTRACT:
  Command: extract_exif
    Rust signature:
      #[tauri::command]
      async fn extract_exif(path: String, app: AppHandle) -> Result<ExifData, AppError>
    Rust types:
      pub struct ExifData { taken_at: Option<DateTime<Utc>>, gps: Option<GpsCoords>, camera: Option<String> }
      pub struct GpsCoords { lat: f64, lon: f64 }
    TS-side type:
      interface ExifData { taken_at: string | null; gps: { lat: number; lon: number } | null; camera: string | null }
    Errors:
      AppError::FileNotFound, AppError::Unsupported, AppError::ParseFailed
```

---

## Conflict Resolution (Orchestrator)

When parallel sub-agents produce conflicting changes:

### Type 1: Module / `mod.rs` registration conflict

```
1. Confirm both modules registered in src-tauri/src/lib.rs (or main.rs)
2. Check tauri::Builder::default().invoke_handler(generate_handler![...]) includes new commands
3. For circular Rust deps — split shared types into a third module
```

### Type 2: Naming / interface conflict (different sub-agents used different names)

```
1. Determine which naming better matches project conventions
2. Rename in all usage locations
3. Verify imports / `use` paths are updated
```

### Type 3: Test failure after integration

```
1. cd src-tauri && cargo test (Rust) and pnpm test (UI)
2. For each failure:
   a. Identify cause (IPC type drift, new required field, etc.)
   b. Assess: is the test outdated or is the code wrong?
   c. Fix the appropriate side
3. Repeat until green
```

### Type 4: IPC Contract Mismatch (Backend ↔ Frontend)

The most common conflict with Strategy D — frontend calls a Tauri command differently than backend implemented.

```
1. Compare what backend command actually accepts/returns vs what frontend invokes:
   a. Field names (camelCase vs snake_case — Tauri serde defaults to snake_case unless renamed)
   b. Types (string vs number, null vs undefined, Option<T> vs nullable)
   c. Date format (DateTime<Utc> serializes to ISO string by default with serde + chrono feature)
   d. Command name string
   e. Error response format

2. Determine source of truth:
   - If IPC contract was defined upfront → whoever deviated — they fix it
   - If contract is unclear → Rust types are the source of truth, TS adapts

3. Fix:
   a. If backend deviated → Task Backend: "Fix [specifically what]"
   b. If frontend deviated → Task Frontend: "Fix [specifically what]"

4. Integration check:
   - pnpm tauri dev — verify the actual flow end-to-end in the webview
```

---

## Architecture Rules

### General Rules

- **One file — one responsibility** (Single Responsibility)
- **Naming**:
  - TS/React: camelCase for variables/functions, PascalCase for components/types, kebab-case for files
  - Rust: snake_case for fns/vars, PascalCase for types/traits, SCREAMING_SNAKE_CASE for consts, snake_case for module files
- **Imports**: relative imports only (no path aliases unless configured intentionally), never deeper than 2 levels (`../../`)
- **No comments in code** — code should be self-documenting
- **Error handling**:
  - Rust: `Result<T, AppError>`, never panic in command handlers; map IO/parse errors via `#[from]`
  - TS: typed error subclasses or discriminated unions; never silently swallow rejected promises

### Backend (`src-tauri/`) Module Structure (target)

```
src-tauri/src/
├── lib.rs / main.rs          # Tauri builder, command registration
├── commands/                  # Thin command adapters; one feature per file
│   ├── exif.rs
│   ├── sort.rs
│   └── mod.rs
├── domain/                    # Domain types & business logic
│   ├── exif.rs
│   ├── sort_plan.rs
│   └── mod.rs
├── fs/                        # Filesystem wrapper (mockable boundary)
│   └── mod.rs
├── error.rs                   # AppError + thiserror
└── types.rs                   # Serde-shared types mirrored to TS
```

### Frontend (`src/`) Structure (target)

```
src/
├── App.tsx
├── main.tsx
├── components/                # UI components — one component per file
├── pages/                     # Top-level views
├── hooks/                     # Custom hooks (incl. wrappers around invoke())
├── ipc/                       # invoke() wrappers grouped by feature; types mirror Rust
├── types/                     # Shared TS types (incl. ipc.ts mirror)
└── utils/                     # Pure helpers
```

### Test Rules

- ~60–70% coverage for MVP — only critical business logic
- Rust: colocated `#[cfg(test)] mod tests { ... }` for unit, `src-tauri/tests/<feature>.rs` for integration
- TS: colocated `<name>.test.tsx`
- Naming:
  - Rust: `<subject>_<behavior>_<condition>`
  - TS: `should <expected behavior> when <condition>`

---

## Anti-patterns (What NOT to do)

- **DO NOT** write all code in one message without a plan
- **DO NOT** modify files unrelated to the current task
- **DO NOT** add dependencies without explicit need and user consent
- **DO NOT** delete existing tests
- **DO NOT** ignore TypeScript or Rust compiler errors
- **DO NOT** hardcode values — use a config module
- **DO NOT** create God-files (>500 lines — signal to split)
- **DO NOT** run parallel agents on overlapping file scopes
- **DO NOT** delegate a task to a sub-agent without clear scope and spec
- **DO NOT** let Backend Developer touch frontend code and vice versa
- **DO NOT** run Strategy D without a pre-defined IPC contract
- **DO NOT** let Frontend hardcode command name strings without the central `ipc/` wrapper
- **DO NOT** use `unwrap()` / `expect()` in command handlers — return `Result<T, AppError>`
- **DO NOT** use `npm` or `yarn` — only `pnpm` (UI) and `cargo` (Rust)
- **DO NOT** write explanatory comments in code
- **DO NOT** let parallel agents create shared resources — only Phase 0/Phase 2 sequential agents
- **DO NOT** let Orchestrator edit files directly in Strategy B/C/D — always delegate to an agent
- **DO NOT** skip Quality Gate — it is mandatory for all strategies
- **DO NOT** perform destructive filesystem ops without an undo log / dry-run option

---

## Available Commands

```bash
# UI
pnpm install
pnpm dev                       # Vite dev server (UI only)
pnpm tauri dev                 # Full Tauri dev (Rust + UI)
pnpm tauri build               # Production desktop build
pnpm lint
pnpm format
pnpm test

# Rust (in src-tauri/)
cargo check
cargo build
cargo test
cargo clippy --all-targets -- -D warnings
cargo fmt

# Makefile shortcuts (root)
make help / setup / install / dev / build / lint / fmt / test / clean
```
