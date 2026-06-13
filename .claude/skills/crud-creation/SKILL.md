---
name: crud-creation
description: Use when adding a new request/response capability to media-sorter as a vertical slice across the Rust/Tauri backend and the React frontend — a new domain type, a feature module with its IPC DTO + service + #[tauri::command], handler registration, and the TypeScript mirror + invoke() binding. Triggers when work creates a new src-tauri/src/<feature>/ module, adds a #[tauri::command], introduces a new domain struct in src-tauri/src/domain/, or wires a new invoke() call in src/ipc/commands.ts. Mirrors CLAUDE.md's backend module layout.
---

# CRUD Creation (Rust/Tauri vertical slice)

## Overview

How to add a new command-shaped capability to media-sorter as a single vertical slice: a domain type, a feature module (`dto.rs` → `service.rs` → `command.rs`), handler registration, and the React-side mirror type + `invoke()` binding. Every slice follows the same ordered recipe and the same file layout from CLAUDE.md § Backend module layout. Skipping a step, or doing them out of order, produces a type that the frontend can't see, a wire break that compiles on both sides but deserializes to `undefined`, or a command that never registers.

**Core principle:** domain type → DTO → service → command → registration → frontend mirror. Always in that order. Never start with the command. The order exists because step N+1 consumes the type produced by step N — the DTO embeds the domain type, the service returns it, the command calls the service, the frontend mirror restates the DTO's wire shape.

This is the MS analogue of a CRUD recipe. There are **no templates** — MS structs are concrete and small; copy the live patterns in `src-tauri/src/scanning/` (the cleanest end-to-end slice: `dto.rs`, `service.rs`, `command.rs`, `mod.rs`) and the matching `scan_source` entries in `src/ipc/commands.ts` + `src/types/ipc.ts`.

## When to Use

Use when:

- Adding a new `#[tauri::command]` and the request/response types it needs
- Creating a new feature module under `src-tauri/src/<feature>/`
- Adding a new shared domain struct or enum in `src-tauri/src/domain/`
- Wiring a new `invoke()` call from the React side

Do NOT use when:

