#!/bin/bash
# media-sorter deterministic risk classifier (EPIC-18 B3 feature-loop; spec §B3, discovery §B1.2).
#
# CLI, NOT a PreToolUse hook: takes a base ref as $1, classifies the UNCOMMITTED working tree
# (tracked diff against the merge-base UNION untracked new files), prints zero or more riskFlags
# to stdout (one per line), and exits 0. It ROUTES risk to deeper review; it never blocks. Output
# is ORed with the feature-loop team-lead LLM riskFlags downstream.
#
# It is a ROUTER, not a judge: it flags when a changeset TOUCHES a risk surface. It does NOT decide
# whether the change is safe (polarity) — e.g. it flags a destructive FS verb without trying to
# prove an undo/move-log guards it. That reversibility judgment is the LLM's / human reviewer's job
# (Constitution Article VI). Over-flagging is acceptable; missing a surface is not.
#
# Scoping: only changes under src-tauri/ are harvested. Within that, the three content flags
# (media-write / fs-irreversible / ipc-surface) inspect ONLY *.rs files, and capability inspects
# ONLY the two JSON config paths — an allowlist, so prose files such as src-tauri/CLAUDE.md that
# happen to quote a code token (e.g. "#[tauri::command]") never raise a false flag.
#
# MS risk surfaces (flags), all scoped to changes under src-tauri/:
#   media-write     — any filesystem MUTATION verb (rename/copy/write/create/append/remove/truncate)
#                     appears in an added-or-removed line. The general write surface; superset of
#                     fs-irreversible. User-media write paths are runtime-selected (a folder the user
#                     picks at scan time), so they cannot be matched as a static path — the FS verb
#                     in the diff is the only deterministic signal.
#   fs-irreversible — the DESTRUCTIVE subset only: remove_file / remove_dir / remove_dir_all or a
#                     truncating write. These can destroy user data and demand an Article VI undo /
#                     move-log review. fs::rename and fs::copy fire media-write but NOT this flag
#                     (a move is reversible via the move-log; a copy does not destroy the source).
#   capability      — any edit to src-tauri/tauri.conf.json or src-tauri/capabilities/*.json. These
#                     hold the Tauri permission set (incl. fs:allow-* grants), CSP, and bundle config
#                     and are security-sensitive throughout, so NO token gate is applied — any
#                     added-or-removed line in those files routes to least-privilege review.
#   ipc-surface     — a new #[tauri::command] entry point appears in an added line. Each command is a
#                     fresh IPC attack surface regardless of which file it lands in (MS adds commands
#                     to existing command.rs files, so new-file detection alone would miss them).
#
# KNOWN OVER-FLAG (v0, intentional): Rust co-locates unit tests via `#[cfg(test)] mod tests` in the
# same production file, so a destructive verb or #[tauri::command] inside a test block also flags.
# Stripping cfg(test) regions in bash is fragile and anti-KISS; per router doctrine we accept the
# over-flag (the reviewer dismisses it) rather than risk under-flagging real production code.
#
# Exit codes:
#   0 = classified OK (flags on stdout; empty output = clean).
#   1 = classifier failure (not a git repo / base ref unresolved). FAIL-LOUD: emits all four flags
#       as a fail-safe + a stderr diagnostic, so an unresolved base never silently passes. An
#       explicitly-passed base that does not resolve but where staging does is surfaced on stderr
#       (warning) before falling back, so the fallback is never silent either.
#
# No `set -e`: a non-matching grep exits 1, which would falsely abort the script.

readonly SCOPED_PATH_PREFIXES='src-tauri/'

readonly CAPABILITY_FILE_GLOB='(^|/)src-tauri/(tauri\.conf\.json|capabilities/[^/]+\.json)$'
readonly RUST_SOURCE_GLOB='\.rs$'
readonly IPC_COMMAND_TOKEN='#\[tauri::command\]'
readonly FS_WRITE_TOKENS='remove_file|remove_dir_all|remove_dir|fs::rename|\.rename\(|fs::copy|\.copy\(|fs::write|\.write\(|create_dir_all|create_dir|File::create|OpenOptions|append\(true\)|set_len\(|truncate\(true\)'
readonly FS_IRREVERSIBLE_TOKENS='remove_file|remove_dir_all|remove_dir|set_len\(|truncate\(true\)'

readonly FAIL_SAFE_FLAGS='media-write capability fs-irreversible ipc-surface'

root="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$root" ]; then
  echo "risk-classify: not inside a git repository — fail-loud" >&2
  printf '%s\n' $FAIL_SAFE_FLAGS
  exit 1
fi
cd "$root" || exit 1

resolve_base() {
  local candidate
  for candidate in "$1" staging origin/staging; do
    [ -n "$candidate" ] || continue
    if git rev-parse --verify "$candidate" >/dev/null 2>&1; then
      git merge-base HEAD "$candidate" 2>/dev/null && return 0
    fi
    [ "$candidate" = "$1" ] && echo "risk-classify: base ref '$1' did not resolve — falling back to staging" >&2
  done
  return 1
}

base="$(resolve_base "$1")"
if [ -z "$base" ]; then
  echo "risk-classify: could not resolve a base ref (tried '$1', staging, origin/staging) — fail-loud" >&2
  printf '%s\n' $FAIL_SAFE_FLAGS
  exit 1
fi

tracked="$(git diff --name-only "$base" -- "$SCOPED_PATH_PREFIXES" 2>/dev/null)"
untracked="$(git ls-files --others --exclude-standard -- "$SCOPED_PATH_PREFIXES" 2>/dev/null)"
changed_files="$(printf '%s\n%s\n' "$tracked" "$untracked" | grep -v '^$' | sort -u)"

is_untracked() { printf '%s\n' "$untracked" | grep -qxF "$1"; }

added_lines() {
  local file="$1"
  if is_untracked "$file"; then
    cat "$file" 2>/dev/null
  else
    git diff "$base" -- "$file" 2>/dev/null | grep -E '^\+' | grep -vE '^\+\+\+' | sed 's/^+//'
  fi
}

removed_lines() {
  local file="$1"
  is_untracked "$file" && return 0
  git diff "$base" -- "$file" 2>/dev/null | grep -E '^-' | grep -vE '^---' | sed 's/^-//'
}

both_lines() { added_lines "$1"; removed_lines "$1"; }

flags=""
add_flag() {
  case " $flags " in
    *" $1 "*) ;;
    *) flags="$flags $1" ;;
  esac
}

while IFS= read -r file; do
  [ -z "$file" ] && continue

  if printf '%s' "$file" | grep -qE "$CAPABILITY_FILE_GLOB"; then
    both_lines "$file" | grep -qE '.' && add_flag capability
    continue
  fi

  printf '%s' "$file" | grep -qE "$RUST_SOURCE_GLOB" || continue

  added_lines "$file" | grep -qE "$IPC_COMMAND_TOKEN" && add_flag ipc-surface
  both_lines "$file" | grep -qE "$FS_WRITE_TOKENS" && add_flag media-write
  both_lines "$file" | grep -qE "$FS_IRREVERSIBLE_TOKENS" && add_flag fs-irreversible
done <<< "$changed_files"

[ -n "$flags" ] && printf '%s\n' $flags | sort
exit 0
