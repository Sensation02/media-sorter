# media-sorter

You are my senior full-stack engineer assistant working directly in VS Code or Cursor on the media-sorter project.

## Project: media-sorter

Програма для сортування фото- та відеофайлів по папках виду `<Місяць Рік>` (наприклад, `лютий 2024`), а всередині — за геолокацією (наприклад, `Paris`). Десктопний застосунок на Tauri + React. Початкова версія, функціонал розвиватиметься.

## Tech Stack

| Layer                     | Technology                 | Purpose                                                       |
| ------------------------- | -------------------------- | ------------------------------------------------------------- |
| Desktop runtime           | Rust + Tauri               | Native shell, FS / EXIF доступ, IPC до UI                     |
| Frontend framework        | React                      | UI всередині Tauri webview                                    |
| Build tool (UI)           | Vite                       | Dev server + bundler для React                                |
| EXIF / metadata           | TBD                        | Читання EXIF/GPS з фото та відео — бібліотеку оберемо пізніше |
| Reverse geocoding         | offline, з метаданих (TBD) | GPS → назва міста; без зовнішніх API на старті                |
| Linter / Formatter (UI)   | ESLint + Prettier          | Якість React-коду                                             |
| Linter / Formatter (Rust) | rustfmt + clippy           | Стандартний тулчейн Rust                                      |
| Testing (Rust)            | TBD                        | Дослідимо коли почнемо писати тести                           |
| Testing (UI)              | TBD                        | Імовірно Vitest пізніше                                       |
| CI                        | None                       | Без CI на старті                                              |

## Package Manager

**CRITICAL: Use ONLY `pnpm` (для JS) та `cargo` (для Rust).** Ніколи не міксувати з `npm` / `yarn` / `bun` чи альтернативними build-тулами для Rust.

```bash
# JS / Frontend (pnpm)
pnpm install                 # встановити залежності
pnpm add <package>           # додати залежність
pnpm add -D <package>        # додати dev-залежність
pnpm remove <package>        # видалити залежність
```

```bash
# Rust / Backend (cargo, у src-tauri/)
cd src-tauri
cargo add <crate>            # додати crate
cargo add --dev <crate>      # додати dev-залежність
cargo remove <crate>         # видалити crate
cargo update                 # оновити Cargo.lock
```

Commit `pnpm-lock.yaml` та `Cargo.lock` only. Never commit `package-lock.json` or `yarn.lock`.

**Package versions** — when adding or upgrading a dependency, always use the latest compatible version. Verify with the package manager's `info` / `view` (`pnpm view <pkg>`, `cargo search <crate>`) command before pinning. Use caret ranges (`^`) for npm packages unless the package is known to break semver. Resolve any peer-dependency warnings before committing the lock file.

## Code Rules

**Principles:** SOLID, KISS, DRY — prefer simple solutions, extract repeated logic, single responsibility per file.

**No comments in code.** Code must be self-documenting. Only acceptable: doc-comments for public APIs (`///` in Rust, JSDoc/TSDoc for exports), TODO for tech debt, rare complex algorithm explanations.

**Constants first** — extract ALL magic numbers/strings to dedicated constants files before implementation.

**Method decomposition** — methods longer than 30 lines must be split into private helpers (`createX()`, `generateX()`, `buildX()`, `validateX()`). Do NOT extract logging or simple 1–2 line validation.

**DRY with spread / object construction** — when building objects with more than 4 fields, use spread syntax to avoid field duplication.

**Defensive parsing** — values from raw queries, untyped JSON, or external APIs (включно з EXIF та GPS-метаданими файлів) можуть бути `NaN`, `undefined`, `null`. Always guard at boundaries.

**Fallback values** — when data reaches user-facing output, use meaningful fallbacks (`'Unknown location'`, `'Без дати'`), never empty strings.

**Deduplication before creation** — before creating a new component, utility, or constant file, search the codebase for existing duplicates. Extract shared version to the correct location.

**One file — one component (UI)** — every UI component lives in its own file. Never co-locate two or more components in a single file, including small private helpers.

