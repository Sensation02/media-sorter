---
name: error-handling
description: Use when writing or reviewing any code path that returns a Result, maps an error, calls unwrap/expect, logs a failure, or crosses the Tauri IPC boundary. Triggers whenever a `Result<T, AppError>`, `?`, `.map_err(...)`, `.ok_or_else(...)`, a `match` on an `Err` arm, `.unwrap()`/`.expect()`, an `eprintln!`, or a `#[tauri::command]` signature appears in the diff. Also use when designing a new command or service method — error paths are part of the design, not an afterthought. Catches silent failures, the wrong `AppError` variant, an `AppError` variant that exists on only one side of the IPC boundary, raw OS error strings leaking into user toasts, and over-logged graceful-recovery branches.
---

# Error Handling

## Overview

A single standard for how errors flow through media-sorter: services return `Result<T, AppError>` (aliased `AppResult<T>`), `#[tauri::command]` entry points return the same and let Tauri serialize the failure, and every error reaches React as a typed `{ code, params }` discriminated union the UI matches on. Logging severity matches recoverability — escalating paths are loud, graceful recovery is quiet.

**Core principle:** `AppError` is a five-variant `thiserror` enum that serializes (via `#[serde(tag = "code", content = "params")]`) into the exact discriminated union React reads. That union is **hand-mirrored across three files** — adding or changing a variant means editing all three in the same change, or the boundary silently desyncs. Anything that bypasses `AppError` (a bare `panic!`, an `.unwrap()` on the happy path, a raw `std::io::Error` string forwarded into a toast) breaks that contract: the UI either cannot match on it or shows a leaked internal string.

## When to Use

Use when:
- Adding any error return in a service or `#[tauri::command]`
- Writing or reviewing any `match` / `if let` with an `Err` arm, any `.map_err(...)`, any `?`
- Calling `.unwrap()` / `.expect()` anywhere outside a `#[cfg(test)]` block
- Wrapping a blocking or external call (`std::fs`, EXIF/metadata reads, `spawn_blocking`, a mutex `.lock()`)
- Deciding what to surface to the user and at what log severity
- Designing a new command — the error union ships with the success type, not later
- Reviewing a PR where an `Err` arm or a new `AppError` variant was added or changed

Do NOT use when:
- You're only renaming a local binding or reformatting an existing error (no behavioural change)
- You're inside a `#[cfg(test)]` block — `unwrap()` / `expect()` are expected there (see `unwrap` / `expect` section)

---

## The contract — one `AppError`, three mirrored files

`AppError` lives in `src-tauri/src/error.rs`:

```rust
#[derive(Debug, Clone, Error, Serialize)]
#[serde(
    tag = "code",
    content = "params",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum AppError {
    #[error("io error: {message}")]
    Io { message: String },

    #[error("validation error: {message}")]
    Validation { message: String },

    #[error("permission denied: {path}")]
    Forbidden { path: String },

    #[error("conflict at {path}")]
    Conflict { path: String },

    #[error("internal error: {message}")]
    Internal { message: String },
}

pub type AppResult<T> = Result<T, AppError>;
```

When a `#[tauri::command]` returns `Err(AppError::Forbidden { path })`, Tauri's `Serialize` derive produces the JSON the webview rejects with:

```json
{ "code": "forbidden", "params": { "path": "/Users/me/Photos" } }
```

The React side already consumes this shape:

- `src/types/ipc.ts` — `AppErrorCode` (`"io" | "validation" | "forbidden" | "conflict" | "internal"`) and the `AppErrorDto` union (`{ code: "io"; params: { message: string } } | ...`)
- `src/utils/app-error.ts` — `isAppErrorDto()` (the type guard React uses to recognise a structured error) and `toAppErrorView()` (turns it into a `{ title, detail }` toast view)

**The load-bearing rule:** the union is hand-mirrored, not generated. There is no `ts-rs` / `specta` codegen — `build.rs` is just `tauri_build::build()`. A new `AppError` variant, or a changed field, MUST touch all three files in the same change:

1. `src-tauri/src/error.rs` — the variant + its `#[error("...")]` line
2. `src/types/ipc.ts` — `AppErrorCode` + the matching `AppErrorDto` arm
3. `src/utils/app-error.ts` — the `TITLES` entry and the `detailFor` arm

