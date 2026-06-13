---
name: false-positive-triage
description: Use when classifying findings from any automated review — `.claude/agents/reviewer.md` output, `.claude/agents/pattern-guard.md` AP matches, ESLint/clippy complaints, or static-analysis suggestions — before applying any fix. Triggers whenever an automated tool reports an issue and the question "should I just apply this?" is on the table. Prevents the most common rework cycle: blindly applying every suggestion, then reverting the breakages it introduces.
---

# False-Positive Triage

## Overview

Automated review tools produce findings. Some are real defects, some are false positives, some are style preferences with no basis in the project's rules, some are outdated rules that contradict newer conventions. Blindly applying every suggestion wastes time AND can introduce real bugs — the suggestion looked right but missed context the tool couldn't see.

**Core principle:** never apply a review finding without understanding it. Triage first — fix second.

## When to Use

Use when:
- The `reviewer` agent (`.claude/agents/reviewer.md`) returned a findings list (`critical` / `recommended` / `style preference`)
- A `pattern-guard` scan (`.claude/agents/pattern-guard.md`) returned `[AP-XXX | Article Y]` matches (the "is this really the Bad example?" question)
- A subagent verification reported gaps in a skill or doc
- An external tool (ESLint, clippy, type-checker, security scanner) flagged something that looks debatable
- Code review feedback (human or automated) arrives and you're about to start "addressing" it

Do NOT use when:
- The finding is mechanical and clearly correct (`eslint --fix`, `prettier`, `cargo fmt`, a typo) — just apply it
- The finding has already been classified and you're acting on the classification

---

## The four classifications

| Class | Action | Example |
|---|---|---|
| **Real issue** | Fix immediately, commit separately | Missing null guard on EXIF data, wrong type, swallowed `Result`, unhandled promise rejection |
| **False positive** | Ignore. If recurring, document the pattern in memory | Tool flagging a justified `unwrap()` whose invariant is documented one line above; pattern-guard matching close-but-not-quite |
| **Style preference** | Ignore unless it contradicts CLAUDE.md or the relevant skill | Reviewer prefers different naming, comment style, file organisation |
| **Outdated rule** | Ignore, update the rule if it recurs | Rule conflicts with a newer project convention; spec was migrated but the tool reads the old one |

---

## How to detect false positives

Apply the four checks below to every finding. If ANY answer is "no", the finding is not yet "real" — re-classify.

### 1. Does the proposed fix actually improve correctness?

Open the cited file at the cited line. Read the code in context — the surrounding 20 lines, the calling sites if relevant, the data shape that flows through.

- ✅ Correctness improvement: the fix prevents a possible runtime error, removes a real type unsafety, plugs a real reversibility/move-log gap
- ❌ Cosmetic: the fix changes how the code reads without changing what it does

### 2. Does the finding contradict an existing project convention?

Check `.claude/CLAUDE.md`, the relevant skill, and `docs/specs/` for the area the finding touches.

- If CLAUDE.md says "use `chrono`, never `SystemTime::now()`" and the tool flagged a `chrono` call — false positive, the tool doesn't know our rule
- If the relevant skill prescribes the exact pattern the tool flags — false positive, follow the skill
- If the project has an established way of doing X and the tool wants Y — style preference at best

### 3. Does the finding match runtime behaviour, or only static analysis?

Some tools flag patterns that LOOK risky but are safe in this codebase's runtime.

- A bounded `unwrap()` whose invariant is documented in an adjacent comment — CLAUDE.md allows `unwrap()` with a justifying comment; the tool is conservative
- EXIF / GPS defensive parsing that already guards `NaN` / `None` at the boundary before the value is used — the tool flags the raw access, missing the upstream guard
- A `#[allow(clippy::...)]` with a stated rationale — the suppression is deliberate, not an oversight
- React `useEffect` without a deps array flagged — sometimes intentional ("run on every render")

For runtime-only patterns, the fix is to add a clarifying comment (or a justified suppression), NOT to silence the tool blindly.

