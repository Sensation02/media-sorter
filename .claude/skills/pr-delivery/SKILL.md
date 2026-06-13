---
name: pr-delivery
description: Use when finishing a feature, bugfix, or refactor and converting verified working-directory changes into a PR. Triggers when work is verified locally and ready to ship — splitting into atomic commits, running the pattern-guard scan, dispatching the native reviewer agent, triaging findings, running the green gate, pushing the branch, and opening the PR. Defaults to a single cohesive PR per epic; multi-PR is the exception. Also use when reviewing whether an in-flight PR's description still matches its commits.
---

# PR Delivery

## Overview

How verified code becomes a PR on media-sorter. The model is **develop-then-split**: all changes live in the working directory until verified, then get split into atomic commits in a single concentrated delivery pass. There is no "commit as you go" — commits are a delivery artifact, not a development one.

**Core principle:** a PR contains multiple atomic commits, each representing one logical step. A PR with a single mega-commit is a delivery defect, not a style preference.

**Default shape:** one cohesive PR per epic. media-sorter prefers shipping a feature epic as a single PR and merging fast once CI is green. Multi-PR is the exception, used only when the plan explicitly calls for it (e.g. a true build-time boundary). See [Single PR is the default](#single-pr-is-the-default).

## When to Use

Use when:
- A feature, bugfix, or refactor is implemented and verified in the working directory
- An open PR needs follow-up commits (review fixes, scope expansions)
- An in-flight PR's description needs to be checked against its actual content

Do NOT use when:
- Code is still in flux — finish implementation + the self-improvement loop first, then deliver

For a hotfix, the flow is identical except you branch from and target `production` instead of `staging`.

---

## Develop-then-split

```
Develop → Self-improve → Split → Commit → Pattern Guard → Review
  → Triage → Fix → Verify → Push → CI → Merge
```

```
Development: all code in working directory → verified → self-improved
       ↓
Delivery: working code → split into atomic commits → pattern-guard → review
          → triage → verify → push → PR
```

Never create branches or commit mid-development. Code first, deliver second. A premature commit on the wrong branch is a common rework signal.

---

## Single PR is the default

media-sorter ships a cohesive feature epic as **one PR** by default, and the owner merges fast once CI is green. Do not pre-emptively split a cohesive epic into a backend PR plus a frontend PR plus a docs PR — that fragments review and slows merge for no gain.

Choose multi-PR ONLY when:
- The plan in `docs/specs/epic-XX-*.md` explicitly defines a PR split, OR
- Two slices have a genuine build-time dependency that forces an ordered merge, OR
- The changeset is so large that a single diff is unreviewable

When none of these hold, deliver one PR with multiple atomic commits.

---

## Atomic commits — granularity rules

Each commit = one logical step the reader can understand without cross-referencing other commits.

```
Good (4 commits in one PR):
  feat(core): add MediaFile domain struct with capture-date value object
  feat(scanning): add scan DTOs and request envelope
  feat(scanning): add scan service with sandbox isolation
  feat(scanning): add scan command and module registration

Bad (1 commit in one PR):
  feat(scanning): add scanning
```

Granularity guidance:
- One domain type / struct definition = one commit
- One service / feature module = one commit
- One component group = one commit
- Tests can be a separate commit OR grouped with the code they test
- Fixes from the self-improvement loop = separate commit(s)
- Review findings = one commit per accepted finding (or per logical group)

Commit message format: `type(scope): description` — see CLAUDE.md > Git Conventions for types, functional scopes, and user-facing commit message rules.

---

## Delivery flow: single PR

```
1. Create the feature branch from staging
     git checkout -b feat/XXX-NNN-description staging

2. Stage files by logical group and commit atomically
     git add <logical-group-1-files>
     git commit -m "type(scope): first logical step"
     git add <logical-group-2-files>
     git commit -m "type(scope): second logical step"
     ... repeat per logical group

   IF the PR changes user-visible behavior AND the type is
   feat / fix / perf / revert: add the CHANGELOG [Unreleased] bullet in the
   SAME commit as the code change, in the matching section
   (### Features / ### Bug Fixes / ### Performance / ### Reverts).
   Developer-facing-only PRs add NO bullet even with a feat( ) prefix — the
   Constitution's Article VII trigger is user-visible behavior, not commit type.
   See CLAUDE.md > Git Conventions for the user-friendly wording rules.

3. Pattern-guard scan — BEFORE the review (see Pattern-guard scan below)
     Fix any AP-XXX matches before proceeding.

4. Reviewer dispatch (see Reviewer dispatch below)

5. Triage findings (see Triage every finding below)

6. Fix accepted findings, commit each separately
     git commit -m "fix(scope): address review finding"

7. Re-review if critical findings were found

8. Green gate (MUST pass before push)
     make check       # full pre-PR gate: typecheck + lint (clippy -D warnings) + tests
     make fmt-check    # prettier --check + cargo fmt --check

9. Push and open the PR
     git push -u origin <branch>
     gh pr create --base staging --title "..." --body "..."

10. Epic status sync (see Epic status sync below)

11. Verify the PR description matches the actual content (see PR description accuracy)
```

---

## Delivery flow: multiple PRs (the exception)

Use only when a multi-PR split is justified per [Single PR is the default](#single-pr-is-the-default). Deliver each PR independently from a fresh branch off `staging`:

```
For each PR defined in the plan:
  1. git checkout staging && git pull origin staging
  2. git checkout -b feat/XXX-NNN-description staging
  3. Stage ONLY files scoped to THIS PR, commit atomically (multiple commits)
  4. Pattern-guard scan → fix AP-XXX matches
  5. Reviewer dispatch → triage → fix → green gate
  6. Push + gh pr create
  7. Epic status sync if this PR crosses an epic boundary
  8. git checkout staging — repeat for the next PR
```

Multi-PR rules:
- Each PR MUST build independently — `make check` green from a fresh checkout (or `pnpm build` / `cargo build` for the touched workspace)
- PRs MUST NOT break each other — no import dependencies across PR boundaries
- Each PR gets its own branch — never reuse one branch for two PRs
- Base branch: `staging` (or `production` for a hotfix)
- Deliver PRs in the order defined in the plan
- If PR #2 depends on PR #1 at build time, they MUST merge in order — note it in the PR description and rebase the child onto updated `staging` after the dependency merges (`git push --force-with-lease`, never `--force`)

---

## Pattern-guard scan — mandatory step

Before the reviewer dispatch, scan the changed files against `docs/workflow/anti-patterns.md`. Run the [pattern-guard-scan](../pattern-guard-scan/SKILL.md) skill, which dispatches `.claude/agents/pattern-guard.md` with the changed file list and reports `[AP-XXX | Article Y] file:line` matches.

- AP-XXX matches MUST be fixed (or explicitly classified as a false positive) before the review runs
- After applying fixes, re-scan with the same file list — repeat until the matches list is empty
- Pattern guard reports; it never fixes code — fixing is the implementer's job

Dispatch shape (Agent tool):

```
description: Pattern-guard scan
prompt: |
  Read .claude/agents/pattern-guard.md and follow those role instructions.

  Files to scan:
  <one path per line, from `git diff --name-only staging...HEAD`>

  Report only [AP-XXX | Article Y] matches and the Clean list per the
  Output Format in the agent definition. Do not propose fixes.
```

---

## Reviewer dispatch

Dispatch the project-native reviewer — never a plugin review command. Use the Agent tool to run `.claude/agents/reviewer.md` with the changed file list. It reviews against CLAUDE.md rules and `docs/workflow/anti-patterns.md`, anchors findings to Constitution articles, and produces a structured Critical / Important / Suggestion / Positive list. It never modifies code.

Dispatch shape (Agent tool):

```
description: Reviewer pass
prompt: |
  Read .claude/agents/reviewer.md and follow those role instructions.

  Files to review:
  <one path per line, from `git diff --name-only staging...HEAD`>

  Produce the structured findings list per the agent definition.
  Do not modify code.
```

Re-review rule: if the review found **critical** findings, re-dispatch after the fixes are committed. Suggestion-level findings do not require a re-review.

---

## Triage every finding — never blindly apply

Review output contains false positives. Blindly applying every suggestion wastes time and can introduce real bugs. Classify each finding before touching code — see [false-positive-triage](../false-positive-triage/SKILL.md). The four classes:

| Class | Action |
|---|---|
| Real issue | Fix immediately, commit separately |
| False positive | Ignore; record the pattern in memory if it recurs |
| Style preference | Ignore unless it violates CLAUDE.md |
| Outdated rule | Ignore; update the rule if it recurs |

---

## Green gate

The green gate is `make check` + `make fmt-check`. Both MUST pass before push.

```
make check       # verify (typecheck + lint, clippy -D warnings) + tests — the full pre-PR gate
make fmt-check    # prettier --check + cargo fmt --check
```

Notes:
- `make verify` alone is the quick typecheck+lint tier and is NOT sufficient for a PR — it runs no tests. The PR gate is `make check`.
- `make fmt-check` is a separate target (kept symmetric across JS and Rust); run it alongside `make check`, do not assume `check` covers formatting.
- `tauri build` is intentionally NOT in the gate — it is slow and covered by the release pipeline.

---

## CI readiness

After push, confirm CI passes, then merge.

```
1. gh pr checks <PR-number>
2. If a check fails → diagnose, fix, push — never merge with red CI
3. Once CI is green, the owner merges fast (manual, via UI or explicit command)
```

Rules:
- Merge is NEVER automatic — always manual or by explicit user command
- Once CI is green, do not poll an UNKNOWN-state check or stall — the owner merges fast
- If CI fails due to a missing import from a dependency PR, merge the dependency first, rebase the child branch, re-push

---

## PR description body — required sections

The PR description is the artifact reviewers and future-you read to understand what shipped. Mirror the repo's `.github/PULL_REQUEST_TEMPLATE.md`. Every PR body MUST contain:

```markdown
## Summary

<1–3 sentences: what changed and why. Trace back to the task / issue.>

## What's new

<Bullet list of the user-visible or developer-visible changes — UI components,
Tauri commands, Rust modules. Mirror the commit messages but in prose.>

## Test Plan

- [ ] <checklist of what was verified — make check, make fmt-check, manual flows>

For PRs that move, rename, or rewrite user photos/videos: verify the
reversibility guarantees per Articles I & VI — dry-run previews the plan
without touching files, undo restores the prior state, the move-log records
every operation.

## Out of scope

<Anything intentionally NOT in this PR — to head off "why didn't you also
do X" review comments.>

Relates to #<issue-number>
```

Optional sections when relevant:
- **Breaking changes** — if an IPC contract changed, list the affected Tauri commands / DTOs and the upgrade path
- **Follow-ups** — issues to file after merge

Title rules:
- Under 70 characters
- Imperative mood (`Add scanning feature`, NOT `Added scanning feature`)
- `type(scope): description` to match commit conventions
- Use `Relates to #N` (the template default) for a staging-targeted PR

---

## PR description accuracy

The PR description MUST always reflect the actual content — a continuous obligation, not a one-time task.

1. **Verify on creation** — before opening, review all commits and files; write an accurate summary
2. **Update on change** — when commits are added (follow-up work, scope expansion), update the description
3. **Match the original task** — the summary traces back to the task that initiated the work
4. **Reflect scope changes** — if the PR grew beyond the original task, the description must reflect the FULL scope

| Trigger | Action |
|---|---|
| New commits pushed to the PR branch | Review if the description still covers all changes |
| User requests additional work on the PR | Update the description after pushing |
| Review findings fixed | No update needed — fixes are expected |
| PR scope expanded beyond the original task | Update Summary and Test Plan |

```bash
gh pr view <number> --json commits,files   # compare against the description
gh pr edit <number> --body "..."           # update if mismatched
```

---

## Epic status sync

media-sorter has no project board. The genuine analogue to moving a board card is the **epic status sync** required by CLAUDE.md > Git Workflow and the PR Checklist.

When a PR crosses an epic status boundary (`pending` → `in progress` → `complete`) or closes a subtask in `docs/specs/epic-XX-*.md`:
- Update the spec's `Status:` / `Last updated:` fields AND the matching row in `docs/specs/STATUS.md`
- Ship both updates in the SAME PR as the code change

Full procedure: `docs/workflow/delivery.md` > Epic Status Tracking.

A STATUS.md status transition is human-gated and forbidden under autonomous `/bg` — see [background-execution](../background-execution/SKILL.md).

---

## Report

After the PR is open, summarise:
1. What was done (one short paragraph)
2. Created / modified files
3. PR created, with URL
4. Anything requiring attention or follow-up work

---

## Common mistakes

| Mistake | Fix |
|---|---|
| One mega-commit per PR | Re-stage by logical group; commit each group separately |
| Pre-splitting a cohesive epic into many PRs | Default to one cohesive PR; multi-PR only when justified |
| Branches created mid-development | Stash, switch back to `staging`, re-plan; deliver only when verified |
| Using a plugin review command (`pr-review-toolkit:*`) | Always dispatch the native `.claude/agents/reviewer.md` |
| Merged with red CI | Never. Diagnose, fix, push. Manual merge after green only |
| Stalling after CI is green | Once green, the owner merges fast — do not poll UNKNOWN-state checks |
| PR description never updated after scope expansion | Update via `gh pr edit --body` |
| Applying every review finding without triage | Triage first; classify each as real / FP / style / outdated |
| Pattern-guard scan skipped | Always run BEFORE the review — fixes one anti-pattern class up front |
| Treating `make verify` as the PR gate | The PR gate is `make check` + `make fmt-check`; `verify` runs no tests |
| Epic spec / STATUS.md not synced in the PR | Update both in the same PR when crossing an epic boundary |
| `git push --force` on a shared branch | Use `--force-with-lease`, and only after a rebase on `staging` |

---

## Cross-references

- [pattern-guard-scan](../pattern-guard-scan/SKILL.md) — anti-pattern audit step inside this flow
- [false-positive-triage](../false-positive-triage/SKILL.md) — how to classify review findings
- [background-execution](../background-execution/SKILL.md) — which parts of this flow are allowed under `/bg`
- `docs/workflow/delivery.md` — Epic Status Tracking procedure
- `docs/workflow/anti-patterns.md` — the AP-XXX registry the pattern-guard scan reads
- `docs/workflow/implementation.md` — the develop / implement / self-improve phases before delivery
- `.claude/agents/reviewer.md` — the native reviewer agent dispatched here
- `.claude/agents/pattern-guard.md` — the native anti-pattern scanner

---

## Final checklist (per PR)

- [ ] Branch created from `staging` (not from another feature branch)
- [ ] Single cohesive PR unless the plan justifies a multi-PR split
- [ ] Changes split into atomic commits — each is one logical step
- [ ] Pattern-guard scan run, AP-XXX matches addressed
- [ ] Native `.claude/agents/reviewer.md` dispatched; findings triaged; fixes committed separately
- [ ] Critical findings → re-review run after fixes
- [ ] `make check` AND `make fmt-check` pass
- [ ] CI green (`gh pr checks <number>`)
- [ ] Base branch is `staging` (or `production` for a hotfix)
- [ ] PR title under 70 chars, imperative mood
- [ ] PR body has Summary / What's new / Test Plan / Out of scope; matches the actual commits and files
- [ ] CHANGELOG [Unreleased] bullet added only if the PR changes user-visible behavior (feat / fix / perf / revert)
- [ ] Epic spec `Status:` + `STATUS.md` row synced in the same PR if an epic boundary was crossed
- [ ] Merged only after green CI AND explicit user command
