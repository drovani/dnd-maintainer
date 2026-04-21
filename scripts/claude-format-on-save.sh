#!/usr/bin/env bash
# Invoked by Claude Code PostToolUse hook. Reads JSON on stdin.
# Runs Prettier + eslint --fix on the edited file. Advisory only (never blocks).

set -u
payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')

if [ -z "$file" ]; then
  echo "skipping: no file_path in payload" >&2
  exit 0
fi

# Resolve repo root
if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  repo_root="$CLAUDE_PROJECT_DIR"
else
  repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
  if [ -z "$repo_root" ]; then
    echo "[format-hook] skipping: cannot determine repo root" >&2
    exit 0
  fi
fi
repo_root=$(realpath -m "$repo_root" 2>/dev/null || echo "$repo_root")

# Resolve absolute path
abs_file=$(realpath -m "$file" 2>/dev/null || echo "$file")

# Skip files outside repo root
case "$abs_file" in
  "$repo_root"/*) ;;
  *) echo "skipping: file outside repo root" >&2; exit 0 ;;
esac

# Skip ignored directories
case "$abs_file" in
  */node_modules/*) echo "skipping: node_modules" >&2; exit 0 ;;
  */dist/*) echo "skipping: dist" >&2; exit 0 ;;
esac

# Extract lowercase extension
basename="${abs_file##*/}"
if [[ "$basename" != *.* ]]; then
  echo "skipping: no extension in $basename" >&2
  exit 0
fi
ext="${basename##*.}"
ext=$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')

# Run Prettier for supported extensions
case "$ext" in
  ts|tsx|js|jsx|json|jsonc|css|md|mdx|html|yml|yaml)
    npx --no-install prettier --write --log-level warn "$abs_file" 1>&2 || true
    ;;
  *)
    echo "skipping: extension .$ext not handled" >&2
    exit 0
    ;;
esac

# Run ESLint --fix for JS/TS files only
case "$ext" in
  ts|tsx|js|jsx)
    npx --no-install eslint --fix "$abs_file" 1>&2 || true
    ;;
esac

exit 0
