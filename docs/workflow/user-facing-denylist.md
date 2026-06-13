# User-Facing Denylist

> Governance artifact (human-maintained). The leak gate (`.claude/hooks/leak-scan.sh`)
> scans user-facing surfaces — in-app UI strings (toasts, notifications, error copy),
> `src/locales/**` translation bundles (`en`, `uk`), `CHANGELOG.md`, release notes /
> "What's new", and `feat` / `fix` commit headlines — for the terms below. These are
> developer-internal words that must never reach a user. The **deterministic scan is the
> binding verdict**; an LLM critic, if run, is **advisory only**. Terms are the
> backtick-quoted tokens in each section. **Adding or removing a term is a separate
> governance PR** — never edited inline as a side effect of a feature change.
>
> This gate defends Article II (Privacy by default): raw error signatures and internal
> jargon can carry absolute file paths, EXIF/GPS metadata, or machine details, so keeping
> them out of user-facing copy is a privacy boundary, not only a polish concern. User-facing
> commit headlines feed release notes, so the same rule applies to `feat` / `fix` subjects.

## Internal domain terms

`IPC` `Tauri command` `#[tauri::command]` `undo-log` `move-log` `move plan` `dry-run`

## Stack / architecture

`Rust` `Tauri` `Vite` `clippy` `cargo` `pnpm` `React` `EXIF` `GPS`

## Raw-error signatures

`thiserror` `panic` `panicked` `unwrap` `.unwrap()` `AppError` `stderr`
