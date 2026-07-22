# Site Editor Customisation Guide

This reference covers tailoring the Site Manager snippet to sites that don't match the default assumptions.

## Brand colours

The Site Manager assumes a CSS-variable-based palette. The default brand variables are:

| Variable    | Purpose                  |
|-------------|--------------------------|
| `--red`     | Primary brand colour     |
| `--red-d`   | Dark brand variant       |
| `--red-l`   | Light brand variant      |
| `--navy`    | Deep / dark background   |
| `--navy-m`  | Mid-dark variant         |
| `--gold`    | Accent                   |
| `--cream`   | Off-white background     |

### Mapping a different palette

If a site uses different variable names (e.g. `--brand`, `--accent`, `--bg`), edit the `COLORS` array near the top of the script section in `assets/site-manager-snippet.html`:

```js
const COLORS = [
  {name:'Brand primary', varName:'--brand'},
  {name:'Accent',        varName:'--accent'},
  {name:'Background',    varName:'--bg'}
];
```

Then re-run the injector. The colour picker panel will reflect the new variable list.

### When the site has no CSS variables at all

The injector adds a default `:root` palette if it detects no `--red`/`--navy`/`--gold`/`--cream` declarations. The site will then be themable through the Site Manager even if the original styles use hard-coded hex values. Note: hard-coded values won't update; only elements using `var(--name)` will respond. For a stronger sweep, run a one-shot find-and-replace on the hex codes before injecting.

## Page auto-detect

`detectPages()` collects candidates from:

1. Hero blocks (`.hero-bg`, `[class*="hero"]`)
2. `<section id="...">` and any `<section>` containing a heading
3. Portal view containers (`[id^="p-view-"]`, `[id^="alm-"]`, etc.)
4. Main content wrappers (`[role="main"]`, `.p-content`, `main`)

### Widening detection for unusual sites

If a site uses different conventions (e.g. `<article class="page">` or `<div data-page="...">`), add a step inside `detectPages` in the snippet:

```js
document.querySelectorAll('article.page, [data-page]').forEach(el => push(el));
```

Match by whatever the site actually uses. Keep size guards (`offsetHeight > 80`) to avoid picking up tiny pills/icons.

### Friendly labels

Update the `map` object inside `labelFor()` to assign human-readable names to known IDs. The detector also falls back to the first `<h1>/<h2>/<h3>` text inside the section.

## Image edits and file size

Replaced images embed as base64 data URLs in the saved HTML. This works but inflates file size. If a site has many image edits:

- Tell the user to host images externally and use plain `src="https://..."` URLs instead.
- Mention that very large exports (>10 MB) may load slowly.

## Troubleshooting

### "Edit text" prompt appears when clicking the Site Manager itself

This was a bug fixed in v1.0.0. The snippet now guards every click against the Site Manager's own UI (`#v15sm-panel`, `#v15sm-btn`, `#v15sm-overlay`, `#v15sm-text-modal`). If it reappears, check that the guard `isOnSiteManagerUI(target)` is still present in `installEditCapture` inside the snippet.

### Site Manager appears nested inside its own preview

Also fixed. `refreshPreview()` clones the document and strips the Site Manager nodes and its script tag before serialising into the iframe. If you re-add a feature inside the snippet, make sure the strip list still covers all its IDs.

### Colour picker shows wrong hex

The `normalizeHex` helper renders the computed style via a temporary element and converts RGB to hex. Some browsers return `rgb(0, 0, 0)` for unset variables; in that case, edit the default value in the variable's `:root` block.

### Save → Download produces a blank file

Usually caused by a CSP / sandbox restriction in the host page. Open the file via `file://` directly rather than through an iframe / hosted preview.

## Versioning

When updating the snippet (`assets/site-manager-snippet.html`), bump the `version` in the skill's `SKILL.md` frontmatter. Use semver:

- Patch (1.0.x): bug fixes (e.g. click guard fix)
- Minor (1.x.0): new features (e.g. find-and-replace, image crop)
- Major (x.0.0): breaking changes to the injection contract
