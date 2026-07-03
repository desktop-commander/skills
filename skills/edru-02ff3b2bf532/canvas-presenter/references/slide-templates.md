# Slide Templates Reference

Complete data specification for each slide template in Canvas Presenter.

## Common Properties

All templates share these optional properties:
- `tagText` (string) — pill label text, e.g. "Key Insights"
- `tagColor` (string) — `green` | `blue` | `red` | `purple` | `warn`
- `orbColor` (string) — decorative gradient orb color: `accent` | `accent2` | `danger` | `warn` | `purple`
- `orbStyle` (string) — CSS positioning for the orb, e.g. `"top:-200px;right:-200px;"`
- `fragments` (boolean) — when `true`, child elements (grid cards, stat cards) appear one-by-one on each click instead of all at once. Supported on `grid` and `title` templates.

## Dual Mode: Reader / Speaker

Any slide can include a `speakerData` object for speaker mode (toggled with M key or 📖/🎤 button):

```json
{
  "template": "points",
  "data": {
    "tagText": "The Problem",
    "tagColor": "red",
    "title": "MCP gave AI <span class=\"danger\">superpowers</span>",
    "points": "→ AI reads files — dumps <strong>raw text</strong><br>→ 20–80% made zero uses after install<br>→ No UI control for MCP developers"
  },
  "speakerData": {
    "tagText": "The Problem",
    "tagColor": "red",
    "title": "MCP = <span class=\"danger\">backend without frontend</span>",
    "points": "→ Raw text dumps<br>→ 20–80% activation gap<br>→ Zero UI control",
    "notes": "Talk about our own experience here. We ran prompt injection experiments, A/B tested welcome screens. But fundamentally we were building powerful tools inside a text box. Every other MCP server had the same problem."
  }
}
```

- `speakerData` uses the same template as `data` by default, or override with `speakerData.template`
- `speakerData.notes` — shown in the fixed notes panel at the bottom during speaker mode
- If no `speakerData`, the slide looks identical in both modes

## HTML in Data Values

Titles, subtitles, body text, and points fields accept inline HTML. Use color classes for emphasis:
- `<span class="accent">green text</span>`
- `<span class="accent2">blue text</span>`
- `<span class="danger">red text</span>`
- `<span class="warn">orange text</span>`
- `<span class="purple">purple text</span>`
- `<strong>bold</strong>`, `<br>` for line breaks

---

## 1. `title` — Hero / Opening Slide

```json
{
  "template": "title",
  "data": {
    "tagText": "Quarterly Review · Q1 2026",
    "tagColor": "blue",
    "title": "Product <span class=\"accent2\">Insights</span>",
    "subtitle": "A deep dive into user behavior and growth.",
    "stats": [
      { "value": "12.4K", "label": "Active Users", "color": "accent2" },
      { "value": "87%", "label": "Satisfaction", "color": "accent" }
    ],
    "footnote": "ACME CORP · CONFIDENTIAL",
    "orbColor": "accent2"
  }
}
```

Best for: opening slides, section headers, big announcements.

---

## 2. `grid` — Card Grid (2-4 columns)

```json
{
  "template": "grid",
  "width": 1400,
  "data": {
    "tagText": "Key Themes",
    "tagColor": "warn",
    "title": "4 themes driving <span class=\"warn\">this quarter</span>",
    "columns": 2,
    "items": [
      { "icon": "🚀", "title": "Growth", "value": "<span class=\"accent\">+180%</span>", "body": "User signups tripled." },
      { "icon": "🔄", "title": "Retention", "value": "<span class=\"danger\">-12%</span>", "body": "Day-30 retention dropped." }
    ],
    "orbColor": "warn"
  }
}
```

Best for: feature overviews, KPI summaries, comparison grids.

---

## 3. `profile` — Person/Persona with Before→After

```json
{
  "template": "profile",
  "width": 1300,
  "data": {
    "tagText": "User 1 · 499 prompts",
    "tagColor": "blue",
    "color": "accent2",
    "name": "Alice Chen",
    "label": "Full-Stack Developer",
    "before": { "label": "First Action", "text": "Organize this folder by file type." },
    "after": { "label": "Real Job", "text": "Built a complete SaaS app.", "danger": false },
    "journey": "→ File organization\n→ Codebase audit\n→ Full app scaffolding",
    "quote": "Power user. Full-time pair programmer.",
    "quoteColor": "blue"
  }
}
```

Set `after.danger: true` for negative outcomes (red styling). The `journey` field uses `\n` for line breaks. Best for: user stories, persona cards, case studies.

---

## 4. `table` — Data Table

```json
{
  "template": "table",
  "width": 1500,
  "data": {
    "tagText": "Data",
    "tagColor": "blue",
    "title": "All users: first action → <span class=\"accent2\">real job</span>",
    "columns": ["User", "Prompts", "Days", "First Action"],
    "rows": [
      ["Alice Chen", "<strong class=\"accent2\">499</strong>", "5", "Organize folder"],
      ["Marco Silva", "<strong class=\"purple\">314</strong>", "12", "System health"]
    ],
    "orbColor": "accent2"
  }
}
```

Best for: comparison tables, data summaries, leaderboards.

---

## 5. `points` — Key Takeaways with Stats

```json
{
  "template": "points",
  "data": {
    "tagText": "Discussion",
    "tagColor": "blue",
    "title": "What the data <span class=\"accent2\">tells us</span>",
    "points": "→ <strong>26% are developers</strong> — core use case<br>→ <strong class=\"danger\">Churn risk</strong> = expectation gap",
    "stats": [
      { "value": "7/27", "label": "Developers", "color": "accent2" },
      { "value": "3/27", "label": "Trading", "color": "danger" }
    ],
    "footnote": "DATA FROM 3,561 PROMPTS · 27 USERS",
    "orbColor": "accent2"
  }
}
```

Best for: conclusions, recommendations, summaries.

---

## 6. `quote` — Big Centered Quote

```json
{
  "template": "quote",
  "data": {
    "tagText": "User Voice",
    "tagColor": "green",
    "quote": "I want three distributions: conservative, consensus, and savant-level wow.",
    "attribution": "Power User #8",
    "orbColor": "purple"
  }
}
```

Best for: testimonials, pull quotes, key statements.

---

## 7. `blank` — Custom HTML

```json
{
  "template": "blank",
  "data": {
    "html": "<div style='text-align:center;'><h1>Custom Content</h1><p>Any HTML here.</p></div>"
  }
}
```

Best for: anything not covered by other templates, fully custom layouts.
