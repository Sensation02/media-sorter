#!/bin/bash
# PreToolUse:WebSearch|WebFetch — Layer-2 privacy backstop (Article II).
# Blocks a web call whose query/url/prompt embeds user data: filesystem paths,
# GPS coordinates, or media filenames. Exit-code contract: 2 = block, 0 = allow.
# No `set -e`: a non-matching grep exits 1, which would falsely abort the script.

if ! command -v jq >/dev/null 2>&1; then
  echo "pre-web: jq is required but not installed (brew install jq). Blocking to fail closed." >&2
  exit 2
fi

input=$(cat)
haystack=$(echo "$input" | jq -r '[.tool_input.query, .tool_input.url, .tool_input.prompt] | map(select(. != null)) | join(" ")')

[ -z "$haystack" ] && exit 0

# Filesystem paths: absolute unix, home-relative, or windows.
PATH_TOKENS='(^|[[:space:]"])(/Users/|/home/|~/)[^[:space:]"]+|[A-Za-z]:\\[^[:space:]"]+'
# Media filenames: a basename with a photo/video extension.
MEDIA_TOKENS='[A-Za-z0-9_-]+\.(jpe?g|png|heic|heif|tiff?|gif|webp|mov|mp4|m4v|avi|mkv)([[:space:]"]|$)'
# GPS coordinate pair: two signed decimals (≥4 fractional digits) separated by comma/space.
GPS_TOKENS='-?[0-9]{1,3}\.[0-9]{4,}[[:space:],]+-?[0-9]{1,3}\.[0-9]{4,}'

if echo "$haystack" | grep -qiE -e "$PATH_TOKENS"; then
  echo "Blocked: web query contains a filesystem path — user data must not leave the machine (Article II). Research the topic in the abstract." >&2
  exit 2
fi

if echo "$haystack" | grep -qiE -e "$MEDIA_TOKENS"; then
  echo "Blocked: web query contains a media filename — user data must not leave the machine (Article II). Research the topic in the abstract." >&2
  exit 2
fi

if echo "$haystack" | grep -qiE -e "$GPS_TOKENS"; then
  echo "Blocked: web query contains GPS coordinates — user location must not leave the machine (Article II). Research the topic in the abstract." >&2
  exit 2
fi

exit 0