- The command **streams progress or runs long** — that path also emits Tauri events (`src/ipc/events.ts`, and the sorting runner's `emitter.rs` / `events.rs`). Events are a separate concern; this recipe covers only the request→response spine. Build the slice with this recipe, then add the event channel separately.
- You are only editing an existing service or command with no new type and no new module — apply the relevant per-step rules and ignore registration.

## Creation Order

```
1. Domain type   → src-tauri/src/domain/mod.rs           (shared structs/enums, only if a new shared type is needed)
2. DTO           → src-tauri/src/<feature>/dto.rs         (request/response IPC envelopes)
3. Repository    → src-tauri/src/<feature>/repository.rs  (OPTIONAL — only if the feature does FS/persistence)
4. Service       → src-tauri/src/<feature>/service.rs     (business logic, returns AppResult<T>)
5. Command       → src-tauri/src/<feature>/command.rs     (#[tauri::command], thin)
6. Registration  → src-tauri/src/<feature>/mod.rs + src-tauri/src/lib.rs
7. Frontend bind → src/types/ipc.ts + src/ipc/commands.ts (+ src/ipc/index.ts barrel)
```

Each step has a checklist below. Do not skip ahead. Steps 1 and 3 are conditional; steps 2, 4, 5, 6, 7 are always present for a new command.

---

## 1. Domain type

Shared entities, enums, and value objects live in `src-tauri/src/domain/mod.rs` (centralized). Never colocate a shared type inside the feature module — even if exactly one feature uses it today (CLAUDE.md Architecture Rule 1).

**Reference:** `MediaFile`, `ScanSummary`, `SortRuleId` in `src-tauri/src/domain/mod.rs`.

**Rules:**

- Add the type here only if it is **shared** or is a reusable value object. A request/response shape that exists purely to carry one command's payload is a DTO, not a domain type — it belongs in step 2.
- Derive `Serialize` and `Deserialize` on every type that crosses the IPC boundary; add `Debug, Clone` to match the existing structs.
- **Structs:** `#[serde(rename_all = "camelCase")]` so Rust `snake_case` fields serialize to the camelCase the React side expects.
- **Enums:** `#[serde(rename_all = "kebab-case")]` — they become TS string-literal unions on the wire (`SortRuleId::ByDate` ↔ `"by-date"`).
- Integer primary identifiers are type aliases over `i64` (`pub type ScanId = i64; pub type JobId = i64;`) — they cross the boundary as a TS `number`. Integer, not UUID (CLAUDE.md Architecture Rule 4).
- Optional fields use `Option<T>` and map to `T | null` on the TS side.
- Defensive parsing: a domain type carrying EXIF/GPS data must model absence honestly (`Option<CaptureDate>`, `Option<GeoPoint>`) — metadata is missing far more often than not.

### 🎓 serde casing is the wire contract

The `#[serde(rename_all = "...")]` attribute is the only thing keeping the Rust field names and the TypeScript field names in sync. `rename_all = "camelCase"` on a struct turns `size_bytes` into `sizeBytes`; `rename_all = "kebab-case"` on an enum turns `ByDateAndPlace` into `"by-date-and-place"`. If the Rust casing and the hand-written TS type in step 7 disagree, the payload still compiles on both sides but a field arrives as `undefined` at runtime — a silent wire break with no error. The two must always be authored together.

---

## 2. DTO

Each feature owns its request/response contracts in `<feature>/dto.rs` (CLAUDE.md Architecture Rule 2). DTOs are the IPC envelopes; they may embed domain types directly.

**Reference:** `ScanSourceRequest`, `ScanResponse`, `RevealRequest` in `src-tauri/src/scanning/dto.rs`.

**Rules:**

- **Request DTO** derives `Deserialize` (it arrives from the frontend); **Response DTO** derives `Serialize` (it returns to the frontend). Add `Debug, Clone` to match siblings.
- `#[serde(rename_all = "camelCase")]` on every DTO struct — same wire-contract rule as domain types.
- **Embed domain types directly — there is no mapper layer.** A response is built by composing domain types into the envelope (`ScanResponse { scan_id, summary: ScanSummary }`, where `ScanSummary` is a raw domain struct). MS does not have an entity→DTO mapper step; any field assembly happens inline in the service or command (see `run_scan` in `scanning/command.rs`). Do **not** create a `mapper.rs`.
- A DTO that exists only to carry one field is still worth its own struct — it keeps the `request` argument shape uniform on the frontend (step 5).
- Shared request envelopes (e.g. a `JobIdRequest` reused by sibling features) live in the feature that owns them and are imported via `crate::<feature>::dto::...` — they are not duplicated.

---

## 3. Repository (optional)

Only if the feature reads or writes the filesystem or persists state. Stateless features (e.g. `metadata`) have no `repository.rs`.

**Reference:** `src-tauri/src/scanning/repository.rs` (in-memory scan session), `src-tauri/src/settings/repository.rs` (store-backed persistence).

**Rules:**

- The repository is the data-access wrapper (CLAUDE.md Design Patterns § Repository) — the service calls it, the command never does.
- All filesystem access goes through `AppResult<T>` and the `?` operator; `std::io::Error` converts into `AppError::Io` automatically via the `From` impl in `error.rs`.
- Article I: a repository that moves user files must keep the move reversible (a move log / undo path) — never delete. See the `error-handling` skill and the sorting runner's `log.rs` for the reversibility pattern.

---

## 4. Service

Business logic lives here. The command is thin; the service does the work (CLAUDE.md § Backend module layout).

**Reference:** `scan_directory` and its private helpers in `src-tauri/src/scanning/service.rs`.

**Rules:**

- Public service functions return `AppResult<T>` (= `Result<T, AppError>`). Never return an error object on the happy path; never `panic!` / `unwrap()` on a recoverable error. Full error doctrine: cross-reference the `error-handling` skill.
- Guards first (validate inputs, early-return `Err(AppError::validation(...))`), then data preparation, then the main action, then return — the method-body recipe from CLAUDE.md.
- A function longer than 30 lines is split into private helpers (`validate_*`, `build_*`, `classify_*`) — see how `scan_directory` delegates to `validate_directory`, `empty_summary`, `classify_entry`, `accumulate`.
- Map foreign errors at the boundary with `.map_err(...)` into the right `AppError` variant; do not let a raw library error escape into the IPC layer untyped.
- Tests: add `#[cfg(test)] mod tests` here for **critical business logic only** (transformations, error paths, isolation invariants) — not for boilerplate. See the test block in `scanning/service.rs` for the `tempfile::TempDir` filesystem-isolation pattern.

---

## 5. Command

HTTP-equivalent wiring only. No business logic in the command body.

**Reference:** `scan_source`, `pick_source_dir`, `reveal_directory` in `src-tauri/src/scanning/command.rs`.

**Rules:**

- Annotate with `#[tauri::command]`. The function returns `AppResult<T>` — `AppError` serializes into the tagged union the frontend already mirrors (`AppErrorDto` in `src/types/ipc.ts`).
- **One DTO parameter named `request`.** The frontend calls `invoke("snake_name", { request: { ... } })`; the parameter name `request` must match that key. A command with no input takes no parameter (see `list_history` / `get_settings`).
- The command unpacks the request, calls the service, wraps the result — it does not contain the algorithm. Inline DTO assembly (composing the response envelope) is fine here; business logic is not.
- **Blocking filesystem work runs off the async runtime:** wrap it in `tauri::async_runtime::spawn_blocking(move || ...)` and `.await` it (see `scan_source`). A `#[tauri::command] async fn` that does synchronous heavy FS work directly will stall the runtime.
- Commands that need OS dialogs take `app: AppHandle` and bridge the callback with a `tokio::sync::oneshot` channel (see `pick_source_dir`).

### 🎓 `spawn_blocking` and the `request` argument shape

`spawn_blocking` moves CPU/IO-bound synchronous work onto a dedicated thread pool so the async command doesn't block Tauri's runtime; `.await` then yields the result and `.map_err(AppError::internal)?` converts a join error into a typed `AppError`. The `move ||` closure takes ownership of the captured values (`request.path`) so they outlive the spawn. On the wire, Tauri matches the single command parameter to the named key in the `invoke` payload — naming it `request` everywhere keeps `src/ipc/commands.ts` uniform.

---

## 6. Registration

Two edits, both required. A command that compiles but is not in `generate_handler!` returns "command not found" at runtime.

**Reference:** `src-tauri/src/scanning/mod.rs` and the `invoke_handler` block in `src-tauri/src/lib.rs`.

**Rules:**

- **`<feature>/mod.rs`** — declare the submodules (`pub mod command; pub mod dto; ...`) and re-export the public command fns: `pub use command::{scan_source, reveal_directory, ...}`. `mod.rs` re-exports command fns and DTO types only, never service internals (CLAUDE.md).
- **`lib.rs`** — if the feature module is new, add `pub mod <feature>;` to the module list, then add each command to `tauri::generate_handler![ ... ]` as `<feature>::command::<fn_name>`.
- `lib.rs` re-exports nothing from a feature except via the handler registration.

---

## 7. Frontend binding

> **Codebase convention vs CLAUDE.md prose:** CLAUDE.md and the EPIC-18 task describe the frontend IPC binding as living "under `src/features/<feature>/`". The actual codebase does **not** do this — every `invoke()` wrapper is centralized in `src/ipc/commands.ts` and every DTO mirror type in `src/types/ipc.ts`; `src/features/<feature>/` holds only the hooks and components that consume those. This recipe follows the codebase. (The nested-CLAUDE / convention reconciliation is tracked separately as EPIC-18 S31.)

Three edits, in order:

**Reference:** the `ScanResponse` type in `src/types/ipc.ts` and the `scanSource` wrapper in `src/ipc/commands.ts`.

**Rules:**

1. **Mirror the DTO as a TS type in `src/types/ipc.ts`.** Hand-write the type to match the Rust DTO's **serialized** shape: camelCase fields (matching the struct's `rename_all = "camelCase"`), string-literal unions for enums (matching `rename_all = "kebab-case"`, e.g. `SortRuleId = "by-date" | ...`), `T | null` for `Option<T>`, `number` for `i64` aliases. This is the other half of the wire contract from step 1.
2. **Add the `invoke()` wrapper in `src/ipc/commands.ts`.** Call `invoke<ResponseType>("snake_command_name", { request: { ...camelCaseArgs } })`. The command name is the Rust fn name in snake_case; the payload key is `request` (matching step 5); a no-arg command calls `invoke<T>("name")` with no second argument. Type the return as `Promise<ResponseType>`. For fire-and-forget commands return `Promise<void>` and `await` the invoke (see `pauseSort` / `setMemo`).
3. **Confirm the barrel** — `src/ipc/index.ts` re-exports `./commands`, so a new wrapper is exported automatically. Feature hooks under `src/features/<feature>/` then import from `../ipc` (or `src/ipc`) — never call `invoke` directly inside a component.