### 4. Is this finding recurring?

If the same false positive shows up three times, document it:

- Add a memory entry describing the pattern and why the tool keeps mis-firing
- If the tool has a suppress mechanism (`// eslint-disable-line` with a reason, a `#[allow(...)]` with a rationale comment) — use it with an explanation
- If it's pattern-guard mis-matching a registry AP, propose a registry tightening in `docs/workflow/anti-patterns.md` (keep the `Problem / Why it's bad / Fix / First seen in` schema; never renumber existing entries)

---

## Decision flowchart

```
For each finding:

  Read the cited file at the cited line
        │
        ▼
  Does the proposed fix actually improve correctness?
        ├── no  → False positive OR Style preference (decide based on whether the
        │         existing code is "less correct" or just "less to the reviewer's taste")
        │
        └── yes
              │
              ▼
        Does it contradict CLAUDE.md, a skill, or an established project convention?
              ├── yes → Outdated rule (in the tool) OR Style preference
              │
              └── no
                    │
                    ▼
              Does it match runtime behaviour, or only static analysis?
                    ├── static-only → False positive
                    │
                    └── runtime-matching → REAL ISSUE → fix immediately,
                                            commit separately
```

---

## Commit discipline for accepted findings

Real-issue fixes get their own commit per logical group:

```
fix(exif): guard missing GPS tag in date extraction (review finding)
fix(ui): handle null location in MonthFolderCard (review finding)
```

This keeps the diff readable for re-review and makes review-found fixes distinguishable from in-flight implementation work in `git log`.

Do NOT batch all review fixes into one mega-commit. Triage each, fix each, commit each.

---

## When to escalate

Escalate to the human (or pause `/bg` and wait) when:

- The "correctness improvement" question requires understanding business logic the reviewer doesn't have access to
- The finding contradicts CLAUDE.md AND the contradiction looks intentional (maybe CLAUDE.md is wrong?) — Constitution amendments are not unilateral
- The same false positive recurs in a context where suppression is awkward — the tool may need configuration changes
- The `reviewer` agent and `pattern-guard` disagree about the same line — usually means the AP registry needs tightening

Escalation example: "Pattern-guard flagged `[AP-XXX | Article V] src-tauri/src/scanning/service.rs:42 — raw unwrap on EXIF parse`. I checked: the `unwrap()` cannot panic here because the value is guarded by a `matches!(tag, Some(_))` three lines up, and the invariant is documented in the adjacent comment CLAUDE.md requires. Possible false positive — confirm before I rewrite it into a `?` propagation?"

---

## What NOT to do

| Anti-pattern | Why it hurts |
|---|---|
| Apply every reviewer finding mechanically | Each false-positive fix that introduces a regression costs more than the original finding saved |
| Skip the triage step on pattern-guard matches | Pattern-guard is pattern-matching; some matches are close-but-not-quite. Reading the Bad example in the registry is required |
| Argue with the tool in chat instead of in code | If suppression is needed, write the suppression comment; if the rule is wrong, update the rule. Don't leave the disagreement undocumented |
| Treat reviewer style preferences as gospel | The team's style is encoded in CLAUDE.md and the skills. Reviewer suggestions outside that scope are negotiable |
| Mark a finding "false positive" without saying why | The next reviewer will hit the same finding and re-debate. Document the reasoning in the PR comment or in memory |

---

## Cross-references

- [pr-delivery](../pr-delivery/SKILL.md) — where this triage step lives in the standard delivery flow
- [pattern-guard-scan](../pattern-guard-scan/SKILL.md) — pattern-guard matches go through the same triage
- `docs/workflow/anti-patterns.md` — the registry; consult the Problem / Why it's bad / Fix examples when triaging AP matches
- `.claude/CLAUDE.md` — the conventions reviewer findings should be checked against
- `docs/CONSTITUTION.md` — when a reviewer finding seems to contradict the Constitution, the Constitution wins
```
