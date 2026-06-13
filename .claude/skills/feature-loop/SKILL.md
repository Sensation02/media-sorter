---
name: feature-loop
description: Use when driving a feature end-to-end through the attended development loop on media-sorter — the human asked to run, start, or continue the feature-loop on a change, or to take a feature from intent to a review-ready branch through the phased loop. Triggers whenever feature-loop state exists for a feature or a new loop run begins. Attended-only; opens a draft PR but never merges.
---

# Feature Loop (v0 — attended)

## Overview

A state machine that drives one feature through phases 0–11 to a **draft PR** that a human then reviews and ships. It never commits directly to protected branches and never merges; at review-ready it pushes the feature branch and opens a **draft PR** to `staging`. A human reviews it, removes the draft flag, and merges.

**v0 is ATTENDED — and only attended.** Native `/loop` is session-bound (it dies on app close, no auto-resume), so unattended runs are not viable and are out of scope (spec EPIC-18 Q3). A human watches every tick and the **G gate halts unconditionally** for human approval. The premise of v0 is exactly this: prove the loop produces worthy review-ready branches *under supervision* and calibrate the risk tiering before any unattended milestone is ever considered. If the output is poor under supervision, unattended stays off the table.

**The loop is attended, not `/bg`.** [background-execution](../background-execution/SKILL.md) forbids `git push` / `gh pr create` under a detached `/bg` session. The feature-loop runs *attended*, so Phase 11's push + `--draft` PR is a human-watched action, not a backgrounded one — and it still never merges (merge is the human's separate step).

**No self-modification lock — the safety net is the G gate plus manual merge.** Per the EPIC-18 owner decision (2026-06-12), media-sorter dropped HP's default-deny guardrail lock and ships **no `*_GUARDRAIL_UNLOCK` env var**. Every governance file (`.claude/hooks/`, `.claude/settings*.json`, `CLAUDE.md`, `docs/CONSTITUTION.md`, `.claude/skills/`) is editable immediately — there is **no physical barrier** stopping the loop from rewriting its own constraints. The compensation is procedural, and this loop is where it is enforced: the **G gate stays unconditional** and **nothing auto-merges**. A guardrail edit is still treated as out-of-scope for a feature loop and escalated as a separate human governance PR (see §Park, B6) — not because the edit is blocked, but because routing it through manual review is the only safety net MS has left.

**Core principle:** every gate exists because skipping it under pressure is exactly what an orchestrator rationalizes. **Violating the letter of a gate is violating the spirit of it.** When unsure, the safe move is always STOP/PARK and notify — never auto-pass.

## When to Use

Use when:
- The human says "run / start / continue the feature-loop" on a feature or change
- A `docs/superpowers/loop/<feature>/state.json` exists and work should resume from its `phase`

Do NOT use when:
- The change is a one-line edit the human wants done directly (just do it — the loop is for features, not trivial edits)
- You are asked to *merge* — that stays human; the loop's handoff line is a draft PR (review-ready)
- The work is an unattended / scheduled run — v0 is attended-only; `/schedule` as a server-grade fallback is noted in the spec but not built

## state.json

Location: `docs/superpowers/loop/<feature>/state.json`. The single source of truth for where the loop is. Update it after every phase transition.

```json
{ "feature": "", "phase": 0, "tier": "ATTENDED|UNATTENDED_ELIGIBLE",
  "riskFlags": [], "ticks": 0, "attackRounds": 0, "parked": false,
  "artifacts": { "intentBrief": "", "plan": "", "branch": "" }, "reviewReady": false }
```

`tier` is recorded for **calibration only** — in v0 the G gate is unconditional regardless of tier, and `UNATTENDED_ELIGIBLE` is never a reachable mode (it is the calibration label, not a permission). Resume = read `state.json`, continue from `phase`. Never re-run a completed phase blindly; read its recorded artifact first.

## Phases 0–11

Dispatch agents via the **Agent tool** with `Read .claude/agents/<role>.md and follow those role instructions.` Dispatch skills (`intent-capture`, `/attack-plan`, `false-positive-triage`) via the **Skill tool**.

