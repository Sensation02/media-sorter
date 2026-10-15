---
name: self-improvement-loop
description: Use after implementing a change on media-sorter and before delivery — re-read changed files end-to-end, fix typos / naming / dead imports, record recurring mistakes as AP-XXX, and verify the code does exactly what the spec asked. Triggers when implementation is done and you are about to split into commits, and whenever a recurring mistake should become an anti-pattern entry.
---

# Self-Improvement Loop

Run this after implementation, before splitting into commits / PRs (CLAUDE.md → Git Workflow: code → **self-improve** → split → …). It is mandatory — never skip it.

## Steps

1. **Re-read changed files end-to-end.** `git diff` (or `git diff --staged`), then open each changed file in full — not just the hunks. Context around a change often reveals the real issue.
2. **Fix the cheap stuff** — the checklist in `docs/workflow/implementation.md` § _Phase 3.5: SELF-IMPROVEMENT LOOP_ (typos, IPC-boundary naming, unused imports / `use` paths, magic values, missing defensive parsing, empty-string fallbacks, `unwrap()` without an invariant comment).
3. **Record recurring mistakes** — see _Recording a new anti-pattern_ below.
4. **Verify scope (Article IV).** Confirm the code does exactly what the spec asked — nothing speculative, no drive-by refactors. Remove anything extra.
5. **Verify it works.** `make check` + `make fmt-check`. "Should work" is not done.

Repeat 1–5 until a full re-read finds nothing — usually one or two passes.

## Recording a new anti-pattern

The one home for this procedure — `pattern-guard-scan` and `implementation.md` point here rather than restating it.

1. **Confirm it recurred.** A one-off bug is a bug; an AP is a mistake made a second time. One occurrence goes in the PR description, not the registry.
2. **Check it is not already there.** `grep -i` `docs/workflow/anti-patterns.md` for the symptom before writing a new entry — a near-duplicate makes both harder to match.
3. **Append at the next free number** using the live schema described at the top of `docs/workflow/anti-patterns.md` (short name, Problem, Why it's bad, Fix, First seen in — a PR number or commit SHA). **Never reuse or renumber an existing AP**: tests, PR descriptions and skills cite these numbers, so a renumber silently re-points every citation.
4. **Anchor it.** Add the `AP-XXX → Article` row in `.claude/agents/pattern-guard.md` so the new AP carries its consequence.
5. **Ship it in the same PR as the change that taught it, as its own commit** — subject in plain words, naming the mistake (`docs(workflow): record the silent EXIF fallback pattern`). **Keep the new AP's number out of the commit message, the PR title and the PR description of the PR that records it**: those are read by people with no registry to resolve it against, so the id is a dangling reference there even though it is the right anchor inside the registry. Docs travel with the change that made them true (Article VII); a follow-up PR is how the entry is still unwritten three weeks later.
6. **On a number collision, the merged one keeps the number.** An id is assigned only once it merges to `staging`. Two branches in flight both take the next free id, and the loser is whichever merges second — so when your `AP-XXX` is already on `staging` under another entry, renumber **yours** and re-point your own citations. Never renumber the merged one to make room.

## Then

Hand off to delivery: [pr-delivery](../pr-delivery/SKILL.md) splits the work into atomic commits, then runs the `pattern-guard` scan and the `reviewer` (both read-only), triages, and opens the PR (base `staging`). Merge is manual.

## Cross-references

- `docs/workflow/implementation.md` § _Phase 3.5_ — the detailed re-read checklist and the loop shape
- [pattern-guard-scan](../pattern-guard-scan/SKILL.md) — scans changes against the registry this loop writes to
- `docs/workflow/anti-patterns.md` — the AP-XXX registry
- `.claude/agents/pattern-guard.md` — the `AP-XXX → Article` mapping table
