# <Feature> — Run state

**Written at the end of Phase 11, after the draft PR is open. This is the last thing the run does.**

<!-- Everything durable the run produced is already a file: commits, the plan, the tests, the PR body.
     state.json holds where the machine is; this file records what it cannot — what each gate cleared,
     what was covered by hand, what was deferred, what a human still owes — so the next session starts
     cold instead of re-deriving it. Keep it short; it is an index, not a narrative. -->

**PR:** #<n> (draft) · **Branch:** <branch> → `staging` · **Spec:** <epic or none> · **Date:** YYYY-MM-DD

## Where it landed

- **Size-table row:** <1–5> — <reason> <!-- and if it moved mid-run: from row N at Phase X, because … -->
- **Attack rounds run:** <n> · **Phase-7 reviewer depth run:** Standard / Deep
- **Plan:** `docs/superpowers/loop/<feature>/plan.md`

## What the gates cleared

<!-- What each gate examined and found sound. A follow-up session must not re-derive this — and must
     re-open it if its own change touches that ground. -->

| Gate                            | Cleared                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `pattern-guard`                 | <files scanned; registry matches empty / resolved>          |
| `reviewer`                      | <files walked, at which depth>                              |
| `security-auditor`              | <capabilities / FS scope / IPC validation checked>          |
| coverage walk                   | <rows resolved; whether their tests ran under `make check`> |
| `make check` + `make fmt-check` | <green on commit `<sha>`>                                   |

## Covered by hand, not by a suite

<!-- Build from the plan's Manual-verification rows, not from recall. -->

| Row | Manual-verification step | Reproducible at all? |
| --- | ------------------------ | -------------------- |

## Deferred

| What                                         | Where it went       |
| -------------------------------------------- | ------------------- |
| <scope carved out, accepted risk, follow-up> | <issue / PR / spec> |

## Still owed by a human

<!-- `none` is a real answer and must be written — an empty section and an unwritten one read the same. -->

- <question> — <who owes it>
