# EPIC-18. Workflow automation & governance (Handy Partners adoption)

**Status:** draft
**Branch:** `feat/workflow-automation`
**Owner:** Vasyl Kaminskyi
**Last updated:** 2026-06-12

---

## Goal

Move the workflow rules that today live only as CLAUDE.md prose into deterministic infrastructure: a `.claude/hooks/` enforcement layer, residual hardening of the already-shipped changelog-driven `release.yml` (concurrency + commit pinning + release-level idempotency), discipline pointed at the existing `make check` + `make fmt-check` green gate, article-anchored review/anti-pattern tooling, a read-only adversarial pre-implementation review (`/attack-plan`), and an attended autonomous `feature-loop`. This is a developer-facing outcome — nothing in the shipped desktop app changes. The deliverable is that "rules I sometimes forget" stop depending on model trust and start failing closed at exit code 2.

## Clarifications

### Assumptions

- The Handy Partners (HP) workflow assets read in `docs/discoveries/handy-partners-workflow-adoption.md` are the source of truth for what is borrowable; the stack-gap adaptation notes there are authoritative over a flat copy of HP files.
- `jq` is installable on the owner's macOS dev machine and on CI runners; both surviving hooks fail-closed (block everything) without it, so its presence is a hard prerequisite documented in setup / Makefile.
- MS today has **no** `.claude/hooks/` directory and **no** committed `.claude/settings.json`; this epic creates both from scratch rather than editing existing ones. (A local, gitignored `.claude/settings.local.json` with a `permissions.allow` list co-exists and is not committed; hook wiring goes in the shared, committed `.claude/settings.json` and does not conflict with it.)
- MS `anti-patterns.md` **already holds AP-001..AP-014** (schema: `Problem / Why it's bad / Fix / First seen in`), each with a permanent identifier that must never be reused or renumbered (file rule, line 15). The registry is therefore **not empty** — B4 augments it going forward (AP-015+), it does not bootstrap it. (NOTE: the discovery doc's `[VERIFIED] 0 AP- entries` line, B4, is a stale research artefact; the doc is append-only so it is annotated here, not rewritten there.)
- The existing `make verify` is `typecheck + lint` and **`lint` already runs `cargo clippy -D warnings`** (via `lint-rust`). The full pre-PR lint + test gate the discovery wants **already exists as the `make check` target** (`check: verify test`), and format checks already live in a separate symmetric `make fmt-check` target (`prettier --check` + `cargo fmt --check`). A3 is therefore a small reconciliation, not a rewrite of `verify` — see the A3 decision.
- `staging` and `production` are the protected branches on both repos, so HP's protected-branch and force-push guards port without policy inversion.

### Open questions

| #   | Question                                                                                                                  | Proposed answer                                                                                                                                                              | Status   |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Q1  | Should `post-edit.sh` also guard `Cargo.lock`, or only block `package-lock.json` / `yarn.lock`?                           | Block `package-lock.json` / `yarn.lock` unconditionally (foreign lockfiles); treat `Cargo.lock` as committed-and-allowed, with a soft reminder only. MS commits both lockfiles. Path-matching is by **basename** (`Cargo.lock` anywhere) — the real file is at `src-tauri/Cargo.lock`, there is no root-level `Cargo.lock`, so a root-anchored match would make the reminder dead. | resolved |
| Q2  | CLAUDE.md describes a `commit-msg` / commitlint hook that is **not actually present** (discovery line 128). Reconcile here? | No. Out of scope for this epic — reconcile in a separate `chore` PR. This epic adds Claude Code hooks (`.claude/hooks/`), not git commit hooks (`.husky/`).                    | deferred |
| Q3  | Native `/loop` is session-bound (dies on app close, no auto-resume). Is unattended mode in scope for `feature-loop`?      | No. Only **attended** mode is viable; `/schedule` is noted as the server-grade fallback but not built here. Any risk signal → ATTENDED; unsure → ATTENDED.                     | resolved |
| Q4  | Does the `release.yml` rework belong in EPIC-15 or here?                                                                   | Here, but **narrowed**: EPIC-15 already shipped the changelog-driven pattern *and* `tauri-action` upload; EPIC-18 only adds the residual HP hardening EPIC-15 lacks — `concurrency`, `--target $GITHUB_SHA`, and a release-level `gh release view` idempotency guard. See A2 / Decision-2.              | resolved |
| Q5  | Should the leak gate (B5) ship in this epic or be deferred?                                                                | In scope but last (group 7), gated on creating `user-facing-denylist.md`. Medium priority; the deterministic scan is binding, the LLM critic advisory.                        | resolved |

### Edge cases

- `jq` not installed on the machine running a hook → both `pre-bash.sh` and `post-edit.sh` must fail-closed (block everything, non-zero exit) rather than silently passing.
- A `[Unreleased]` section that was never renamed to the new version → `release.yml` extracts empty notes and MUST fail loud (exit 1), not publish an empty release.
- A re-run of `release.yml` for a tag that already has a release → the `gh release view` idempotency guard makes it a no-op, not a duplicate or an error.
- An agent in an autonomous `/bg` run attempts any forbidden action — `git push` / `gh pr create` / `gh pr merge` / a user-media write / a `tauri.conf.json` **or `capabilities/*.json`** edit / `pnpm tauri dev` / a dependency upgrade or lockfile change / a STATUS.md status **transition** → forbidden; the work stops at a draft and waits for the human. (The canonical forbidden list is `docs/workflow/background-execution.md` + `CLAUDE.md` §/bg; this spec adds nothing to it — see Constraints.)
- A Bash call invoking `npm` / `yarn` / `bun` → `pre-bash.sh` Rule 1 blocks it; `pnpm` and `cargo` pass.
- A commit attempt directly on `staging` / `production`, or a force-push to either → `pre-bash.sh` Rules 3 & 4 block it (ported as-is from HP).
- An `attack-plan` / adversary agent attempts to edit a file → its `tools:` frontmatter (`Read, Bash, Grep, Glob` only) makes the edit physically impossible. **This invariant is delivered by the agent-creation subtasks S20–S22, not by A4/S10:** each new adversary agent file MUST be authored inline with the restrictive `tools:` frontmatter and the `ABSOLUTE PROHIBITIONS` block (A4/S10 only scopes the *existing* agents on disk; the adversaries do not exist until Group 5).

### Constraints

- **B4-guard / self-modification lock is dropped (owner decision, 2026-06-12).** MS adopts **no** default-deny guard on safety-control files and has **no `MS_GUARDRAIL_UNLOCK` env var**. Every governance file (`.claude/hooks/`, `.claude/settings*.json`, `CLAUDE.md`, `docs/CONSTITUTION.md`, `.claude/skills/`) is editable immediately. Concretely: omit `pre-edit.sh` and `guardrail-paths.sh`, omit any `PreToolUse:Edit|Write` hook, and drop `pre-bash.sh` Rule 5 (Bash mutation of guardrail files). Rationale lives in Decisions; aligns with Article III.
- **Background-session (`/bg`) limits.** The forbidden-action list is **defined canonically in `docs/workflow/background-execution.md` and `CLAUDE.md` §/bg; this spec adds nothing to it and maintains no second copy.** For convenience the full list is: no `git push`, no `gh pr create`, no `gh pr merge`, no writes to user media, no `tauri.conf.json` **or `capabilities/*.json`** edits, no `pnpm tauri dev`, no dependency upgrades / lockfile changes, and no STATUS.md status **transitions** autonomously. Outward-facing CI (`release.yml`, `ci.yml`) and STATUS transitions are human-gated. Articles I & VI apply.
- **Package managers: `pnpm` + `cargo` only.** Hooks must block `npm` / `yarn` / `bun`. This inverts HP's rule (HP is yarn-only and blocks `pnpm`).
- **MS commits both lockfiles.** `pnpm-lock.yaml` and `Cargo.lock` are committed; `post-edit.sh` blocks foreign lockfiles (`package-lock.json` / `yarn.lock`) instead — the inverse of HP, which blocks `pnpm-lock.yaml`.
- **No DB / no tenancy / no RAG / no job queue.** All TypeORM / Postgres / `api/src/db/...` reminders, the `rag-adversary`, and JWT/RBAC/tenant lenses are dropped, not ported.
- **No network egress of user metadata (Article II).** Nothing in this epic introduces a network path for user data; the leak gate exists to defend that boundary in user-facing copy.

### Documentation impact

- **No CHANGELOG `[Unreleased]` entries are added by this epic, despite the `feat( )` commit prefixes.** Article VII triggers the CHANGELOG requirement only when a PR "changes **user-visible behavior**" (Constitution, Article VII verbatim). This epic is entirely developer-facing — the Goal states "nothing in the shipped desktop app changes". The `feat( )` prefixes are accurate as commit *types* (new feature code is added), but they carry no CHANGELOG obligation here. Per the Precedence ordering the Constitution outranks CLAUDE.md's type-based "every `feat` PR adds a bullet" rule, so the user-visibility trigger wins. (A bullet like "add `.claude/hooks/pre-bash.sh`" would also be exactly the internal jargon this epic's own B5 leak gate is built to block.)
- **No nested CLAUDE.md exists yet for the C3 split.** `src-tauri/CLAUDE.md` and `src/CLAUDE.md` are absent today (verified), so S31 creates them; the root `CLAUDE.md` is trimmed, not replaced.

