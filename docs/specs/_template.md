# EPIC-XX. <Short title>

**Status:** draft | in progress | done
**Branch:** `<feat|fix>/<scope>-<slug>`
**Owner:** <agent or person>
**Last updated:** YYYY-MM-DD

> Copy this file to a new `epic-XX-<slug>.md` and fill every section. Delete the guidance blockquotes (like this one) before submitting. Do not edit `_template.md` to track work.

---

## Goal

> One or two sentences. What outcome does this epic deliver? Phrase as user-visible result, not implementation detail.
> Bad: "Refactor the scanner module."
> Good: "Let the user pick a folder and see how many photos and videos it contains."

<fill in>

## Clarifications

> Borrowed from spec-kit's `Clarify` step. Surface every assumption, ambiguity, and edge case **before** writing the Decisions section. Each clarification has: a question, a proposed answer, and a status. Do not move to Decisions until every clarification is `resolved` or explicitly deferred.
>
> Use the table below. Add rows freely. Delete this guidance block when done.

### Assumptions

> Things you are taking for granted. If any turn out false, the spec needs revision.

- <assumption 1>
- <assumption 2>

### Open questions

| #   | Question                                         | Proposed answer                | Status                |
| --- | ------------------------------------------------ | ------------------------------ | --------------------- |
| Q1  | <e.g. What happens when EXIF date is missing?>   | <e.g. Fall back to file mtime> | open / resolved / deferred |
| Q2  | <e.g. Are HEIC files first-class on Linux?>      | <e.g. Yes, via libheif>        | open / resolved / deferred |

### Edge cases

> Concrete failure scenarios the implementation must handle. Used later as test cases.

- <e.g. Source folder is empty>
- <e.g. File has GPS coordinates 0,0 (Null Island)>
- <e.g. Two files share the same target name after sort>

### Constraints

> Hard limits dictated by the Constitution, platform, or external systems.

- <e.g. No network calls (Article II)>
- <e.g. Original file MUST remain until user confirms (Article I)>

## Scope

> Bullet list of what this epic builds. Be specific — file paths, modules, IPC commands.

- <bullet 1>
- <bullet 2>

## Decisions

> Resolved technical choices with rationale. Each decision answers a Clarification. Format: `### <Decision title>` then 1–3 sentences of rationale.

### <Decision 1 title>

<rationale>

### <Decision 2 title>

<rationale>

## Subtasks

> Atomic, ordered checklist. Each item should map to one commit. Strike-through (`~~item~~`) when superseded; check (`- [x]`) when done.

- [ ] <subtask 1>
- [ ] <subtask 2>
- [ ] <subtask 3>

## IPC contract (if applicable)

> Tauri command and event signatures touched by this epic. Omit the section if no IPC changes.

| Command | Input | Output | Notes |
| ------- | ----- | ------ | ----- |
|         |       |        |       |

| Event | Payload |
| ----- | ------- |
|       |         |

## Out of scope

> Things explicitly NOT in this epic. Reduces drive-by edits and clarifies follow-up work.

- <out-of-scope item 1>
- <out-of-scope item 2>

## References

- Constitution articles touched: <e.g. I, V>
- Related specs: <e.g. EPIC-04, EPIC-07>
- External docs: <links if any>
