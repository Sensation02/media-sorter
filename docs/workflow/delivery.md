# Delivery: Phases 4–5

> Splitting code into atomic commits and PRs, review, false positive detection, and reporting.
> Part of the workflow documentation suite. See also: `orchestration.md`, `implementation.md`.

---

## Phase 4: DELIVER (PRs)

**Goal:** Split completed work into atomic commits and PRs.

This phase is **mandatory**. All work must be delivered as PRs — never left as uncommitted changes.

### Develop-then-Split Model

All development happens in the working directory first (Phases 1–3). Only after code is complete and verified does the Orchestrator split it into branches, atomic commits, and PRs.

```
Development (Phases 1–3):
  All code written in working directory → verified → self-improved

Delivery (Phase 4):
  Working code → split into PRs → atomic commits per PR → review → push
```

**Never** create branches or commit mid-development. Code first, deliver second.

### Atomic Commits

Every PR MUST contain multiple atomic commits — never push all changes in one commit. Each commit represents one logical step:

```
Good (4 commits in one PR):
  feat(core): add ExifData domain type
  feat(exif): add EXIF parser with chrono date handling
  feat(tauri): expose extract_exif command
  feat(ui): add ExifPanel that consumes extract_exif

Bad (1 commit in one PR):
  feat(exif): EXIF extraction
```

**Commit granularity rules:**
- One Rust type/struct definition = one commit
- One Tauri command = one commit (with its parser/service if small; separately if large)
- One UI component group = one commit
- Tests can be a separate commit or grouped with the code they test
- Fixes found during self-improvement loop = separate commit(s)

### Delivery Flow: Single PR

```
1. Create feature branch from staging
     git checkout -b feat/<scope>-<short-description> staging

2. Stage files by logical group and commit atomically
     git add <logical-group-1-files>
     git commit -m "type(scope): first logical step"
     git add <logical-group-2-files>
     git commit -m "type(scope): second logical step"
     ... repeat for each logical group

3. Run Pattern Guard (anti-pattern scan) — BEFORE PR review
     Dispatch .claude/agents/pattern-guard.md with changed file list
     Fix any AP-XXX matches before proceeding

4. Run multi-agent code review
     /pr-review-toolkit:review-pr (or equivalent)

5. Triage findings (see False Positive Detection below)

6. Fix accepted findings, commit fixes separately
     git commit -m "fix(scope): address review finding"

7. Re-review if critical findings were found

8. Lint + tests MUST pass
     pnpm lint && cd src-tauri && cargo clippy --all-targets -- -D warnings && cargo test && cd .. && pnpm test

9. Push and open PR
     git push -u origin <branch>
     gh pr create --title "..." --body "..."

10. Apply PR labels (see "Labels" section)
11. Verify PR description matches actual content (see "PR Description Accuracy")
```

### Delivery Flow: Multiple PRs

When the plan defines multiple PRs, deliver each independently:

```
For each PR defined in the plan:
  1. git checkout -b feat/<scope>-<short> staging
  2. Stage ONLY files scoped to this PR, commit atomically (multiple commits)
  3. Run Pattern Guard — dispatch .claude/agents/pattern-guard.md, fix AP-XXX matches
  4. Multi-agent review
  5. Triage findings
  6. Fix accepted findings, commit fixes separately
  7. Lint + tests MUST pass
  8. git push -u origin <branch> + gh pr create
  9. Apply PR labels
  10. Verify PR description matches actual content
  11. git checkout staging — repeat for next PR
```

**Multi-PR rules:**
- Each PR MUST build independently (`pnpm build` and `cd src-tauri && cargo build`)
- PRs MUST NOT break each other — no import dependencies across PR boundaries
- Each PR gets its own branch (e.g., `feat/exif-parser`, `feat/exif-ui-panel`)
- PR base branch: `staging` (unless hotfix → `production`)
- Deliver PRs in the order defined in the plan
- If PR #2 depends on PR #1 at runtime but not at build time — note it in PR description

### Review-then-Fix Loop

```
1. Pattern Guard scan               — fix AP-XXX matches first
2. Multi-agent code review
3. Triage findings                  — classify each: fix / ignore / false positive
4. Apply fixes, commit separately   — each fix = its own commit
5. Re-review (if critical findings) — verify critical issues are resolved
6. Lint + tests MUST pass
```

**Re-review rule:** If the initial review found **critical** findings, re-run after fixes. For suggestion-level findings, re-review is optional.

### False Positive Detection

