---
name: heic-to-jpg
description: Converts HEIC/HEIF images in the current workspace to JPG files (macOS) and saves them into the workspace output folder. This skill should be used when a user needs regular HEIC → JPG/JPEG conversions.
version: 1.0.0
---

# HEIC to JPG (macOS)

Convert `.heic` / `.heif` image files to `.jpg` using macOS built-in tooling (`sips`).

## When to Use

This skill should be used when a user says things like:
- “convert HEIC to JPG/JPEG”
- “I have HEIC photos and need JPEGs”
- “batch convert HEIC files”
- “do this regularly / make it repeatable”

## Defaults

- **Input folder:** workspace folder
- **Output folder:** workspace `/output`
- **Overwrite existing JPGs:** enabled (unless user says otherwise)

## Workflow

### 1) Confirm intent + destination

Confirm these settings (use user-provided values if available):
- Input folder
- Output folder
- Whether to overwrite existing `.jpg`

### 2) Discover candidate files

List HEIC/HEIF files (case-insensitive). Prefer checking the input folder first; include subfolders only if the user asks for recursive conversion.

### 3) Convert using the bundled script

Run the script:

- Script: [convert_heic_to_jpg.sh](scripts/convert_heic_to_jpg.sh)
- Uses: `sips -s format jpeg` (built in on macOS)

Recommended invocation (overwrite enabled):

```bash
bash "/Users/eduardsruzga/.desktop-commander/skills/heic-to-jpg/scripts/convert_heic_to_jpg.sh" \
  --input "/ABS/INPUT" \
  --output "/ABS/OUTPUT" \
  --overwrite
```
### 4) Report results

After running, report:
- number of files found
- number converted
- number skipped (if overwrite disabled)
- where the JPGs were written

## Script flags

- `--input "/path"` (required)
- `--output "/path"` (required)
- `--overwrite` (optional; if omitted, existing JPGs are not replaced)
- `--recursive` (optional; if omitted, converts only the input folder’s top level)
  - When enabled, preserve the relative folder structure under the output directory to avoid filename collisions.

## Notes / troubleshooting

- If conversion fails, capture and show the `sips` error output for the specific file.
- HEIC can include HDR data; JPG is 8-bit and may look different.
- Keep original files; conversion is non-destructive to inputs.

## Scripts

- [convert_heic_to_jpg.sh](scripts/convert_heic_to_jpg.sh) - Batch converts HEIC/HEIF images to JPG using macOS `sips`.