Miss any one and the boundary desyncs silently: Rust emits a `code` React's `match`/`switch` does not handle, or React renders `undefined` as a toast title. This is the MS analogue of HP's "add the key to `ERROR_KEYS` before throwing" rule — here the discriminant is a variant, mirrored by hand, three files at once.

---

## Which variant to use

Mirrors the Error Handling table in `.claude/CLAUDE.md` — same five semantics, same UI signals:

| Situation | Variant | `params` | UI signal |
|---|---|---|---|
| File / folder not readable, FS I/O failed | `AppError::Io { message }` | English detail | Toast + skip in batch |
| Invalid input / metadata / business rule | `AppError::Validation { message }` | English detail | Mark as "unknown date / location", inline message |
| Permission denied on a path | `AppError::Forbidden { path }` | offending path | Modal with "Grant access" CTA |
| Duplicate / colliding target path | `AppError::Conflict { path }` | offending path | Conflict resolution dialog (skip / overwrite / rename) |
| Unknown / unexpected (poisoned mutex, join failure) | `AppError::Internal { message }` | English detail | Error toast + log line |

Prefer the constructors in `error.rs` — `AppError::internal(e)`, `AppError::validation(e)`, `AppError::io(e)` — over building the struct variant inline; they take `impl Display` and call `.to_string()` for you. `Forbidden` / `Conflict` carry a `path`, so construct those as struct variants.

Do NOT invent a sixth variant for a situation one of the five already covers. A new variant is a three-file change (above) and is justified only when none of the five fits the UI signal — rare.

---

## `code` is the locale-stable discriminant — the `messageKey` analogue

HP attaches a per-scenario `messageKey` (`course.notFound`) to every user-facing exception so the UI can translate it. MS's analogue is **coarser and already wired**: the `code` discriminant (`io` / `validation` / `forbidden` / `conflict` / `internal`) is the stable key React keys off. `src/utils/app-error.ts` maps it to a user-facing title:

```typescript
const TITLES: Record<AppErrorCode, string> = {
  io: "Cannot read folder",
  validation: "Invalid input",
  forbidden: "Permission denied",
  conflict: "Path conflict",
  internal: "Unexpected error",
};
```

**Two honest differences from HP — do not paper over them:**

- **Granularity.** HP keys are per-scenario; MS `code` is one of five categories. The specific detail lives in `params` (`message` / `path`) and is **not** localized — it is the English fallback / log line, the analogue of HP's `message`, never of `messageKey`. Do not try to force HP's granular-key model onto the five-variant enum.
- **`TITLES` is hardcoded English today.** It is not yet wired to the `src-tauri/src/i18n/` catalog. So "`code` maps to MS's locale requirement" is partly aspirational: `code` is the stable key a locale catalog *would* index, but today `toAppErrorView` resolves it to English literals. When the i18n catalog grows a user-facing-error namespace, `code` is the key to wire it through. Until then, keep titles in `TITLES` and keep `code` stable — renaming a variant is a breaking change for any future catalog.

---

## Service & command rules — return, never panic

Services return `AppResult<T>` and use `?` to propagate. The `From<std::io::Error> for AppError` impl in `error.rs` means a bare `?` on an `std::fs` call already lands as `AppError::Io` — lean on it.

```rust
// ✅ Correct — propagate via ?, fail with a specific variant
fn job(jobs: &Registry, job_id: u64) -> AppResult<&Job> {
    jobs.get(&job_id)
        .ok_or_else(|| AppError::validation(format!("job {job_id} not found")))
}

// ✅ Correct — a fallible lock maps to a specific Internal cause
let mut jobs = registry().lock().map_err(poisoned)?;

fn poisoned<E>(_: E) -> AppError {
    AppError::internal("job registry mutex poisoned")
}
```

`#[tauri::command]` entry points stay thin: they hop to a blocking pool and forward the service `Result`. The join error is itself an exit path — map it, never `.unwrap()` it:

```rust
// ✅ Correct — both the service Result AND the JoinError are handled
#[tauri::command]
pub async fn get_settings(app: AppHandle) -> AppResult<AppSettings> {
    tauri::async_runtime::spawn_blocking(move || service::get_settings(&app))
        .await
        .map_err(AppError::internal)?
}
```

