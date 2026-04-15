# Slide Authoring Rules

## Narrative Principles

- Build the deck as a sequence of beats, not a stack of topics
- Keep one idea per slide
- Write for spoken delivery first
- Use speaker notes for examples, nuance, and transitions
- Let visual contrast do more work than volume of text

## Preferred Slide Types

- Hero title
- Big quote
- Assertion plus supporting paragraph
- Two-column comparison
- Three-card framework
- Diagram or process slide
- Demo or CTA slide

## Writing Constraints

- Keep headlines short and strong
- Use italics or accent color for one key phrase, not many
- Avoid more than one paragraph unless the slide is intentionally content-heavy
- Keep body copy to a few lines when possible
- Use labels for acts or sections to give the audience a sense of progression

## Notes Discipline

Speaker notes should:
- Carry the real speaking script
- Include timing or delivery cues when useful
- Hold examples that would clutter the slide
- Clarify what to emphasize or pause on

## Layout Guidance

Choose layout by the idea:
- `hero` for opening, section resets, or major claims
- `quote` for point-of-view or emotional beats
- `two-column` for contrast, before/after, or story plus visual
- `three-card` for frameworks and multi-part models
- `custom` only when a standard layout weakens the idea

## HTML Authoring Guidance

- Prefer semantic HTML inside each slide body
- Keep inline styles minimal and purposeful
- Reuse the template utility classes before adding new ones
- Serialize slide data as JSON and let the renderer escape it safely
- Preserve relative asset paths when deck assets live beside the output file

## Print and Export Discipline

- Never remove the print stylesheet
- Keep the slide size fixed at 16:9 in print
- Ensure hidden UI stays hidden in exported PDF
- Test both live presentation mode and browser print mode before handoff
