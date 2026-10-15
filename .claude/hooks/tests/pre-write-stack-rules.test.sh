#!/bin/bash
# Test cases for pre-write-stack-rules.sh. Exit 0 = all pass, 1 = a case failed.
# Builds a throwaway checkout with src-tauri/ and src/ stack trees plus synthetic transcripts.

HOOK="$(cd "$(dirname "$0")/.." && pwd)/pre-write-stack-rules.sh"
fails=0

root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT

repo="$root/repo"
mkdir -p "$repo/.git" "$repo/src-tauri/src/sorting" "$repo/src/features/sort" "$repo/src/features/nested" "$repo/docs" "$root/with space/repo/.git" "$root/with space/repo/src"
printf 'rust rules\nline 2\nline 3\n' > "$repo/src-tauri/CLAUDE.md"
printf 'ui rules\nline 2\nline 3\n' > "$repo/src/CLAUDE.md"
printf 'nested notes\n' > "$repo/src/features/nested/CLAUDE.md"
printf 'ui rules\n' > "$root/with space/repo/src/CLAUDE.md"
backend_rules="$repo/src-tauri/CLAUDE.md"
ui_rules="$repo/src/CLAUDE.md"
transcript="$root/session.jsonl"

attachment() {
  printf '{"type":"attachment","attachment":{"type":"nested_memory","path":"%s"}}\n' "$1"
}

read_call() {
  printf '{"type":"assistant","message":{"content":[{"type":"tool_use","id":"%s","name":"Read","input":{"file_path":"%s"%s}}]}}\n' "$1" "$2" "$3"
}

read_result() {
  printf '{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"%s"%s}]}}\n' "$1" "$2"
}

compaction() {
  printf '{"type":"system","subtype":"compact_boundary"}\n'
}

# args: <description> <expected_exit> <file_path> [agent_id]
check() {
  local desc="$1" expected="$2" file="$3" agent="${4:-}" json actual
  json=$(jq -cn --arg f "$file" --arg t "$transcript" --arg a "$agent" \
    '{tool_name:"Edit",tool_input:{file_path:$f},transcript_path:$t} + (if $a == "" then {} else {agent_id:$a} end)')
  echo "$json" | perl -e 'alarm 5; exec @ARGV' "$HOOK" >/dev/null 2>&1
  actual=$?
  if [ "$actual" != "$expected" ]; then
    echo "FAIL: $desc (expected exit $expected, got $actual)" >&2
    fails=1
  else
    echo "ok: $desc"
  fi
}

# --- MUST ALLOW (exit 0): outside a stack tree, or rules already in context ---
: > "$transcript"
check "file outside any stack tree"       0 "$repo/docs/notes.md"
check "writing the rules file itself"     0 "$ui_rules"

attachment "$backend_rules" > "$transcript"
check "backend rules auto-loaded"         0 "$repo/src-tauri/src/sorting/service.rs"

{ read_call r1 "$ui_rules" ''; read_result r1 ''; } > "$transcript"
check "ui rules read in full"             0 "$repo/src/features/sort/SortPanel.tsx"

{ read_call r2 "$ui_rules" ',"limit":50'; read_result r2 ''; } > "$transcript"
check "limit covering the whole file"     0 "$repo/src/features/sort/SortPanel.tsx"

mkdir -p "${transcript%.jsonl}/subagents"
: > "$transcript"
attachment "$backend_rules" > "${transcript%.jsonl}/subagents/agent-abc.jsonl"
check "subagent transcript has the rules" 0 "$repo/src-tauri/src/sorting/service.rs" abc

{ attachment "$ui_rules"; compaction; attachment "$ui_rules"; } > "$transcript"
check "rules reloaded after compaction"   0 "$repo/src/features/sort/SortPanel.tsx"

attachment "$root/with space/repo/src/CLAUDE.md" > "$transcript"
check "path with a space"                 0 "$root/with space/repo/src/App.tsx"

attachment "$ui_rules" > "$transcript"
check "nested CLAUDE.md under src/"       0 "$repo/src/features/nested/Panel.tsx"

# --- MUST BLOCK (exit 2): stack write without the rules in context ---
: > "$transcript"
check "backend write, nothing read"       2 "$repo/src-tauri/src/sorting/service.rs"
check "new file in a missing directory"   2 "$repo/src/features/new/Panel.tsx"

attachment "$ui_rules" > "$transcript"
check "nested src/ resolves to src-tauri" 2 "$repo/src-tauri/src/lib.rs"

{ read_call r3 "$ui_rules" ',"limit":1'; read_result r3 ''; } > "$transcript"
check "partial read (limit)"              2 "$repo/src/features/sort/SortPanel.tsx"

{ read_call r4 "$ui_rules" ',"offset":2'; read_result r4 ''; } > "$transcript"
check "partial read (offset)"             2 "$repo/src/features/sort/SortPanel.tsx"

{ read_call r5 "$ui_rules" ''; read_result r5 ',"is_error":true'; } > "$transcript"
check "read that errored"                 2 "$repo/src/features/sort/SortPanel.tsx"

{ attachment "$ui_rules"; compaction; } > "$transcript"
check "rules loaded before compaction"    2 "$repo/src/features/sort/SortPanel.tsx"

printf '{"type":"assistant","message":{"content":[{"type":"text","text":"%s"}]}}\n' "$ui_rules" > "$transcript"
check "path only mentioned in text"       2 "$repo/src/features/sort/SortPanel.tsx"

attachment "$ui_rules" > "$transcript"
check "subagent without its own evidence" 2 "$repo/src/features/sort/SortPanel.tsx" missing

attachment "$backend_rules" > "$transcript"
check "nested CLAUDE.md hides no rules"   2 "$repo/src/features/nested/Panel.tsx"
check "dot segment"                       2 "$repo/src/./App.tsx"
check "parent segment"                    2 "$repo/src/features/../App.tsx"
check "relative path (no hang)"           2 "src/App.tsx"
check "bare file name (no hang)"          2 "App.tsx"

rm -f "$transcript"
check "transcript missing → fail closed"  2 "$repo/src/features/sort/SortPanel.tsx"

exit $fails
