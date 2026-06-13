---
name: pattern-guard-scan
description: Use when running the anti-pattern scan against a changeset — during the standard PR delivery flow (before the multi-agent reviewer pass) or as an ad-hoc audit of a single file or module. Triggers when changes are staged, before dispatching the reviewer agent, or whenever the user asks for an anti-pattern check. Dispatches .claude/agents/pattern-guard.md with the changed file list and turns its [AP-XXX | Article Y] matches into concrete fix / false-positive / escalate decisions against docs/workflow/anti-patterns.md (AP-001..AP-014+).
---

# Pattern Guard Scan

## Overview

The pattern-guard agent (`.claude/agents/pattern-guard.md`) is a specialised micro-reviewer: it scans changed files against the registry in `docs/workflow/anti-patterns.md` and reports `[AP-XXX | Article Y]` matches. It does NOT fix code — fixing is the implementer's job. This skill is the **dispatch + interpretation** procedure that wraps it.

**Core principle:** every anti-pattern in the registry exists because it violates a Constitutional article. A pattern-guard match is not "the linter doesn't like this" — it is "you broke `<article>`, which has `<concrete consequence>`". Treat matches accordingly.

The article anchor and the consequence text are owned by `.claude/agents/pattern-guard.md` (the `AP-XXX → Article` mapping) and `docs/CONSTITUTION.md` (the 10 articles). This skill consumes those — it never re-states the mapping, so there is only one source of truth.

## When to Use

Use when:

- Delivering a PR — invoke pattern-guard BEFORE the multi-agent reviewer pass (see [pr-delivery](../pr-delivery/SKILL.md))
- Auditing a specific module or file ad-hoc (without going through full PR delivery)
- The reviewer agent flagged something that smells like a known anti-pattern but wasn't categorised — to confirm it
- Adding a new entry to `docs/workflow/anti-patterns.md` and you want to verify it doesn't already exist

Do NOT use when:

- You already know the code violates a specific AP — fix it first, then run the scan to confirm clean
- Looking for general code-quality feedback — dispatch the full `.claude/agents/reviewer.md` pass (broader scope, article-anchored severity)

---

## Dispatch procedure

1. **Identify the file list** — usually `git diff --name-only staging...HEAD`, or a manually curated list for ad-hoc scans.
2. **Dispatch the agent** via the Agent tool:

```
subagent_type: general-purpose
description: Pattern-guard scan
prompt: |
  Read .claude/agents/pattern-guard.md and follow those role instructions.

  Files to scan: <space- or newline-separated list>

  Report only [AP-XXX | Article Y] matches and the Clean list per the
  Output Format in the agent definition. Do not propose fixes.
```

3. **Wait for the report** — pattern-guard produces its structured findings block: one finding per match with the AP-XXX identifier, the anchored article, the `file:line`, the matched code, and a one-line fix suggestion. If there are no matches it outputs exactly `No anti-patterns detected.`

---

## Interpreting the report

