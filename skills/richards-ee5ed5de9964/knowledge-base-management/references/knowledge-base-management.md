# Knowledge Base Management (Reference)

Source: `/Users/rk/DC/About DC/knowledge-base-skill.md`

---

# Knowledge Base Management

A knowledge base is a structured collection of information designed for easy organization, retrieval, and use as context—particularly valuable when working with AI tools that need to access and reason over large amounts of information.

## When to Apply

Use this skill when user asks to:
- Create or organize documentation for any project, domain, or area of interest
- Build a knowledge base, wiki, or structured notes system
- Update an existing knowledge base
- Document findings while learning or researching a topic
- Structure notes, research, or personal/professional knowledge
- "Help me organize" or "create docs for" requests

Do not apply when user wants:
- Single standalone file (just create it normally)
- Temporary notes or scratch work
- Non-documentation files (code, configs, data files, etc.)

## How to Apply

1. Use folder name provided by user, or `/knowledge-base/` as default
2. Check if folder exists; create if not
3. Create `_index.md` if missing
4. Follow structure and workflows below
5. Keep index updated after every change

## Structure

### Basic (< 20 notes)
```
/knowledge-base/
  _index.md           # Auto-generated, all links organized by topic
  /topics/            # Pillar pages (3+ related notes = topic)
  /notes/             # Individual notes
```

### Hierarchical (20+ notes)
When knowledge base grows, add category layer:
```
/knowledge-base/
  _index.md
  /categories/
    /fundamentals/
      _category.md    # Category overview + links to its topics
      /topics/
        core-concepts.md
        terminology.md
    /practical/
      _category.md
      /topics/
        methods.md
        tools.md
  /notes/             # All notes flat, linked from topics
```

Keep hierarchy to **maximum 3 levels** (category → topic → note). Research shows 67% of users abandon navigation for search beyond 3 levels.

## File Conventions

- **Naming**: lowercase, hyphens, descriptive (`project-timeline.md` not `Project Timeline Notes.md`)
- **Links**: wikilinks `[[filename]]` without extension
- **One concept per note**: split when a note covers multiple distinct ideas

### Zettelkasten-friendly defaults (link-first)

- **Links > tags > folders**: use links to represent thinking relationships (supports / contradicts / extends).
- **Tags are optional metadata**: if tags are used, keep them few and use them for *note roles* (e.g., `#idea`, `#question`, `#reference`) not for topics.
- If a “topic tag” feels tempting, **create a note instead and link to it** (e.g., `[[Second Brain]]`).

## Note Format

### Zettelkasten / Obsidian style (recommended when user mentions Zettelkasten)

**Principles:** one idea per note, atomic, link-first. Tags (if any) are minimal and describe *note role*, not topic.

```markdown
---
tags: [idea] # choose ONE role tag when possible
created: YYYY-MM-DD
---

# Note Title

Related:
- [[other-note]]
- [[supporting-concept]]

The core idea in 1–3 sentences.

Details. Link concepts on first mention only.
```

**Minimal role tag set (aim for ~5–15 total):**
- `idea`, `concept`, `question`, `argument`, `example`, `quote`, `reference`

**Optional “note lifecycle” tags (only if you want them):**
- Fleeting notes → no tags
- Literature/source notes → `source`
- Permanent notes → `zettel` or `permanent`

### KB/Wiki style (when structured navigation matters most)

```markdown
---
type: concept | how-to | reference | troubleshooting
created: YYYY-MM-DD
# tags: [optional-metadata-only]
---

# Note Title

Related: [[topic-name]], [[other-note]]

Content here. Link [[relevant-concepts]] on first mention only.
```

**Important:** avoid topic tags like `#psychology` / `#ai`. If you want a topic, make it a note (e.g., `[[AI]]`) and link to it.

## Index File Format

```markdown
# Knowledge Base Index

## Categories

### Fundamentals
- [[fundamentals/_category]] (category overview)
  - [[core-concepts]] (topic)
    - [[key-principle-a]]
    - [[key-principle-b]]
  - [[terminology]] (topic)
    - [[glossary-entry]]

### Practical Applications
- [[practical/_category]]
  - [[methods]] (topic)

## Uncategorized
- [[misc-note]]
```

