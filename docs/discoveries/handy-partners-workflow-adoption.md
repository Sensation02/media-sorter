# Discovery: Adopting Handy Partners' workflow improvements into media-sorter

Date: 2026-06-12
Status: research artefact (append-only). Not an approved spec — feeds a future epic.

## Why this exists

Handy Partners (HP) and media-sorter (MS) share a common workflow lineage (both generated
from HP's `docs/superpowers/templates/BOOTSTRAP.md`). Since the split, HP's workflow has
grown substantially. This document is the **most complete list** of what MS can borrow,
ranked by value and grouped so interdependent pieces are adopted together rather than
cherry-picked into inert fragments.

Stack gap that drives every adaptation note:
- HP: monorepo, NestJS + TypeORM + Postgres (`api/`) + Vite/React (`ui/`), Node 22 + **yarn** + Docker, multi-tenant RAG chatbot, web-deployed.
- MS: single desktop app, Tauri + **Rust** + React, **pnpm** + cargo, offline-first, ships **native installers**, no DB / no tenancy / no RAG / no job queue.

Legend: **[VERIFIED]** = confirmed by reading both repos this session. **[INFERRED]** =
deduced from MS CLAUDE.md prose (states intent, may not match current reality).

---

## A. Independent quick wins (adopt à la carte, any order)

These have no cross-dependencies. Each is shippable on its own.

### A1. Deterministic Claude Code hooks layer — `.claude/hooks/` + `settings.json` ⭐ highest value
- **[VERIFIED]** MS has **no `.claude/hooks/` directory and no committed `settings.json`** today. Every governance rule in MS CLAUDE.md is model-trust prose only.
- HP's thesis (from its hooks README): *"CLAUDE.md is read by the model and can be silently ignored. Hooks run deterministically: exit code 2 aborts. This moves 'rules I sometimes forget' from the trust-the-model layer into the infrastructure layer."*
- **Wiring** (`settings.json` uses portable `$CLAUDE_PROJECT_DIR`): PreToolUse:Bash → `pre-bash.sh`; PostToolUse:Edit|Write → `post-edit.sh`. **No `PreToolUse:Edit|Write` hook** (see decision below — HP's `pre-edit.sh` exists only for the B4-guard, which MS drops).
- **DECISION — drop the B4-guard / self-modification lock (user, 2026-06-12).** MS does **not** adopt HP's default-deny guard on safety-control files and has **no `MS_GUARDRAIL_UNLOCK` env var** — every file (`.claude/hooks/`, `.claude/settings*.json`, `CLAUDE.md`, `docs/CONSTITUTION.md`, `.claude/skills/`) is editable immediately. Concretely this means: omit `pre-edit.sh` and `guardrail-paths.sh` entirely, and drop `pre-bash.sh` **Rule 5** (Bash mutation of guardrail files). Rationale: aligns with Constitution Article III (Simplicity over cleverness) for a solo project with manual PR review. Trade-off to accept knowingly: in autonomous `/bg` / `feature-loop` runs the agent can now *technically* rewrite its own constraints (CLAUDE.md, hooks); the remaining safety net is the feature-loop **G gate** + **manual PR merge**, not a physical barrier. The protected-branch and force-push guards below are unaffected.
- **Port as-is:** protected-branch commit block + force-push guard (`pre-bash.sh` Rules 3 & 4 — HP and MS both use `staging`/`production`). These are independent of the dropped B4-guard.
- **MUST INVERT (policy is opposite):**
  - `pre-bash.sh` Rule 1: HP blocks `npm`/`pnpm` (yarn-only). MS must block `npm`/`yarn`/`bun` and **allow `pnpm` + `cargo`**.
  - `post-edit.sh` lockfile block: HP blocks `pnpm-lock.yaml`. MS **commits `pnpm-lock.yaml`** → invert to block `package-lock.json`/`yarn.lock`; consider guarding `Cargo.lock`.
  - npx whitelist → keep eslint/prettier/vite, drop yarn-isms; add cargo/tauri awareness.
- **Drop entirely:** all TypeORM/Postgres/`api/src/db/...` reminders in `post-edit.sh` (no DB in MS).
- **Hard prerequisite:** `jq` must be installed — both remaining hooks **fail-closed** (block everything) without it. Document in setup / Makefile.

### A2. Fix `release.yml` — changelog-driven release + Tauri artifact upload ⭐ highest actionability
- Resolves the live MEMORY item **EPIC-15 immutable-release conflict** + matches the noted "drop release-please for a single `gh release create`" intent.
- **Port the pattern from HP's `release.yml`:** version from manifest (`node -p "require('./package.json').version"`), `awk`-extract the matching `CHANGELOG.md` section, `gh release view` **idempotency guard** (re-run is a no-op), **fail-loud on empty notes** (forgotten `[Unreleased]` rename → exit 1), `--target $GITHUB_SHA` (pin to exact commit), `concurrency` with `cancel-in-progress: false`.
- **CRITICAL — do NOT copy flat:** HP's `release.yml` ships **zero artifacts** (notes-only; Docker deploys elsewhere). A Tauri release without `.dmg`/`.msi`/AppImage + updater `latest.json`/`.sig` is broken. **Bolt on a `tauri-apps/tauri-action` build-and-upload step** (matrix runners), OR let `release.yml` create the release and have `tauri-action` upload into it. This is the half HP's pattern doesn't cover.
- Version source for MS bumps three manifests in sync (`package.json` + `src-tauri/Cargo.toml` + `tauri.conf.json`), not one.

### A3. Extend the existing `make verify` gate
- **[VERIFIED]** MS already has `make verify`, but it is only `typecheck + lint` (explicitly "no tests").
- HP's `verify` = lint + build + test (the real pre-PR green gate). Extend MS's to the full gate: `pnpm lint` + `cd src-tauri && cargo fmt --check && cargo clippy && cargo test` (+ optionally `tauri build`). Aligns with CLAUDE.md imperative #4 ("define success, loop until verified") and the MEMORY rule "run full test suite before PR".
- Optional ergonomics from HP's Makefile: `kill-ports`, parallel `dev -j2`.

### A4. Agent-definition format pass (cheap, applies to all MS agents)
- **[VERIFIED]** HP gives every agent (a) an `ABSOLUTE PROHIBITIONS` block (hard overrides phrased to resist task-pressure, e.g. "NEVER run `git push`… No 'the task said to ship' exception"), and (b) uniform YAML frontmatter with `name` / `description` / `tools:` / `skills:`. MS agents are inconsistent — several have no frontmatter at all, none declare `tools:`.
- **Adopt:** the `ABSOLUTE PROHIBITIONS` block + complete frontmatter. **`tools:` scoping is a real safety win**, not cosmetic (e.g. review/adversary agents restricted to `Read, Bash, Grep, Glob` so they physically cannot edit).

### A5. Article-anchored findings in `reviewer` + `pattern-guard`
- HP's `reviewer` (12.5KB vs MS's 1.6KB) anchors every check to a Constitution article, has a "Severity by Article" table, and a doctrine: *"When a finding cannot be anchored to any article, it is at most a Suggestion — never a blocker."* This operationalizes blocker-vs-preference triage.
- HP's `pattern-guard` adds an **AP-XXX → Article** mapping column ("you didn't break a rule, you broke `<article>`, which means `<consequence>`").
- **Adopt the article-anchoring pattern**, swapping HP's 11 articles for MS's 10 (I. User files sacred, V. Type safety, VI. Reversibility, IX. Tests, …).

### A6. Zero-tolerance lint + per-dir lint-staged
- **[VERIFIED]** MS `lint` = `eslint .` (no `--max-warnings 0`); HP uses `eslint . --max-warnings 0`. Adopt the zero-warning gate. (MS already has `lint-staged` + `prepare: husky`.)

### A7. "Think Before You Code" reasoning framework for developer agents
- HP's backend/frontend-developer agents open with a checklist (TYPE SAFETY / ERROR PATHS / DATA CONSISTENCY / CONSISTENCY-WITH-EXISTING-CODE; frontend adds LIFECYCLE / EFFECT DEPENDENCIES + explicit decomposition rules with a component-size limit). Mostly stack-agnostic. The "grep for the analogous existing implementation before inventing a pattern" rule is especially valuable.

### A8. PR template enrichment
- HP's `PULL_REQUEST_TEMPLATE.md`: Summary / What's new / Test Plan / Out of scope. Adopt the structure; make the Test Plan reminder MS-specific (verify dry-run / undo / move-log per Articles I & II).

### A9. CI ergonomics (pattern-level, adapt to Rust/pnpm/Tauri)
- Lift from HP's `ci-*.yml`: path-filtered triggers, `concurrency` + `cancel-in-progress: true`, `timeout-minutes`, `needs`-chaining as the gate sequence, `$GITHUB_STEP_SUMMARY` build/release summary, "comment on the merged PR with release/deploy status".
- **Do NOT lift:** Docker multi-stage targets, Harbor registry, Portainer webhooks, `type=gha` buildx cache → MS wants `Swatinem/rust-cache` + pnpm-store cache and `tauri-action` on a runner matrix.

---

## B. The bundles (interdependent — adopt the whole bundle in order, or not at all)

HP's highest-value workflow assets form a connected web. Cherry-picking one piece yields
an **inert fragment**. Each bundle below lists its pieces in dependency order.

### B1. Adversarial pre-implementation review — `/attack-plan` ⭐ flagship capability MS entirely lacks
Adopt in this order (earlier pieces are prerequisites for later):
1. **Adversary agents** (read-only, `tools: Read, Bash, Grep, Glob`), each hunting gaps in ONE lens with a shared gap-report schema (`[G-n] severity / location / claim / evidence file:line / consequence / resolution`) and a hard rule "no gap without evidence — a file:line or article, no vibes":
   - Adopt nearly as-is: **`resilience-adversary`** (failure modes, partial failure, missing critical-path tests), **`integration-adversary`** (blast radius — greps real consumers of changed contracts).
   - Re-skin to MS concerns: **`dataflow-adversary`** (EXIF/GPS provenance, defensive parsing at boundaries), **`persistence-adversary`** → reframe as a **file-safety/reversibility** lens (Article VI; undo-log, move-log, atomic FS ops — "deleting a row vs deleting everything that pointed at it" maps to "moving a file vs orphaning its siblings").
   - Skip: **`rag-adversary`** (no RAG). Take only the path-traversal / fs-scope-escape idea from **`security-adversary`** (Tauri capability least-privilege, `fs:allow-*`), drop JWT/RBAC/tenant.
2. **`team-lead` Attack Synthesis Mode** — the synthesising 5th agent that dedupes, resolves contradictions between lenses, ranks by article-anchored severity, and emits a suggested plan diff. **Without this, the adversary reports are unusable.**
3. **`attack-plan` skill** — the dispatcher that right-sizes Quick / Standard / Deep fan-out and is read-only unless `--apply`. **Without this, the agents never get invoked.**

> Dependency: B1 is a hard prerequisite for B3 Phase 5 below.

### B2. Delivery & review skills (formalize what MS already gestures at)
1. **`pattern-guard-scan` skill** — dispatch + interpret wrapper around the `pattern-guard` agent; turns `[AP-XXX | Article Y]` matches into fix/false-positive/escalate decisions. Depends on a **populated** `anti-patterns.md` (see B4).
2. **`false-positive-triage` skill** — fully generic four-class taxonomy (real / false-positive / style / outdated) + one-commit-per-accepted-finding discipline. Codifies the existing MEMORY norm "triage false positives, never blindly apply".
3. **`pr-delivery` skill** — the develop-then-split delivery flow (atomic commits → pattern-guard-scan → review → triage → verify → push → PR body template → labels). Calls B2.1 and B2.2.
   - **ADAPTATION (carry MS's own preference):** MEMORY says MS prefers **single-PR cohesive epics** and **fast merge once CI is green**. HP's `pr-delivery` emphasizes multi-PR-by-default — **soften that** so the skill defaults to single cohesive PR for MS and treats multi-PR as the exception. Drop HP's GitHub-Projects board-card movement (MS has none).

### B3. The feature-loop — phased attended autonomous development ⭐ HP's most sophisticated artifact
A 12-phase (0–11) state machine driving one feature from intent to a **draft PR** (never merges), state in `docs/superpowers/loop/<feature>/state.json`. Adopt in order:
1. **`intent-capture` skill** (Phase 0) — elicits problem/DoD, scope in/out, touched surfaces, **risk surfaces**, **reversibility**, acceptance criteria into an `intent-brief.md`. Reversibility aspect maps directly to MS Article VI.
2. **A risk-classifier** — HP's `risk-classify.sh` flags `{auth, migration, rag, tenant}` deterministically and OR's with LLM judgment; doubles as a mid-implement tripwire. **Must be redesigned for MS** (no port): new surfaces = user-media write paths, `tauri.conf.json`/`capabilities/*.json` edits, `fs:allow-*` changes, irreversible FS operations, `#[tauri::command]` entry points.
3. **`background-execution` skill** — codifies what is safe under `/bg` (allowed/forbidden lists, stop conditions, pre-`/bg` checklist, named failure modes). MS **already has a `/bg` section** in CLAUDE.md to align with; swap the verify gate to MS's, drop the cross-tenant failure mode, frame around Articles I & VI.
4. **`feature-loop` skill** itself — orchestrates B3.1, B1 (Phase 5 "Harden" = bounded ≤3-round attack-fix loop on the plan+tests *before* code), the **G gate** (unconditional human STOP), **PARK** off-ramp, B2.3 for delivery. Risk tiering: any risk signal → ATTENDED; unsure → ATTENDED.
   - **Prerequisite chain:** needs B1 (attack-plan), B2 (pr-delivery + triage), B3.1–3.3, and a working risk-classifier. This is the capstone — adopt last.
   - **Note (B4-guard dropped, per A1 decision):** unlike HP — where the loop runs without the unlock var and is therefore *physically* unable to edit its own safety controls — MS's loop has no such barrier. Its self-modification safety net is the **G gate** + **manual PR merge** alone. Lean harder on those (e.g. keep the G gate unconditional, never auto-merge) to compensate.
   - Reality check from HP's own spike (`loop/spike/RESULTS.md`): native `/loop` is session-bound (dies on app close, no auto-resume) → only **attended** mode is viable; `/schedule` is the server-grade fallback.

### B4. Populated anti-pattern registry
- **[VERIFIED]** MS's `anti-patterns.md` has **0 `AP-` entries** (empty template); HP has **24 populated** entries (What / Where-glob / Source-PR / Bad / Good). The value is the *discipline of filling it from real PRs* — and B2.1/A5 depend on it being non-empty to be useful. Seed it from MS's own review history going forward.

### B5. User-facing leak gate (governance) — conditional
- HP pairs `docs/workflow/user-facing-denylist.md` (human-maintained term list: internal jargon, stack names, raw-error signatures) with a deterministic `leak-scan.sh` hook that scans user-facing surfaces (toasts, CHANGELOG, release notes, feat/fix headlines). "Deterministic scan is binding; LLM critic advisory; adding terms is a separate governance PR."
- **[VERIFIED]** MS has **no `user-facing-denylist.md`** → must be created. Relevant to MS (CHANGELOG headlines + in-app i18n strings are user-facing), and aligns with Constitution Article II (privacy) + the user-facing-commit-message rule. Medium priority; depends on creating the denylist file.

---

## C. Stack-bound — shape-maps (concept transfers, body must be rewritten for Rust/Tauri)

- **`crud-creation` skill** → becomes a **vertical-slice recipe for MS's own layout**: Rust domain struct (`domain/`) → IPC DTO (`<feature>/dto.rs`) → service (`service.rs`) → `#[tauri::command]` (`command.rs`) → `mod.rs`/`lib.rs` registration → React IPC binding. MS CLAUDE.md already prescribes this layout; the skill would formalize it. HP's 9 TypeScript templates are not portable — rewrite as Rust.
- **`error-handling` skill** → rewrite body to `Result<T, AppError>` + `thiserror` enum, no unjustified `unwrap()`, map errors at the IPC boundary into a typed discriminated union for React, severity-matched logging. The methodology rules ("every catch needs a recovery test", "audit every exit path") port verbatim. HP's i18n `messageKey` maps to MS's locale requirement.
- **Stack-scoped nested CLAUDE.md** — HP keeps `api/CLAUDE.md` + `ui/CLAUDE.md` loaded on demand so a single-stack session doesn't pay for the other stack's rules. MS could split into `src-tauri/CLAUDE.md` (Rust) + `src/CLAUDE.md` (React) with the root file staying lean. Token-efficiency win; medium priority.

---

## D. Deliberate divergences — do NOT adopt (these are regressions for MS's context)

- **GitHub Projects board (#5) + `project-board.md` GraphQL automation** — HP uses this *instead of* an epic/status index. MS deliberately uses `docs/specs/STATUS.md` + `epic-XX-*.md`, which fits a solo desktop project better. The GraphQL board automation is only useful **IF** MS ever adopts a Projects board — it is conditional, not a recommendation. **Do not "upgrade" away MS's epic tracking.**
- **No git worktrees** — HP deliberately avoids worktrees (uses `run_in_background` + file-scope separation). MS deliberately uses worktrees for isolation. Keep MS's approach.
- **Husky parity** — non-finding. **[VERIFIED]** both repos have only a committed `pre-commit` hook; neither has a committed `commit-msg`/commitlint (MS CLAUDE.md describes a commit-msg hook that is **not actually present** — that's aspirational prose, worth reconciling separately).

## E. Not applicable — no analogue in a single-user offline desktop app

- `tenant-feature-planning` skill, `database-specialist` agent, `migration-review` skill, `queue-job-creation` skill, TypeORM Makefile targets, Docker/Harbor/Portainer CI. Each carries at most a one-line generic principle (e.g. "never trust an auto-generated artifact blindly"; "long/cancellable work runs off the interactive path — for MS that's Rust async / `spawn_blocking` + IPC progress events, not a queue").
- `browser-testing.md` (dev-browser over CDP port 9333) — **verify applicability before adopting**: Tauri runs in a system webview (WKWebView/WebView2), not remote-debuggable over CDP by default, so HP's Chrome-debug flow likely does **not** transfer. Treat as "investigate", not "port".

---

## Suggested adoption sequencing

1. **A1 hooks layer** + **A2 release.yml/tauri-action** + **A3 verify** — infrastructure foundation; unblocks EPIC-15.
2. **A4–A8** agent/lint/PR-template format passes — cheap, high-leverage.
3. **B4 populated anti-patterns** + **A5 article-anchored review** + **B2 delivery/review skills** — review backbone.
4. **B1 attack-plan bundle** — new adversarial capability.
5. **B3 feature-loop** — capstone; requires everything above.
6. **C shape-maps** + **B5 leak gate** as needed.

Each item should still pass through MS's normal spec → approval gate (Constitution Article X) before implementation; this document is the input to that, not a substitute.

---

## Corrections (2026-06-12, post-spec adversarial review)

Append-only fixes to stale `[VERIFIED]` claims above, surfaced when EPIC-18's spec was
adversarially reviewed against the repo's *current* state. The lines above are left intact
(append-only research artefact); EPIC-18's spec carries the corrected baseline.

- **B4 "`[VERIFIED]` 0 `AP-` entries" was a FALSE NEGATIVE.** `anti-patterns.md` actually holds **AP-001..AP-014** in a live schema (`Problem / Why it's bad / Fix / First seen in`) — the earlier grep matched `### AP-` headings, but entries are `- **AP-001:**` bullets. The registry is **not empty**; B4 is "augment at AP-015+, never renumber", not "seed from empty". This also means `pattern-guard-scan` (B2) and article-anchored review (A5) already have a populated registry to consume.
- **A2 release.yml is largely already shipped (EPIC-15).** MS's `release.yml` already has the changelog-driven pattern (three-manifest version sync, `awk` CHANGELOG extract, fail-loud on mismatch, tag-level `git ls-remote` guard) **and** `tauri-apps/tauri-action` build-and-upload. The "HP notes-only / Tauri release broken" framing no longer matches the repo. Residual delta only: `concurrency (cancel-in-progress:false)`, `--target $GITHUB_SHA`, a **release-level** `gh release view` idempotency guard.
- **A3 the full green gate already exists.** `make check` = `verify test` (verify = typecheck + lint; `lint` already runs `cargo clippy -D warnings`); `make fmt-check` is a separate symmetric target. Do NOT widen `verify` (would double-run tests in `check`). The discovery's "extend `make verify` to include tests" is superseded by "point the discipline at the existing `make check` + `make fmt-check`".
- **CHANGELOG is NOT triggered by this adoption.** Constitution Article VII triggers a `[Unreleased]` entry only on **user-visible behavior**, which this dev-workflow epic has none of (Constitution outranks CLAUDE.md's type-based "every `feat` PR adds a bullet" rule).
