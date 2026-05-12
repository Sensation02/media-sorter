# Background Execution: `/bg`

> When and how to use Claude Code's `/bg` (detached autonomous session)
> primitive, and the safety constraints it must respect on this project.
> Part of the workflow documentation suite. See also: `orchestration.md`,
> `delivery.md`, `implementation.md`.

---

## Purpose

Claude Code exposes a primitive that affects how a session runs:

- **`/bg`** (alias `/background`) — detaches the current session from the
  terminal so it continues without an attached human. The user is notified when
  work pauses or finishes.

It is useful on this project, but it shifts human-in-the-loop oversight and
therefore interacts directly with the Constitution. Article I (user files are
sacred) and Article VI (reversibility extends to code, manual merge only) limit
what may run unattended. This document codifies those limits.

---

## `/bg` — Detached autonomous sessions

`/bg` is appropriate when the next stretch of work is mechanical, additive, and
free of irreversible side effects. It is **not** a shortcut for skipping
review.

### Allowed in `/bg`

- Strategy D parallel teams **after** the IPC contract (Tauri command
  signatures, DTO shapes) is locked and visible in code or spec.
- Self-improvement loop on a large changeset — re-reading files, fixing typos,
  consolidating imports, drafting `docs/workflow/anti-patterns.md` entries.
- Discovery research — reading external documentation, drafting
  `docs/discoveries/*.md`, building summary tables.
- Long sequential implementations whose steps are purely additive: new files
  under `src/` or `src-tauri/src/`, new tests, new specs.
- Drafting CHANGELOG entries and PR description bodies in scratch files for
  later human review.

### Forbidden in `/bg`

The following actions MUST stop the session and wait for an attached human,
even if a sub-agent believes they are ready:

- Any write outside the repository, in particular into user photo / video
  folders. **Article I, no exceptions.**
- `git push`, `gh pr create`, `gh pr merge`, `gh pr review --approve`, or any
  command that publishes to a remote. **Article VI; CLAUDE.md "merge is always
  manual".**
- `pnpm tauri dev` or any UI smoke test — the project's system prompt requires
  human eyes on the webview for UI changes.
- Edits to `tauri.conf.json`, `capabilities/*.json`, or Tauri permission
  manifests — capability changes affect what the app may do on a user's
  machine.
- Dependency upgrades (`pnpm add/up`, `cargo add/update`, lockfile changes)
  beyond what an in-scope spec already lists — a real build on a real machine
  is required.
- Status transitions in `docs/specs/STATUS.md` or per-epic `Status:` fields —
  these belong in the PR that finishes the work, by a human.

### Stop conditions inside `/bg`

A backgrounded session MUST stop and await the human when it encounters:

- A failing verification gate (`cargo clippy`, `cargo test`, `pnpm lint`,
  `pnpm tauri build`).
- A merge conflict, rebase prompt, or `git push --force-with-lease` situation.
- An anti-pattern match from `pattern-guard` that requires judgement (not a
  mechanical rename).
- A scope question — anything that would expand the work beyond the plan or
  the active PR / spec scope.

---

## Pre-`/bg` checklist

Before invoking `/bg`, all of the following MUST be true. Treat this list the
same way as the PR Checklist in CLAUDE.md — missing items are a defect.

- [ ] A plan exists (`docs/specs/...`, implementation plan, or strategy block
      in the conversation) with PR split if the work is multi-PR.
- [ ] Sub-agent prompts include an explicit "STOP before push / `gh pr` /
      merge / capability change; wait for human" line.
- [ ] Verification commands are known and runnable headlessly: `cargo clippy
    --all-targets -- -D warnings`, `cargo test`, `pnpm lint`, `pnpm tauri
    build` (or the documented subset for the slice in question).
- [ ] Filesystem scope is bounded to the repository or `.artifacts/`. No
      command in the plan writes to user media.
- [ ] If the work touches an IPC contract, DTOs are aligned on both sides
      (`src-tauri/src/<feature>/dto.rs` and `src/types/` or
      `src/features/<feature>/`).
- [ ] If the work crosses an epic status boundary, the human is the one who
      will flip `Status:` and `STATUS.md` — not the backgrounded agent.

---

## Failure modes

These are workflow-level failures, distinct from code anti-patterns in
`anti-patterns.md`. Same structure: Problem / Why it's bad / Fix.

- **FM-1: Background push or PR creation**
- **Problem:** A backgrounded session runs `git push` or `gh pr create` without
  an attached human.
- **Why it's bad:** Violates Article VI (manual merge only) and removes the
  human review step from the delivery flow defined in `delivery.md`.
- **Fix:** Always end the backgrounded plan at "branch ready, commits staged,
  verification green". The human attaches, reviews, and executes the push and
  PR.

- **FM-2: `/bg` outside the repo**
- **Problem:** A backgrounded self-improvement or research session decides to
  "tidy up" user media folders, caches, or unrelated directories.
- **Why it's bad:** Direct Article I violation. Even read-only walks of user
  media folders raise privacy concerns under Article II.
- **Fix:** Constrain plans to repository paths only. Anything that needs to
  exercise user media runs attended, with an explicit human confirmation and a
  reversible operation per Article I.

- **FM-3: Skipping the Quality Gate**
- **Problem:** A backgrounded session marks work "done" without running the
  verification commands listed in the Pre-`/bg` checklist, on the assumption
  the human will run them later.
- **Why it's bad:** Cycles back-and-forth between attached and detached states,
  loses the time `/bg` was supposed to save, and hides real lint / test
  failures inside the agent's own report.
- **Fix:** The Quality Gate is part of the plan's definition of done, not a
  follow-up. Verification commands run inside the backgrounded session; if any
  fail, the session stops and waits.

---

## Quick reference

| Action                          | Allowed under `/bg`? | Reason                         |
| ------------------------------- | -------------------- | ------------------------------ |
| Write new files in repo         | Yes                  | Reversible, in scope           |
| Edit `src/` / `src-tauri/src/`  | Yes, additive only   | Watch for irreversible deletes |
| Run `cargo clippy` / `test`     | Yes                  | Verification gate              |
| Run `pnpm lint` / `tauri build` | Yes                  | Verification gate              |
| Run `pnpm tauri dev`            | No                   | UI needs human eyes            |
| `git commit` on feature branch  | Yes                  | Local, reversible              |
| `git push` / `gh pr create`     | No                   | Article VI                     |
| `gh pr merge`                   | No                   | CLAUDE.md: merge is manual     |
| Edit `tauri.conf.json`          | No                   | Capability change              |
| Write into user media paths     | No                   | Article I                      |
| Update `STATUS.md`              | No                   | Crosses status boundary        |