Every match is a four-line block (the agent's Conventions in `pattern-guard.md`, with the article threaded into the tag):

```
[AP-XXX | Article Y] <short name>
File: src-tauri/src/<feature>/service.rs:42
Match: <quoted code>
Fix: <one-line suggestion>
```

| Field        | Meaning                                                                              |
| ------------ | ------------------------------------------------------------------------------------ |
| `AP-XXX`     | Registry entry in `docs/workflow/anti-patterns.md` (AP-001..AP-014, AP-015+ ongoing) |
| `Article Y`  | The Constitution article the AP anchors to (mapping owned by `pattern-guard.md`)     |
| `<short name>` | The AP's short name, copied from the registry entry                                |
| `File:`      | The specific match site as `file:line` — pattern-guard always cites this             |
| `Match:`     | The quoted code that triggered the match                                             |
| `Fix:`       | The agent's one-line fix suggestion                                                  |

Open the file at the cited line. Read the matching AP entry in `docs/workflow/anti-patterns.md` for its `Problem / Why it's bad / Fix / First seen in` fields and apply the listed Fix. The article anchor tells you the consequence — derive it from `docs/CONSTITUTION.md`, never invent one.

---

## Decide per match: fix, false-positive, or escalate

```
For each [AP-XXX | Article Y] match:

  Is the AP's Problem description semantically identical to the cited code?
    ├── yes → real match → fix
    │   ├── Mechanical fix (rename, extract a token, add a type guard at a
    │   │     boundary, swap an inline <button> for <Button>): do it
    │   └── Judgement-call fix (changes behaviour, affects callers, touches an
    │         IPC contract or a #[tauri::command] signature, moves a user file):
    │           → stop the backgrounded plan if any (see background-execution),
    │           → present options to the human
    │
    ├── close-but-not-quite → likely false positive → see [false-positive-triage](../false-positive-triage/SKILL.md)
    │
    └── definitely not what the AP describes → false positive
        → note in the PR description that pattern-guard fired but was inapplicable here
```

Pattern-guard does not have judgement — it pattern-matches. The judgement layer is yours.

---

## Severity by article anchor

The article citation tells you how serious a match is and how it should be handled. This table keys on the article only — the per-AP anchor lives in `.claude/agents/pattern-guard.md`, the article meanings in `docs/CONSTITUTION.md`. Do not duplicate specific AP numbers here.

| Anchor article                        | Severity                | Default action                                                              |
| -------------------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| Article I (user files are sacred)      | Critical — blocks merge | Fix immediately; if `/bg` running, stop — an irreversible FS path is at risk |
| Article II (privacy by default)        | Critical — blocks merge | Fix immediately; never relax a boundary that lets user metadata leave the machine |
| Article VI (reversibility extends to code) | High — usually blocks | Re-evaluate the change; non-atomic or churn-heavy diffs offend here          |
| Article V (type safety)                | Important — fix in this PR | Most APs anchor here; usually mechanical (type guard at a boundary, drop a lazy cast) |
| Article III (simplicity / DRY)         | Important — fix in this PR | Often signals "you reinvented an existing helper / duplicated a primitive"  |
| Article IX (tests guard the critical path) | Important — add test in same PR | New critical-path logic (EXIF/date/geo/sort/conflict/reversibility) without a test |
| Article VII (documentation as deliverable) | Important — fix in this PR or open a follow-up | Stale spec / CHANGELOG when the change is user-visible            |

If a match arrives with no article anchor (the agent reports `[AP-XXX | —]` or omits the citation), that is a **mapping defect in `pattern-guard.md`** — flag it to the human and do NOT guess the article. Every registered AP is expected to carry an anchor.

---

## Adding a new AP to the registry

If pattern-guard misses something you keep seeing in reviews:

1. Confirm it is a **recurring** pattern (one-off bugs don't justify an AP).
2. Append an entry to `docs/workflow/anti-patterns.md` using the live schema — do not invent a new shape:
   - `**AP-XXX: \`<short name>\`**`
   - `**Problem:**` the bad pattern
   - `**Why it's bad:**` the consequence
   - `**Fix:**` the correct approach
   - `**First seen in:**` PR number or commit SHA
3. Number it **sequentially** at the next free identifier (AP-015, AP-016, …). Never reuse or renumber an existing AP — the file rule (`anti-patterns.md` line 15) makes every AP-XXX permanent.
4. Add the `AP-XXX → Article` anchor row in `.claude/agents/pattern-guard.md` so the new AP carries its consequence.
5. Record new APs during the **self-improvement loop** (CLAUDE.md § Self-Improvement Loop) — the loop that follows implementation is where recurring mistakes get codified.

---

## Re-scan after fixes

Pattern-guard runs are cheap. After applying fixes to AP-XXX matches:

1. Re-dispatch the agent with the SAME file list (or expand the list if your fixes touched new files).
2. Confirm the findings section is empty (`No anti-patterns detected.`) or contains only classified false-positives.
3. Only then proceed to the `.claude/agents/reviewer.md` pass.

Common reasons a re-scan still flags the same line:

- The fix changed the symptom but not the cause (e.g. renamed a variable the AP pattern doesn't care about).
- The fix introduced a different AP — pattern-guard now matches a sibling rule.
- The "fix" was a false-positive classification, not a code change — note this in the PR body so the reviewer does not re-flag.

If a match persists after two scan-fix cycles, escalate to the human reviewer — the AP rule may be too tight (registry needs adjustment) or the code may need a structural change beyond the AP's recipe.

---

## Common mistakes

| Mistake                                                            | Fix                                                                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Skipping pattern-guard before the reviewer pass                    | Run pattern-guard first. AP matches are cheap to fix; the same finding surfacing through the multi-agent reviewer costs another round-trip       |
| Applying every match without classifying                           | Read each match, open the file, compare against the AP's Problem field. Some are inapplicable — see [false-positive-triage](../false-positive-triage/SKILL.md) |
| Fixing pattern-guard matches by editing the agent definition       | Never. The agent is read-only on the registry. Add a new AP or remove a stale one in `docs/workflow/anti-patterns.md` itself                     |
| Skipping the article citation when reporting                       | Pattern-guard MUST cite the article. If the report is missing the citation, re-dispatch with the corrected prompt                                |
| Inventing new AP-XXX identifiers on the fly during a scan          | Only AP-IDs that exist in the registry are valid. If the agent invents one, that is a defect — flag to the human                                 |
| Renumbering or reformatting AP-001..AP-014 to "tidy" the registry  | Forbidden by the file's permanence rule. New work appends at AP-015+ in the existing schema; existing entries are immutable                      |

---

## Cross-references

- [pr-delivery](../pr-delivery/SKILL.md) — where this scan fits in the PR flow (before the multi-agent reviewer pass)
- [false-positive-triage](../false-positive-triage/SKILL.md) — how to handle close-but-not-quite matches
- [background-execution](../background-execution/SKILL.md) — judgement-call AP matches stop `/bg`; mechanical ones don't
- `docs/workflow/anti-patterns.md` — the registry of AP-XXX entries (source of truth; AP-001..AP-014, ongoing at AP-015+)
- `.claude/agents/pattern-guard.md` — the agent that gets dispatched; owns the `AP-XXX → Article` mapping
- `.claude/agents/reviewer.md` — the broader article-anchored review pass that runs after this scan
- `docs/CONSTITUTION.md` — the 10 articles cited in every match
