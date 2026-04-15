# Presentation Style Reference

## Core Feel

The source deck is not generic startup presentation design. It feels editorial, calm, and slightly cinematic.

- Mood: warm, thoughtful, human, high-trust
- Tone: expert but not flashy
- Density: sparse on-slide, rich in speaker notes
- Pacing: deliberate; each slide earns attention

## Color System

Use this palette as the default system.

- Background deep: `#f5f3ef`
- Slide background: `#faf9f6`
- Card background: `#ffffff`
- Primary text: `#1a1a1f`
- Secondary text: `#555560`
- Dim text: `#999aa5`
- Accent amber: `#c47a1a`
- Accent glow: `rgba(196, 122, 26, 0.12)`
- Accent blue: `#3b7fdb`
- Accent green: `#2d9b5a`
- Accent red: `#d14b3e`
- Accent purple: `#7c5cbf`

Use amber for emphasis, rules, accents, italic emphasis, and active states. Use the other accent colors only to differentiate concepts or levels.

## Typography

- Display font: `Instrument Serif`
- Body font: `DM Sans`
- `h1`: large, elegant, around `4rem` or slightly larger, tight line-height
- `h2`: around `2.8rem`, still display-led
- Body copy: around `1.3rem`
- Labels: uppercase, small, tracked out, subdued
- Quotes: display italic with amber border or accent treatment

## Layout Rules

- Default canvas is 16:9
- Use a centered inner container with generous side padding
- Favor single-column hero slides, two-column comparison slides, and three-card framework slides
- Keep whitespace active; avoid filling the whole frame
- Use cards only when they add scannability or conceptual grouping
- Use rounded corners, thin borders, and very soft shadows

## Motion and Interaction

- Slides transition with vertical fade-in movement
- Child elements can reveal with short staggered fade-up animation
- Navigation chrome should stay minimal: progress bar, slide counter, optional notes toggle
- Motion should disappear entirely in print

## Image and Media Treatment

- Use contained images with soft borders and rounded corners
- Video blocks should feel embedded, not dominant
- Portraits or avatars can use a circular crop with an amber border

## Print Rules

Every generated deck must include print CSS.

- Set `@page` to `1600px 900px` with zero margins
- Force each slide to render visibly and sequentially in print
- Hide progress bar, notes toggle, speaker notes panel, grain, and counters
- Disable all transitions and animations in print
- Enforce `page-break-after: always` and `break-after: page` per slide
- Keep `print-color-adjust: exact`

## What To Avoid

- Pure black backgrounds or heavy dark themes
- Loud gradients across the whole deck
- Bullet-heavy consulting slides by default
- Oversaturated accent colors
- Multiple competing focal points on one slide
- Decorative animation without meaning