**Inline invocation.** If the loop is invoked with a feature description (e.g. `/feature-loop <details>`), pass those details to Phase 0 as pre-filled intent — `intent-capture` then elicits only the gaps instead of all six aspects. Risk surfaces (④) and reversibility (⑤) are still confirmed explicitly, never assumed from the inline text, because they set the tier.

| Phase | Executor | Action / gate |
|-------|----------|---------------|
| 0 Intent | `intent-capture` (skill) | → `intent-brief.md` (6 aspects + tier-feed) |
| 1 Classify | `team-lead` (agent) + `risk-classify.sh` | write `tier` + `riskFlags` to state.json (calibration; v0 still attended) |
| 2 Research+Docs | `researcher` (agent) | context notes |
| 3 Plan | `team-lead` (agent) | high-level plan → `artifacts.plan` |
| 4 Test-first | `team-lead` + `tester` (agents) | acceptance criteria → named failing tests (plan may adjust to tests — TDD-for-plan) |
| 5 Harden | `/attack-plan` (skill) + `team-lead` (fix) | bounded plan+tests attack-fix loop (≤3 rounds) → filtered escalation residue (see §Phase 5) |
| **G** | **human** | **STOP + `PushNotification` (with the residue) → wait for explicit "go" (UNCONDITIONAL in v0)** |
| 6 Implement | `backend-developer` / `frontend-developer` (agents) | code |
| 7 Verify | `reviewer` + `pattern-guard` + `security-auditor` (**advisory**) + `make check` + `make fmt-check` (**binding**) | findings |
| 8 Triage | `false-positive-triage` (skill) | classify findings: real / false-positive / style / outdated |
| 9 Self-improve | orchestrator | re-read own code, fix typos/naming, record learnings |
| 10 Readability | `reviewer` (light) | methods ≤30 lines, no nested ternaries, breathing room |
| 11 Commit+PR | orchestrator (commit rules from `pr-delivery`) | branch + atomic commits + CHANGELOG → push + **draft PR** to staging — **no merge** (see §Phase 11) |
| ✓ | — | **REVIEW-READY** (see §13) |

The count is **12 phases (0–11)** plus the **G gate** — G is unnumbered and lives between Phase 5 and Phase 6. It is a human checkpoint, not a phase.

### Phase 1 — Classify (how tier is set)

```bash
.claude/hooks/risk-classify.sh staging
```

It prints zero or more of `{media-write, capability, fs-irreversible, ipc-surface}` (one per line) for the working tree, and exits 0 (or exits 1 fail-loud, emitting **all four flags**, if the base ref is unresolved). It is a **router, not a judge** — it flags a *touch* of an MS risk surface, not safe-vs-unsafe; the reversibility judgment (does a move-log / undo guard a destructive verb?) is the LLM's / human's job (Article VI). Set:

- `riskFlags` = `risk-classify.sh` output **OR** the team-lead LLM's risk read **OR** the `intent-brief.md` aspect ④ surfaces
- `tier` = `ATTENDED` if `riskFlags` is non-empty OR the intent-brief tier-feed was `ATTENDED-candidate` OR the feature is large/irreversible OR the classifier's own read is **uncertain**; else `UNATTENDED_ELIGIBLE`

**Any signal → ATTENDED; unsure → ATTENDED.** The uncertain-read clause is self-contained: even if no flag fired and the brief said `ELIGIBLE-candidate`, a team-lead read that cannot confidently call the feature trivial defaults to `ATTENDED` (fail toward attended — never optimistic). In v0 the tier is recorded for **calibration only** — G stays unconditional regardless of tier — but an optimistic mislabel here would bias the future unattended decision the wrong way, so the conservative default matters.

### Phase 5 — Harden (bounded plan+tests attack-fix loop)

Phase 5 hardens the {plan + named tests} pair (Phases 3–4) by attacking it, fixing what the AI can, and escalating only the **filtered residue**. It runs *before* G and touches NO code — it revises the plan and the tests (both may shift here).

**Round (max 3 — `attackRounds` in state.json):**
1. **Attack** — invoke `/attack-plan` on the current {plan + tests} → a ranked, Constitution-anchored gap report. (`/attack-plan` right-sizes itself: a quick single inline pass for a small plan, the full read-only adversary fan-out — `dataflow` / `file-safety` / `resilience` / optional `integration` — for a large/risky one.)
2. **Classify each finding:**
   - *AI-resolvable* — a deterministic fix, **not** on an MS risk surface, **not** a guardrail-file edit.
   - *Human-needed* — a B-class blocker (B1 fork · B2 intent conflict · B4 missing authority · B5 no Constitution-compliant path · B6 guardrail-file edit · B3 irreversible user-media FS op where knowable on the plan) → goes to the **residue**.