- Defensive parsing on the frontend boundary too: a value typed `T | null` must be handled as possibly null, with a meaningful fallback (`'Unknown location'`, `'No date'`) before it reaches user-facing output (CLAUDE.md Fallback values).
- Type-map the error: a rejected `invoke` carries an `AppErrorDto` — discriminate on `.code` (`"io" | "validation" | "forbidden" | "conflict" | "internal"`) rather than rendering a raw error string.

---

## Module file layout

```
src-tauri/src/<feature>/
├── mod.rs            # declares submodules, re-exports command fns + DTO types
├── command.rs        # #[tauri::command] entry points (thin)
├── service.rs        # business logic, returns AppResult<T> (+ #[cfg(test)] tests)
├── repository.rs     # OPTIONAL — FS / persistence access
└── dto.rs            # request/response IPC envelopes

src-tauri/src/domain/mod.rs   # shared structs/enums (+ new shared types)
src-tauri/src/lib.rs          # pub mod <feature>; + generate_handler![...]

src/types/ipc.ts              # hand-written TS mirror of the DTO
src/ipc/commands.ts           # invoke() wrapper
src/ipc/index.ts              # barrel (re-exports ./commands automatically)
src/features/<feature>/       # hooks/components that consume the binding
```

---

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Rust struct missing `#[serde(rename_all = "camelCase")]` | Field arrives as `undefined` on the TS side — a silent wire break. Add the attribute; match the TS casing exactly |
| Enum without `rename_all = "kebab-case"` while the TS union expects `"by-date"` | Align both sides: enum `rename_all = "kebab-case"` ↔ TS string-literal union |
| New request/response shape added to `domain/mod.rs` | If it only carries one command's payload it is a DTO — put it in `<feature>/dto.rs`, not `domain/` |
| Created a `mapper.rs` to convert entity → DTO | MS has no mapper layer. Embed domain types directly in the DTO; assemble inline in service/command |
| Command param not named `request` | Frontend `invoke(name, { request })` won't bind. Rename the single DTO param to `request` |
| `#[tauri::command] async fn` does heavy synchronous FS work directly | Wrap it in `spawn_blocking(move || ...).await` and map the join error to `AppError` |
| Command compiles but returns "command not found" | Missing from `generate_handler![]` in `lib.rs` — registration is two edits (`mod.rs` re-export + `lib.rs` handler) |
| Business logic in `command.rs` | Move it to `service.rs`; the command only unpacks, calls, wraps |
| Service returns `null` / error object on a not-found path | Return `Err(AppError::validation(...))` / the right variant; never an error object on the happy path |
| `invoke()` called directly inside a React component | Add the wrapper to `src/ipc/commands.ts`; consume it from a feature hook |
| TS mirror dropped under `src/features/<feature>/` | Mirror types go in `src/types/ipc.ts`, invoke wrappers in `src/ipc/commands.ts` — match the codebase, not the prose |
| Service method > 30 lines | Decompose into private helpers (`validate_*`, `build_*`, `classify_*`) |

