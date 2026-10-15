# Skill & Agent Authoring Rubric

The project rubric for **what** a good skill (`.claude/skills/*/SKILL.md`) or agent
definition (`.claude/agents/*.md`) contains. The mechanics of authoring — file
layout, frontmatter, the `SKILL.md` shape — belong to the
`superpowers:writing-skills` and `skill-creator` skills; this file is the content
layer on top of them.

The six checks below are distilled from the [Claude Code prompt-library
patterns](https://code.claude.com/docs/en/prompt-library) ("what makes these
prompts work"), reframed from _how a human prompts Claude_ to _how our skills
instruct the agent_. They are a **checklist, not a mandate** — a small skill may
need only two or three. Each anchors to `docs/CONSTITUTION.md` where a check
enforces an article.

## The six checks

1. **Outcome over steps.** State the goal and the success criterion so the agent
   adapts to the real code, not a click-by-click script that rots. A _recipe_
   skill may still prescribe order and layer responsibilities — keep that to the
   durable contract (the invariant), not incidental paths that drift. Exemplar:
   `crud-creation` fixes the layer order of a vertical slice, not file contents.
   [Article III]

2. **Built-in self-check.** Name the concrete command or gate the agent runs to
   prove it is done — `make check` + `make fmt-check`, a red test that must go
   green. A skill with no verification step ratifies whatever the agent produced.
   Exemplars: `background-execution`'s green gate, `reviewer` reporting the
   `make check` result. [Article IX]

3. **Point at a reference.** Point at a template or an existing exemplar to match
   instead of inlining boilerplate that drifts from the codebase. Exemplars:
   `src-tauri/src/scanning/` as the shape of a backend feature module; the
   `attack-plan` gap-report schema kept in one home. [Article III]

4. **Measurable done.** Make "done" unambiguous — a gate, a named test, a green
   command — never "looks good". Exemplar: `pr-delivery`'s final checklist.
   [Article IX]

5. **Work from the artifact.** Have the agent read the real source — the diff, the
   log, the failing test output, the real EXIF dump — not a description of it.
   Exemplars: `reviewer` and `pattern-guard` (the working diff), `attack-plan`
   (the plan file, or an explicit coverage note when there is none).

6. **Specify the output shape.** Define the deliverable's shape — a finding line
   (`[file:line | Article Y]`), a report layout, an **Explicitly cleared** section
   — so results are consistent, checkable, and can be handed to the next lens.
   Exemplars: `reviewer` output, `pattern-guard` `[AP-XXX | Article Y]` citations.

A skill or agent that touches `src-tauri/` also carries the Article VIII
obligation from `src-tauri/CLAUDE.md` — explain new Rust syntax, ownership and
macros to the human — and must not drop it for brevity.

## When a hook enforces the same rule

A hook and a prompt act at different moments, so a rule a hook enforces still
gets one line in the agent's prompt — the rule and its reason — and nothing more.

- **The line is for the moment before the hook fires.** A guard stops the tool
  call, after the agent has already planned the work without the rule. The line
  puts the rule in front of it while it plans, and saves the blocked attempt —
  and the workaround an agent reaches for when it does not know why it was stopped.
- **What the hook cannot see stays in the prompt.** A regex hook matches shapes,
  not intent; for whatever its pattern cannot express, the prompt line is the
  only safeguard.
- **The mechanics stay in the hook and its README.** Patterns, extensions, paths
  and exit codes copied into several agent files drift at the hook's next change,
  and the block message already tells the agent what to do instead.

The worked example in this repo is the research privacy model (Article II):

```text
# In the prompt — the rule and the reason (.claude/agents/researcher.md)
- NEVER put user data into a web query (WebSearch / WebFetch): no media file paths,
  file names, GPS coordinates, or EXIF-extracted values. … (Article II).

# In the hook — the mechanics (.claude/hooks/pre-web.sh, documented in .claude/hooks/README.md)
block: a filesystem path, a media filename (*.jpg, *.heic, *.mov, …), a GPS coordinate pair
```

The prompt names no regex; the hook names no reason beyond its block message.
EXIF-extracted values that are not paths, filenames or coordinates are exactly
what the hook cannot see — so the prompt line carries them.

Why: the hook catches the plan that went wrong; the line in the prompt is what
makes the plan right, and neither can do the other's job.

## When NOT to write a skill

Over-skilling (a skill per ad-hoc prompt) is a scope-discipline failure
(Article IV) and a maintenance tax. Do **not** add a skill when:

- **It is a one-off ad-hoc prompt.** "explain this code", "what breaks if I delete
  X", "commit with a generated message", "resolve these merge conflicts" — good
  prompts to type, not skills to maintain.
- **A built-in already covers it.** The `Explore` agent (search), `/init` +
  `CLAUDE.md` (orientation), and native git already serve most discovery needs. A
  skill that wraps them adds indirection, not leverage.
- **It would duplicate an existing skill or doc.** Before adding one, search
  `.claude/skills/`, `.claude/agents/` and `docs/workflow/` for the same contract
  (CLAUDE.md → _Deduplication before creation_). Two homes for one procedure drift
  apart; keep one and point at it.

A skill earns its place when the task **recurs**, has a **non-obvious contract**
(order, gates, boundaries) worth encoding once, or must run **the same way every
time**. If none of those hold, leave it an ad-hoc prompt.

## See also

- Skills: [`.claude/skills/`](../../.claude/skills/) · agents: [`.claude/agents/`](../../.claude/agents/)
- Hooks and their rules: [`.claude/hooks/README.md`](../../.claude/hooks/README.md)
- Anti-pattern registry: [`anti-patterns.md`](./anti-patterns.md)
- `superpowers:writing-skills`, `skill-creator` — the authoring mechanics
