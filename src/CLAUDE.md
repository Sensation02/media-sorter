# Frontend — React / TypeScript / Vite Rules

> **Scope:** applies to `src/**`. This file **extends** the root `.claude/CLAUDE.md` — it does not override it. Precedence is unchanged: Constitution → root `.claude/CLAUDE.md` → stack-scoped (`src-tauri/` & `src/`) → `docs/workflow/*` → `docs/specs/*` → code. All paths below are repo-root-relative.
>
> Loaded on demand when the agent reads or edits files under `src/`, which keeps the root file lean. Frontend work is delegated to `.claude/agents/frontend-developer.md` — read that role file before implementing; the conventions here are what it must follow. Universal rules (no-comments, constants-first, method decomposition, defensive parsing, strict typing, error-handling philosophy, time library, the import/member-order/blank-line/ternary readability rules) live in the root file and also apply here.

## Naming conventions (TS / React)

- `camelCase` for functions/variables, `PascalCase` for types and components, `UPPER_SNAKE_CASE` for constants

The shared naming sub-rules (private fields immutable by default; avoid single-letter vars / abbreviations / non-descriptive names) live in the root `.claude/CLAUDE.md` > Code Rules and apply here.

## Code Rules (frontend)

**One file — one component (UI)** — every UI component lives in its own file. Never co-locate two or more components in a single file, including small private helpers.

## Architecture (frontend)

- **Frontend mirrors the backend vertical split** under `src/features/<feature>/` (components, hooks, IPC bindings). See the backend module layout in `src-tauri/CLAUDE.md`.
- **UI server-state** — N/A (desktop without a backend API). For local async state from Rust commands, use the project's chosen state lib (TanStack Query is allowed but often overkill — we'll pick one when the need arises).

## Session Context — language explanations

For TS / React / Vite changes, **do not** explain language features unless asked — the user is fluent there. (The Rust learning-notes obligation applies only to `src-tauri/` — see `src-tauri/CLAUDE.md` > Session Context.)

## Commands

```bash
# Frontend (UI only)
pnpm dev                  # Vite dev server (no Tauri shell — for UI debug)
pnpm preview              # Preview UI production build
pnpm lint                 # ESLint
pnpm format               # Prettier
```

The repo-root commands (`pnpm install`, `pnpm tauri dev`, `pnpm tauri build`), the package-manager policy, and the Makefile shortcuts live in the root `.claude/CLAUDE.md` > Available Commands.