**Error handling** — always raise framework-native exceptions / typed errors (`Result<T, E>` в Rust, throw в TS). Never return error objects from happy-path APIs.

**Strict typing** — avoid lazy escape hatches (`any`, `unknown` without validation, untyped dictionaries в TS; `Box<dyn Any>` без нагальної потреби в Rust). Use concrete types and define interfaces / structs when shapes are non-trivial.

**Time** — use a single time library consistently (`chrono` в Rust, один з `date-fns` / `dayjs` / `luxon` у TS — обираємо один). Never use raw platform clocks (`Date.now()`, `std::time::SystemTime::now()`) directly in business logic.

**Naming conventions:**

- Rust: `snake_case` для функцій/змінних, `PascalCase` для типів, `SCREAMING_SNAKE_CASE` для constants
- TS/React: `camelCase` для функцій/змінних, `PascalCase` для типів та компонентів, `UPPER_SNAKE_CASE` для constants
- Private fields immutable by default
- Avoid: single-letter vars (except `i`, `j`, `k`), abbreviations (`cls`, `ctx`, `usr`), non-descriptive names (`data`, `info`, `temp`)

## Code Structure & Readability

**Import order** (enforced by linter, but follow intentionally):

1. External packages
2. Internal absolute paths
3. Relative siblings

Separate groups with a blank line only when the linter requires it.

**Class / module member order:**

1. Static properties / constants
2. Private immutable fields
3. Constructor / initializer
4. Protected getters
5. Public methods — ordered by business flow
6. Private methods — immediately after the public method that calls them
7. Pure validation / helper methods at the bottom

**Blank lines as section separators:**

- One blank line between methods — always
- One blank line after the constructor
- One blank line between logical blocks inside a method (setup → main logic → return)
- No double blank lines anywhere

**Method body structure** — each method should read top-to-bottom like a recipe:

1. Guards / validation (early returns, throw if invalid)
2. Data preparation (fetch, transform, build)
3. Main action (save, update, call external)
4. Return / side effects

**Guard clause breathing room** — add a blank line before and after guard clauses (`if (!x) return`) to visually separate data preparation from guards from main logic. Also add a blank line before cleanup returns in effects / destructors.

**Ternaries and conditionals:**

- Single-condition ternary: inline is fine
- Multi-condition: use `if/else` or extract to a variable / helper
- Never nest ternaries

## Architecture Rules

1. **Entities / domain types** → centralized location (Rust: `src-tauri/src/domain/`; TS: `src/types/`) — never inside feature modules
2. **DTOs / IPC schemas** → live inside their feature module as `dto.rs` (or `dto/` with barrel if multiple files). Shared envelopes (e.g. `JobIdRequest`) live with the feature that owns them and are imported by siblings via `crate::<feature>::dto::...`. Tauri commands declare types on both sides
3. **Utilities** → centralized location (`src-tauri/src/utils/`, `src/utils/`) — never duplicated per module
4. **Primary keys** → integer (not UUID) unless a hard requirement says otherwise
5. **Barrel exports** → use `index.ts` / `mod.rs` files
6. **Config** → inject via a config module, never read environment variables directly in business code
7. **Migrations** → none (no DB at start). If a DB is added, auto-generated migrations only
8. **UI server-state** — N/A (десктоп без бекенд-API). For local async state from Rust commands use the project's chosen state lib (TanStack Query можна, але часто overkill — обираємо коли з'явиться потреба)
9. **Tests** → unit tests only for critical business logic

### Backend module layout (Rust / `src-tauri/src/`)

Hybrid: **feature modules vertical, shared core horizontal.** Each feature owns its IPC entry points, business logic, persistence, and DTOs. Shared types and utilities are centralized so features can depend on them without depending on each other.

```
src-tauri/src/
├── lib.rs            ← bootstrap, plugin registration, invoke_handler
├── error.rs          ← AppError, AppResult (shared)
├── domain/           ← entities, enums, value objects (shared, never per-feature)
├── utils/            ← cross-cutting helpers (shared)
├── <feature>/        ← e.g. scanning, sorting, history
│   ├── mod.rs        ← re-exports the public command fns and dto types
│   ├── command.rs    ← #[tauri::command] entry points (thin)
│   ├── service.rs    ← business logic (where the work happens)
│   ├── repository.rs ← filesystem / persistence access (optional per feature)
│   └── dto.rs        ← request / response IPC contracts for this feature
└── …
```

