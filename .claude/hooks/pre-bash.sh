#!/bin/bash
# Exit-code contract: 2 = block (stderr shown to Claude, operation aborted); 0 = allow.
# No `set -e`: a non-matching grep exits 1, which would falsely abort the script.

if ! command -v jq >/dev/null 2>&1; then
  echo "Hook error: jq is required but not installed (brew install jq). Blocking to fail closed." >&2
  exit 2
fi

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // ""')

[ -z "$command" ] && exit 0

if echo "$command" | grep -qE '^(npm|yarn|bun)[[:space:]]+(install|i|ci|add|remove|uninstall|update|upgrade|dlx|exec|x|create)([[:space:]]|$)'; then
  cat >&2 <<EOF
Blocked: project uses pnpm (JS) and cargo (Rust) only (CLAUDE.md > Package Manager).

Instead of '$command' use:
  pnpm install
  pnpm add <pkg>          # runtime dependency
  pnpm add -D <pkg>       # dev dependency
  pnpm remove <pkg>
  cargo add <crate>       # Rust crate (run inside src-tauri/)
EOF
  exit 2
fi

if echo "$command" | grep -qE '^npx[[:space:]]'; then
  if ! echo "$command" | grep -qE '^npx[[:space:]]+(eslint|prettier|vite|tsc)([[:space:]@]|$)'; then
    cat >&2 <<EOF
Blocked: 'npx' is only allowed for: eslint, prettier, vite, tsc.

Command: '$command'

If you need another package:
  - Permanent: add as a devDependency with 'pnpm add -D <pkg>'
  - One-off:   extend the whitelist in .claude/hooks/pre-bash.sh (and update README.md)
EOF
    exit 2
  fi
fi

if echo "$command" | grep -qE '^git([[:space:]]+-C[[:space:]]+\S+)*[[:space:]]+commit([[:space:]]|$)'; then
  repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
  if [ -n "$repo_root" ]; then
    branch=$(git -C "$repo_root" branch --show-current 2>/dev/null || echo "")
  else
    branch=""
  fi
  if [ "$branch" = "staging" ] || [ "$branch" = "production" ]; then
    cat >&2 <<EOF
Blocked: direct commits to '$branch' are forbidden.

Changes must go through a feature/fix branch -> PR -> manual merge.
Create a new branch:
  git checkout -b feat/<scope>-<desc>
  git checkout -b fix/<scope>-<desc>
EOF
    exit 2
  fi
fi

if echo "$command" | grep -qE '^git[[:space:]]+push[[:space:]]+.*(--(force|force-with-lease)([[:space:]]|$)|-f([[:space:]]|$))'; then
  if echo "$command" | grep -qE '(^|[[:space:]])(staging|production)([[:space:]]|$)'; then
    cat >&2 <<EOF
Blocked: force push to staging/production is forbidden (overwrites other commits).

If you genuinely need to rewrite history, coordinate first.
EOF
    exit 2
  fi
  current_branch=$(git branch --show-current 2>/dev/null || echo "")
  if [ "$current_branch" = "staging" ] || [ "$current_branch" = "production" ]; then
    cat >&2 <<EOF
Blocked: force push to '$current_branch' is forbidden (overwrites other commits).

If you genuinely need to rewrite history, coordinate first.
EOF
    exit 2
  fi
fi

exit 0
