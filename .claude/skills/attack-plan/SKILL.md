---
name: attack-plan
description: Use ONLY when the user explicitly invokes `/attack-plan` or asks to "attack", "red-team", "stress-test", or "find the gaps in" a plan, spec, feature idea, or bug fix BEFORE implementation. Right-sizes from a quick single-pass (small fixes) to a full parallel adversary fan-out (large features); each read-only adversary hunts gaps in one discipline, then team-lead synthesises a ranked, Constitution-anchored gap report with a suggested plan diff. `--mode=fix` reframes the lenses for bug fixes. Never self-activates during unrelated work. Never edits the target unless `--apply` is passed or the user explicitly asks.
---

# Attack Plan

## Overview

Adversarially stress-test a plan, spec, raw feature idea, or bug fix so it accounts for as much as possible before a single line is written — from high-level logic down to fine implementation calls (e.g. *moving a file vs. orphaning its siblings*, *reading EXIF at scan time vs. at sort time*).

It works by **lens diversity, not vendor diversity**: each adversary is locked into one discipline (data flow, file safety, resilience, optionally blast-radius integration) and forbidden from grading outside it, so they do not converge into one bland review. `team-lead` then synthesises the reports — the contradictions *between* lenses are the strongest signal that a plan is weak.

**Core principle:** dispatch N read-only adversaries in parallel → collect structured gap reports → `team-lead` dedupes, ranks by Constitution-anchored severity, and emits a suggested plan diff. **The fan-out scales to the target** (see Right-sizing): a one-line fix gets a single inline pass, a cross-cutting feature gets the full fan-out. The target is **never** mutated unless apply mode is requested.

## Activation — manual only

This skill fires **only** on explicit intent: the `/attack-plan` invocation, or a clear request to attack / red-team / stress-test / find gaps in a plan, idea, or fix. It must **never** self-suggest or auto-run during normal implementation, review, or planning work.

## When to Use

Use when:
- A spec in `docs/specs/epic-XX-*.md` needs a pre-implementation gap hunt before its subtasks are coded.
- A feature idea is still free-text and you want to steer the future spec.
- A **bug fix** is planned and you want to confirm it hits the root cause without regressions (`--mode=fix`).

Do NOT use when:
- You want to review already-written **code** — that is the native `reviewer` / `pattern-guard` path (the `pattern-guard-scan` skill, or dispatching `reviewer` per `.claude/agents/reviewer.md`). Adversaries attack *plans and fixes*, not diffs.

## Interface

```
/attack-plan [target] [--angles=<list>] [--quick | --deep] [--mode=fix] [--apply]
```

| Argument | Meaning |
|----------|---------|
| `target` | Path to a spec (`docs/specs/epic-XX-*.md`) or another design doc, or a quoted free-text idea / fix description. If omitted → list recent specs and ask which (or take the most recently modified). The `feature-loop` passes its plan target explicitly. |
| `--angles=<list>` | Comma-separated subset from the catalog below. If omitted → chosen by tier (see Right-sizing). |
| `--quick` | Force the **Quick** tier — one inline pass, no fan-out. |
| `--deep` | Force the **Deep** tier — the full catalog (all 4 lenses). |
| `--mode=fix` | Bug-fix framing — reframes every lens to root-cause / regression / reproduction-test (see Right-sizing & modes). |
| `--apply` | After synthesis, write the suggested edits into the target file (file targets only). Without it → report + suggested diff only, **not applied**. |

## Angle catalog → adversary agents

| `--angles` key | Adversary agent | Lens — what it hunts | Default | Primary articles |
|----------------|-----------------|----------------------|:-------:|------------------|
| `dataflow` | `.claude/agents/dataflow-adversary.md` | EXIF / GPS provenance: where each metadata field originates (file → parser → DTO → IPC → React) and lands; defensive parsing at boundaries (`NaN` / `null` / missing EXIF); fallback values; privacy of GPS data | ✅ | I, II, V |
| `file-safety` | `.claude/agents/file-safety-adversary.md` | Article VI reversibility: undo-log / move-log completeness, atomic FS ops, no orphaned siblings, dry-run parity; **folds in path-traversal / fs-scope-escape — Tauri capability least-privilege, `fs:allow-*` over-grant, writes outside the sandbox** | ✅ | I, VI |
| `resilience` | `.claude/agents/resilience-adversary.md` | error paths, silent failures, partial-batch failure, status-transition completeness, idempotency / re-run safety, missing critical-path tests | ✅ | IX, V |
| `integration` | `.claude/agents/integration-adversary.md` | blast radius — which modules / `#[tauri::command]` entry points / React IPC consumers break, hidden coupling, shared constants / barrels / `mod.rs` re-exports, cross-feature flows | optional | III, IV |