The trailing `.map_err(AppError::internal)?` converts the `JoinError` (panic / cancellation in the blocking task) into `AppError::Internal` and unwraps the inner `AppResult` with `?`. That single line is a live "audit every exit path" instance — the await can fail independently of the work it wraps.

What NOT to do:

```rust
// ❌ panic crosses the boundary as an opaque 500-equivalent, no code React can match
panic!("settings missing");

// ❌ unwrap on the happy path — a poisoned lock or absent value aborts the command
let jobs = registry().lock().unwrap();

// ❌ swallowing — the caller cannot tell success from a silently-defaulted failure
let settings = service::get_settings(&app).unwrap_or_default();
```

---

## Wrap blocking / external calls — never let a raw OS string surface

When calling `std::fs`, an EXIF / metadata reader, or any blocking primitive directly, the raw error MUST NOT reach a user toast verbatim. Either lean on `From<std::io::Error>` (lands as `Io`) or map deliberately to the variant whose UI signal fits, and keep the raw text in `params.message` for the log/fallback — not as the toast title.

This is the leak kernel ported from HP's "external-service / DB error never leaks raw": a raw `std::io::Error` string ("No such file or directory (os error 2)") is meaningless to a user and can expose absolute paths. The React side already defends this — `detailFor` in `app-error.ts` falls back to `"Something went wrong"` / `"selected folder"` when `params` is empty (CLAUDE.md "Fallback values"). Point at that helper rather than inventing toast strings at the call site.

There is **no DB and no tenancy in MS** — HP's database-error-leak, soft-delete, deactivation-guard, and `ValidationPipe` sections do not port. The single surviving rule is the one above: don't echo raw OS / I/O strings into user-facing copy.

---

## `unwrap()` / `expect()` — test-only by default

| Context | Rule |
|---|---|
| `#[cfg(test)]` blocks | `unwrap()` / `expect("…")` are expected — a failed unwrap is a failed test |
| Happy path in `src/` (non-test) | Forbidden — return an `AppError` variant instead |
| Genuinely unreachable non-test case | Allowed only with a justifying comment explaining why it cannot fail (PR checklist: "use one only with a comment explaining why") |

This matches the codebase today: every `unwrap()` / `expect()` in `src-tauri/src/` lives inside a test module. A new one outside a test is a review blocker unless it carries the justifying comment.

---

## Every Result-handling path needs a recovery test

> **Every new `catch` block needs an error-recovery test in the same PR.** (HP, ported verbatim.)

Rust reading: every `Err` arm, every `.map_err(...)`, every `?`-driven `From` conversion, and every `spawn_blocking` join-error path is the MS analogue of a `catch`. Each new one needs an error-recovery test in the same PR — a test that drives the failing input and asserts the specific variant:

```rust
assert!(matches!(result, Err(AppError::Validation { .. })));
```

Writing the test forces you to enumerate the exit paths and pick a severity per branch. Without it, the error arm is silent code — and silent code is where every silent-failure regression comes from. This is not extra scope: CLAUDE.md's testing philosophy explicitly lists error paths ("corrupted files, missing metadata") as critical logic to test, so the recovery test is exactly what the ~60–70% target already asks for.

---

## Audit every exit path

> **Audit every exit path — silent timeouts re-create anti-patterns.** (HP, ported verbatim.)

When fixing a known anti-pattern (e.g. "don't swallow an error"), audit EVERY exit path of the affected function — in Rust that means every `?`, every `match` / `if let` arm, every early `return`, and the `JoinError` exit on a `spawn_blocking`. A `.await` that fails after the work succeeded does the exact thing you removed from the `Err` arm — and it does it quieter, so the next reviewer assumes the bug is gone. The `.map_err(AppError::internal)?` on every command is there precisely because that join is a separate, easy-to-forget exit.

---

## Logging — severity matches recoverability

media-sorter has **no `log` / `tracing` crate today**; the current convention is a prefixed `eprintln!`, e.g. the history GC in `lib.rs`:

```rust
match history::gc::run(&app) {
    Ok(count) => eprintln!("[history] gc removed {count} expired job(s)"),
    Err(err) => eprintln!("[history] gc failed: {err}"),
}
```