For basic structure without categories, omit the category level.

## Workflows

### Creating a Note
1. Create file in `/notes/` with standard format including frontmatter
2. Add `Related:` link to relevant topic
3. Add link to `_index.md` under correct topic/category section
4. Update topic file to include link to new note

### Creating a Topic
Trigger: 3+ notes share a common theme

1. Create file in `/topics/` (or `/categories/[name]/topics/` if using hierarchy)
2. Add overview content + links to all related notes
3. Update each related note's `Related:` line
4. Create new section in `_index.md`

### Creating a Category (hierarchical only)
Trigger: 3+ topics share a broader theme

1. Create folder in `/categories/`
2. Create `_category.md` with overview
3. Move related topic files into category's `/topics/` subfolder
4. Update `_index.md` with new category section

### Updating Index (and keeping structure consistent)

**Mandatory placement check:** Before adding new links or new sections, read `_index.md` end-to-end and place the new information into the most appropriate existing section whenever possible.

Rebuild `_index.md` by:
1. Scan `/categories/` for category folders (if using hierarchy)
2. Scan `/topics/` for all topic files
3. For each topic, list its linked notes
4. Scan `/notes/` for any not linked from topics → add to Uncategorized

If the new information does not fit cleanly:
- Create/refresh a topic page (3+ related notes), then link it from `_index.md`
- Only then consider a new category (3+ topics)

## Linking Rules

- **First mention only**: don't repeat the same link in one note
- **Link for meaning**: links should express a thinking relationship (supports / contradicts / extends / example-of)
- **Specific targets**: link to the most relevant note, not the broadest “bucket”
- **Context over navigation**: link when the reader benefits, not just to satisfy structure
- **Prefer links over tags**: if you want to group by a topic, create a hub/MOC note and link to it; keep tags for note roles (e.g., `idea`, `question`, `reference`)

## Search Optimization

Most users eventually use search (62% switch from browsing to search). Optimize for findability:

- **Descriptive titles**: use key terms users would search (`Investment Portfolio Strategy` not `Money Notes`)
- **Frontload key info**: put main concept in first paragraph
- **Consistent terminology**: pick one term and use it everywhere (don't mix synonyms inconsistently)
- **Include synonyms**: mention alternative terms users might search for
- **Clear headers**: use specific section names that match search queries

## Obsidian features that support Zettelkasten (optional)

- **Backlinks**: “accidental discovery” of related notes
- **Graph view**: surfaces clusters of ideas (not categories)
- **Search**: replaces over-tagging
- **Aliases**: one idea, multiple names

## AI Retrieval Considerations

For knowledge bases used with AI tools (RAG, assistants, context windows):

- **One concept per note**: aids semantic chunking
- **Frontload context**: first paragraph should be self-contained summary
- **Explicit headers**: use descriptive section names, not clever ones
- **Avoid dangling references**: don't use pronouns that require context from other notes
- **Include light metadata**: a small set of role/lifecycle tags (e.g., `idea`, `reference`, `source`, `permanent`) helps filtering without turning tags into topics
- **Consistent structure**: same format across notes improves retrieval quality

## Example Domains

This structure works for any knowledge domain:

| Domain | Example Categories | Example Topics |
|--------|-------------------|----------------|
| Personal Learning | fundamentals, advanced, resources | key-concepts, techniques, tools |
| Business/Work | processes, policies, projects | onboarding, workflows, guidelines |
| Research | literature, methods, findings | theories, experiments, data |
| Hobby/Interest | basics, techniques, projects | equipment, skills, completed-works |
| Health/Wellness | nutrition, exercise, mental-health | meal-planning, routines, practices |

Adapt category and topic names to match the natural structure of your domain.

## Maintenance

- **Orphan check**: notes in Uncategorized need a home or deletion
- **Merge signal**: two notes heavily reference each other → consider combining
- **Split signal**: note has multiple H2 sections on different concepts → split into separate notes
- **Promote signal**: 3+ notes link to same concept not yet a topic → create topic
- **Tag/metadata audit**: keep the tag list intentionally small; if a new “topic tag” appears, prefer creating a note and linking instead
