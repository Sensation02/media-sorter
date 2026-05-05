## Summary

<!-- 1-3 bullet points describing what this PR does and why -->

-

## Changes

<!-- List key files/areas changed (UI components, Tauri commands, Rust modules, etc.) -->

-

## Test Plan

<!-- How to verify this works — manual steps + which automated checks ran -->

- [ ]

## Checklist

- [ ] Types complete — no `any` in TS, no raw `unwrap()`/`expect()` без обґрунтування в Rust
- [ ] Error handling — no unhandled promises / silent catches; Rust returns `Result<T, AppError>`
- [ ] Unit tests added — for new critical business logic (Rust `#[cfg(test)]` або UI tests)
- [ ] Lint passes — `pnpm lint` + `cargo clippy --all-targets -- -D warnings`
- [ ] Build passes — `pnpm tauri build` локально на хоча б одній платформі (для значних змін)
- [ ] User-file safety — будь-які операції з фото/відео користувача мають бути зворотними (dry-run, undo, або лог)
- [ ] Docs updated — if Tauri IPC contract changed, оновлено типи на обох сторонах
- [ ] CHANGELOG.md updated — додано user-friendly bullet під `## [Unreleased]` (обов'язково для `feat`/`fix`/`perf`/`revert`; не потрібно для `refactor`/`docs`/`style`/`test`/`build`/`ci`/`chore`)
