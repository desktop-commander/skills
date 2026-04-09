#!/bin/bash
# Extract all issue numbers already mentioned in the triage knowledge base files.
# Outputs one number per line, sorted and deduplicated.
# If KB files don't exist, outputs nothing (no error).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KB_DIR="$(dirname "$SCRIPT_DIR")/kb"

if [[ ! -d "$KB_DIR" ]]; then
  exit 0
fi

KB_FILES=()
[[ -f "$KB_DIR/triage.md" ]] && KB_FILES+=("$KB_DIR/triage.md")
[[ -f "$KB_DIR/overview.md" ]] && KB_FILES+=("$KB_DIR/overview.md")

if [[ ${#KB_FILES[@]} -eq 0 ]]; then
  exit 0
fi

grep -ohE '#[0-9]+' "${KB_FILES[@]}" 2>/dev/null \
| sed 's/^#//' \
| sort -un