Do NOT introduce a logging dependency to satisfy this section — that would be speculative scope (Articles III / IV). Apply the **principle** with the tools present:

- **Graceful recovery stays quiet.** If an `Err` arm returns a default, skips one file in a batch, or otherwise recovers and the downstream is fine, it does not deserve a loud failure line. This is HP's single biggest source of false alerts — a loud log on a branch that recovered.
- **Only escalating paths are loud.** A branch that rethrows (`?`), aborts the job, or surfaces to the user is the one that gets the prominent `[module] failed: …` line.
- **Never log sensitive or noisy detail.** No raw absolute user paths dumped at volume, no secrets. The `[module]` prefix is the convention; keep it.

When a real logging crate is adopted (a separate decision — see flag below), the `debug` / `warn` / `error` severities map onto: diagnostic context → quiet recovery → escalation, in that order. Encode the principle now; do not prescribe the API.

---

## Common mistakes

| Mistake | Fix |
|---|---|
| `panic!` / `.unwrap()` / `.expect()` on the happy path | Return an `AppError` variant; reserve `unwrap`/`expect` for `#[cfg(test)]` |
| New `AppError` variant added only in `error.rs` | Mirror it in `src/types/ipc.ts` (`AppErrorCode` + `AppErrorDto`) and `src/utils/app-error.ts` (`TITLES` + `detailFor`) in the same change |
| Inventing a sixth variant for a case the five cover | Reuse the variant whose UI signal fits; new variants are a three-file change, justified only when none fits |
| Raw `std::io::Error` string forwarded into a toast | Map to a variant; keep raw text in `params.message`; let `detailFor` apply the fallback |
| `.map_err(AppError::internal)?` dropped from a command | Keep it — the `JoinError` is a distinct exit path from the work it wraps |
| Loud failure log on a branch that gracefully recovered | Quiet on recovery; loud only when the path escalates (rethrow / abort / surface) |
| New `Err` arm / `.map_err` with no recovery test | Add the test in the same PR; assert the variant with `matches!(…, Err(AppError::X { .. }))` |
| Adding a `log` / `tracing` dependency "to do logging properly" | Out of scope — use the existing `eprintln!("[module] …")` convention until a logger is a deliberate decision |

---

## Cross-references

- [crud-creation](../crud-creation/SKILL.md) — the vertical-slice recipe; its `service.rs` → `command.rs` steps return `AppResult<T>` and follow these rules
- `src-tauri/src/error.rs` — the `AppError` enum and its constructors; canonical source for the variant set
- `src/types/ipc.ts` — `AppErrorCode` + `AppErrorDto`; the React mirror of the enum
- `src/utils/app-error.ts` — `isAppErrorDto` / `toAppErrorView` / `TITLES` / `detailFor`; where a new variant's title and fallback live
- `.claude/CLAUDE.md` — the Error Handling table (Situation → Semantic → UI signal) these variants implement
- `docs/CONSTITUTION.md` — Article I (reversibility — a failed op must not leave user files in a half-moved state) and Article II (privacy — no raw paths leaked beyond the local toast)

---

## Final checklist

- [ ] Service and command return `AppResult<T>`; no `panic!` on the happy path
- [ ] The variant chosen matches the intended UI signal (Io / Validation / Forbidden / Conflict / Internal)
- [ ] A new or changed variant is mirrored in all three files (`error.rs`, `ipc.ts`, `app-error.ts`) in the same change
- [ ] `#[tauri::command]` keeps its `.map_err(AppError::internal)?` on the `spawn_blocking` join
- [ ] No `.unwrap()` / `.expect()` outside `#[cfg(test)]` without a justifying comment
- [ ] Raw OS / I/O strings do not reach user toasts — mapped to a variant, with a meaningful fallback
- [ ] Every new `Err` arm / `.map_err` / `?` conversion has an error-recovery test asserting the variant
- [ ] Every exit path audited — `?`, each `match` arm, early returns, and the `JoinError` on `spawn_blocking`
- [ ] Logging severity matches recoverability — quiet on graceful recovery, loud only on escalation
- [ ] No logging dependency introduced; existing `eprintln!("[module] …")` convention used