Review tools can produce false positives — findings that look like issues but are actually correct code. Blindly applying every suggestion wastes time and can introduce real bugs.

**Triage every finding before acting:**

| Classification | Action | Example |
|----------------|--------|---------|
| **Real issue** | Fix immediately, commit separately | Missing `?` operator, wrong type, real null hazard |
| **False positive** | Ignore, document pattern in memory | Flagging an intentional `unwrap()` with adjacent invariant comment |
| **Style preference** | Ignore unless it violates CLAUDE.md | Reviewer prefers different naming |
| **Outdated rule** | Ignore, update rule if recurring | Rule conflicts with newer project convention |

**How to detect false positives:**
1. Read the flagged code in context — does the "fix" actually improve correctness?
2. Check if the finding contradicts an existing project convention (CLAUDE.md, specs)
3. Verify the finding against the actual runtime behavior, not just static analysis
4. If the same false positive recurs — document it in memory to skip faster next time

**Never** apply a review finding without understanding it. When in doubt, ask the user.

### PR Dependency Management

When multiple PRs have import dependencies between them:

1. **Before creating a PR** — verify all imports / `use` paths resolve against `staging` (not another feature branch)
2. **Merge order matters** — merge dependency PRs first
3. **After merging a dependency** — rebase child branches onto updated `staging`
4. **Cross-PR imports are a red flag** — if PR #2 needs code from PR #1 at build time, they must be merged in order

```
Example: PR #12 imports a hook from PR #10
  → Merge #10 first
  → git checkout feat/PR-12-branch && git rebase staging
  → git push --force-with-lease
  → Wait for CI green, then merge #12
```

---

## CI/CD Readiness Check

After push, verify CI passes before merge:

```
1. gh pr checks <PR-number>         — check CI status
2. If failed → diagnose, fix, push  — never merge with red CI
3. Merge only after green CI AND explicit user command/manual action
```

**Rules:**
- Merge is NEVER automatic — always manual or by explicit user command
- If CI fails due to missing imports from another PR → merge dependency PR first, rebase, re-push
- After squash-merge of a dependency PR → `git rebase staging` on child branch (duplicate commits auto-drop)

---

## Labels

Apply PR labels based on content:

| Label | When to apply | Notes |
|-------|---------------|-------|
| _(none)_ | Default — code changes that need verification | Walk the affected flow in `pnpm tauri dev` before merge |
| `skip-testing` | Docs-only, config, CI, non-functional | Can merge after green CI without manual UX verification |
| `cross-platform-check` | Touches FS, OS dialogs, paths, or Tauri capabilities | Verify on macOS + at least one of Windows/Linux before merge |

### What qualifies for `skip-testing`

- Documentation changes (`docs/`, `*.md`, `.claude/`)
- CI/CD workflow changes (`.github/workflows/`)
- Linter/formatter config (`.eslintrc`, `.prettierrc`, `rustfmt.toml`, `clippy.toml`)
- Dev tooling config (`.vscode/`, `Makefile`)

### What does NOT qualify

- Any change to `src/` or `src-tauri/src/` — always needs testing
- `tauri.conf.json` / `capabilities/*.json` — always needs testing
- Package dependency changes (`package.json`, `Cargo.toml`, lockfiles) — always needs testing

---

## PR Description Accuracy

The PR description must always reflect the **actual content** of the PR. This is a continuous obligation, not a one-time task.

### Rules

1. **Verify on creation** — before opening a PR, review all commits and files to write an accurate summary
2. **Update on change** — when commits are added to an existing PR, update the description to match
3. **Match the original task** — the summary should trace back to the task or issue that initiated the work
4. **Reflect scope changes** — if the PR grew beyond the original task, the description must reflect the full scope

### When to update

| Trigger | Action |
|---------|--------|
| New commits pushed to PR branch | Review if description still covers all changes |
| User requests additional work on the PR | Update description after pushing the changes |
| Review findings fixed | No update needed (fixes are expected) |
| PR scope expanded beyond original task | Update summary and test plan |

### How to verify

Before marking a PR as ready or requesting merge:
1. `gh pr view <number> --json commits,files` — list all commits and changed files
2. Compare against the PR description — every significant change should be mentioned
3. `gh pr edit <number> --body "..."` — update if mismatched

---

## Phase 5: REPORT (Orchestrator)

Orchestrator summarizes:

1. Briefly describe what was done
2. List created/modified files
3. List PRs created (with URLs)
4. Note anything requiring attention or further work