---

## Cross-references

- `error-handling` skill — `Result<T, AppError>` + `thiserror`, no unjustified `unwrap()`, IPC-boundary error mapping into the TS discriminated union. The depth on error handling lives there; this recipe only points at `AppResult<T>`.
- `src-tauri/src/scanning/` — the cleanest end-to-end reference slice (dto/service/command/mod + repository).
- `src-tauri/src/error.rs` — `AppError` / `AppResult` definitions and the `From<std::io::Error>` conversion.
- `src/types/ipc.ts` + `src/ipc/commands.ts` — the frontend mirror + binding the recipe extends.
- CLAUDE.md § Backend module layout / § Architecture Rules — the authoritative layout this recipe formalizes.

---

## Final checklist

- [ ] New shared type (if any) in `src-tauri/src/domain/mod.rs` with `Serialize`/`Deserialize` + correct `rename_all` casing
- [ ] Request DTO (`Deserialize`) and/or Response DTO (`Serialize`) in `<feature>/dto.rs`, `rename_all = "camelCase"`, domain types embedded directly (no mapper)
- [ ] Repository added only if the feature touches the filesystem / persists state; user-file moves stay reversible (Article I)
- [ ] Service returns `AppResult<T>`, guards-first, helpers under 30 lines, foreign errors `.map_err`'d to `AppError`
- [ ] Critical-path logic has a `#[cfg(test)]` test (Article IX) — boilerplate does not
- [ ] `#[tauri::command]` is thin, single param named `request`, heavy FS work in `spawn_blocking`
- [ ] Registered in both `<feature>/mod.rs` (re-export) and `lib.rs` (`generate_handler![]`)
- [ ] TS mirror type added to `src/types/ipc.ts` matching the DTO's serialized shape
- [ ] `invoke()` wrapper added to `src/ipc/commands.ts` (`{ request: {...} }`, snake_case command name)
- [ ] Consumed from a feature hook under `src/features/<feature>/`, never `invoke` inside a component
- [ ] `make check` (lint + test) and `make fmt-check` pass