Dropped from HP: `rag-adversary` (no RAG in MS). HP's `persistence-adversary` is reframed as `file-safety-adversary`; HP's `security-adversary` survives only as the path-traversal / `fs:allow-*` lens folded into `file-safety-adversary` (JWT / RBAC / tenant dropped — none exist in MS). The `security-auditor` agent is NOT part of this roster.

Synthesiser (Standard/Deep tiers): `team-lead` in **Attack Synthesis Mode** — see `.claude/agents/team-lead.md`.

## Right-sizing & modes

The fan-out scales to the target — don't spend four agents on a one-line fix. Pick a tier at Step 0; the user can force it with `--quick` / `--deep`.

| Tier | When (auto-signal) | What runs |
|---|---|---|
| **Quick** (`--quick`) | a bug fix, a one-file / additive change, or a target naming ≤1 module | **No fan-out.** The orchestrator does ONE inline adversarial pass across the 1–2 most relevant lenses itself — no background agents, no separate `team-lead` synthesis (the single pass already concludes). Seconds. |
| **Standard** (default) | an ordinary feature touching a few modules | the **default** angle subset (`dataflow`, `file-safety`, `resilience`) as background agents + `team-lead` synthesis. Add `integration` when the change touches multiple modules or shared contracts. |
| **Deep** (`--deep`) | a large / cross-cutting / irreversible change (new `#[tauri::command]` + user-media writes + `capabilities/*.json` together, schema-like data shape changes, FS operations) | the **full** catalog — all 4 lenses incl. `integration` — + synthesis |

**Default / optional split (with only 4 lenses):** default = `{dataflow, file-safety, resilience}`; optional = `{integration}` (the blast-radius escalation lens — add it for cross-module work); Deep = all 4.

**Auto-signal (Step 0):** judge by the target's size and how many modules / features / `#[tauri::command]` entry points / capability files it names. Lean **Quick** for fixes and tiny additive work; **Deep** when it touches user-media FS operations + `tauri.conf.json` / `capabilities/*.json` + a new command together. When unsure, default **Standard** and state which tier you picked and why. `--angles` still narrows any tier; `--quick` / `--deep` override the auto-signal.

**Bug-fix mode (`--mode=fix`):** reframes every lens from "what could this feature miss" to fix-specific questions. Prepend these to each adversary prompt (or apply them in the Quick inline pass):
- **root-cause vs symptom** — does the fix address the cause, or mask the effect?
- **regression / blast-radius** — what else touches the changed path; what breaks nearby?
- **reproduction test** — is there a test that *fails before* and *passes after* the fix, pinning the bug so it cannot return?

Default tier for `--mode=fix` is **Quick**. Escalate to **Standard** when the fix touches an MS risk surface: user-media write paths, `tauri.conf.json` / `capabilities/*.json`, `fs:allow-*` changes, irreversible FS operations, or a `#[tauri::command]` entry point.

## Procedure

### 0. Size & mode

Pick the tier (Quick / Standard / Deep) per **Right-sizing & modes** above — from the target's scope and any `--quick` / `--deep`. Note whether `--mode=fix` is set. State the chosen tier and a one-line reason before proceeding. **Quick tier skips the fan-out (steps 4–6)** — see step 4.

### 1. Resolve target

Classify the input:
- **File path** under `docs/specs/` (or another design doc) → read it in full; this is the artifact under attack.
- **Quoted free text** → treat as an idea / fix description; there is no file. Note this — several adversaries will have reduced codebase grounding and MUST flag coverage gaps instead of fabricating.
- **Nothing** → list `docs/specs/epic-*.md` (most-recent first) and ask which to attack, or take the most recently modified.

### 2. Ground context

So adversaries attack against the project's *actual* rules and know *what is connected*:
- ALWAYS read `docs/CONSTITUTION.md` and `.claude/CLAUDE.md`.
- For a file target: grep the codebase for every feature module / service / `#[tauri::command]` entry point / React IPC binding the target names, and read the `docs/specs/*` it references. Collect these as file:line pointers to hand to the adversaries (or to use yourself in the Quick inline pass).

### 3. Select angles

