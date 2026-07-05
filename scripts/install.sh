#!/usr/bin/env bash
#
# The Agency — installer / vendor script
#
# Copies the agent library from this repo into the agents directory of the
# AI coding tool you use. The same handwritten specialists convert to a dozen
# different tools; pick yours with --tool.
#
# Usage:
#   scripts/install.sh                      # install all agents for Claude Code (project scope)
#   scripts/install.sh --tool cursor        # install for Cursor
#   scripts/install.sh --scope user         # install into your home config, not the project
#   scripts/install.sh --division engineering,security   # only these divisions
#   scripts/install.sh --list               # list agents and exit
#   scripts/install.sh --dry-run            # show what would be copied
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO_ROOT/.claude/agents"

TOOL="claude"
SCOPE="project"          # project | user
DIVISIONS=""             # comma-separated division dir names; empty = all
DRY_RUN=0
DO_LIST=0

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --tool)     TOOL="${2:-}"; shift 2 ;;
    --scope)    SCOPE="${2:-}"; shift 2 ;;
    --division) DIVISIONS="${2:-}"; shift 2 ;;
    --dry-run)  DRY_RUN=1; shift ;;
    --list)     DO_LIST=1; shift ;;
    -h|--help)  sed -n '2,20p' "$0"; exit 0 ;;
    *)          die "unknown argument: $1" ;;
  esac
done

[ -d "$SRC" ] || die "agent source not found at $SRC"

# Resolve the destination directory for the chosen tool + scope.
dest_dir() {
  local tool="$1" scope="$2" home proj
  home="$HOME"
  proj="$REPO_ROOT"
  case "$tool" in
    claude|claude-code)
      [ "$scope" = user ] && echo "$home/.claude/agents" || echo "$proj/.claude/agents" ;;
    cursor)
      [ "$scope" = user ] && echo "$home/.cursor/rules" || echo "$proj/.cursor/rules" ;;
    windsurf)
      [ "$scope" = user ] && echo "$home/.codeium/windsurf/rules" || echo "$proj/.windsurf/rules" ;;
    copilot|github-copilot)
      echo "$proj/.github/agents" ;;
    codex)
      [ "$scope" = user ] && echo "$home/.codex/agents" || echo "$proj/.codex/agents" ;;
    gemini)
      [ "$scope" = user ] && echo "$home/.gemini/agents" || echo "$proj/.gemini/agents" ;;
    aider)
      echo "$proj/.aider/agents" ;;
    generic)
      echo "$proj/agents" ;;
    *)
      die "unknown tool '$tool' (try: claude, cursor, windsurf, copilot, codex, gemini, aider, generic)" ;;
  esac
}

# Gather the list of agent files, optionally filtered by division.
collect() {
  if [ -n "$DIVISIONS" ]; then
    local IFS=,
    for d in $DIVISIONS; do
      find "$SRC/$d" -maxdepth 1 -name '*.md' 2>/dev/null || true
    done
    # top-level agents (e.g. agents-orchestrator) always included
    find "$SRC" -maxdepth 1 -name '*.md' 2>/dev/null || true
  else
    find "$SRC" -name '*.md'
  fi | sort -u
}

if [ "$DO_LIST" = 1 ]; then
  count=0
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    printf '  %s\n' "${f#"$SRC"/}"
    count=$((count + 1))
  done < <(collect)
  printf '\n%d agents in %s\n' "$count" "$SRC"
  exit 0
fi

DEST="$(dest_dir "$TOOL" "$SCOPE")"
printf 'Installing agents for %-12s -> %s\n' "$TOOL" "$DEST"

copied=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  rel="${f#"$SRC"/}"
  out="$DEST/$rel"
  if [ "$DRY_RUN" = 1 ]; then
    printf '  [dry-run] %s\n' "$rel"
  else
    mkdir -p "$(dirname "$out")"
    cp "$f" "$out"
    printf '  + %s\n' "$rel"
  fi
  copied=$((copied + 1))
done < <(collect)

printf '\n%s %d agents.\n' "$([ "$DRY_RUN" = 1 ] && echo "Would install" || echo "Installed")" "$copied"
[ "$DRY_RUN" = 1 ] || printf 'Talk to them in plain English, e.g. "Use the backend-architect to design this API."\n'