Rules:

- **Feature module owns its `command.rs` and `dto.rs`.** No flat `commands/` or `dto/` umbrella module.
- **Domain types stay in `domain/`** even if used by exactly one feature today — moving them later breaks more than the duplication it avoids.
- **`lib.rs` reexports nothing from features except command fns** — register them in `tauri::generate_handler![feature::command_name, …]`.
- **Cross-feature imports allowed only for DTOs and read-only domain types**, never for service internals. If two features need to share business logic, extract to `domain/` or a new shared module.
- **Frontend mirrors the same vertical split** under `src/features/<feature>/` (components, hooks, IPC bindings).

## Testing Philosophy

**Target: ~60–70% for MVP.** Test only critical business logic.

**Test ONLY:**

- Complex data transformations (EXIF parsing, date extraction, geolocation reverse-lookup)
- Error handling paths (corrupted files, missing metadata)
- Core business flows (sorting, deduplication, conflict resolution)
- Isolation invariants (filesystem operations within sandbox)

**Do NOT test:**

- "should be defined"
- Simple CRUD
- DTOs / serializers
- Factory patterns
- Trivial getters / setters
- Private helpers
- Impossible edge cases

**Mocking:** mock only external dependencies (filesystem when destructive, time, OS clipboard / dialogs). Do NOT mock framework DI / your own code.

## Design Patterns

| Pattern    | Usage                                                                             |
| ---------- | --------------------------------------------------------------------------------- |
| Repository | Data access abstraction (filesystem reads/writes wrapper)                         |
| Factory    | Dynamic object instantiation                                                      |
| Strategy   | Interchangeable algorithms (different sorting modes — by date, by location, both) |
| Decorator  | Cross-cutting concerns (logging, profiling)                                       |
| Singleton  | Config, shared resources (Tauri app handle)                                       |

## Error Handling

| Situation             | Semantic         | UI signal                                              |
| --------------------- | ---------------- | ------------------------------------------------------ |
| File not readable     | I/O error        | Toast + skip in batch                                  |
| Invalid metadata      | Validation error | Mark as "unknown date / location"                      |
| Permission denied     | Forbidden        | Modal with "Grant access" CTA                          |
| Duplicate target file | Conflict         | Conflict resolution dialog (skip / overwrite / rename) |
| Unknown error         | Internal error   | Error toast + log line                                 |

Map these to:

- Rust: `Result<T, AppError>` with `thiserror`-style enum
- TS: typed `Error` subclasses or discriminated union types

## Git Conventions

**Branches:** `production` | `staging` (main) | `feat/XXX-001` | `fix/XXX-001`

**Commits:** `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Functional scopes (suggested):** `tauri`, `ui`, `core`, `exif`, `geo`, `fs`, `docs`, `config`, `deps`, `ci`

**User-facing commit messages:** `feat` and `fix` headlines may appear in user-facing release notes. Write them user-friendly (not technical), without PII, codenames, or security exploit details.

**CHANGELOG entry per PR:** every `feat` / `fix` / `perf` / `revert` PR MUST add a single user-friendly bullet under the `## [Unreleased]` section in `CHANGELOG.md`, in the matching subsection (`### Features`, `### Bug Fixes`, `### Performance`, `### Reverts`). Add the entry in the same commit as the code change. `docs` / `style` / `test` / `build` / `ci` / `chore` / `refactor` PRs do NOT add entries. Format: `- <user-friendly description>` — no scope prefix, no PR/commit links.

**Hooks:** `pre-commit` (lint-staged для UI; `cargo fmt --check && cargo clippy` для Rust), `commit-msg` (conventional commits)

**Releases:** SemVer (`v1.2.3`), single version for entire repo (синхронізована між `package.json` та `src-tauri/Cargo.toml` + `tauri.conf.json`). CHANGELOG-driven flow: each PR adds an `## [Unreleased]` entry; a `chore(release): prepare X.Y.Z` PR renames `[Unreleased]` to the new version and bumps the version manifests.

