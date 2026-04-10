#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
convert_heic_to_jpg.sh --input "/path" --output "/path" [--overwrite] [--recursive]

Converts .heic/.heif files to .jpg using macOS 'sips'.

Flags:
  --input       Folder containing HEIC/HEIF files
  --output      Destination folder for JPGs
  --overwrite   Replace existing .jpg files
  --recursive   Include subfolders
EOF
}

INPUT=""
OUTPUT=""
OVERWRITE=0
RECURSIVE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input) INPUT="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --overwrite) OVERWRITE=1; shift 1 ;;
    --recursive) RECURSIVE=1; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done
if [[ -z "$INPUT" || -z "$OUTPUT" ]]; then
  echo "--input and --output are required" >&2
  usage
  exit 2
fi

mkdir -p "$OUTPUT"

declare -a FILES
if [[ $RECURSIVE -eq 1 ]]; then
  while IFS= read -r -d '' f; do FILES+=("$f"); done < <(
    find "$INPUT" -type f \( -iname "*.heic" -o -iname "*.heif" \) -print0
  )
else
  while IFS= read -r -d '' f; do FILES+=("$f"); done < <(
    find "$INPUT" -maxdepth 1 -type f \( -iname "*.heic" -o -iname "*.heif" \) -print0
  )
fi

FOUND=${#FILES[@]}
CONVERTED=0
SKIPPED=0
FAILED=0

# Normalize to avoid path edge cases (e.g., trailing slash)
INPUT="${INPUT%/}"
OUTPUT="${OUTPUT%/}"

for f in "${FILES[@]}"; do
  # Preserve relative paths when converting recursively to avoid filename collisions.
  rel="${f#"$INPUT"/}"
  if [[ "$rel" == "$f" ]]; then
    rel="$(basename "$f")"
  fi

  out="$OUTPUT/${rel%.*}.jpg"
  mkdir -p "$(dirname "$out")"

  if [[ -f "$out" && $OVERWRITE -eq 0 ]]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if sips -s format jpeg "$f" --out "$out" >/dev/null 2>&1; then
    CONVERTED=$((CONVERTED + 1))
  else
    FAILED=$((FAILED + 1))
    echo "FAILED: $f" >&2
    sips -s format jpeg "$f" --out "$out" 1>&2 || true
  fi
done

echo "Found: $FOUND"
echo "Converted: $CONVERTED"
echo "Skipped: $SKIPPED"
echo "Failed: $FAILED"
echo "Output: $OUTPUT"
