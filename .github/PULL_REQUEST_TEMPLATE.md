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

- [ ] Types complete — no `any` in TS, no raw `unwrap()`/`expect()` without justification in Rust
- [ ] Error handling — no unhandled promises / silent catches; Rust returns `Result<T, AppError>`
- [ ] Unit tests added — for new critical business logic (Rust `#[cfg(test)]` or UI tests)
- [ ] Lint passes — `pnpm lint` + `cargo clippy --all-targets -- -D warnings`
- [ ] Build passes — `pnpm tauri build` locally on at least one platform (for significant changes)
- [ ] User-file safety — any operations on user photos/videos must be reversible (dry-run, undo, or log)
- [ ] Docs updated — if the Tauri IPC contract changed, types updated on both sides
- [ ] CHANGELOG.md updated — added a user-friendly bullet under `## [Unreleased]` (required for `feat`/`fix`/`perf`/`revert`; not required for `refactor`/`docs`/`style`/`test`/`build`/`ci`/`chore`)