Parse `--angles`. If absent, choose by **tier**: **Quick** → the 1–2 most relevant lenses; **Standard** → the default subset (`dataflow`, `file-safety`, `resilience`), adding `integration` for cross-module work; **Deep** → all 4. Map each selected key to its adversary agent via the catalog. In `--mode=fix`, bias toward `resilience` (reproduction test) plus the lens the bug lives in.

### 4. Dispatch adversaries in parallel (Strategy C)

**Quick tier:** skip this fan-out entirely — do a single inline adversarial pass yourself across the 1–2 chosen lenses, emit the gap report inline, and go straight to step 7 (no background agents, no step-6 synthesis).

For **Standard / Deep**, issue **one `Agent` call per selected angle in a single message** so they run concurrently:
- `subagent_type` = the adversary name (e.g. `dataflow-adversary`).
- `run_in_background: true`.
- Prompt MUST include the MS delegation convention string `Read .claude/agents/<adversary>.md and follow those role instructions.` + the **full target text** + the grounding pointers from step 2 + the **shared gap-report schema** below.
- If `--mode=fix`, prepend the three fix-specific questions (root-cause / regression / reproduction test) so each adversary attacks the **fix**, not a feature.

### 5. Collect reports

Wait for every background adversary to finish. Gather each structured gap report verbatim. *(Quick tier: skipped — the inline pass already produced the report.)*

### 6. Synthesise

Dispatch `team-lead` (not in background) with: the original target + all N adversary reports. Include `Read .claude/agents/team-lead.md and follow those role instructions.` and instruct it to run **Attack Synthesis Mode** — dedupe overlapping gaps, resolve contradictions between lenses, rank by Constitution-anchored severity, and produce the synthesis output contract defined in `.claude/agents/team-lead.md`. *(Quick tier: skipped — present the single inline report directly.)*

### 7. Output

Present the synthesis (Standard/Deep) or the inline report (Quick) to the user. **Do not modify the target.**

### 8. Apply (conditional)

Only if `--apply` was passed OR the user explicitly says to apply: edit the target file with the suggested edits and show the resulting diff. Never apply to a free-text idea (no file). Applying is a reversible, human-visible edit (Article VI) — show the diff, do not commit unless asked.

## Shared gap-report schema (every adversary emits this)

```
## <Angle> Adversary Report

### Gaps
- [G-1] severity: Critical | High | Medium | Low
  - location: <plan section heading> OR "MISSING" (absent from the plan entirely)
  - claim: what is wrong, missing, or underspecified
  - evidence: file:line in the codebase, plan section, or Constitution article that grounds the claim
  - consequence: what breaks (or what defect ships) if the plan stays as-is
  - suggested resolution: the concrete edit the plan needs

### Cross-cutting concerns
- dependencies on other angles (e.g. "file-safety gap G-2 forces a data-flow contract change")

### Coverage note
- what this adversary could NOT assess (out of lens, or missing info in idea-mode)
```

Severity anchoring (shared with `reviewer` and `team-lead`): **Article I (user files are sacred)** and **Article VI (reversibility)** violations are Critical; **Article V (type safety)** violations are non-negotiable. A concern that cannot be anchored to any Constitution article is at most a Suggestion, never a blocker.

## Synthesis output contract (team-lead)

`team-lead` emits the **Attack Synthesis Mode** output contract defined in `.claude/agents/team-lead.md` (single source of truth — `## Attack Synthesis — <target>`, Summary, Consolidated gaps ranked, Contradictions resolved, Suggested plan diff). This skill does not redefine it, so the two never drift.

## Notes

- **Read-only adversaries.** Adversaries carry `Read, Bash, Grep, Glob` only — they investigate the codebase to ground gaps, they never edit (enforced by each agent's `tools:` frontmatter + `ABSOLUTE PROHIBITIONS` block). The single mutation point is step 8, performed by the main session.
- **Cost / right-sizing.** Deep (4 passes + synthesis) is heavy by design — reserve it for large / cross-cutting / irreversible changes. Use **Quick** (one inline pass, no agents) for fixes and tiny additive work, **Standard** (default 3-lens subset) for ordinary features. `--angles` trims any tier; add `integration` for cross-module work.
- **Idea-mode honesty.** With a free-text target, adversaries lacking a concrete artifact MUST populate the Coverage note rather than invent gaps.
- **No second copy.** The synthesis output contract lives in `.claude/agents/team-lead.md`; only the gap-report schema is inlined here, because step 4 hands it to each adversary in the dispatch prompt.