3. **Fix** — `team-lead` resolves **every** AI-resolvable finding, revising the plan and/or the named tests.
4. **Accumulate** human-needed findings into the escalation residue.

**Termination — whichever comes first:**
- **Converged** — an attack round surfaces no unaddressed criticals and no new criticals. Re-attack a round only if the previous round applied a fix (to verify it landed + catch new gaps); a round with no fix and no new finding stops the loop.
- **Exhausted** — 3 rounds done.

**Filtering → residue (the whole point):**
- The AI resolves everything resolvable across the ≤3 rounds. The **residue** is the consolidated set of human-needed findings, escalated **once** — not finding-by-finding.
- **Residue empty** → plan+tests are hardened → proceed to G.
- **Residue non-empty** → escalate the consolidated residue (write it to `docs/superpowers/loop/<feature>/harden-residue.md`).
- **Convergence failure** — a **critical** finding still unresolved after 3 rounds (the AI could not fix it) joins the residue and is escalated. **Never proceed to G / Implement with an open critical.**

**Anti-weakening:** every re-attack runs on the **revised** plan+tests. A "fix" that *suppresses* a finding — narrowing scope to dodge it, or gutting a test so it no longer asserts the requirement — is itself a finding, not a resolution. Open findings = unresolved-**and-not-suppressed**.

**v0 vs unattended:**
- **v0 (attended):** Phase 5 hardens and consolidates the residue; **G then stops unconditionally regardless.** The human at G reviews an already-hardened plan plus the residue — a focused, cheaper review. v0's unconditional G is untouched.
- **Unattended (later milestone, not built):** residue empty → proceed without waiting; residue non-empty → PARK. This automated plan-adversary would stand in for the human at G — a hard precondition before unattended is ever considered.

Phase 5 attacks the **plan**; Phase 7 (Verify) attacks the **code**. They are complementary, not duplicates.

### Phase 7 — Verify (advisory vs binding)

- **Binding** (must be green to be review-ready): `make check` (typecheck + lint with `cargo clippy -D warnings` + tests) and `make fmt-check` (`prettier --check` + `cargo fmt --check`). `make verify` alone is the quick typecheck+lint tier and is **not** sufficient — it runs no tests.
- **Advisory** (run and triaged, never silently ignored): `reviewer`, `pattern-guard`, and `security-auditor`. These produce findings that Phase 8 classifies; they do not gate review-ready by themselves.

(`security-auditor` belongs in Verify but **not** in the Phase-5 attack roster — the attack-plan adversary fan-out is `dataflow` / `file-safety` / `resilience` / `integration` only.)

### Phase 11 — commit + draft PR (NO merge)

Follow `pr-delivery`'s *Atomic commits — granularity rules*, `type(scope): description` conventions, and PR-body template — but stop at a **draft** PR. Merge is always the human's step (Constitution Article VI: manual merge only; the `pre-bash` hook blocks commits to `staging`/`production`).

