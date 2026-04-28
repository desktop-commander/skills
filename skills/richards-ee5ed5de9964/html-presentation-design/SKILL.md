---
name: html-presentation-design
description: Create distinctive, production-grade HTML slide decks and presentations with strong visual design, clear narrative structure, responsive 16:9 layouts, speaker-friendly pacing, and print/PDF readiness. Use this skill when the user asks to build, style, redesign, or polish an HTML presentation, keynote-style deck, conference talk, pitch deck, workshop deck, visual story, or slide-based artifact. For decks that must match the existing AI agents editorial house style exactly, combine with html-presentation-style.
version: 1.0.0
---

# HTML Presentation Design

Create distinctive HTML presentations that feel intentionally designed, not like generic web pages chopped into slides. Adapt the visual ambition of the frontend-design skill to the constraints of presentation work: one strong idea per slide, cinematic pacing, legible type from a distance, and reliable presenting/printing behavior.

## When to Use

Use this skill when the user asks for:
- An HTML slide deck, presentation, keynote-style page, pitch deck, conference deck, workshop deck, or visual report
- A redesign or beautification of existing slides
- A printable or PDF-exportable HTML presentation
- Speaker notes, slide navigation, presenter-friendly pacing, or 16:9 slide layouts
- A presentation with a distinctive visual direction rather than a fixed template

If the user specifically asks for the existing AI agents presentation style, also read the [html-presentation-style](../html-presentation-style/SKILL.md) skill.

## Design Thinking

Before coding, define the presentation as a visual argument.

- **Audience**: Who is in the room, and what do they already believe?
- **Goal**: What should change after the presentation: belief, decision, action, or understanding?
- **Format**: Speaking support, self-read report, sales deck, workshop material, demo-led narrative, or printable handout.
- **Tone**: Choose a clear direction such as editorial, cinematic, brutalist, refined minimal, data-room, product-native, technical chalkboard, museum placard, operating memo, playful workshop, or high-contrast keynote.
- **Memory**: Decide what visual motif, framing device, or slide pattern the audience will remember.

Commit to one coherent aesthetic. Bold maximalism and restrained editorial design both work, but each slide must feel like part of the same deck.

## Presentation Aesthetics Guidelines

Focus on:

- **Typography**: Use characterful, legible type. Avoid default UI stacks unless the existing project requires them. Headlines should read instantly from a distance; body text should be sparse and comfortable.
- **Slide Composition**: Treat every slide as a designed frame. Use scale, contrast, alignment, and negative space to create a clear reading order. Avoid web-page sections, nested cards, and dense dashboard layouts unless the slide is explicitly a tool screenshot or data room.
- **Narrative Pacing**: Build rhythm across slides. Alternate dense and quiet moments. Use section breaks, quotes, diagrams, comparisons, reveals, and summaries deliberately.
- **Color & Theme**: Use CSS variables and a purposeful palette. Avoid generic purple gradients, overused SaaS blues, or timid evenly distributed color. Accent colors should guide attention.
- **Visual Systems**: Create reusable slide patterns for title, thesis, quote, comparison, diagram, data, demo, timeline, section break, and closing slides.
- **Motion**: Use subtle transitions and reveals to support delivery. Avoid decorative animation that distracts from the speaker or makes print/export unreliable.
- **Data & Diagrams**: Make charts and diagrams presentation-native: simplified, labeled directly, and readable without zooming. Prefer one insight per chart.
- **Print/PDF Readiness**: Include print CSS for one slide per page when the output may be exported. Hide navigation chrome and preserve backgrounds.

## Workflow

### Step 1: Clarify the Deck

Collect or infer:
- Topic and target audience
- Desired slide count or talk length
- Whether the deck is speaker-led, self-read, or printable
- Required format: single HTML file, app route, static page, React component, or other local project format
- Whether speaker notes, keyboard navigation, or PDF export are needed

Proceed with sensible defaults if the user already provided enough content to build.

### Step 2: Shape the Story

Create a compact outline before implementing. Structure the deck into acts or sections, then assign each slide one dominant message. Move narration, caveats, examples, and details into speaker notes where possible.

Avoid bullet dumps. Use a stronger slide type instead: thesis, contrast, quote, diagram, framework, timeline, before/after, metric, demo setup, decision slide, or closing ask.

### Step 3: Choose a Visual Direction

Pick a specific aesthetic direction based on the subject and audience. Define:
- Font pairing
- Color palette
- Layout grid and slide margins
- Motif or visual device
- Motion style
- Reusable slide components

Do not reuse the same look across unrelated decks. Each presentation should feel designed for its content.

### Step 4: Implement the HTML Deck

Build real working code, not a mockup. Use semantic slide sections, stable 16:9 dimensions, responsive scaling, keyboard navigation when useful, accessible contrast, and durable CSS variables.

For single-file decks, keep the HTML portable. For project-based decks, follow the repo's existing framework and styling conventions.

### Step 5: Validate the Experience

Before delivery, check:
- Slides fit at desktop and mobile/tablet widths without overlapping text
- Long titles and labels wrap cleanly
- Navigation works if included
- Print CSS creates one slide per page if PDF export is expected
- Fonts, assets, charts, and background treatments render correctly
- Motion does not hide content or break print/export

Use browser screenshots or Playwright verification for substantial decks.

### Step 6: Deliver

Return the generated file path, summarize the deck structure, and mention any remaining assumptions. If the deck can be printed to PDF, say that the HTML includes print-ready CSS.

## Non-Negotiables

- Design slides as presentation frames, not generic web pages
- Use one primary idea per slide unless the user asks for a dense reference deck
- Keep typography legible from a distance
- Avoid generic AI aesthetics and repetitive stock SaaS layouts
- Include speaker notes when the user needs talk support
- Include print styles when PDF export is part of the request
- Verify text fit and layout stability before calling the deck done

## References

- [Slide Design Rules](references/slide-design-rules.md) - Detailed composition, writing, motion, and export checks for HTML presentations