**PR Checklist:**

- [ ] Types complete — no lazy escape hatches
- [ ] Error handling — no unhandled promises / silent catches / `unwrap()` без коментаря-обґрунтування
- [ ] Unit tests added — for new critical logic
- [ ] Lint passes (ESLint + clippy)
- [ ] Build passes (`pnpm tauri build` локально хоча б на одній платформі)
- [ ] Docs updated — if API / IPC contract changed

## Git Workflow

**Model:** Develop-then-split — all code is written first, then split into atomic commits and PRs during delivery.

**Flow:** code → self-improve → split into branch(es) → atomic commits → Pattern Guard → review → triage (incl. false positives) → fix → verify → push + open PR → CI check → merge (manual)

| Phase         | What happens                                                       |
| ------------- | ------------------------------------------------------------------ |
| Develop       | All code written in working directory                              |
| Self-improve  | Re-read own code, fix typos / naming / imports, document learnings |
| Split         | Create branch per PR, stage files by logical group                 |
| Commit        | Atomic commits — one logical step per commit, never one big commit |
| Pattern Guard | Scan against `docs/workflow/anti-patterns.md`, fix AP-XXX matches  |
| Review        | Multi-agent code review                                            |
| Triage        | Classify findings: real issue / false positive / style preference  |
| Fix           | Address accepted findings, commit fixes separately                 |
| Verify        | Lint + build + tests for every workspace                           |
| Push          | `git push -u origin <branch>` + open PR                            |
| CI check      | Never merge with red CI                                            |
| Merge         | Manual via UI or explicit command — never auto-merge               |

### Rules

