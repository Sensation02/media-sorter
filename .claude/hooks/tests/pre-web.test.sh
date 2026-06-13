#!/bin/bash
# Test cases for pre-web.sh. Exit 0 = all pass, 1 = a case failed.
# Mirrors the echo-pipe style documented in .claude/hooks/README.md.

HOOK="$(cd "$(dirname "$0")/.." && pwd)/pre-web.sh"
fails=0

# args: <description> <expected_exit> <json>
check() {
  local desc="$1" expected="$2" json="$3" actual
  echo "$json" | "$HOOK" >/dev/null 2>&1
  actual=$?
  if [ "$actual" != "$expected" ]; then
    echo "FAIL: $desc (expected exit $expected, got $actual)" >&2
    fails=1
  else
    echo "ok: $desc"
  fi
}

# --- MUST BLOCK (exit 2): user data in a web query ---
check "absolute macOS path" 2 '{"tool_name":"WebSearch","tool_input":{"query":"why is /Users/bob/Photos/IMG_2024.jpg corrupt"}}'
check "home path"           2 '{"tool_name":"WebSearch","tool_input":{"query":"exif of ~/Pictures/vacation.heic"}}'
check "windows path"        2 '{"tool_name":"WebSearch","tool_input":{"query":"C:\\Users\\bob\\photo.png metadata"}}'
check "gps coordinate pair" 2 '{"tool_name":"WebSearch","tool_input":{"query":"what city is at 48.8584, 2.2945"}}'
check "media filename"      2 '{"tool_name":"WebSearch","tool_input":{"query":"IMG_4821.HEIC will not open"}}'
check "webfetch url+prompt" 2 '{"tool_name":"WebFetch","tool_input":{"url":"https://example.com","prompt":"compare to /Users/bob/Photos/IMG_1.jpg"}}'

# --- MUST ALLOW (exit 0): legitimate technical research ---
check "library question"      0 '{"tool_name":"WebSearch","tool_input":{"query":"best offline reverse geocoding crate for Rust"}}'
check "version number"        0 '{"tool_name":"WebSearch","tool_input":{"query":"tauri 2.1.0 fs scope capabilities"}}'
check "exif parsing topic"    0 '{"tool_name":"WebSearch","tool_input":{"query":"how does kamadak-exif parse GPS IFD"}}'
check "generic docs fetch"    0 '{"tool_name":"WebFetch","tool_input":{"url":"https://docs.rs/kamadak-exif","prompt":"how to read DateTimeOriginal"}}'

exit $fails
