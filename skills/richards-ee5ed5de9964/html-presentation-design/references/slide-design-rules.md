# Slide Design Rules

Use these rules when building or reviewing an HTML presentation.

## Slide Writing

- Start every slide with the point it proves, not the topic it covers.
- Keep slide text sparse for speaker-led decks. Move detail into notes.
- Use bullets only when parallel items need comparison or scanning.
- Prefer concrete labels over decorative captions.
- Write section breaks as narrative turns, not generic agenda markers.

## Composition

- Design for a 16:9 frame first, then make it responsive.
- Give each slide one dominant visual anchor: headline, image, chart, quote, diagram, or metric.
- Use a consistent margin system so slides feel related.
- Avoid nesting cards inside cards. Use cards only for repeated comparable items.
- Make hierarchy obvious through scale, weight, spacing, and color.
- Keep important content away from slide edges for projectors and PDF export.

## Typography

- Use display type for moments that need drama and readable body type for support text.
- Keep line lengths short on large screens.
- Avoid tiny labels, low-contrast captions, and all-caps paragraphs.
- Test long words, names, and numbers so they do not overflow.

## Visual Direction

- Choose a deck-specific aesthetic before implementing.
- Use a motif that matches the subject: grid, timeline, map, dossier, product UI, lab notebook, editorial spread, command center, or stage cue.
- Avoid generic gradients, stock dashboard cards, and repeated SaaS hero compositions.
- Use real screenshots, diagrams, data, or source imagery when they help the audience understand the subject.

## Motion

- Treat animation as presentation pacing.
- Use simple fade, slide, scale, or reveal transitions with short durations.
- Do not animate core content in ways that make screenshots, printing, or PDF export unreliable.
- Respect reduced-motion preferences when practical.

## HTML Implementation

- Use semantic `<section class="slide">` blocks or an equivalent component abstraction.
- Define CSS variables for color, spacing, slide size, and typography.
- Keep slide dimensions stable with aspect-ratio or fixed presentation bounds.
- Add keyboard navigation when the deck is meant to be presented live.
- Add speaker notes in a structured form when the deck supports narration.

## Print And Export

- Include `@media print` when PDF export is expected.
- Hide navigation, progress indicators, controls, and hover-only UI in print.
- Force each slide to print on a separate page.
- Preserve backgrounds and key visual treatments when possible.
- Verify that slide content does not split across pages.

## Final Review

- Check the deck at common laptop and mobile widths.
- Confirm all text fits and no UI overlaps.
- Confirm assets load from stable paths or are embedded when portability matters.
- Confirm the first slide makes the subject immediately clear.
- Confirm the final slide gives the audience a clean ending or next action.