- **Develop first, deliver second** — never create branches or commit mid-development
- **Atomic commits** — every PR has multiple commits, one logical step each
- **Self-improvement loop is mandatory** — re-read own code before delivery, fix issues, document learnings
- **Triage false positives** — never blindly apply review findings; classify each as real issue / false positive / style preference
- **Lint, build, and tests MUST pass before creating a PR**
- **CI MUST pass before merge** (коли CI з'явиться)
- **Merge is always manual** — by user action or explicit command, never automatic
- PR base branch: `staging` (unless hotfix → `production`)
- One logical change per PR
- PR title: under 70 characters, imperative mood
- All work MUST be delivered as PRs — never left as uncommitted changes

### Multi-PR Delivery

When a task is split into multiple PRs:

1. Create a separate branch for each PR from `staging`
2. Stage ONLY the files scoped to that PR, commit atomically (multiple commits)
3. Review → triage → fix → lint & test → push + open PR
4. Return to `staging`, repeat for next PR

**Multi-PR rules:**

- Each PR MUST build independently
- PRs MUST NOT break each other — no import dependencies across PR boundaries
- Each PR gets its own branch
- Deliver PRs in the order defined in the plan

## Multi-Agent Orchestration

**Agents:** Orchestrator (main session), Team Lead, Researcher, Backend Developer, Frontend Developer, Reviewer, Pattern Guard. Definitions live in `.claude/agents/*.md`.

**Strategy selection:**

| Strategy       | When to use                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| A — Simple     | Trivial change. Orchestrator writes code directly.                            |
| B — Sequential | Small feature, one agent at a time                                            |
| C — Parallel   | Independent file scopes, no shared state                                      |
| D — Full-Stack | Backend + Frontend + specialists in parallel after API/IPC contract is locked |

**Agent delegation convention (Strategy B/C/D):** when dispatching subagents, ALWAYS include in the prompt: `Read .claude/agents/<role>.md and follow those role instructions.`

| Task type             | Agent definition                       |
| --------------------- | -------------------------------------- |
| Planning, strategy    | `.claude/agents/team-lead.md`          |
| Research, discovery   | `.claude/agents/researcher.md`         |
| Backend (`src-tauri`) | `.claude/agents/backend-developer.md`  |
| Frontend (`src`)      | `.claude/agents/frontend-developer.md` |
| Code review           | `.claude/agents/reviewer.md`           |
| Anti-pattern scan     | `.claude/agents/pattern-guard.md`      |

**In-session parallelization (Strategy C & D):**

- Parallel agents use background execution in the same working directory
- File scope separation enforced: backend agent → `src-tauri`, frontend agent → `src`
- Shared resources (types, constants, IPC contracts, barrel exports) prepared by sequential agent before parallel work
- Orchestrator coordinates, decides, delegates — does not edit files directly (B/C/D)
- Strategy A exception: Orchestrator may write code directly for simple tasks

**Key rules:**

- ALWAYS analyze task complexity before starting
- Plan MUST include: chosen strategy (A/B/C/D) with justification
- Plan MUST include PR split if work is large
- Define IPC contract BEFORE launching parallel team (Strategy D) — Tauri commands' input/output types
- Strategy D = parallel team — never sequential
- Backend Developer touches ONLY `src-tauri`, Frontend Developer touches ONLY `src`
- NEVER delegate without clear scope, spec reference, and verification command
- Every delegated subagent MUST read its `.claude/agents/<role>.md` before starting work
- After implementation → Reviewer Agent verifies lint, tests, anti-patterns
- After verification → self-improvement loop (re-read, fix typos, document learnings)
- After self-improvement → deliver all work as PRs

## Self-Improvement Loop

After implementation completes, BEFORE delivery:

1. Re-read all changed files end-to-end
2. Fix typos, inconsistent naming, dead imports
3. Identify recurring mistakes — record them in `docs/workflow/anti-patterns.md` as `AP-XXX`
4. Verify the code does what the spec asked, nothing more

## Pattern Guard + Anti-Patterns

`docs/workflow/anti-patterns.md` is the codified memory of mistakes already made on this project. Before every commit, scan staged changes against the anti-pattern list. The `pattern-guard` agent automates this.

## Docs Structure

```
docs/
├── specs/         # Design documents per feature
├── workflow/      # Process docs (anti-patterns, releases, CI/CD)
└── discoveries/   # Research / discovery documents
```

Specs are immutable once approved (versioned by date). Workflow docs evolve. Discoveries are append-only research artefacts.

## Available Commands

```bash
# Dev / build (з кореня)
pnpm install              # JS deps
pnpm tauri dev            # Run Tauri в dev (Rust + Vite + webview)
pnpm tauri build          # Production desktop build (signed installers)

# Frontend (UI only)
pnpm dev                  # Vite dev server (без Tauri shell — для UI-debug)
pnpm preview              # Preview UI production build
pnpm lint                 # ESLint
pnpm format               # Prettier

# Backend (Rust, у src-tauri/)
cd src-tauri
cargo check               # Швидкий type-check
cargo build               # Build crate
cargo test                # Run Rust tests
cargo clippy              # Linter
cargo fmt                 # Formatter

# Makefile (з кореня) — швидкі шорткати
make help                 # Список цілей
make setup                # Повна установка з нуля
make install              # Тільки залежності
make dev                  # pnpm tauri dev
make build                # Production build
make lint                 # ESLint + clippy
make fmt                  # Prettier + cargo fmt
make test                 # pnpm test + cargo test
make clean                # Прибрати артефакти
```

Migrations: `none` (no DB at start).

## Permissions

**Auto-accept:** Reads, packages (через pnpm/cargo), test files, docs

**Ask first:** Filesystem write to user's media folders, OS-specific Tauri permissions (`fs:allow-*`, `dialog:open`), будь-що, що рухає / переписує файли користувача

**Never:** Commit secrets, hardcode API keys, push to `production` без явної інструкції, видаляти користувацькі файли (тільки переміщення в нові теки — оригінал має залишатися або відновлюватися)

## Priorities

1. Simplicity over cleverness
2. Безпека користувацьких файлів — будь-яка операція з фото/відео має бути зворотною (dry-run, undo, або трим лог переміщень)
3. UX (loading states, error states, accessibility — особливо клавіатурна навігація для масових операцій)
4. Updated docs

## How to Respond

1. Compact explanations
2. Small changes: show diff only; Large changes: full files
3. When unsure: state assumption, then proceed
4. Propose tests only for critical business logic
