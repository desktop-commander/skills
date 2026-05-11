---
name: article-canvas
description: Open an article in a zoomable Figma/Miro-style canvas viewer with multi-level Medium-style typography.
version: 1.0.0
---

# Article Canvas

Open an article in a zoomable Figma/Miro-style canvas viewer with multi-level Medium-style typography.

## When to Use

Use when the user wants to "scan" an article like a map. Triggers on phrases like "open article canvas", "load article into canvas", "show this article in the canvas", "scan this article", and "open canvas for <url>".

## Workflow

1. Load article content.
2. Normalize content via [normalize-html.mjs](scripts/normalize-html.mjs).
3. Render canvas via [render-canvas.mjs](scripts/render-canvas.mjs).
4. Present the output to the user.

## Scripts

- [canvas-page.mjs](scripts/canvas-page.mjs) - Handles canvas page generation
- [load-from-chrome.mjs](scripts/load-from-chrome.mjs) - Loads content from active Chrome tab
- [normalize-html.mjs](scripts/normalize-html.mjs) - Normalizes HTML structure for canvas
- [render-canvas.mjs](scripts/render-canvas.mjs) - Core rendering script

## References

- [compression-levels](references/compression-levels.md) - Explains A/B/C sizing modes
- [design-notes](references/design-notes.md) - Technical design documentation
