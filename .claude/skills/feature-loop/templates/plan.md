# <Feature> — Implementation Plan

**Intent brief:** `docs/superpowers/loop/<feature>/intent-brief.md` · **Spec:** <`docs/specs/epic-XX-*.md` or none> · **Strategy:** A | B | C | D · **IPC contract locked:** yes / no / n/a

## Status — read this first

<!-- Written when the run stops at the G gate, before the planning report (templates/planning-report.md).
     A fresh Phase-6 session reads this first. -->

- **Phase 5:** closed on YYYY-MM-DD, <n> attack rounds run — converged / exhausted
- **Next:** Phase 6 from `<base branch>` — <the first piece to dispatch>
- **Owed by the human:** <one choice per line> <!-- `none` is a real answer and must be written -->
- **Logged open for the draft PR:** <accepted risk> <!-- or `none` -->

**Size-table row:** <1–5> — <the one-line reason> · **Attack rounds:** <n> · **Phase-7 reviewer depth:** Standard / Deep · **Risk flags:** <`risk-classify.sh` output + brief ④, or `none`>

<!-- Picked once at Phase 1. If Phases 2–4 turn up a surface the row assumed away — a user-media write,
     a capability change, a boundary crossing, a consumer — re-enter the table, land on the new row, and
     note here why it moved. Rows move up, never down. -->

## File layout

<!-- Name the files before code is written, following src-tauri/CLAUDE.md (vertical feature + shared core)
     and src/CLAUDE.md (src/features/<feature>/). Approximate is enough; revise as the work finds things.
     Delete the section for a change that adds no new file. -->

| Path                                               | Responsibility                      |
| -------------------------------------------------- | ----------------------------------- |
| `src-tauri/src/domain/<type>.rs`                   | <domain type>                       |
| `src-tauri/src/<feature>/{command,dto,service}.rs` | <IPC entry · DTOs · business logic> |
| `src/features/<feature>/…`                         | <components · hooks · IPC bindings> |

## Owner review rules

<!-- Rules the human set while this run was in progress, each with the example that prompted it.
     Every agent brief points here. Before Phase 11 each one is proposed to the human for a separate
     governance PR to .claude/CLAUDE.md or a stack CLAUDE.md that the human opens (B6), or is marked as binding this feature only. -->

- <rule> — <example from this run> — <proposed for a governance PR | this feature only, because …>

## Shared first

- [ ] `src-tauri/src/domain/` types
- [ ] IPC contract — `#[tauri::command]` signatures + DTOs on both sides (Strategy D)

## Backend (`src-tauri/`)

- [ ] <step>

## Frontend (`src/`)

- [ ] <step>

## Edge & rare-failure rows (Phase 4)

<!-- Every row carries an id; Phase 7 walks them. Each ends as a named test or a Manual-verification
     entry. Rows on user-file reversibility, metadata egress, or duplicate-target conflict resolution
     need an automated test — the manual route does not close those. -->

| Id  | Case           | Resolved by                                         |
| --- | -------------- | --------------------------------------------------- |
| E1  | <edge case>    | `<test name>`                                       |
| R1  | <rare failure> | `<test name>` / Manual: <how it is checked by hand> |

## Tests — critical path only (Article IX)

- [ ] EXIF / metadata parsing · date / location extraction · sorting strategies · conflict resolution · reversibility (move log, undo)

## Delivery

- [ ] Phase 9 self-improve
- [ ] `pattern-guard` + `reviewer` + `security-auditor` + coverage walk
- [ ] `make check` + `make fmt-check` green
- [ ] atomic commits, **draft** PR to `staging`, accepted risks listed on it
- [ ] `run-state.md` written
