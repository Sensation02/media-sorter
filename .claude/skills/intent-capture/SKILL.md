---
name: intent-capture
description: Use when starting a new feature through the feature-loop — Phase 0, the first step before any classification, planning, or code. Triggers when the human starts a feature-loop run on a feature that has no intent-brief yet, or when a feature's problem, scope, touched surfaces, risk surfaces, reversibility, and acceptance criteria need pinning down before work proceeds.
---

# Intent Capture

## Overview

Phase 0 of the feature-loop. Before a feature is classified, planned, or coded, capture six aspects of intent into a single `intent-brief.md`. The brief is the contract the rest of the loop reads from: the tier decision (Phase 1), the plan (Phase 3), and the acceptance tests (Phase 4) all derive from it.

**Core principle:** ambiguity captured now is cheap; ambiguity discovered at Implement is a PARK or a rewrite. Ask one focused question per aspect — do not batch all six into one prompt, and never infer an answer the human did not give. Aspects ④ and ⑤ feed the tier decision, so a vague answer there defaults the feature toward ATTENDED.

## When to Use

Use when:

- A new feature enters the feature-loop (Phase 0) — always the first step
- The human says "run the loop on X" / "start a feature-loop for X" and no brief exists yet

Do NOT use when:

- A brief already exists for this feature — resume the loop from the recorded phase instead
- The work is a follow-up fix inside an already-briefed feature

## The six aspects — one question each

| #   | Aspect              | What to elicit                                                                                                            |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| ①   | Problem / DoD       | The problem in one sentence + an explicit Definition of Done                                                              |
| ②   | Scope IN / OUT      | What is explicitly in scope; what is explicitly out                                                                       |
| ③   | Touched surfaces    | Modules, files, `domain/` types, `#[tauri::command]` entry points, React components, the FS surfaces the change will touch |
| ④   | Risk surfaces       | Does it touch user-media write paths, `tauri.conf.json` / `capabilities/*.json`, `fs:allow-*` permissions, irreversible FS operations, or `#[tauri::command]` entry points? |
| ⑤   | Reversibility       | Is every user-file operation reversible (Article I — move log + undo path, no deletion)? Is the change itself revertable (Article VI)? Any destructive/irreversible step? |
| ⑥   | Acceptance criteria | Observable criteria that prove DoD — the seed for Phase 4 named tests                                                     |

Ask in order, one at a time. If an answer is vague, re-ask before moving on.

**Pre-supplied details.** If the loop invocation already carried a feature description (e.g. text passed to `/feature-loop`), treat it as given answers — fill the matching aspects from it and ask only for the gaps. Still confirm ④ and ⑤ explicitly even when the text seems to cover them: a passing mention is not the deliberate risk / reversibility judgment the tier decision needs.

## Output

Write `docs/superpowers/loop/<feature>/intent-brief.md` with all six aspects as headed sections, then a final **tier-feed** line:

- `tier-feed: ATTENDED-candidate` — if ④ names ANY risk surface, OR ⑤ has a destructive/irreversible step (Article I) or an unrevertable change (Article VI), OR ② scope is "large"
- `tier-feed: ELIGIBLE-candidate` — otherwise

The tier-feed is a *candidate*, not the verdict. The final tier is decided at Phase 1 (Classify) by OR-ing this candidate with the deterministic `risk-classify.sh` flags. **Eligibility is conservative:** when unsure whether a feature is trivial, emit `ATTENDED-candidate` (fail toward attended).

## Common mistakes

| Mistake                                                | Fix                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Batching all six aspects into one question             | Ask one at a time; each answer informs the next                                |
| Inferring ④/⑤ from the code instead of asking          | Risk and reversibility are human judgments at intake — ask explicitly          |
| Emitting `ELIGIBLE-candidate` when unsure              | Unsure → `ATTENDED-candidate`. Conservative by design                          |
| Treating tier-feed as the final tier                   | It only feeds Phase 1; `risk-classify.sh` can still escalate to ATTENDED       |
| Anchoring ⑤ to Article VI alone for user-file ops      | User-media reversibility is **Article I** (move log / undo / no deletion); VI covers code/PR revertability |

## Cross-references

- `.claude/skills/feature-loop/SKILL.md` — the state machine that calls this in Phase 0 and reads the brief in every later phase
- `.claude/hooks/risk-classify.sh` — the deterministic classifier Phase 1 OR's with the tier-feed; its flagged surfaces mirror aspect ④
- `docs/CONSTITUTION.md` — Article I (user files are sacred — reversible operations, move log, undo path) is the primary anchor for ④ and ⑤; Article VI (atomic, revertable PRs) anchors the code dimension of ⑤
