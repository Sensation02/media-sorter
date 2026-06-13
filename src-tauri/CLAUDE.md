# Backend — Rust / Tauri Rules

> **Scope:** applies to `src-tauri/**`. This file **extends** the root `.claude/CLAUDE.md` — it does not override it. Precedence is unchanged: Constitution → root `.claude/CLAUDE.md` → stack-scoped (`src-tauri/` & `src/`) → `docs/workflow/*` → `docs/specs/*` → code. All paths below are repo-root-relative.
>
> Loaded on demand when the agent reads or edits files under `src-tauri/`, which keeps the root file lean. Backend work is delegated to `.claude/agents/backend-developer.md` — read that role file before implementing; the conventions here are what it must follow. Universal rules (no-comments, constants-first, method decomposition, defensive parsing, strict typing, error-handling philosophy, time library, the import/member-order/blank-line/ternary readability rules) live in the root file and also apply here.

## Naming conventions (Rust)

- `snake_case` for functions/variables, `PascalCase` for types, `SCREAMING_SNAKE_CASE` for constants

The shared naming sub-rules (private fields immutable by default; avoid single-letter vars / abbreviations / non-descriptive names) live in the root `.claude/CLAUDE.md` > Code Rules and apply here.

## Backend module layout (`src-tauri/src/`)

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
- **Frontend mirrors the same vertical split** under `src/features/<feature>/` (components, hooks, IPC bindings) — see `src/CLAUDE.md`.

## Session Context — Rust learning notes

The repository owner is using this project as a vehicle for **learning Rust** alongside delivery. They are a senior JS / TS / React developer with no prior Rust background. (Article VIII — Learning is a first-class concern.)

When the agent makes Rust changes in `src-tauri/`, it MUST briefly explain in English:

- new syntax that hasn't appeared in this codebase yet (`let-else`, `match`, `?`, closures `|x|`, lifetimes, generics, turbofish, pattern matching, `impl Trait`)
- attribute macros (`#[derive(...)]`, `#[tauri::command]`, `#[serde(...)]`, `#[cfg(...)]`, `#[error("...")]`)
- ownership / borrowing decisions (`&str` vs `String`, `&Path` vs `PathBuf`, `&mut`, when to `.clone()`)
- async vs blocking trade-offs in Tauri commands (`blocking_*`, `spawn_blocking`, oneshot channels)
- module / crate structure (`mod`, `pub`, `use`, `super::`, `crate::`, barrel re-exports)
- error-handling patterns (`Result`, `Option`, `?`, `From`, `thiserror`, `map_err`)

Style for explanations:

- short, concrete, with code excerpts
- English
- mark explanation blocks clearly so they are skippable (e.g. a dedicated `### 🎓` heading or block)
- do NOT repeat explanations of concepts already covered in the same conversation — rely on context
- skip explanations on trivial mechanical edits (renames, formatting fixes, moving lines)

## Commands

```bash
# Backend (Rust, in src-tauri/)
cd src-tauri
cargo check               # Fast type-check
cargo build               # Build the crate
cargo test                # Run Rust tests
cargo clippy              # Linter
cargo fmt                 # Formatter
```

The `cargo` dependency commands (`cargo add` / `remove` / `update`), the package-manager policy (commit `Cargo.lock`; latest compatible crate versions verified with `cargo search`), and the repo-root / Makefile shortcuts all live in the root `.claude/CLAUDE.md` (> Package Manager and > Available Commands).
