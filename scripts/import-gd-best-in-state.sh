#!/usr/bin/env bash
# Import Golf Digest "Best in State" data via the API endpoint.
# Usage: ./scripts/import-gd-best-in-state.sh [BASE_URL]
#   BASE_URL defaults to https://golfequalizer.ai

set -euo pipefail

BASE_URL="${1:-https://golfequalizer.ai}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_FILE="$SCRIPT_DIR/gd_best_in_state_data.json"

if [ ! -f "$DATA_FILE" ]; then
  echo "ERROR: Data file not found at $DATA_FILE"
  exit 1
fi

echo "Importing Golf Digest Best in State data to $BASE_URL ..."
echo "Data file: $DATA_FILE ($(wc -l < "$DATA_FILE") lines)"

curl -s -X POST \
  "$BASE_URL/api/admin/import-gd-best-in-state" \
  -H "Content-Type: application/json" \
  -H "x-import-token: gd-best-in-state-2026-temp" \
  -d @"$DATA_FILE" \
  --max-time 300 | python3 -m json.tool

echo ""
echo "Done."
