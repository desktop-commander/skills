#!/bin/bash
# Fetch all open GitHub issues from DesktopCommanderMCP repo as JSON.
# Usage: ./fetch-issues.sh [--since YYYY-MM-DD]

set -euo pipefail

REPO="wonderwhy-er/DesktopCommanderMCP"
SINCE_DATE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --since)
      SINCE_DATE="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -n "$SINCE_DATE" ]]; then
  gh issue list \
    --repo "$REPO" \
    --state open \
    --limit 300 \
    --json number,title,createdAt,labels,author \
    --jq "[.[] | select(.createdAt >= \"${SINCE_DATE}T00:00:00Z\")]"
else
  gh issue list \
    --repo "$REPO" \
    --state open \
    --limit 300 \
    --json number,title,createdAt,labels,author
fi
