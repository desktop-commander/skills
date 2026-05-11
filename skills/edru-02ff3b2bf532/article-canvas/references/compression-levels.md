# Compression Levels

When the user asks Claude to generate zoom levels for an article in the canvas, Claude reads the JSON file and produces four compression levels. Each level has a distinct purpose and visual size.

## Level 1: TL;DR (largest font)

**Format:** One sentence, max 25 words.

**Goal:** If the reader only reads one thing, this is it. Captures the article's central claim or finding, not its topic.

**Bad:** "This article discusses the impact of AI on software development."
**Good:** "Most AI-coding productivity gains come from boilerplate elimination, not novel problem-solving — and the gap is closing slowly."

Write the result to `levels.tldr`.

## Level 2: Keywords (large font, displayed as chips)

**Format:** 5–9 keyword chips. Each is 1–3 words.

**Goal:** Topic surface area. What concepts, tools, people, or places does this article touch?

**Selection rules:**
- Proper nouns get priority (specific tools, companies, people)
- Avoid generic terms ("technology", "future", "challenges")
- Mix abstract concepts and concrete things
- No duplicates or near-synonyms

Write to `levels.keywords` as an array of strings.

## Level 3: Section summaries (medium font, one per section)

**Format:** One line per section, max 15 words. Written in the article's own voice — not "the article discusses" framing.

**Goal:** The article's spine. Reading the section summaries top to bottom should feel like reading a compressed version of the article that still makes sense as prose.

**Selection rules:**
- The summary is the section's *argument*, not its topic
- Use the same tense and voice as the article
- If a section has a heading, the summary should add information beyond what the heading already says

Write each to `sections[i].summary`.

## Level 4: Block summaries (small font, one per paragraph/block)

**Format:** One line per text block (paragraphs, blockquotes, lists). Max 12 words. Images and code blocks get a short caption instead.

**Goal:** Skim layer. The reader can run their eye down this column and decide which paragraphs to actually read in the full-text column.

**Selection rules:**
- For paragraphs: extract the single most informative sentence-fragment
- For blockquotes: who said what, in 6–10 words
- For lists: "List of N items: X, Y, Z..."
- For images: alt text or 5-word description
- For code blocks: "Code: [language] — [what it does]"

Write to `levels.block_summaries` as `{ "b1": "summary", "b2": "summary", ... }`.

## Update protocol

After generating, write the entire updated JSON back to the same file. The server watches the file and the browser auto-reloads.

```javascript
// Pseudo-code
const article = JSON.parse(readFileSync(jsonPath));
article.levels.tldr = "...";
article.levels.keywords = [...];
article.sections.forEach(s => s.summary = "...");
article.levels.block_summaries = { ... };
writeFileSync(jsonPath, JSON.stringify(article, null, 2));
```

## Quality bar

If you find yourself writing meta-text ("This section explains...", "The author argues..."), stop and rewrite in the article's own voice. The reader should be able to read the summary column as if it were the article itself, just shorter.
