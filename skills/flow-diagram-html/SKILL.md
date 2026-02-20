---
name: flow-diagram-html
description: Creates a zoomable pan-and-zoom HTML flow diagram from a Mermaid flowchart definition and saves it into the workspace output folder.
version: 1.3.0
---

# Flow Diagram HTML (Mermaid + Pan/Zoom)

Create a self-contained HTML file that renders a Mermaid flowchart and provides pan/zoom controls (scroll to zoom, drag to pan).

This skill is useful when flow diagrams are needed frequently and should be shareable as a single `.html` file.

## When to Use

Use this skill when the user asks to:
- create a flow diagram / flowchart
- generate a Mermaid diagram as an HTML viewer
- produce a zoomable/pannable diagram they can open in a browser

## Inputs to Collect

1. **Output filename** (without extension is fine)
2. **Title** (optional; default: the filename)
3. **Mermaid definition**
   - Prefer a flowchart definition starting with `graph TD`, `graph LR`, or `flowchart TD`.
   - If the user provides steps in plain language, convert them into Mermaid.

## Output Location

Save the final HTML to:

- `/Users/eduardsruzga/Library/CloudStorage/GoogleDrive-er@desktopcommander_app/Shared drives/RESTRICTED/output/<filename>.html`

## Workflow

1. Ensure the output directory exists.
2. Generate the HTML **without copying the template into the LLM context** (token efficient):
   - Use the renderer script to read the template locally and inject placeholders.
   - Mermaid source is passed via **STDIN** so it’s provided only once.

   Example:
   - `node assets/render-template.mjs --output "/abs/path/out.html" --pageTitle "..." --headerTitle "..." <<'EOF'`
   - *(paste Mermaid here)*
   - `EOF`

3. **Fail-fast validate Mermaid** before returning the link:
   - Run: `node assets/validate-mermaid.mjs /absolute/path/to/output/file.html`
   - This uses `npx @mermaid-js/mermaid-cli` (cached by npx) and validates by rendering to SVG.
   - Token-efficient: Mermaid source lives once (inside the HTML); the validator extracts it from `<pre id="diagramDefinition">`.

4. **Export static SVG + PNG next to the HTML (required)**
   - Why: browser PNG export can be blocked by canvas security ("tainted canvas").
   - Run: `node assets/export-mermaid.mjs /absolute/path/to/output/file.html`
   - This writes `file.svg` and `file.png` next to the HTML so image download is always available.

5. If validation passes → return clickable links to:
   - the HTML viewer
   - the PNG
   - (optional) the SVG

6. If validation fails → show the parse error, ask for a fix/simplification, and **do not** present the HTML as “done”.

## Notes / Guardrails

- The HTML is generated via [render-template.mjs](assets/render-template.mjs) to avoid copying the full template through the LLM (token efficient).
- Keep Mermaid code inside the `<pre id="diagramDefinition">` block (the renderer script injects it there verbatim).
- Avoid adding extra indentation inside `{{MERMAID_CODE}}`.
- If the user requests a different direction, switch `TD` (top-down) to `LR` (left-right).

### Mermaid “parse-safe” rules (prevents common errors)

If CLI validation is enabled (see Workflow), these rules reduce iteration time.

When generating Mermaid from plain English, keep labels intentionally simple.

**Avoid inside labels** (node labels like `A[Label]` and especially edge labels like `A -->|Label| B`):
- Double quotes `"`
- Literal newlines `\n` (Mermaid flowcharts often don’t accept them in labels)
- Parentheses `(` `)` in edge labels (can trigger parse errors)

**Prefer instead**:
- Use plain text: `Sign in` (not `"Sign in"`)
- Use line breaks with HTML: `<br/>`
- Replace parentheses with words: `optional refresh_token` (not `(refresh_token)`)

### Correct link/label patterns

- Solid link with label:
  - `A -->|label text| B`
- Dotted/dashed link with label (label is inline, NOT `|label|`):
  - `A -. label text .-> B`

If a diagram fails to render, open the Debug panel and simplify the label first (remove punctuation), then re-introduce formatting carefully.

## Built-in Debug Mode (New)

The generated HTML now includes a **Debug** panel to make Mermaid issues easier to diagnose:
- Click **Debug** to view the Mermaid source that is being rendered.
- If Mermaid fails to render, the page will automatically show the Debug panel with the **exact parse/render error**.
- The panel includes:
  - **Render from Source** (try edits live)
  - **Copy Source**
  - **Open Source in New Tab**

Optional: add `?debug=1` to the URL to open the Debug panel immediately.
