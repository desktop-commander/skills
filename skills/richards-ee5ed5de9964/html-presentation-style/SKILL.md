---
name: html-presentation-style
description: Creates polished HTML presentations in the same editorial style as the AI agents presentation on the Desktop: warm off-white backgrounds, Instrument Serif plus DM Sans typography, amber accents, spacious layouts, cinematic pacing, speaker notes, and built-in print CSS. Use when the user asks for an HTML slide deck, keynote-style presentation, conference talk deck, speaker-noted slides, or a printable 16:9 presentation page.
version: 1.0.0
---

# HTML Presentation Style

Create HTML slide decks that match the visual language of the existing AI agents presentation.

## Use This Skill For

Use this skill when the user wants:
- An HTML presentation or slide deck
- A deck in the same visual style as the AI agents presentation
- Speaker notes built into the deck
- A deck that prints cleanly to PDF with one 16:9 slide per page
- A presentation system that is easy to adapt for future talks

## Style System

Match the source deck’s design choices precisely enough that the family resemblance is obvious.

- Use warm paper backgrounds instead of pure white or dark mode
- Use `Instrument Serif` for headlines and `DM Sans` for body copy
- Use restrained amber as the main accent, with blue, green, red, and purple only as support colors
- Favor generous whitespace, centered composition, and one strong idea per slide
- Keep slides editorial rather than corporate: fewer boxes, larger type, tighter hierarchy
- Treat motion as pacing, not decoration: soft fade-up transitions and subtle stagger reveals only

For the extracted design language, read [Presentation Style Reference](references/presentation-style-reference.md).
For writing rules, read [Slide Authoring Rules](references/slide-authoring-rules.md).

## Workflow

### Step 1: Clarify the deck

Define:
- Audience
- Goal of the talk
- Desired slide count or duration
- Whether the deck is mostly speaking support, content-dense, or demo-led
- Whether speaker notes are required for every slide

If the user already has source notes, outline, or markdown, use that material as the content source.

### Step 2: Shape the narrative

Build the deck around acts or clear sections.

- Start with a title slide that feels cinematic, not busy
- Give each slide one dominant message
- Prefer quotes, frameworks, diagrams, or bold assertions over bullet dumps
- Put explanatory detail into notes, not on the slide
- Use cards and grids only when comparison or structure helps comprehension

### Step 3: Prepare slide data

Represent each slide as a small object with:
- `act`
- `title`
- `notes`
- `layout`
- `bodyHtml`

Use simple layout types such as `hero`, `quote`, `two-column`, `three-card`, `image-left`, `image-right`, `framework`, or `custom`.

### Step 4: Render the deck

Use [render-presentation.mjs](scripts/render-presentation.mjs) with [deck-template.html](assets/deck-template.html). The renderer keeps the large template out of model context and injects only the deck-specific data.

### Step 5: Validate before delivery

Run [validate-presentation.mjs](scripts/validate-presentation.mjs) on the output file before saying it is done.

Validation must confirm:
- The template placeholders are fully resolved
- The print stylesheet is present
- The deck contains slide sections
- Speaker notes and slide data are serialized safely

### Step 6: Finalize for the user

Return the generated HTML file plus a short summary of the presentation structure. If asked for PDF export, keep the print CSS intact and explain that browser print should preserve one 1600x900 slide per page.

## Scripts

- [render-presentation.mjs](scripts/render-presentation.mjs) - Injects deck data into the reusable presentation template
- [validate-presentation.mjs](scripts/validate-presentation.mjs) - Checks that output HTML is ready for presentation and print/PDF export

## References

- [Presentation Style Reference](references/presentation-style-reference.md) - Colors, type, layout, motion, and interaction principles extracted from the source deck
- [Slide Authoring Rules](references/slide-authoring-rules.md) - Content and pacing rules for writing new decks in the same style

## Assets

- [deck-template.html](assets/deck-template.html) - Base presentation shell with typography, slide chrome, navigation, and print CSS

## Non-Negotiables

- Keep backgrounds warm and soft, never stark
- Keep typography expressive but restrained
- Keep print CSS in every generated deck
- Hide interactive chrome in print
- Force one slide per printed page
- Do not overload slides with dense bullets unless the user explicitly asks for it
- Prefer speaker notes for detail, narration, and examples
