---
name: background-execution
description: Use when considering whether to run the next stretch of work under `/bg` (Claude Code's detached autonomous session) or when deciding whether an action mid-session crosses the human-in-the-loop line. Triggers when work is about to be backgrounded — Strategy C/D parallel teams after the IPC contract is locked, self-improvement loops on large changesets, discovery research, long additive implementations — and as the stop-condition reference for any agent dispatched into a backgrounded plan. The green gate this skill enforces is `make check` + `make fmt-check`.
---

# Background Execution (`/bg`)

## Overview

Claude Code exposes `/bg` (alias `/background`) — a primitive that detaches the
current session from the terminal so it continues without an attached human. The
user is notified when work pauses or finishes. This skill codifies what is safe
to do under `/bg` on media-sorter, and the stop conditions that bring the human
back into the loop.

**Core principle:** `/bg` is appropriate when the next stretch of work is
mechanical, additive, and free of irreversible side effects. It is NOT a
shortcut for skipping review. Article I (user files are sacred) and Article VI
(reversibility extends to code, manual merge only) are the laws that limit what
may run unattended — those limits are absolute, not advisory. Article II
(privacy by default) applies wherever a backgrounded plan would read or walk
user media.

The detailed prose version of these rules lives in
`docs/workflow/background-execution.md`. This skill is the operational
checklist an agent consults at the moment it is about to background work or
about to take a step that might cross the line.

## When to Use

Use when:

- Considering whether to invoke `/bg` for the next stretch of work
- An agent (or sub-agent prompt) is being designed to run inside `/bg` — to
  encode its stop conditions
- Reviewing whether an action the agent is about to take crosses the
  unattended-allowed line
- A backgrounded session is reporting "ready to push" — to verify it actually
  stopped at the right point

Do NOT use when:

- You're attached and just want the PR delivery checklist — that lives in
  [pr-delivery](../pr-delivery/SKILL.md)

---

## When `/bg` is appropriate

The next stretch of work is appropriate for `/bg` when ALL of the following
hold:

- The work is **additive**: new files, new tests, new docs. Refactors are OK
  only if they're mechanical (renames, import sorting) and pre-planned.
- There is **no human decision point** in the middle. If the plan contains
  "ask the user about X", `/bg` ends at the question.
- The **green gate runs headlessly**: `make check` (typecheck + lint +
  tests) and `make fmt-check` (prettier `--check` + `cargo fmt --check`).
  Anything requiring the webview (`pnpm tauri dev`) or a manual flow
  walkthrough is NOT headless.
- The work does NOT cross any of the limits in "Forbidden in `/bg`" below.

---

## Allowed in `/bg`

- Strategy C/D parallel teams **after** the IPC contract (Tauri command
  signatures, DTO shapes) is locked and visible in code or spec
- Self-improvement loop on a large changeset — re-reading files, fixing typos,
  consolidating imports, drafting `docs/workflow/anti-patterns.md` entries at
  AP-015+
- Discovery research — reading external documentation, drafting
  `docs/discoveries/*.md`, building summary tables
- Long sequential implementations whose steps are purely additive: new files
  under `src/` or `src-tauri/src/`, new tests, new specs
- Drafting CHANGELOG entries and PR description bodies in scratch files for
  later human review
- Generating ephemeral HTML artefacts in `.artifacts/` (see
  `docs/workflow/artifacts.md`)
- Running the green gate (`make check`, `make fmt-check`) and a production
  build (`pnpm tauri build`) — both are headless and reversible. Note the
  build is allowed but is **not** part of the green gate (it is slow and
  covered by the release pipeline); do not block a backgrounded plan on it.

---

## Forbidden in `/bg`

The following MUST stop the session and wait for an attached human — even if a
sub-agent believes it is ready.

- Any write outside the repository, in particular into user photo / video
  folders. **Article I, no exceptions.**
- `git push`, `gh pr create`, `gh pr merge`, `gh pr review --approve`, or any
  command that publishes to a remote. **Article VI; CLAUDE.md "merge is always
  manual".**
- `pnpm tauri dev` or any UI smoke test — the project requires human eyes on
  the webview for UI changes.
- Edits to `tauri.conf.json`, `capabilities/*.json`, or Tauri permission
  manifests (`fs:allow-*`, `dialog:open`) — capability changes affect what the
  app may do on a user's machine.
- Dependency upgrades (`pnpm add` / `pnpm up`, `cargo add` / `cargo update`,
  lockfile changes) beyond what an in-scope spec already lists — a real build
  on a real machine is required.
- Status transitions in `docs/specs/STATUS.md` or per-epic `Status:` fields —
  these belong in the PR that finishes the work, by a human.

---

## Stop conditions

A backgrounded session MUST stop and wait when it encounters:

- A failing green gate — `make check` or `make fmt-check` returns non-zero
- A merge conflict, rebase prompt, or `git push --force-with-lease` situation
- A pattern-guard match that requires judgement, not a mechanical rename (see
  [pattern-guard-scan](../pattern-guard-scan/SKILL.md))
- A scope question — anything that would expand the work beyond the plan or the
  active PR / spec scope
- A finding that can only be resolved by an irreversible filesystem operation
  on user media — Article I forbids "fixing" it by moving or rewriting a user
  file unattended

When a stop fires, the agent ends its plan at "branch ready, commits staged,
green gate passing" (or whatever the last safe point was) and reports the
situation for the human to resolve.

---

## Pre-`/bg` checklist

Before invoking `/bg`, ALL of the following MUST be true. Missing items are a
defect — treat this like the PR Checklist in CLAUDE.md.

- [ ] A plan exists (in `docs/specs/...`, an implementation plan, or a strategy
      block in the conversation) with PR split if the work is multi-PR
- [ ] Sub-agent prompts include an explicit "STOP before `git push` / `gh pr` /
      merge / capability change; wait for human" line
- [ ] The green gate is known and runnable headlessly: `make check` (typecheck
      + lint + tests; `lint` already runs `cargo clippy -D warnings`) and
      `make fmt-check` (prettier `--check` + `cargo fmt --check`). A UI
      dev-server smoke test (`pnpm tauri dev`) is NOT headless.
- [ ] Filesystem scope is bounded to the repository or `.artifacts/`. No
      command in the plan writes to user media.
- [ ] If the work touches an IPC contract, DTOs are aligned on both sides
      (`src-tauri/src/<feature>/dto.rs` and `src/types/` or
      `src/features/<feature>/`)
- [ ] If the work crosses an epic status boundary, the human is the one who
      will flip `Status:` and `STATUS.md` — not the backgrounded agent

---

## Failure modes

Distinct from code anti-patterns in `docs/workflow/anti-patterns.md` — these are
workflow-level failures. Same structure: Problem / Why it's bad / Fix.

### FM-1 — Background push or PR creation

- **Problem:** A backgrounded session runs `git push` or `gh pr create` without
  an attached human.
- **Why it's bad:** Violates Article VI (manual merge only) and removes the
  human review step from the delivery flow defined in
  [pr-delivery](../pr-delivery/SKILL.md).
- **Fix:** End the backgrounded plan at "branch ready, commits staged, green
  gate passing". The human attaches, reviews, and executes push + PR.

### FM-2 — `/bg` outside the repository

- **Problem:** A backgrounded self-improvement or research session decides to
  "tidy up" user media folders, caches, or unrelated directories.
- **Why it's bad:** Direct Article I violation. Even a read-only walk of user
  media folders raises privacy concerns under Article II.
- **Fix:** Constrain plans to repository paths only. Anything that needs to
  exercise user media runs attended, with an explicit human confirmation and a
  reversible operation per Article I.

### FM-3 — Skipping the green gate

- **Problem:** A backgrounded session marks work "done" without running
  `make check` + `make fmt-check`, assuming the human will run them later.
- **Why it's bad:** Wastes the time `/bg` saved and hides real lint / test /
  format failures inside the agent's own report.
- **Fix:** The green gate is part of the plan's definition of done, not a
  follow-up. The gate runs inside the backgrounded session; if it fails, the
  session stops and waits.

---

## Quick reference

| Action                              | Allowed under `/bg`? | Reason                          |
| ----------------------------------- | -------------------- | ------------------------------- |
| Write new files in repo             | Yes                  | Reversible, in scope            |
| Edit `src/` / `src-tauri/src/`      | Yes, additive only   | Watch for irreversible deletes  |
| Run `make check` / `make fmt-check` | Yes                  | The green gate                  |
| Run `pnpm tauri build`              | Yes                  | Headless, reversible — not the gate |
| Run `pnpm tauri dev` (smoke)        | No                   | UI needs human eyes             |
| `git commit` on feature branch      | Yes                  | Local, reversible               |
| `git push` / `gh pr create`         | No                   | Article VI                      |
| `gh pr merge`                       | No                   | Merge is manual                 |
| Edit `tauri.conf.json` / `capabilities/*.json` | No        | Capability change               |
| `pnpm add` / `cargo add` / lockfile change | No            | Needs a real build to verify    |
| Write into user media paths         | No                   | Article I                       |
| Update `STATUS.md` / epic `Status:` | No                   | Crosses status boundary         |
| Generate HTML in `.artifacts/`      | Yes                  | Ephemeral, gitignored           |

---

## Cross-references

- `docs/workflow/background-execution.md` — the prose version of these rules
- [pr-delivery](../pr-delivery/SKILL.md) — the steps `/bg` defers to the
  attached human (push, PR creation, merge)
- [pattern-guard-scan](../pattern-guard-scan/SKILL.md) — judgement-call matches
  stop `/bg`; mechanical matches do not
- [false-positive-triage](../false-positive-triage/SKILL.md) — classifying
  reviewer / pattern-guard findings before acting on them
- `docs/CONSTITUTION.md` — Articles I, II, VI; the laws this skill enforces
