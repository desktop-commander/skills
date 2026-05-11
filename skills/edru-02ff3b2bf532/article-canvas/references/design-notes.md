# Design Notes

## Why size-as-zoom-level

Most "semantic zoom" tools for documents (TreeReader, the Columbia UIST'21 spoken-dialog viewer, Semantic Zoom View) use the same font size at every level and require a click to switch views. This loses the comparison superpower that image thumbnails have — where you see all 10 at once and your eye picks the interesting one.

Article-canvas uses **visual hierarchy as the navigation primitive itself**:

- The most-compressed level (TL;DR) is the biggest text on screen — readable from across the room
- The full text is tiny but always visible, like terrain detail on a zoomed-out map
- You don't click to "show me the summary"; the summary is already the largest thing

This mirrors how a newspaper page works (huge headline, medium deck, small body) but generalized to arbitrary depth and made interactive.

## Alignment strategy (v0.1)

The columns are aligned **per-section, not pixel-perfect across the full document**. Each section row starts at the same vertical position in all four columns. Within a section:

- The TL;DR column shows the global TL;DR (constant across all sections — sticky at top)
- Keywords column shows section-relevant keywords (or global keywords for v0.1)
- Section summaries column shows one line per section, vertically centered in the section
- Block summaries column shows one line per block, aligned to its paragraph in the full-text column
- Full text column shows the actual article

A 2000-word section will be tall in the full-text column and the block-summaries column, but the section-summary cell will just have one line floating in that height. We accept the whitespace as the price of alignment.

**Future:** v0.2 could use sticky positioning so the section summary stays in view as you scroll its section.

## Zoom interaction

Click a paragraph in the small full-text column → it pops to a larger inline size (`font-size: 1rem` from default `0.55rem`). Click outside or hit `Esc` to collapse.

Alternative we rejected: pinch-to-zoom on the column. Scroll coupling becomes confusing — zooming a column changes its height, which breaks alignment with other columns.

## Why a paste workflow

Two reasons:
1. **Avoiding scraping.** Many sites detect and block fetching from non-browser clients. Letting the user paste sidesteps this entirely.
2. **Fidelity.** When the user copies from a rendered page, they get the page's text content with structure (headings, lists, blockquotes) preserved by the clipboard's `text/html` mime type. That's exactly what we need.

The normalizer strips inline styles, scripts, ads, and class names — keeping only structural tags (`h1`-`h6`, `p`, `ul`/`ol`/`li`, `blockquote`, `pre`/`code`, `img`, `a`). The result is portable, lightweight, and Claude can read it cleanly.

## Prior art

- **TreeReader** (NVIDIA + U Toronto, July 2025) — Chrome extension that shows academic papers as expandable key-point summaries. Vertical accordion, not aligned columns.
- **Hierarchical Summarization for Longform Spoken Dialog** (Columbia, UIST'21) — short/medium/long summary panels side by side for audio. Aligned, but uniform font sizes.
- **Semantic Zoom View** (SFU, 2011) — academic foundation for "focus + context" document viewing. Pre-LLM, so the levels were entity extraction and keyword highlighting.
- **Accordion / Fractal summarization** (Stanford, 2001–2003) — first hierarchical document compression for small screens.

Article-canvas is closest to the Columbia paper but with two key additions: **size-graded columns** (compression level = font size) and **LLM-generated summaries** (instead of extractive).
