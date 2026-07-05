#!/usr/bin/env bash
#
# The Agency — agent library validator
#
# Checks every agent file for: required frontmatter fields, a name that matches
# its filename, unique names across the library, and the seven required body
# sections. Exits non-zero if anything is wrong.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO_ROOT/.claude/agents"

REQUIRED_SECTIONS=(
  "## Who I am"
  "## What I specialize in"
  "## My workflow"
  "## Deliverables"
  "## Standards & quality bar"
  "## How I collaborate"
  "## Anti-patterns I refuse"
)

errors=0
count=0
names_file="$(mktemp)"
trap 'rm -f "$names_file"' EXIT

while IFS= read -r f; do
  count=$((count + 1))
  rel="${f#"$SRC"/}"
  base="$(basename "$f" .md)"

  # Frontmatter must be the first line.
  if [ "$(head -n1 "$f")" != "---" ]; then
    printf 'FAIL %s: file must start with YAML frontmatter (---)\n' "$rel"; errors=$((errors + 1)); continue
  fi

  # Extract the frontmatter block (between the first two --- lines).
  fm="$(awk 'NR>1 && $0=="---"{exit} NR>1{print}' "$f")"

  name="$(printf '%s\n' "$fm" | sed -n 's/^name:[[:space:]]*//p' | head -n1)"
  division="$(printf '%s\n' "$fm" | sed -n 's/^division:[[:space:]]*//p' | head -n1)"
  desc="$(printf '%s\n' "$fm" | sed -n 's/^description:[[:space:]]*//p' | head -n1)"

  [ -n "$name" ]     || { printf 'FAIL %s: missing frontmatter field: name\n' "$rel"; errors=$((errors + 1)); }
  [ -n "$division" ] || { printf 'FAIL %s: missing frontmatter field: division\n' "$rel"; errors=$((errors + 1)); }
  [ -n "$desc" ]     || { printf 'FAIL %s: missing frontmatter field: description\n' "$rel"; errors=$((errors + 1)); }

  if [ -n "$name" ] && [ "$name" != "$base" ]; then
    printf 'FAIL %s: name "%s" does not match filename "%s"\n' "$rel" "$name" "$base"; errors=$((errors + 1))
  fi

  if [ -n "$name" ]; then
    if grep -qxF "$name" "$names_file"; then
      printf 'FAIL %s: duplicate agent name "%s"\n' "$rel" "$name"; errors=$((errors + 1))
    else
      printf '%s\n' "$name" >> "$names_file"
    fi
  fi

  for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! grep -qF "$section" "$f"; then
      printf 'FAIL %s: missing section "%s"\n' "$rel" "$section"; errors=$((errors + 1))
    fi
  done
done < <(find "$SRC" -name '*.md' | sort)

printf '\nChecked %d agents. ' "$count"
if [ "$errors" -eq 0 ]; then
  printf 'All valid.\n'
else
  printf '%d problem(s) found.\n' "$errors"; exit 1
fi
