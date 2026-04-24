---
name: knowledge-base-management
description: Create or reorganize a Markdown knowledge base (wiki/notes system) with atomic notes, links, topic pages/MOCs, optional categories, and an always-updated _index.md. Includes Zettelkasten-style (Obsidian-friendly) link-first guidance.
version: 1.1.2
---

# Knowledge Base Management

## Overview

This skill helps create and maintain a structured, searchable **link-first** knowledge base in Markdown.

It supports two compatible styles:
- **KB/Wiki navigation**: topic pages + an always-updated `_index.md`.
- **Zettelkasten (Obsidian-friendly)**: atomic notes connected primarily via links; tags (if used) stay minimal and describe *note role*, not topic.

## When to Use

- Creating or organizing a project wiki/knowledge base/notes system
- Turning research/learning notes into a navigable set of linked notes
- Refactoring a growing pile of docs into topics + index

## Default Structure

- Root folder: user-provided, otherwise `knowledge-base/`
- Files/folders:
  - `_index.md` (auto-maintained table of contents)
  - `notes/` (individual notes; keep them atomic)
  - `topics/` (topic pages / MOCs — “maps of content” that *link out* to notes)
  - `categories/` (optional, for larger KBs; avoid over-nesting)

**Zettelkasten note:** treat `topics/` and `_index.md` as *entry points*, not “where knowledge belongs.” The real structure should emerge from links between notes.

Full specification and detailed rules: [Knowledge Base Management Reference](references/knowledge-base-management.md)

## Workflow

0. **Mandatory placement rule (do this every time you add new info):**
   - Read the knowledge base `_index.md` end-to-end first.
   - Use it as the source of truth for the current information architecture.
   - Decide *where the new information belongs* (existing section/topic vs new topic/category) **before** writing links.

1. Confirm the knowledge base root folder, intended audience (personal, team, AI/RAG), and preferred style (**KB/Wiki** vs **Zettelkasten/link-first**).
2. Ensure folders exist (`notes/`, `topics/`, optional `categories/`) and `_index.md`.
3. For each new item:
   - Create a note in `notes/` using the standard frontmatter + `Related:` links.
   - If 3+ notes cluster, create/refresh a topic page and link notes from it.
   - If 3+ topics cluster, create a category folder + `_category.md` (hierarchical mode).
4. **Placement + structure update (mandatory):**
   - Re-check `_index.md` to ensure the new note is placed into the *best existing* section.
   - Update any relevant section index pages (e.g., `*_topic.md`) so navigation stays consistent.
   - Only create a new topic/category if the current structure cannot reasonably accommodate the new info.
5. After every change, update `_index.md` so it reflects current structure and includes an “Uncategorized” section for orphans.
6. Periodically run maintenance: orphan check, merge/split signals, promote-to-topic signals, **metadata/tag audit** (keep tag list small; prefer links over topic tags).

## Output Expectations

- Filenames: lowercase-hyphenated
- Links: wikilinks without extension (e.g., `[[my-note]]`)
- Notes: one idea per note; keep them small and precise
- Tags (optional): **few** tags total; use for note roles (e.g., `#idea`, `#question`, `#reference`) not for topics
- Search-optimized notes: descriptive titles; key idea in first paragraph
