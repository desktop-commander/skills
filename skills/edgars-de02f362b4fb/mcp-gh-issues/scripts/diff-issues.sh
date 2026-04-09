#!/bin/bash
# Compare open GitHub issues against already-triaged issues.
# Outputs untriaged issues and a summary.
# Works even if KB doesn't exist yet (treats everything as untriaged).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KB_DIR="$(dirname "$SCRIPT_DIR")/kb"

echo "=== Fetching open issues from GitHub... ==="
ALL_ISSUES=$("$SCRIPT_DIR/fetch-issues.sh")

echo "=== Extracting already-triaged issue numbers... ==="
TRIAGED=$("$SCRIPT_DIR/extract-triaged-numbers.sh")

if [[ -z "$TRIAGED" ]]; then
  echo "  (No KB found — all issues are untriaged)"
  KB_EXISTS=false
else
  KB_EXISTS=true
fi

TRIAGED_JSON=$(echo "$TRIAGED" | jq -R 'select(length > 0) | tonumber' | jq -s '.' 2>/dev/null || echo "[]")

echo ""
echo "=== Untriaged Open Issues ==="
echo ""

echo "$ALL_ISSUES" | jq -r --argjson triaged "$TRIAGED_JSON" '
  .[] |
  select(.number as $n | ($triaged | index($n)) == null) |
  "#\(.number) | \(.createdAt[:10]) | \(.title) | by \(.author.login)"
' | sort -t'#' -k2 -n

echo ""
echo "=== Summary ==="
TOTAL=$(echo "$ALL_ISSUES" | jq 'length')
UNTRIAGED=$(echo "$ALL_ISSUES" | jq -r --argjson triaged "$TRIAGED_JSON" '
  [.[] | select(.number as $n | ($triaged | index($n)) == null)] | length
')
TRIAGED_COUNT=$((TOTAL - UNTRIAGED))
echo "Total open: $TOTAL | Already triaged: $TRIAGED_COUNT | New/untriaged: $UNTRIAGED"

if [[ "$KB_EXISTS" == "false" ]]; then
  echo ""
  echo "=== ACTION NEEDED ==="
  echo "No knowledge base found at: $KB_DIR"
  echo "Run '/mcp-gh-issues init' to bootstrap the KB from current open issues."
fi
