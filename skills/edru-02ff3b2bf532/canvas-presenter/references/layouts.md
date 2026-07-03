# Layout Strategies Reference

Canvas Presenter positions slides on an infinite canvas using layout strategies applied per-section.

## Section Structure

```json
{
  "sections": [
    {
      "layout": "linear",
      "options": { "gapX": 1600, "startX": 0, "startY": 0 },
      "slides": [ ... ]
    },
    {
      "layout": "grid",
      "options": { "cols": 3, "gapX": 1500, "gapY": 900, "startX": 0, "startY": 1200 },
      "slides": [ ... ]
    }
  ]
}
```

## Layout Types

### `linear` — Horizontal Row
Slides arranged left-to-right in a single row.

Options:
- `gapX` (default: 1600) — horizontal spacing between slides
- `startX` (default: 0) — X offset for the first slide
- `startY` (default: 0) — Y offset for the row

### `grid` — Wrapped Grid
Slides wrap into rows after N columns.

Options:
- `cols` (default: 4) — columns before wrapping
- `gapX` (default: 1600) — horizontal gap
- `gapY` (default: 1000) — vertical gap between rows
- `startX`, `startY` — origin offset

### `freeform` — Manual Positioning
Each slide specifies its own `left` and `top` in the slide config.

### `stack` — Same Position, Fade Between
All slides occupy the **same canvas position**, fading in/out as the user navigates. No camera pan, no Prezi-style fly between slides. Use for slides that conceptually belong to the same "section" of a talk — multiple beats of one argument, or H2 subsections within an H1 section of an article.

Options:
- `startX` (default: 0) — X position for all slides in the section
- `startY` (default: 0) — Y position for all slides in the section

**When to use linear vs stack:**
- **linear**: every slide is a distinct "place" in the deck; the camera pans between them (Prezi feel). Best for transitioning between major sections of a talk.
- **stack**: every slide is the *same place* with different content; the camera stays put and content crossfades. Best for stepping through beats within one section without losing the audience's spatial orientation.

**Article-to-deck mapping** (typical pattern):
- Each H1 section of the article → one section in the deck
- If the H1 has multiple H2s → use `layout: "stack"` so the H2 slides fade in place
- Position each H1 section far apart on the canvas (large `startX` or `startY` deltas) so cross-section transitions still feel like a Prezi fly

## Positioning Multiple Sections

Use `startX` and `startY` to place sections at different areas of the canvas. The viewer navigates between slides in order, panning/zooming across sections automatically.

**Common pattern — spatial storytelling:**
```
Section 1 (linear, startY: 0)       → Opening slides in a row
Section 2 (grid, startY: 1200)      → Detail cards in a grid below
Section 3 (linear, startY: 3200)    → Closing analysis further below
```

This creates a visual hierarchy where zooming out reveals the full story structure.

## Slide Width Override

Individual slides can override the default 1200px width:
```json
{ "template": "table", "width": 1500, "data": { ... } }
```

Use wider slides for tables and grid cards that need more horizontal space.

## Navigation

The engine auto-calculates zoom/pan to fit each slide on screen. Users navigate linearly through all slides across all sections using arrow keys, spacebar, or click.
