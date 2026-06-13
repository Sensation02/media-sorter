#!/bin/bash
# Exit-code contract: 2 = block (stderr shown as error, edit treated as failed); 0 = allow.
# No `set -e`: a non-matching grep exits 1, which would falsely abort the script.

if ! command -v jq >/dev/null 2>&1; then
  echo "Hook error: jq is required but not installed (brew install jq). Blocking to fail closed." >&2
  exit 2
fi

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

[ -z "$file_path" ] && exit 0

base=$(basename "$file_path")

if [ "$base" = "package-lock.json" ] || [ "$base" = "yarn.lock" ]; then
  cat >&2 <<EOF
Blocked: '$file_path' is a foreign lockfile. The project uses pnpm + cargo only.

Remove it and re-install with pnpm:
  rm '$file_path'
  pnpm install

MS commits pnpm-lock.yaml and Cargo.lock only.
EOF
  exit 2
fi

if [ "$base" = "Cargo.lock" ]; then
  cat >&2 <<EOF
Reminder: '$file_path' changed. Keep Cargo.lock committed and in sync with Cargo.toml
(run cargo build / cargo update inside src-tauri/ after dependency changes).
EOF
fi

exit 0