1. Create a feature branch from `staging` — `git checkout -b feat/<scope>-<desc> staging` (never commit on `staging`/`production`)
2. Atomic commits, one logical step each
3. Add the CHANGELOG `[Unreleased]` bullet in the same commit **only if** the PR changes user-visible behavior AND the type is `feat`/`fix`/`perf`/`revert` (Article VII's trigger is user-visible behavior, not commit type — a developer-facing feature adds no bullet)
4. `git push -u origin <branch>`
5. `gh pr create --draft --base staging` with the pr-delivery PR-body template (Summary / What's new / Test Plan / Out of scope; `Relates to #N`, never `Closes #N`)

Set `artifacts.branch` in state.json. **FORBIDDEN in Phase 11:** `gh pr merge` or any merge, removing the draft flag, force-push to protected branches. media-sorter has no project board, so there are no board cards to move — the epic-status sync (spec `Status:` + `STATUS.md`) is a **human-gated** step that ships in the same PR after review, never flipped autonomously.

## The G gate (unconditional in v0)

After Phase 5 (Harden), STOP. Send `PushNotification` (carrying the Phase-5 residue, if any). Wait for the human's explicit "go" before Phase 6 (Implement). There is no tier, no triviality, and no time pressure that makes G optional in v0 — removing it removes v0's only safety property (human-watches-every-tick), and since MS has no physical guardrail lock, G plus manual merge are the *entire* self-modification safety net.

## Park

PARK = set `parked: true` in state.json, STOP, `PushNotification`, wait for the human. PARK is **cheap** (a lost session) and auto-pass on risk is **catastrophic** (an unsafe commit, an irreversible user-media operation) — the polarity always favours PARK.

Trigger a PARK on any of:
- **Process triggers:** plateau (no progress across ticks), ambiguity vs intent, budget exhausted, a tool / Context7 outage
- **Risk tripwire (mid-implement):** re-run `risk-classify.sh` on the **revised** tree during Phase 6–7; if it now touches a previously-unflagged MS risk surface (`media-write` / `capability` / `fs-irreversible` / `ipc-surface`) → force PARK (do not auto-resolve)
- **B-class blockers (BLOCKER → PARK):** B1 material fork · B2 conflict/ambiguity with intent · B3 irreversible user-media FS op (checked at Phase 7 against the real tree, not just the plan; Article I) · B4 missing authority/info · B5 no Constitution-compliant path · B6 fix requires a **guardrail-file edit**

**B6 is special — and its rationale is procedural, not physical.** MS has no `*_GUARDRAIL_UNLOCK` and no lock: the loop *can* technically edit hooks / skills / settings / `CLAUDE.md` / `CONSTITUTION` / `user-facing-denylist.md`. It must **not**. A fix needing one of those is **out-of-scope for a feature loop** and goes out as a **separate human governance PR** — never bundled into the feature's draft PR (the bootstrap caveat in EPIC-18 warns that a guardrail edit riding under feature-review cover can fast-merge on green CI and fail open while looking fail-closed). Escalate it; do not silently apply it and do not spin in a STUCK loop attempting it.

## Review-ready (§13)

Before the final "done" `PushNotification`, ALL must hold — else it is not review-ready:

- [ ] `make check` = green (typecheck + lint + tests) AND `make fmt-check` = green — both binding
- [ ] Phase 5 Harden converged or its residue was escalated and cleared — no open critical from the plan attack
- [ ] Phase 7 advisory gates (`reviewer` + `pattern-guard` + `security-auditor`) **ran and were triaged** — findings classified, not ignored
- [ ] Every acceptance criterion → a **green named test**
- [ ] Atomic commits pushed + a **draft PR** is open to staging (Phase 11) — not merged
- [ ] No guardrail-file edit rode in under the feature PR (any governance change was split out as a separate human PR)
- [ ] `parked` is `false`

Then set `reviewReady: true` and `PushNotification`. Ship = human review → remove draft flag → merge + CI. The loop opens the draft PR but never merges.

## Red flags — STOP and reconsider

- About to skip or pre-confirm G ("the human will obviously say go")
- About to proceed past Phase 5 with an open **critical** plan finding ("I'll just note it") — resolve it or escalate; never carry it into Implement
- About to set `reviewReady: true` with a red `make check` / `make fmt-check` or an un-triaged advisory gate
- About to auto-resolve a finding that touches a previously-flagged MS risk surface (`media-write` / `capability` / `fs-irreversible` / `ipc-surface`)
- About to edit a guardrail file (`.claude/hooks`, `.claude/skills`, `.claude/settings*.json`, `CLAUDE.md`, `CONSTITUTION`, `user-facing-denylist.md`) to make a fix — there is no lock stopping you, which is exactly why you must escalate instead
- About to bundle a governance edit into the feature's draft PR instead of splitting it into a separate human PR
- About to count an open finding as resolved because you suppressed or relaxed the check
- About to push through a plateau or ambiguity instead of PARK + notify
- About to "fix" a finding by an irreversible move / rewrite / delete of a user photo or video (Article I)
- About to merge, remove the draft flag, or otherwise promote the PR past review — merge is always the human's step

**Each of these means: STOP. Update state.json, PushNotification, wait for the human.**

## Rationalizations — and why they are wrong

| Rationalization | Reality |
|-----------------|---------|
| "This change is trivial, I'll skip G" | G is unconditional in v0. Skipping it deletes v0's only safety property, and MS has no physical lock to fall back on. |
| "Phase 5 attack found a critical, but I'll just note it and implement" | A critical must be resolved or escalated in the residue. Proceeding past Phase 5 with an open critical is forbidden. |
| "I'll narrow the scope so the attack finding goes away" | That is suppression, not a fix (anti-weakening). Re-attack on the revised plan; a dodged finding is still open. |
| "It only *reads* a user-media path, safe to auto-pass" | A risk-surface touch forces PARK regardless of code reversibility — copying GPS data off the machine is harm-irreversible even when the code is revertable (Article II / Article I, not just Article VI). |
| "I relaxed the check, so open-findings is now 0" | Open findings = unresolved-AND-not-suppressed. Weakening to drop the count is forbidden; re-run `risk-classify.sh` on the revised tree. |
| "The fix just needs a tweak to a hook/skill — there's no lock, so I'll do it" | No lock is precisely why you escalate (B6). A guardrail edit is a separate human governance PR; bundling it into the feature PR is the fail-open the bootstrap caveat warns about. |
| "Plan looks done, I'll mark review-ready now" | Review-ready requires ALL of §13 — `make check` + `make fmt-check` green, residue cleared, advisory gates triaged. Marking it early is a false review-ready. |
| "Parking is failure; push through" | A parked session is cheap; an unsafe commit or an irreversible user-media op is catastrophe. PARK is the safe default. |

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Treating G as advisory | G is a hard STOP in v0. Send `PushNotification`, wait for "go". |
| Running Phase 5 once and stopping at the first escalation finding | Keep resolving AI-resolvable findings across rounds; escalate only the *consolidated* residue at the end. |
| Letting Phase 5 loop past 3 rounds | Cap at 3 (`attackRounds`). Unresolved critical after 3 → residue → escalate. |
| Forgetting to update state.json between phases | state.json is the resume point — stale state corrupts resume. Update every transition (incl. `attackRounds`). |
| Dispatching agents without the role pointer | Always `Read .claude/agents/<role>.md and follow those role instructions.` |
| Running `risk-classify.sh` only at Phase 1 | Re-run it on the revised tree mid-implement — that is the tripwire. |
| Treating `make verify` as the binding gate | The binding gate is `make check` + `make fmt-check`; `verify` runs no tests. |
| Editing a guardrail file because nothing blocks it | No lock ≠ permission. Escalate as a separate human governance PR (B6). |
| Opening a non-draft PR, or merging | Phase 11 opens a **draft** PR only; un-drafting and merge are the human's ship step. |

## Cross-references

- [intent-capture](../intent-capture/SKILL.md) — Phase 0; produces the `intent-brief.md` this loop reads
- [attack-plan](../attack-plan/SKILL.md) — Phase 5 attack engine; right-sizes the adversary pass over the plan+tests
- [false-positive-triage](../false-positive-triage/SKILL.md) — Phase 8 finding classification
- [pr-delivery](../pr-delivery/SKILL.md) — Phase 11 follows its atomic-commit + PR-body rules and push step, but opens a **draft** PR and stops before merge
- [pattern-guard-scan](../pattern-guard-scan/SKILL.md) — the Phase 7 anti-pattern advisory pass
- [background-execution](../background-execution/SKILL.md) — why Phase 11's push + draft PR is an *attended* action, and the green-gate definition (`make check` + `make fmt-check`)
- `.claude/hooks/risk-classify.sh` — Phase 1 deterministic risk router (+ mid-implement tripwire); flags `{media-write, capability, fs-irreversible, ipc-surface}`
- `.claude/agents/team-lead.md` — Phase 1/3/5 planner + Attack Synthesis Mode
- `docs/CONSTITUTION.md` — Article I (user files are sacred), II (privacy by default), VI (reversibility, manual merge) anchor the risk model
- `docs/specs/epic-18-workflow-automation.md` — the contract; the B4-guard drop (Decisions) and the bootstrap caveat that B6 escalation defends
