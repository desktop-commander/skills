---
name: markdown-preview
description: Preview and edit local markdown files with clean, Medium-style typography in Chrome. Includes WYSIWYG editing with floating toolbar, auto-save back to .md, and live reload. Use when the user wants to preview, view, read, or edit a .md file as a formatted page — especially blog drafts, articles, documentation, or KB notes. Triggers on phrases like "preview markdown", "edit this article", "show me how this looks", "render this .md file", or "open this nicely".
version: 2.0.0
---

# Markdown Preview & Editor

Preview and edit any local `.md` file as a beautifully formatted, Medium-style page in Chrome — with WYSIWYG editing and auto-save.

## When to Use

- Previewing blog article drafts before publishing
- Editing articles with Medium-style formatting (select text → floating toolbar)
- Reading KB notes, documentation, or READMEs with proper formatting
- Reviewing markdown content with tables, code blocks, and images
- Any time the user wants to "see" or "edit" a markdown file as a formatted page

## Workflow

### Step 1: Start the editor

```bash
node ~/.desktop-commander/skills/markdown-preview/scripts/render-preview.mjs /path/to/file.md
```

Opens Chrome automatically with the formatted article.

### Step 2: Edit (Medium-style)

- **Click anywhere** to start typing
- **Select text** → floating toolbar appears with: Bold, Italic, Code, H2, H3, Link, Blockquote, Section break
- **Keyboard shortcuts**: Cmd+B bold, Cmd+I italic, Cmd+K link, Cmd+S save
- **Auto-saves** to the `.md` file after 1.5s of inactivity
- **YAML frontmatter** is preserved automatically on save

### Step 3: External editing

If the file is edited externally (e.g., in VS Code), the browser refreshes automatically.

### Step 4: Stop

The server runs until terminated (Ctrl+C or kill the process).

## Features

- **Medium-style WYSIWYG** — Edit rendered text directly, saves back as markdown
- **Floating toolbar** — Appears on text selection with formatting buttons
- **Auto-save** — Debounced 1.5s save with status indicator (Saved/Editing.../Error)
- **Frontmatter preservation** — YAML frontmatter untouched during editing
- **Medium-style typography** — Source Serif 4 font, 728px content width
- **GitHub-flavored markdown** — tables, task lists, code blocks
- **Syntax-highlighted code** — highlight.js with GitHub theme
- **Local image support** — relative paths resolved from markdown directory
- **Image placeholders** — `<!-- IMAGE: description -->` rendered as placeholder cards
- **Reading time & progress** — auto-calculated in top bar
- **Live reload** — external file changes trigger browser refresh
- **Port fallback** — auto-increments if default port is taken

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | 3456 | HTTP port for the server |

## Scripts

- [render-preview.mjs](scripts/render-preview.mjs) — Editor + preview server

## Limitations

- HTML→Markdown roundtrip may simplify some complex markdown constructs
- Code block editing is basic (no syntax-aware editing)
- Table editing preserves content but may reformat alignment
- Images cannot be inserted via the editor (add in markdown directly)
