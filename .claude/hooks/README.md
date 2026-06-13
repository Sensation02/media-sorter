# Claude Code Hooks

Deterministic checks executed by the Claude Code harness (no LLM involved) on tool
events. Wiring lives in `.claude/settings.json`; the scripts live in this folder.

## Why hooks instead of CLAUDE.md reminders?

CLAUDE.md is prose read by the model — it can be silently ignored or forgotten under
load. Hooks run deterministically: an exit code of `2` aborts the operation regardless
of what the model intended. This moves "rules I sometimes forget" out of the
trust-the-model layer and into the infrastructure layer, where they fail closed.

## Exit-code contract

| Exit code | Meaning |
|---|---|
| `0` | Allow (stderr, if any, is shown to Claude as informational) |
| `2` | **Block** (stderr shown as an error, the downstream tool call is aborted) |
| Other non-zero | Hook error — treated as an infrastructure failure, does NOT guarantee a block |

**Only exit `2` guarantees the operation is aborted.** Never rely on exit `1` to block.

The scripts intentionally do not use `set -e`: a non-matching `grep` exits `1`, which
under `set -e` would abort the script with a non-blocking error code instead of falling
through to the next rule.

## `jq` is a hard prerequisite (fail-closed)

Both hooks parse the tool-input JSON from stdin with `jq`. If `jq` is missing, each hook
prints an error to stderr and `exit 2` (block) rather than passing the operation through.
Install it once: `brew install jq` (macOS). Without it, every Bash command and every
Edit/Write is blocked — deliberately, so a missing dependency cannot silently disable the
guards.

## Active hooks

### `pre-bash.sh` — PreToolUse:Bash

| Rule | Action |
|---|---|
| `npm` / `yarn` / `bun` package ops (`install`, `i`, `ci`, `add`, `remove`, `uninstall`, `update`, `upgrade`, `dlx`, `exec`, `x`, `create`), first-token anchored | block |
| `npx <tool>` outside the whitelist (`eslint`, `prettier`, `vite`, `tsc`) | block |
| `git commit` on branch `staging` or `production` (handles `git -C <path> commit`) | block |
| `git push --force` / `--force-with-lease` / `-f` targeting `staging` / `production`, plus a bare force-push while the current branch is protected | block |

`pnpm` and `cargo` are explicitly allowed — they are never matched by Rule 1.

### `post-edit.sh` — PostToolUse:Edit\|Write

| Trigger (matched by **basename**) | Action |
|---|---|
| `package-lock.json` or `yarn.lock` written | block (foreign lockfile) |
| `Cargo.lock` written | reminder only (`exit 0`) — keep it committed and in sync |

`pnpm-lock.yaml` is explicitly allowed — MS commits `pnpm-lock.yaml` and `Cargo.lock`.

## MS inversions vs Handy Partners (HP)

These hooks are structurally borrowed from HP but invert HP's stack policy:

- **Package manager.** HP is yarn-only and blocks `pnpm`. MS is pnpm + cargo only and
  blocks `npm` / `yarn` / `bun` instead.
- **Lockfiles.** HP blocks `pnpm-lock.yaml`. MS blocks the foreign `package-lock.json` /
  `yarn.lock` and treats both `pnpm-lock.yaml` and `Cargo.lock` as committed-and-allowed.
- **npx whitelist.** HP's yarn-isms (`shadcn`, `lint-staged`) are dropped; MS keeps
  `eslint` / `prettier` / `vite` / `tsc`.

## What is deliberately NOT adopted: the B4-guard

MS does **not** adopt HP's B4-guard / self-modification lock and ships **no
`MS_GUARDRAIL_UNLOCK` env var**. There is no `pre-edit.sh`, no `guardrail-paths.sh`, no
`PreToolUse:Edit|Write` hook, and no Bash-mutation block on governance files. Every
governance file (`.claude/hooks/`, `.claude/settings*.json`, `CLAUDE.md`,
`docs/CONSTITUTION.md`, `.claude/skills/`) is editable immediately.

Rationale (owner decision, per `docs/specs/epic-18-workflow-automation.md`): for a solo
project with mandatory manual PR review, a physical default-deny lock is clever machinery
that Article III (Simplicity over cleverness) tells us to avoid. The accepted trade-off is
that an autonomous run can technically rewrite its own constraints; the safety net is
**manual PR review** plus the feature-loop **G gate** (unconditional human STOP) — not a
physical lock. Nothing auto-merges.

## Test locally

```bash
# Block (expect exit 2):
echo '{"tool_input":{"command":"npm install express"}}' | .claude/hooks/pre-bash.sh
echo '{"tool_input":{"command":"yarn add lodash"}}'     | .claude/hooks/pre-bash.sh
echo '{"tool_input":{"command":"npx some-tool"}}'       | .claude/hooks/pre-bash.sh
echo '{"tool_input":{"file_path":"/p/package-lock.json"}}' | .claude/hooks/post-edit.sh

# Allow (expect exit 0):
echo '{"tool_input":{"command":"pnpm install"}}'        | .claude/hooks/pre-bash.sh
echo '{"tool_input":{"command":"cargo add serde"}}'     | .claude/hooks/pre-bash.sh
echo '{"tool_input":{"command":"npx eslint ."}}'        | .claude/hooks/pre-bash.sh
echo '{"tool_input":{"file_path":"/p/pnpm-lock.yaml"}}' | .claude/hooks/post-edit.sh
```

## Dependencies

- `bash` 3.2+ (ships with macOS)
- `jq` for stdin JSON parsing — `brew install jq`
- `git` for branch detection (Rules 3 & 4)

## Personal hooks

To add a hook for yourself only (not the team), put it in `.claude/settings.local.json`.
That file is gitignored; the shared hook wiring lives in the committed `.claude/settings.json`.
