---
name: canvas-presenter
description: This skill creates beautiful infinite-canvas HTML presentations from user content. Use when the user asks to create a presentation, slide deck, pitch deck, or wants to present information visually as navigable slides. Produces a single self-contained .html file with pan/zoom navigation, animations, dark/light mode, and optional webcam/screen share for live presenting. NOT for PowerPoint (.pptx) files — use the pptx skill for those.
version: 1.0.0
---

# Canvas Presenter

Create stunning infinite-canvas presentations as self-contained HTML files. Features pan/zoom navigation, staggered fade-in animations, dark/light mode toggle, and built-in webcam/screen share for live presenting.

## When to Use

- User asks for a "presentation", "slide deck", or "deck" and doesn't specifically need .pptx format
- User wants a visually impressive, interactive presentation that works in any browser
- User wants to present data, reports, user research, pitch decks, or storytelling content
- User says "canvas presentation" or "HTML presentation"

## Scripts

- [render.mjs](scripts/render.mjs) — Injects presentation data into HTML template and writes output file
- [validate.mjs](scripts/validate.mjs) — Validates presentation JSON structure before rendering

## References

- [Slide Templates](references/slide-templates.md) — Complete data spec for all 7 slide templates
- [Layouts](references/layouts.md) — Section layout strategies (linear, grid, freeform)

## Assets

- [template.html](assets/template.html) — Self-contained HTML template with all CSS/JS inlined (do NOT load into context)

## Workflow

### Step 1: Plan the Deck Structure

Analyze the user's content and decide:

1. How many slides and what types (title, grid, profile, table, points, quote, blank)
2. How to group them into sections with layout strategies
3. What color palette/tag colors to use for visual consistency

Typical deck patterns:
- **Pitch deck**: title → grid (problem) → grid (solution) → table (traction) → points (ask)
- **Report**: title → grid (highlights) → profiles (case studies) → table (data) → points (conclusions)
- **Story**: title → profile → profile → profile → quote → points (lessons)

### Step 2: Generate the Presentation JSON

Build the presentation data object. Load [Slide Templates](references/slide-templates.md) for the exact data shape of each template type. Load [Layouts](references/layouts.md) if using non-trivial spatial arrangements.

The root structure:
```json
{
  "sections": [
    {
      "layout": "linear",
      "options": { "gapX": 1600, "startX": 0, "startY": 0 },
      "slides": [ { "template": "title", "data": { ... } }, ... ]
    }
  ]
}
```

**Design guidelines:**
- Use `tagText` on every slide for visual context (section labels, categories)
- Use `orbColor` on feature slides for depth (decorative blurred gradient)
- Vary tag colors across sections to create visual rhythm
- Use stat cards liberally — they're visually striking
- Keep `title` text punchy; use `<span class="accent2">highlights</span>` for emphasis
- For grid slides, 2 columns works best for detail; 3 for overview
- Set `width: 1400-1500` on table and wide grid slides

**Fragment reveal (progressive disclosure within a slide):**

Add `"fragments": true` to a slide's `data` (and optionally `speakerData`) to make individual elements appear one-by-one on each click/keypress, instead of all at once. Works on:
- **grid** template: each card is a fragment
- **title** template: each stat card is a fragment

When fragments are present, pressing → (or spacebar/enter) reveals the next hidden fragment. Once all fragments are visible, the next press advances to the next slide. Pressing ← hides the last revealed fragment before going to the previous slide.

Example:
```json
{
  "template": "grid",
  "data": {
    "title": "Three pillars",
    "fragments": true,
    "columns": 3,
    "items": [
      { "icon": "1️⃣", "title": "First", "body": "Appears on first click" },
      { "icon": "2️⃣", "title": "Second", "body": "Appears on second click" },
      { "icon": "3️⃣", "title": "Third", "body": "Appears on third click" }
    ]
  }
}
```

**Dual mode (Reader / Speaker):**

Slides support an optional `speakerData` object for speaker mode. When present:
- **Reader mode** (📖): Shows full `data` content — detailed, self-contained slides for reading
- **Speaker mode** (🎤): Shows minimal `speakerData` content — key points only, with speaker notes in a panel at the bottom

Toggle with the 📖/🎤 button or press `M`.

Each slide can have:
- `speakerData` — same shape as `data` but with condensed content. Can optionally override `template` via `speakerData.template`
- `speakerData.notes` — HTML string shown in the speaker notes panel (what the presenter says aloud)
- If a slide has no `speakerData`, it looks the same in both modes

### Step 3: Validate

Pipe the presentation JSON through the validator:

```bash
echo '<presentation_json>' | node ~/.desktop-commander/skills/canvas-presenter/scripts/validate.mjs
```

Fix any errors before rendering. Only proceed when validation passes.

### Step 4: Render

Pipe the full input JSON (with title, outputPath, and presentation) to the renderer:

```bash
echo '{"title":"My Deck","outputPath":"/path/to/output.html","presentation":<validated_json>}' | node ~/.desktop-commander/skills/canvas-presenter/scripts/render.mjs
```

The renderer reads the template from `assets/template.html`, injects the data, and writes a self-contained .html file.

### Step 5: Deliver

Return the output file path to the user. The file:
- Opens in any browser (works from file:// protocol, no server needed)
- Supports arrow keys, spacebar, swipe for navigation
- Has dark/light mode toggle (D key or button)
- Has fullscreen mode (F key)
- Includes webcam and screen share controls for live presenting
- Has a progress bar and slide counter

## Token Efficiency

**Critical:** The template.html asset is ~250 lines of inlined CSS+JS. NEVER read it into context. The renderer script handles template injection locally — only the presentation data JSON needs to flow through the LLM.

## Quick Example

For a simple 3-slide deck:

```json
{
  "title": "Project Update",
  "outputPath": "/tmp/update.html",
  "presentation": {
    "sections": [{
      "layout": "linear",
      "options": { "gapX": 1600 },
      "slides": [
        {
          "template": "title",
          "data": {
            "tagText": "February 2026",
            "tagColor": "blue",
            "title": "Project <span class=\"accent2\">Update</span>",
            "subtitle": "Key milestones and next steps."
          }
        },
        {
          "template": "grid",
          "data": {
            "title": "What we shipped",
            "columns": 2,
            "items": [
              { "icon": "✅", "title": "Feature A", "body": "Launched to 100% of users." },
              { "icon": "🚧", "title": "Feature B", "body": "In beta, 80% complete." }
            ]
          }
        },
        {
          "template": "points",
          "data": {
            "tagText": "Next Steps",
            "tagColor": "green",
            "title": "What's ahead",
            "points": "→ <strong>Ship Feature B</strong> by end of month<br>→ Begin <span class=\"accent2\">user research</span> for Q2"
          }
        }
      ]
    }]
  }
}
```
