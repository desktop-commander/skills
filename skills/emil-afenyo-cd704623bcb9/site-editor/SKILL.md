---
name: site-editor
description: Inject a visual "Site Manager" editor into any single-file HTML website so the user can edit text, images, links, and brand colours in-browser, then download a new HTML file with all changes baked in. Use this skill when the user wants to make a static HTML site editable, add an inline content editor, or set up a one-file CMS-style workflow for a single-page or multi-section HTML site.
version: 1.0.12
---

# Site Editor

This skill injects a self-contained visual Site Manager into any single-file HTML website. The Site Manager floats on top of the page (button top-right), auto-detects pages/sections, lets the user click any text, image, or link to edit it, exposes brand colour pickers tied to CSS variables, and exports a new HTML file with every change baked in.

It is designed to make a one-file static site behave like a tiny CMS without any server, build step, or framework.

## When to Use

Trigger this skill when the user says things like:

- "Make this website editable"
- "Add a site editor / site manager / CMS to this HTML file"
- "I want to edit this site visually and save the result"
- "Apply the site editor to [filename]"
- "Set up the same edit workflow we did for CCSD on this other site"
- The user has a single-file HTML site and wants to update content without touching code

## Inputs

- A single HTML file (a one-file website / dashboard / landing page).
- Optional: brand colour palette (CSS variable names + hex values).

## Outputs

- A new copy of the HTML file with the Site Manager injected. Naming convention: `<original>_editable.html`.
- The original file is never modified.

## Workflow

1. Confirm the target file path with the user if ambiguous.
2. Verify the file is a complete HTML document (has `<html>`, `<head>`, `<body>`, `</body>`).
3. Run the injector script:
   ```bash
   node ~/.agents/skills/site-editor/scripts/inject-site-manager.mjs <path-to-html>
   ```
   The script:
   - Reads the source HTML.
   - Copies it to `<original>_editable.html`.
   - Inserts the Site Manager snippet (CSS + UI + JS) immediately before `</body>`.
   - Adds a small CSS guard before the first `</style>` so any legacy in-page Site Manager (if one exists) is hidden.
   - If the source has no `:root` block, inserts a default brand palette (`--red`, `--navy`, `--gold`, `--cream`).
4. Report the output file path to the user as a clickable markdown link.
5. Tell the user how to use it (open in browser → click ⚙️ Site Manager → edit → Save → Download HTML → upload the downloaded file as the new live site).

## What the Site Manager does

- **Auto-detects pages/sections** by scanning for `<section id>`, hero blocks, portal views (`p-view-*`), and any large container with a heading. Sidebar lists them with friendly labels (uses `<h1>/<h2>` text where possible).
- **Click-to-edit**:
  - Text — inline modal with a multi-line textarea (Cmd/Ctrl+Enter to save, Esc to cancel).
  - Images — file picker, encoded as base64 so the new image bakes into the exported HTML.
  - Links — edit `href` and visible text.
- **Brand colour pickers** — live edits CSS custom properties on `:root` so changes preview across the whole site instantly.
- **Edit log** — every change is tracked with timestamp + page label.
- **Save → Download HTML** — serialises the live DOM (with edits applied), strips out the Site Manager UI and script, and downloads a clean publishable HTML file.
- **Self-isolation** — clicks on the Site Manager's own UI never trigger the editor on itself (this was a real bug we hit; the snippet guards against it).

## Snippet structure (for context)

The Site Manager is one block of HTML/CSS/JS embedded just before `</body>`. It does not depend on any external script (no React, no jQuery). It does use CSS variables (`var(--red)`, `var(--navy)`, etc.) for theming — see [Customisation](references/customisation.md) for how to map a different palette.

## Scripts

- [inject-site-manager.mjs](scripts/inject-site-manager.mjs) — Reads a target HTML file, creates an `*_editable.html` copy, injects the Site Manager snippet, and reports the result. Refuses to overwrite an existing editable file unless `--force` is passed.

## Assets

- [site-manager-snippet.html](assets/site-manager-snippet.html) — The full Site Manager (CSS + UI + JS). The injector reads this file at runtime and inserts it into the target HTML.

## References

- [Customisation guide](references/customisation.md) — Mapping a different brand palette, widening page auto-detect for unusual layouts, troubleshooting.

## Naming Convention

- New editable copy: `<original_basename>_editable.html` in the same directory as the source.
- Exported (post-edit) file from the browser: defaults to `<basename>_edited_YYYY-MM-DD.html`. The user can rename on download.

## Important Behaviours

- Never modify the source file in place — always work on `_editable.html`.
- The exported file is clean: the Site Manager UI, overlay, and script are removed during export so the published site has no editor visible to visitors.
- Image edits embed as base64 data URLs — this increases file size. For sites with many image edits, recommend the user re-host large images and use plain URLs instead.
- Undo is currently per-session reload only (reload the editable file to discard unsaved edits). Tell the user to download often.

## Anti-Patterns

- ❌ Editing the original file directly — always produce a separate `_editable.html`.
- ❌ Injecting more than once into the same file — the script detects this and refuses unless `--force`.
- ❌ Running on partial HTML fragments — requires a complete document with `</body>`.
- ❌ Building or rewriting the snippet inline — always read it from `assets/site-manager-snippet.html`.

## When to Update This Skill

Update the snippet (`assets/site-manager-snippet.html`) when:
- A new site structure makes page auto-detect miss real pages (widen the selector list in `detectPages`).
- A new bug is found (e.g. clicks bleeding through to non-editable elements).
- A user requests a new editing capability (e.g. bulk find-and-replace, image cropping) that would be reusable across sites.

Update the script (`scripts/inject-site-manager.mjs`) when:
- A site has an unusual HTML structure that breaks the injection points (no `</style>`, no `:root`, etc.).
- A new naming convention is requested by the user.
