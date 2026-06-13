---
name: parallel-research
description: Use when the human explicitly asks for deep / parallel research on a topic for media-sorter — "how do other tools solve X", a broad library/approach survey, or a question one researcher pass cannot cover. The MAIN SESSION orchestrates a fan-out of researcher instances with independent verification; never auto-escalated from the simple researcher path. Read-only research — produces a cited discovery document, never code.
---

# Parallel Research (complex research mode)

## Overview

The complex tier of the project's two research modes. The **main session** — the only legitimate
orchestrator (no agent may spawn sub-agents) — fans out several `researcher` instances over distinct
angles of one question, independently verifies their key claims, and synthesizes one cited discovery
document. The simple tier is the `researcher` agent invoked directly; use that for narrow questions.

## When to Use

Use when:
- The human explicitly asks for deep / parallel / multi-angle research, or "how do other tools solve X".
- A question is too broad for a single `researcher` pass to cover well.

Do NOT use when:
- The question is narrow — invoke `researcher` directly (simple mode) instead.
- The work is implementation — this is read-only research.

**Never auto-escalate.** Running this skill is the human's explicit opt-in to the (token-expensive)
fan-out. You MAY suggest it on a visibly broad question, but do not start it without the human asking.

## Privacy (Article II) — input isolation

This skill accepts ONLY an abstract topic / question as input. NEVER pass raw user data — media file
paths, file names, GPS coordinates, or EXIF values — into the fan-out or any web query. If the
request carries such data, restate it as an abstract topic before proceeding. The `pre-web.sh` hook
is the deterministic backstop, but isolation here is the first layer.

## Procedure

1. **Decompose** — split the question into K distinct angles. Right-size K: a narrow question → 2–3
   angles; a broad question → 5–8. State the chosen K and the angles before fanning out.
2. **Fan-out** — for each angle, dispatch a `researcher` instance. Prefer the `Workflow` tool with
   `agentType: 'researcher'` and a `schema` that forces structured findings; parallel `Agent` calls
   with the same agent are an acceptable fallback. Each instance inherits researcher's ABSOLUTE
   PROHIBITIONS (incl. the web-privacy rule).
3. **Verify** — for each key claim, dispatch ONE independent verifier (a fresh `researcher` instance,
   never the claim's author) prompted to refute it. A refuted claim is dropped or downgraded; a
   surviving claim keeps its confidence.
4. **Synthesize** — consolidate confirmed findings into ONE discovery document at
   `docs/discoveries/YYYY-MM-DD-<topic>.md`, using the researcher format (Question / Findings /
   Confidence / Contradictions / Proposed direction / Open risks).
5. **Log — no silent caps** — print how many angles were researched and how many claims were verified.
   If you bounded coverage (capped angles, skipped a verification), say so explicitly in the log AND
   in the discovery doc's Open risks.

## Output

A single cited discovery document under `docs/discoveries/`. Never code, never a plan.

## Cross-references

- `.claude/agents/researcher.md` — the agent this skill fans out; its prohibitions bind every instance.
- `.claude/agents/team-lead.md` — "never launches agents; the main session orchestrates" (the invariant this respects).
- `.claude/hooks/pre-web.sh` — the deterministic web-privacy backstop (Layer 2).
- `docs/CONSTITUTION.md` — Article II (privacy), III (KISS).