## Scope

The full adoption from `docs/discoveries/handy-partners-workflow-adoption.md`, every borrowable item:

**A. Independent quick wins**

- **A1** — `.claude/hooks/pre-bash.sh` (Rule 1 inverted: block `npm`/`yarn`/`bun`, allow `pnpm`+`cargo`; Rules 3 & 4 ported as-is: protected-branch commit block + force-push guard; Rule 5 dropped; **npx whitelist:** keep `eslint`/`prettier`/`vite`, drop HP's yarn-isms, add `cargo`/`tauri` awareness — port it adapted rather than copying HP verbatim or silently omitting it), `.claude/hooks/post-edit.sh` (block `package-lock.json`/`yarn.lock` by basename, soft-reminder on `Cargo.lock` matched by **basename** — the file is at `src-tauri/Cargo.lock`, never repo root — all TypeORM/DB reminders dropped), and `.claude/settings.json` wiring (`PreToolUse:Bash → pre-bash.sh`, `PostToolUse:Edit|Write → post-edit.sh`, portable `$CLAUDE_PROJECT_DIR`). No `pre-edit.sh`, no `guardrail-paths.sh`. `jq` documented as a prerequisite.
- **A2** — `.github/workflows/release.yml` hardening. **EPIC-15 already shipped the bulk of this pattern** (verified on `staging`): three-manifest version sync (`package.json` + `src-tauri/Cargo.toml` + `tauri.conf.json`), `awk`-extract of the matching `CHANGELOG.md` section, fail-loud `exit 1` on a version/notes mismatch, a tag-level `git ls-remote` guard, and the `tauri-apps/tauri-action` build-and-upload (matrix runners, `.dmg`/`.msi`/AppImage + updater `latest.json`/`.sig`). The **residual delta this epic adds** is only the three hardening elements HP's pattern has and MS's does not: (1) a `concurrency` block (`cancel-in-progress: false`), (2) `--target $GITHUB_SHA` commit pinning, and (3) a **release-level** idempotency guard (`gh release view`) — the current `git ls-remote` guard is tag-level and does not prevent a duplicate draft on re-run. Do not re-create or regress the already-shipped EPIC-15 pipeline.
- **A3** — `make verify` / `make check` reconciliation (NOT a rewrite of `verify`). The repo already has a deliberate two-tier design: `verify: typecheck lint` (quick pre-commit; `lint` already runs `cargo clippy -D warnings`) and **`check: verify test`** (the full pre-PR lint + test gate the discovery asks for *already exists*), with format checks isolated in a symmetric `fmt-check: fmt-check-js fmt-check-rust` target (`prettier --check` + `cargo fmt --check`). Folding `test` into `verify` would make `check` run the suite twice and collapse the two tiers; adding only `cargo fmt --check` to `verify` would also break the JS/Rust format-check symmetry. **Resolution:** keep `verify`/`check`/`fmt-check` as they are; this epic's contribution is to point the green-gate discipline at the existing `make check` (full lint+test) + `make fmt-check` (format) rather than inventing a parallel gate. Optional Makefile ergonomics only: `kill-ports`, parallel `dev -j2`. (`tauri build` is NOT part of the gate — see the assumption below.)
- **A4** — agent-definition format pass across the **10 existing** `.claude/agents/*` files: add an `ABSOLUTE PROHIBITIONS` block and uniform YAML frontmatter (`name` / `description` / `tools:` / `skills:`) to each; `tools:` scoping restricts the existing review agent (`reviewer`, `pattern-guard`) to `Read, Bash, Grep, Glob`. The **four adversary agents created later in Group 5 (S20–S22) do not exist yet at A4** — they MUST be authored *inline* with the same restrictive `tools:` frontmatter and `ABSOLUTE PROHIBITIONS` block (A4's conventions are a prerequisite every Group 5 agent-creation subtask satisfies itself). This is what makes the read-only-adversary edge-case invariant actually land on a delivering subtask.
- **A5** — article-anchored findings in `.claude/agents/reviewer.md` and `.claude/agents/pattern-guard.md`: anchor every check to a Constitution article, add a "Severity by Article" table, the doctrine "no anchor → at most a Suggestion, never a blocker", and an `AP-XXX → Article` mapping column. Swap HP's 11 articles for MS's 10. (Adopted in group 4 — review backbone.)
- **A6** — zero-tolerance lint: `eslint . --max-warnings 0` in the `lint` script.
- **A7** — "Think Before You Code" reasoning checklist in `.claude/agents/backend-developer.md` and `.claude/agents/frontend-developer.md` (TYPE SAFETY / ERROR PATHS / DATA CONSISTENCY / CONSISTENCY-WITH-EXISTING-CODE; frontend adds LIFECYCLE / EFFECT DEPENDENCIES + component-size limit; "grep for the analogous existing implementation before inventing a pattern").
- **A8** — `.github/PULL_REQUEST_TEMPLATE.md`: Summary / What's new / Test Plan / Out of scope, with the Test Plan reminder made MS-specific (verify dry-run / undo / move-log per Articles I & II).
- **A9** — `.github/workflows/ci.yml` ergonomics (single file — there is no `ci-*.yml` glob). **Most ergonomics already shipped** (verified on `staging`): `concurrency` + `cancel-in-progress: true`, `timeout-minutes`, `needs`-chaining, `Swatinem/rust-cache` + pnpm-store cache are all present. The **residual delta this epic adds** is only: (1) path-filtered triggers (`paths:`), (2) `$GITHUB_STEP_SUMMARY` output, and (3) a merged-PR status comment. Do not churn the already-working CI config; Docker/Harbor/Portainer/`type=gha` not lifted.

**B. The bundles (interdependent — adopt the whole bundle in order)**

- **B1** — adversarial pre-implementation review `/attack-plan`: read-only adversary agents (`.claude/agents/resilience-adversary.md`, `.claude/agents/integration-adversary.md` adopted nearly as-is; `.claude/agents/dataflow-adversary.md` re-skinned to EXIF/GPS provenance + boundary parsing; `.claude/agents/file-safety-adversary.md` reframing HP's `persistence-adversary` to Article VI reversibility; path-traversal / `fs:allow-*` idea folded in from `security-adversary`; `rag-adversary` skipped), shared gap-report schema `[G-n] severity / location / claim / evidence file:line / consequence / resolution`, `team-lead` Attack Synthesis Mode, and the `.claude/skills/attack-plan/` dispatcher skill (read-only unless `--apply`).
- **B2** — delivery & review skills: `.claude/skills/pattern-guard-scan/`, `.claude/skills/false-positive-triage/` (real / false-positive / style / outdated taxonomy, one-commit-per-accepted-finding), `.claude/skills/pr-delivery/` (develop-then-split flow, defaults to **single cohesive PR** per owner preference, multi-PR as the exception, GitHub-Projects board-card movement dropped).
- **B4** — **augment** the existing `docs/workflow/anti-patterns.md` registry. It already holds AP-001..AP-014 in the live schema `Problem / Why it's bad / Fix / First seen in`. **Keep that schema and continue numbering at AP-015+** — do NOT renumber or reformat the 14 existing entries (the file's permanence rule forbids it, and reformatting live governance content is the blast radius Article VI warns against). This is ongoing AP-XXX discipline, not bootstrapping; the "needs a populated registry" prerequisite for B2.1 (`pattern-guard-scan`) and A5 (article-anchored review) is **already satisfied**, so Group 4's internal order is preserved but its rationale is "continue the discipline", not "make the registry non-empty".
- **B3** — `feature-loop` capstone: `.claude/skills/intent-capture/` (Phase 0 `intent-brief.md` with risk surfaces + reversibility mapped to Article VI), an MS-specific `risk-classify.sh` (new surfaces = user-media write paths, `tauri.conf.json` / `capabilities/*.json` edits, `fs:allow-*` changes, irreversible FS ops, `#[tauri::command]` entry points), `.claude/skills/background-execution/` (allowed/forbidden lists swapped to MS's `/bg` rules, MS green gate = `make check` + `make fmt-check` — **not** `make verify`, which is the quick typecheck+lint tier only; framed around Articles I & VI), and `.claude/skills/feature-loop/` itself (12-phase 0–11 state machine, state in `docs/superpowers/loop/<feature>/state.json`, Phase 5 bounded ≤3-round attack-fix loop invoking B1, unconditional G gate, PARK off-ramp, B2.3 delivery, attended-only).
- **B5** — user-facing leak gate: create `docs/workflow/user-facing-denylist.md` (internal jargon, stack names, raw-error signatures) + `.claude/hooks/leak-scan.sh` scanning user-facing surfaces (toasts, CHANGELOG, release notes, feat/fix headlines). Deterministic scan binding; LLM critic advisory; adding terms is a separate governance PR. Aligns with Article II.

**C. Stack-bound shape-maps (concept transfers, body rewritten for Rust/Tauri)**

- **C1** — `.claude/skills/crud-creation/` rewritten as an MS vertical-slice recipe: `domain/` struct → `<feature>/dto.rs` → `service.rs` → `#[tauri::command]` in `command.rs` → `mod.rs` / `lib.rs` registration → React IPC binding. HP's 9 TypeScript templates not portable.
- **C2** — `.claude/skills/error-handling/` rewritten to `Result<T, AppError>` + `thiserror`, no unjustified `unwrap()`, IPC-boundary mapping into a typed discriminated union for React, severity-matched logging. Methodology rules ("every catch needs a recovery test", "audit every exit path") ported verbatim; HP's i18n `messageKey` maps to MS's locale requirement.
- **C3** — stack-scoped nested CLAUDE.md: split into `src-tauri/CLAUDE.md` (Rust) + `src/CLAUDE.md` (React), root file stays lean. Token-efficiency win.

## Decisions

### Drop the B4-guard / self-modification lock

MS does not adopt HP's default-deny guard on safety-control files and ships no `MS_GUARDRAIL_UNLOCK` env var; every governance file is editable immediately. Rationale: for a solo project with mandatory manual PR review, the physical barrier adds clever machinery that Article III (Simplicity over cleverness) tells us to avoid. **Trade-off accepted knowingly:** in autonomous `/bg` / `feature-loop` runs the agent can now *technically* rewrite its own constraints (CLAUDE.md, hooks, Constitution). The remaining safety net is the feature-loop **G gate** (unconditional human STOP) plus **manual PR merge** — not a physical lock. We lean harder on those to compensate: the G gate stays unconditional and nothing auto-merges.

**Bootstrap caveat (while EPIC-18 builds its own enforcement layer):** the G gate ships last (S28), so it cannot guard the subtasks that *construct* the enforcement layer — S01–S03 (hooks + `settings.json`), S26 (`risk-classify.sh`), S27 (background-execution skill), S33 (`leak-scan.sh`). During this epic's own `/bg` construction the **only** live safety net on those diffs is **manual PR review**. Therefore every hook / `settings.json` / classifier / skill diff in this epic MUST be human-inspected before merge — it must NOT be fast-merged on green CI, because a silently weakened hook (e.g. a `leak-scan.sh` that scans nothing, or a `settings.json` that wires no `PreToolUse:Bash`) would fail open while appearing fail-closed.

### `release.yml` — harden the already-shipped pipeline, do not re-create it

EPIC-15 already shipped MS's `release.yml` with three-manifest version sync, `awk` CHANGELOG extract, fail-loud on mismatch, a tag-level `git ls-remote` guard, and `tauri-apps/tauri-action` build-and-upload on matrix runners (`.dmg`/`.msi`/AppImage + updater `latest.json`/`.sig`) — verified on `staging` (commit `57a1071`). The earlier "HP is notes-only / a Tauri release without installers is broken" framing **no longer matches the repo** and is dropped. EPIC-18's job is narrow hardening only: add `concurrency` (`cancel-in-progress: false`), `--target $GITHUB_SHA` commit pinning, and a **release-level** idempotency guard (`gh release view`, stronger than the current tag-level guard). Re-creating the working pipeline would be a large-blast-radius change Article VI tells us to avoid. The MEMORY "EPIC-15 immutable-release conflict" is owned by EPIC-15's shipped infra; this hardening complements it.

### `make verify` / `make check` — use the existing two-tier gate, don't widen `verify`

The repo already encodes the gate the discovery wants. `verify: typecheck lint` is the quick pre-commit tier, and `lint` already runs `cargo clippy -D warnings` via `lint-rust`. The **full pre-PR lint + test gate already exists as `check: verify test`**, and format checks already live in their own symmetric `fmt-check: fmt-check-js fmt-check-rust` target (`prettier --check` + `cargo fmt --check`), deliberately kept out of `verify`/`check`. Widening `verify` to include `test` would make `check` (= `verify test`) run the suite twice; adding only `cargo fmt --check` to `verify` would break the JS/Rust format-check symmetry. **Decision:** do not modify the target topology — the green-gate discipline points at the existing `make check` (full lint+test) + `make fmt-check` (format), satisfying CLAUDE.md imperative #4 and the MEMORY "run full test suite before PR" rule with no parallel gate to keep in sync. `tauri build` is intentionally NOT in the gate (slow; covered by the release pipeline).

### `pr-delivery` defaults to single cohesive PR

HP's `pr-delivery` emphasizes multi-PR-by-default. MEMORY says MS prefers single-PR cohesive epics and fast merge once CI is green. The MS skill defaults to a single cohesive PR and treats multi-PR as the exception; HP's GitHub-Projects board-card movement is dropped (MS has no board).

### `feature-loop` is the capstone, adopted last

`feature-loop` depends on B1 (attack-plan), B2 (pr-delivery + triage), B3.1–3.3 (intent-capture, risk-classifier, background-execution), and a populated anti-pattern registry. Cherry-picking it earlier yields an inert fragment. It is sequenced last, after every prerequisite is in place, and runs attended-only (native `/loop` is session-bound).

## Subtasks

Atomic, ordered checklist — one item ≈ one commit — grouped to mirror the discovery doc's adoption sequencing. Tags: `[bg-safe]` = additive, autonomous-OK; `[human-gated]` = needs push/PR/merge, a STATUS transition, or touches outward-facing CI.

**Group 1 — A1 hooks + A3 verify (infrastructure foundation)**

- [x] S01 — `feat(config): add .claude/hooks/pre-bash.sh (block npm/yarn/bun, allow pnpm+cargo; protected-branch + force-push guards)` `[bg-safe]`
- [x] S02 — `feat(config): add .claude/hooks/post-edit.sh (block package-lock/yarn.lock, soft-reminder on Cargo.lock)` `[bg-safe]`
- [x] S03 — `feat(config): add .claude/settings.json wiring PreToolUse:Bash + PostToolUse:Edit|Write` `[bg-safe]`
- [x] S04 — `docs(workflow): document jq prerequisite for fail-closed hooks in setup + Makefile` `[bg-safe]`
- [x] S05 — `docs(workflow): document make check (full lint+test) + make fmt-check as the green gate; add kill-ports / dev -j2 ergonomics only` `[bg-safe]`

**Group 2 — A2 release.yml hardening + A9 CI residual ergonomics (most already shipped in EPIC-15)**

- [x] S06 — `ci(release): harden release.yml — add concurrency (cancel-in-progress:false) + --target $GITHUB_SHA pinning` `[human-gated]`
- [x] S07 — `ci(release): add release-level idempotency guard (gh release view) to release.yml` `[human-gated]`
- [x] S08 — `ci(config): add residual ci.yml ergonomics — path-filtered triggers, $GITHUB_STEP_SUMMARY, merged-PR status comment` `[human-gated]`

**Group 3 — A4, A6, A7, A8 format passes**

- [x] S09 — `docs(agents): add ABSOLUTE PROHIBITIONS block + uniform frontmatter to the 10 existing .claude/agents/*` `[bg-safe]`
- [x] S10 — `docs(agents): scope tools: for existing review agents (reviewer, pattern-guard) to Read, Bash, Grep, Glob` `[bg-safe]`
- [x] S11 — `build(config): set eslint --max-warnings 0 in the lint script` `[bg-safe]`
- [x] S12 — `docs(agents): add Think Before You Code checklist to backend- and frontend-developer agents` `[bg-safe]`
- [x] S13 — `docs(config): enrich .github/PULL_REQUEST_TEMPLATE.md with MS-specific Test Plan (dry-run/undo/move-log)` `[bg-safe]`

**Group 4 — B4 anti-patterns + A5 article-anchored review + B2 delivery skills (review backbone)**

- [x] S14 — `docs(workflow): augment anti-patterns.md at AP-015+ (keep existing Problem/Why/Fix/First-seen schema; never renumber AP-001..014)` `[bg-safe]`
- [x] S15 — `docs(agents): article-anchor reviewer.md (Severity by Article table, no-anchor→Suggestion doctrine)` `[bg-safe]`
- [x] S16 — `docs(agents): add AP-XXX→Article mapping column to pattern-guard.md` `[bg-safe]`
- [x] S17 — `feat(skills): add .claude/skills/pattern-guard-scan dispatch + interpret wrapper` `[bg-safe]`
- [x] S18 — `feat(skills): add .claude/skills/false-positive-triage (real/fp/style/outdated taxonomy)` `[bg-safe]`
- [x] S19 — `feat(skills): add .claude/skills/pr-delivery (single-PR default, multi-PR exception)` `[bg-safe]`

**Group 5 — B1 attack-plan bundle (adversarial capability)**

- [x] S20 — `feat(agents): add resilience-adversary + integration-adversary (inline tools: Read/Bash/Grep/Glob + ABSOLUTE PROHIBITIONS, shared gap-report schema)` `[bg-safe]`
- [x] S21 — `feat(agents): add dataflow-adversary (EXIF/GPS provenance, boundary parsing; inline read-only frontmatter)` `[bg-safe]`
- [x] S22 — `feat(agents): add file-safety-adversary (Article VI reversibility; fs-scope-escape lens; inline read-only frontmatter)` `[bg-safe]`
- [x] S23 — `feat(agents): add team-lead Attack Synthesis Mode (dedupe, rank by article severity, plan diff)` `[bg-safe]`
- [x] S24 — `feat(skills): add .claude/skills/attack-plan dispatcher (Quick/Standard/Deep, read-only unless --apply)` `[bg-safe]`

**Group 6 — B3 feature-loop capstone**

- [x] S25 — `feat(skills): add .claude/skills/intent-capture (Phase 0 intent-brief.md with risk + reversibility)` `[bg-safe]`
- [x] S26 — `feat(config): add MS-specific risk-classify.sh (media writes, tauri.conf/capabilities, fs:allow-*, irreversible FS, commands)` `[bg-safe]`
- [x] S27 — `feat(skills): add .claude/skills/background-execution (MS /bg allowed/forbidden lists, green gate = make check + make fmt-check)` `[bg-safe]`
  - NOTE: `docs/workflow/background-execution.md` currently claims `make verify` runs `cargo test`; that drifts from the real Makefile (`verify` = typecheck+lint only). S27's implementer MUST reconcile the skill's gate wording to `make check` + `make fmt-check` per the A3 decision, not copy the stale claim.
- [x] S28 — `feat(skills): add .claude/skills/feature-loop (12-phase state machine, Phase 5 attack-fix, G gate, PARK, attended-only)` `[bg-safe]`

**Group 7 — C shape-maps + B5 leak gate**

- [x] S29 — `feat(skills): add .claude/skills/crud-creation Rust/Tauri vertical-slice recipe` `[bg-safe]`
- [x] S30 — `feat(skills): add .claude/skills/error-handling (Result/AppError/thiserror, IPC boundary mapping)` `[bg-safe]`
- [x] S31 — `docs(config): split nested src-tauri/CLAUDE.md + src/CLAUDE.md; keep root lean` `[bg-safe]`
- [x] S32 — `docs(workflow): create user-facing-denylist.md (jargon, stack names, raw-error signatures)` `[bg-safe]`
- [x] S33 — `feat(config): add .claude/hooks/leak-scan.sh over user-facing surfaces (deterministic binding, LLM advisory)` `[bg-safe]`
- [ ] S34 — `docs(specs): mark EPIC-18 done; update STATUS` `[human-gated]`

## IPC contract

N/A — this epic introduces no Tauri command or event changes.

## Out of scope

- **Section D of the discovery doc — deliberate divergences.** GitHub Projects board (#5) + `project-board.md` GraphQL automation (MS keeps `docs/specs/STATUS.md` + `epic-XX-*.md`); dropping git worktrees (MS keeps worktrees for isolation). These are regressions for MS's context and are not adopted.
- **Section E of the discovery doc — no analogue in a single-user offline desktop app.** `tenant-feature-planning` skill, `database-specialist` agent, `migration-review` skill, `queue-job-creation` skill, TypeORM Makefile targets, Docker/Harbor/Portainer CI. Each carries at most a one-line generic principle, not a portable artifact.
- **`browser-testing.md` (dev-browser over CDP port 9333).** Tauri runs in a system webview (WKWebView/WebView2), not remote-debuggable over CDP by default. Treat as "investigate applicability", not "port" — out of scope until webview-CDP applicability is confirmed.
- **Reconciling the aspirational `commit-msg` / commitlint hook** that CLAUDE.md describes but that is not present (discovery line 128) — separate `chore` PR.
- **Unattended / scheduled autonomous runs.** `feature-loop` is attended-only; `/schedule` as a server-grade fallback is noted but not built.

## References

- Constitution articles touched: III (Simplicity over cleverness — B4-guard drop rationale), VI (Reversibility — file-safety adversary, feature-loop safety net, atomic commits, no churn of already-shipped release/CI pipelines), VII (Documentation — the spec + STATUS ship in the same PR; **CHANGELOG `[Unreleased]` is NOT triggered** because Article VII's trigger is user-visible behavior and this epic has none — see § Documentation impact), X (Specs precede code — this spec is the contract for the adoption).
- Related specs: EPIC-15 (Distribution pipeline) — `release.yml` rework ties in and unblocks the live MEMORY immutable-release conflict.
- Discovery / source of truth: `docs/discoveries/handy-partners-workflow-adoption.md`.
