# Constitution

**Version:** 1.0.0
**Status:** Ratified
**Amendment policy:** Immutable in spirit. Edits to wording allowed; changes to the meaning of a principle require a `chore(constitution): bump to vX.Y.Z` PR with rationale and a CHANGELOG entry under `### Governance`.

---

The supreme law of media-sorter. When other documents (CLAUDE.md, workflow docs, specs) conflict with this file, the Constitution wins. Everything below is binding regardless of feature, branch, or agent.

---

## Article I — User files are sacred

Every operation on a user's photo or video MUST be reversible. No destructive write may occur without:

1. A move log persisted before the operation, and
2. A documented undo path (`revert_job` or equivalent), and
3. The original file remaining recoverable until the user explicitly confirms cleanup.

Deletion of user files is forbidden. The app moves; it never erases.

## Article II — Privacy by default

User media metadata (GPS, EXIF, file paths) MUST NOT leave the user's machine. Reverse geocoding, classification, and any future ML features run offline by default. Any feature that would transmit user data over the network requires explicit opt-in and a Constitutional amendment.

## Article III — Simplicity over cleverness

KISS, DRY, SOLID — in that order. A working naive solution beats an elegant abstract one. Premature abstraction is a defect; three similar lines are not yet a pattern. New abstractions require a concrete second use case.

## Article IV — Scope discipline

A change does only what its spec asks. No drive-by refactors, no surprise dependencies, no "while I'm here" cleanup in the same PR. Out-of-scope work goes to a follow-up issue or a separate PR.

## Article V — Type safety is non-negotiable

No lazy escape hatches: no `any`, no untyped `unknown`, no `Box<dyn Any>` without a documented reason. External boundaries (filesystem, EXIF, IPC payloads) MUST validate input before it touches business logic. Errors propagate as `Result<T, AppError>` (Rust) or typed exceptions (TS) — never as silent fallbacks.

## Article VI — Reversibility extends to code

Every PR is atomic and revertable. No PR mixes unrelated changes. Manual merge only — no auto-merge, no force-push to `staging` or `production`.

## Article VII — Documentation is part of the deliverable

If a PR changes user-visible behavior, the CHANGELOG `[Unreleased]` section MUST be updated in the same PR. If a PR changes an IPC contract, the affected spec in `docs/specs/` MUST be updated in the same PR. Stale docs are bugs.

## Article VIII — Learning is a first-class concern

The repository owner is learning Rust on this project. Rust changes in `src-tauri/` MUST include short, focused explanations of new syntax, ownership decisions, and macro behavior, per the rules in `CLAUDE.md` § Session Context. Skipping these explanations is a regression in the deliverable.

## Article IX — Tests guard the critical path

Unit tests are required for: EXIF/metadata parsing, date/location extraction, sorting strategies, conflict resolution, and reversibility invariants. Tests are NOT required for trivial CRUD, DTOs, or framework wiring. The target is ~60–70% coverage of business logic — not a global percentage.

## Article X — Specs precede code for non-trivial work

Any change beyond a Strategy A (single-orchestrator) task MUST have a spec in `docs/specs/` with at least: Goal, Clarifications, Scope, Decisions, Out of scope. The spec is the contract; the code is the implementation. Specs are immutable once approved — corrections happen in a new dated revision, not by overwriting history.

---

## Precedence

1. Constitution (this file)
2. `CLAUDE.md` (operational rules)
3. `docs/workflow/*.md` (process)
4. `docs/specs/*.md` (per-feature contracts)
5. Code

Lower documents may add detail. They MUST NOT contradict a higher one. If a contradiction is discovered, fix the lower document or amend the Constitution — never silently diverge.
