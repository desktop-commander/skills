---
name: github-stargazers-social-export
description: Exports GitHub repository stargazers to a CSV and extracts public LinkedIn/X links from their GitHub profiles. Use when you need a stargazer list with clickable social links and an HTML preview table.
version: 1.0.0
---

# GitHub Stargazers Social Export

## Overview

This skill exports **all stargazers** for a GitHub repo into a CSV and generates an **HTML previewer** so the links (GitHub/LinkedIn/X) are clickable.

## When to Use

Use this skill when a user asks for:
- “Export stargazers to CSV”
- “Get repo stargazers with LinkedIn / X links”
- “Make an HTML previewer for the CSV”

## What Data Is Collected (Important)

This only collects what users have made **public on their GitHub profile**:
- X: `twitterUsername` or links in bio/website
- LinkedIn: links in bio/website

It does **not** scrape the web or guess social accounts.

## Workflow

### Step 1: Choose repo + output location

- Default output directory:
  - `/Users/eduardsruzga/Library/CloudStorage/GoogleDrive-er@desktopcommander_app/Shared drives/RESTRICTED/output`

### Step 2: Export all stargazers via GraphQL (fast)

Run the exporter script:

- [export_stargazers_graphql.py](scripts/export_stargazers_graphql.py)

Preferred command (uses existing GitHub CLI auth if available):

```bash
GITHUB_TOKEN=$(gh auth token) python3 -u \
  "/Users/eduardsruzga/.desktop-commander/skills/github-stargazers-social-export/scripts/export_stargazers_graphql.py" \
  --owner "<owner>" \
  --repo "<repo>" \
  --out-dir "/Users/eduardsruzga/Library/CloudStorage/GoogleDrive-er@desktopcommander_app/Shared drives/RESTRICTED/output"
```

Fallback (if `gh` is not configured):

```bash
export GITHUB_TOKEN='YOUR_TOKEN'
python3 -u \
  "/Users/eduardsruzga/.desktop-commander/skills/github-stargazers-social-export/scripts/export_stargazers_graphql.py" \
  --owner "<owner>" --repo "<repo>" --out-dir ".../output"
```

### Step 3: Create / copy the HTML previewer

Use the bundled HTML file:
- [csv_link_previewer.html](assets/csv_link_previewer.html)

Copy it to the same output folder as the CSV (or just open it directly) and load the CSV.

### Step 4: Reveal output in Finder (macOS)

Reveal the CSV in Finder:

```bash
open -R "/absolute/path/to/the.csv"
```

## Notes / Limitations

- For token safety + scope details, see [Token + Scopes](references/token-and-scopes.md).
- GitHub may restrict some fields (example: email requires extra scopes). This exporter avoids restricted fields.
- For ~5k stargazers, this completes in ~1–2 minutes (GraphQL batches 100 users per request).
