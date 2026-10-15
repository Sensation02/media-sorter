#!/bin/bash
# PreToolUse hook for Edit / Write events.
# Blocks a write into a stack tree (src-tauri/ or src/) until that tree's CLAUDE.md is in the writer's context.
#
# Exit codes:
#   0 = allow
#   2 = block (stderr shown to Claude as error, operation aborted)
# No `set -e`: a non-matching grep exits 1, which would falsely abort the script.
#
# The stack tree is the nearest ancestor of the written file that is named `src-tauri` or `src` (any case)
# and holds a CLAUDE.md, searched upward and stopping at the checkout root (a directory with a `.git` entry).
# So `src-tauri/src/...` resolves to src-tauri/CLAUDE.md, never to src/CLAUDE.md, and a CLAUDE.md nested deeper
# in a tree does not hide the stack rules. A relative path, or one with `.` / `..` segments, is blocked rather
# than resolved: the walk only understands normalized absolute paths, and the Edit / Write tools take those.
#
# A stack CLAUDE.md loads on its own only when the Read tool opens a file in its tree, and an agent that
# writes before reading anything there never gets it. Two pieces of evidence count, both looked up in the
# writer's own transcript (a subagent's lives under the session's, keyed by agent_id):
#   - the automatic load, recorded as a nested_memory attachment for the rules path — the attachment,
#     not the text, so an agent that merely writes the path does not pass;
#   - a Read of the rules file with no limit and no offset past line 1 whose result came back without an
#     error. A partial read does not count, and it also stops the automatic load for the rest of that session.
# Only evidence after the last compaction counts: the harness drops the stack rules there.
# Not caught: a Read of the rules and this write in one message — the harness writes this call's own line
# only after the hook runs. The "read first" line in the developer agent definitions covers that case.
# A transcript that is not where the harness keeps it blocks rather than passes: the message prints the
# path it expected, so a layout change in Claude Code is fixed here once.

if ! command -v jq >/dev/null 2>&1; then
  echo "Hook error: jq is required but not installed (brew install jq). Blocking to fail closed." >&2
  exit 2
fi

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

[ -n "$file_path" ] || exit 0

case "$file_path" in
  /*) ;;
  *)
    echo "Blocked: '$file_path' is not an absolute path — retry with the absolute path." >&2
    exit 2
    ;;
esac

case "/$file_path/" in
  */./* | */../*)
    echo "Blocked: '$file_path' contains '.' or '..' segments — retry with the normalized absolute path." >&2
    exit 2
    ;;
esac

find_stack_tree() {
  local dir="${1%/*}" name
  while [ -n "$dir" ]; do
    name=$(echo "${dir##*/}" | tr '[:upper:]' '[:lower:]')
    case "$name" in
      src-tauri | src)
        if [ -f "$dir/CLAUDE.md" ]; then
          echo "$dir"
          return
        fi
        ;;
    esac
    [ -e "$dir/.git" ] && return
    dir="${dir%/*}"
  done
}

tree=$(find_stack_tree "$file_path")
[ -n "$tree" ] || exit 0

rules="$tree/CLAUDE.md"
[ "$file_path" = "$rules" ] && exit 0

transcript=$(echo "$input" | jq -r '.transcript_path // ""')
agent_id=$(echo "$input" | jq -r '.agent_id // ""')
[ -n "$agent_id" ] && transcript="${transcript%.jsonl}/subagents/agent-${agent_id}.jsonl"

if [ ! -f "$transcript" ]; then
  cat >&2 <<EOF
Blocked: cannot confirm that $rules was read — the transcript is not at '$transcript'.

If Claude Code has moved its transcripts, update .claude/hooks/pre-write-stack-rules.sh.
EOF
  exit 2
fi

rule_lines=$(wc -l < "$rules" | tr -d ' ')
last_compaction=$(grep -n '"subtype":"compact_boundary"' "$transcript" | tail -1 | cut -d: -f1)

window() {
  tail -n +"$(( ${last_compaction:-0} + 1 ))" "$transcript"
}

if window | grep -F "$rules" | jq -R -e --arg path "$rules" '
  fromjson? | select(.type == "attachment" and .attachment.type == "nested_memory" and .attachment.path == $path)
' >/dev/null 2>&1; then
  exit 0
fi

full_read_ids=$(window | grep -F "$rules" | jq -R -r --arg path "$rules" --argjson lines "$rule_lines" '
  fromjson?
  | select(.message.content | type == "array")
  | .message.content[]
  | select(.type == "tool_use" and .name == "Read" and .input.file_path == $path)
  | select((.input.limit == null or .input.limit >= $lines) and ((.input.offset // 1) <= 1))
  | .id
' 2>/dev/null)

for read_id in $full_read_ids; do
  if window | grep -F "\"tool_use_id\":\"$read_id\"" | grep -qvF '"is_error":true'; then
    exit 0
  fi
done

cat >&2 <<EOF
Blocked: $file_path is under $tree, and that tree's rules are not in your context yet.

Read $rules in full first — the Read tool, no offset and no limit. A partial read does not count, and it
also stops the rules from loading on their own. Then retry this write.

If you opened a file under $tree in this same step, just retry: the rules load with that read.
EOF
exit 2
