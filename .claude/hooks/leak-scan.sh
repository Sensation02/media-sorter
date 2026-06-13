#!/bin/bash
# Scans given files for user-facing-denylist terms. Manual / CI scanner, not a tool-event hook.
# Usage: leak-scan.sh <file>...   Exit: 0 = clean, 1 = term found OR denylist empty/missing.
# No `set -e`: a non-matching grep exits 1, which would falsely abort the script.

cd "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || true
DENYLIST="${LEAK_DENYLIST:-docs/workflow/user-facing-denylist.md}"

if [ ! -f "$DENYLIST" ]; then
  echo "leak-scan: denylist missing ($DENYLIST) — fail-closed" >&2
  exit 1
fi

terms=$(grep -oE '`[^`]+`' "$DENYLIST" | tr -d '`' | sort -u)
if [ -z "$terms" ]; then
  echo "leak-scan: denylist empty ($DENYLIST) — fail-closed" >&2
  exit 1
fi

found=0
while IFS= read -r term; do
  [ -z "$term" ] && continue
  for f in "$@"; do
    [ -f "$f" ] || continue
    if grep -inF "$term" "$f" >/dev/null 2>&1; then
      echo "leak-scan: forbidden term '$term' found in $f" >&2
      found=1
    fi
  done
done <<< "$terms"

exit $found
