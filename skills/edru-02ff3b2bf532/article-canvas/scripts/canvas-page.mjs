// canvas-page.mjs — Figma/Miro-style zoomable canvas, section-aligned layout.
//
// Layout model (NEW):
//   The "world" is a vertical stack of horizontal ROWS.
//   - First row: ARTICLE HEADER (full-width band)
//       columns: [ Title + TL;DR | Keywords | (empty) | (empty) ]
//   - Each subsequent row: ONE SECTION
//       columns: [ (section heading marker) | Section summary | Block summaries | Full text ]
//     All four cells share the row's vertical extent — the row's height is
//     determined by whichever cell is tallest (usually the full-text cell).
//     This means a section's summary is always horizontally aligned with its
//     full text. No accidental drift.
//
//   World transform: translate(panX, panY) scale(zoom). Pan/zoom = Figma model.

export function renderPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Article Canvas</title>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600;8..60,700;8..60,800&display=swap" rel="stylesheet">
<style>
:root {
  --text: #1a1a1a;
  --dim: #6b6b6b;
  --dim2: #9b9b9b;
  --bg: #f1f1ee;
  --surface: #ffffff;
  --border: #e6e6e3;
  --accent: #1a8917;
  --highlight: #fff7cc;
  --font-serif: 'Source Serif 4', 'Georgia', serif;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Cell widths (in CSS px, native size in the world) */
  --col1-w: 460px;   /* TL;DR / Title */
  --col2-w: 380px;   /* Section summary */
  --col3-w: 340px;   /* Block summaries */
  --col4-w: 680px;   /* Full text */
  --row-gap: 0px;
  --col-gap: 0px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; }
html { font-size: 16px; -webkit-font-smoothing: antialiased; }
body { font-family: var(--font-serif); color: var(--text); background: var(--bg); line-height: 1.6; }

/* ---------- Topbar ---------- */
.topbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100; height: 48px;
  background: rgba(255,255,255,0.97); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  display: flex; align-items: center; gap: 16px;
  font-family: var(--font-sans); font-size: 13px; color: var(--dim);
}
.topbar .title { font-weight: 600; color: var(--text); }
.topbar .filepath { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 11px; opacity: 0.7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.topbar button {
  background: none; border: 1px solid var(--border); color: var(--text);
  font-family: inherit; font-size: 12px; padding: 5px 12px; border-radius: 14px; cursor: pointer;
}
.topbar button:hover { background: var(--surface); border-color: var(--dim2); }
.topbar .status { font-size: 11px; padding: 3px 10px; border-radius: 10px; }
.topbar .status.ok { color: var(--accent); background: rgba(26,137,23,0.08); }
.topbar .status.waiting { color: var(--dim); background: var(--surface); }

/* Sizing mode switcher */
.size-switch {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-sans); font-size: 11px; color: var(--dim);
}
.size-switch .seg {
  display: inline-flex; background: var(--bg); border: 1px solid var(--border);
  border-radius: 14px; padding: 2px; gap: 0;
}
.size-switch .seg button {
  background: transparent; border: none; padding: 4px 10px;
  font-family: inherit; font-size: 11px; font-weight: 600;
  color: var(--dim); border-radius: 12px; cursor: pointer;
  transition: all 0.12s;
}
.size-switch .seg button:hover { color: var(--text); }
.size-switch .seg button.active { background: var(--text); color: white; }

/* ---------- Empty state ---------- */
.empty-state {
  position: fixed; inset: 48px 0 0 0;
  display: flex; align-items: center; justify-content: center;
  padding: 40px; overflow: auto;
}
.paste-box {
  max-width: 640px; width: 100%; background: var(--surface);
  border: 2px dashed var(--border); border-radius: 16px; padding: 48px; text-align: center;
}
.paste-box h1 { font-family: var(--font-sans); font-size: 1.6rem; margin-bottom: 12px; font-weight: 700; }
.paste-box p { color: var(--dim); margin-bottom: 24px; font-size: 1rem; }
.paste-box textarea {
  width: 100%; min-height: 200px; padding: 16px;
  font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px;
  border: 1px solid var(--border); border-radius: 8px; background: var(--bg);
  resize: vertical; outline: none;
}
.paste-box textarea:focus { border-color: var(--accent); }
.paste-box .btn {
  margin-top: 16px; padding: 10px 28px; background: var(--accent); color: white;
  border: none; border-radius: 20px; font-size: 14px; font-weight: 600;
  font-family: var(--font-sans); cursor: pointer;
}
.paste-box .source-url {
  width: 100%; padding: 8px 12px; margin-top: 12px;
  font-family: var(--font-sans); font-size: 13px;
  border: 1px solid var(--border); border-radius: 6px; outline: none;
}
.paste-box .hint { font-size: 12px; color: var(--dim2); margin-top: 16px; }

/* ---------- Viewport ---------- */
.viewport {
  position: fixed; inset: 48px 0 0 0;
  overflow: hidden;
  background:
    radial-gradient(circle, #d8d8d4 1px, transparent 1px) 0 0 / 24px 24px,
    var(--bg);
  cursor: grab;
}
.viewport.panning { cursor: grabbing; }
.viewport.space-held { cursor: grab; }
.viewport.space-held.panning { cursor: grabbing; }

.world {
  position: absolute; top: 0; left: 0;
  transform-origin: 0 0;
  will-change: transform;
  display: flex; flex-direction: column;
  align-items: flex-start;
  gap: var(--row-gap);
  padding: 24px;
}

/* ---------- Section row ---------- */
.row {
  display: flex; flex-direction: row;
  align-items: stretch;
  gap: var(--col-gap);
}
.row.row-header { margin-bottom: 16px; }
.cell {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px 36px;
  position: relative;
  overflow: hidden;
}
.cell + .cell { margin-left: 12px; }
.row + .row { margin-top: 12px; }

.cell-label {
  position: absolute; top: 10px; left: 14px;
  font-family: var(--font-sans);
  font-size: 9.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.13em;
  color: var(--dim2);
}

/* ---------- Block-pairs (sub-rows inside section rows) ---------- */
/* The block-pairs container takes the place of cells 3+4 in the section row.
   It's a vertical stack of sub-rows; each sub-row has [block-summary | full-text-block]
   side-by-side, naturally sharing the same height because they're in a flex-row. */
.block-pairs {
  display: flex; flex-direction: column;
  /* width = col3 + col4 + the gap that "cell + cell" margin-left would have added */
  width: calc(var(--col3-w) + var(--col4-w) + 12px);
  gap: 0;
}
.block-pair {
  display: flex; flex-direction: row;
  align-items: stretch;
  gap: 0;
}
.block-pair + .block-pair { margin-top: 0; }
/* Inside a pair: cells share row-height via align-items: stretch */
.block-pair .cell {
  /* Sub-row cells lose the rounded corners between siblings;
     give a unified look across the stack */
  border-radius: 0;
  margin: 0;
}
.block-pair:first-child .cell:first-child { border-top-left-radius: 12px; }
.block-pair:first-child .cell:last-child  { border-top-right-radius: 12px; }
.block-pair:last-child  .cell:first-child { border-bottom-left-radius: 12px; }
.block-pair:last-child  .cell:last-child  { border-bottom-right-radius: 12px; }
/* Collapse the borders between vertically-adjacent pair cells so the stack
   reads as a single tall card with horizontal dividers */
.block-pair + .block-pair .cell { border-top: 1px solid var(--border); }
.block-pair .cell { border-bottom: none; }
.block-pair:last-child .cell { border-bottom: 1px solid var(--border); }
/* And the divider between the two cells of a pair */
.block-pair .cell.cell-blocks { border-right: 1px solid var(--border); }
.block-pair .cell.cell-fulltext { border-left: none; margin-left: 0; }

/* In sub-row mode, cells use top padding only on the first sub-row (which has the label) */
.block-pair .cell { padding: 18px 28px; }
.block-pair:first-child .cell { padding-top: 36px; }

/* ===== Header row ===== */
.cell-title { width: var(--col1-w); padding-top: 44px; }
.cell-title .article-title {
  font-family: var(--font-sans); font-size: 0.95rem; font-weight: 600;
  color: var(--dim); margin-bottom: 14px;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.cell-title .tldr-text {
  font-family: var(--font-serif);
  font-size: 2.1rem; font-weight: 600; line-height: 1.25; letter-spacing: -0.015em;
}
.cell-title .tldr-placeholder { color: var(--dim2); font-style: italic; font-size: 1.25rem; }

.cell-keywords { width: var(--col2-w); padding-top: 44px; }
.cell-keywords .keywords { display: flex; flex-wrap: wrap; gap: 8px; }
.cell-keywords .keyword {
  font-family: var(--font-sans); font-size: 13px; font-weight: 500;
  padding: 6px 14px; background: var(--bg);
  border: 1px solid var(--border); border-radius: 14px;
}
.cell-keywords .placeholder { color: var(--dim2); font-style: italic; font-size: 0.9rem; }

.cell-spacer { width: calc(var(--col3-w) + var(--col4-w) + 12px); background: transparent; border: none; padding: 0; }

/* ===== Section row cells ===== */
.cell-marker { width: var(--col1-w); padding-top: 44px; }
.cell-marker .section-heading {
  font-family: var(--font-sans);
  font-size: 0.95rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text); margin-bottom: 12px;
}
.cell-marker .section-level {
  font-family: var(--font-sans); font-size: 11px; font-weight: 600;
  color: var(--dim2); letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 8px;
}

.cell-summary { width: var(--col2-w); padding-top: 44px; }
.cell-summary .section-summary {
  font-family: var(--font-serif);
  font-size: 1.25rem; line-height: 1.45; font-weight: 500;
}
.cell-summary .section-summary.placeholder { color: var(--dim2); font-style: italic; font-size: 1.05rem; }

.cell-blocks { width: var(--col3-w); padding-top: 44px; }
.cell-blocks .block-row {
  font-family: var(--font-serif);
  font-size: 0.95rem; line-height: 1.5;
  padding: 5px 0; color: var(--text);
}
.cell-blocks .block-row.placeholder { color: var(--dim2); font-style: italic; }
.cell-blocks .block-row.image { color: var(--dim); }
.cell-blocks .block-row.image::before { content: '🖼 '; }
.cell-blocks .block-row.code { font-family: ui-monospace, monospace; color: var(--dim); }
.cell-blocks .block-row.code::before { content: '⌨ '; font-family: var(--font-sans); }
.cell-blocks .block-row.blockquote { font-style: italic; }
.cell-blocks .block-row.blockquote::before { content: '” '; font-weight: 700; }
.cell-blocks .block-row.subheading { font-weight: 700; color: var(--text); margin-top: 8px; }

.cell-fulltext { width: var(--col4-w); padding-top: 44px; }
.cell-fulltext .ft-block {
  font-family: var(--font-serif);
  font-size: 1.15rem; line-height: 1.72; letter-spacing: -0.003em;
  margin: 0 0 1.4em 0; color: #222;
}
.cell-fulltext .ft-block:last-child { margin-bottom: 0; }
.cell-fulltext .ft-block * { max-width: 100%; }
.cell-fulltext .ft-block img {
  max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 0.6em 0;
}
.cell-fulltext .ft-block.image img { margin: 0; }
.cell-fulltext .ft-block.image figcaption,
.cell-fulltext .ft-block.image .caption {
  font-size: 0.85rem; color: var(--dim); margin-top: 6px; font-style: italic; text-align: center;
}
.cell-fulltext .ft-block.code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  white-space: pre-wrap;
  background: #f6f8fa; border: 1px solid var(--border); border-radius: 6px;
  padding: 14px 18px; font-size: 0.88rem; line-height: 1.55;
}
.cell-fulltext .ft-block.blockquote {
  font-style: italic; border-left: 3px solid var(--text);
  padding-left: 22px; font-size: 1.28rem;
  color: #444; line-height: 1.55;
}
.cell-fulltext .ft-block.list ul,
.cell-fulltext .ft-block.list ol { padding-left: 1.5em; }
.cell-fulltext .ft-block.list li { margin-bottom: 0.4em; }
.cell-fulltext .ft-block a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.cell-fulltext .ft-block code {
  background: #f6f8fa; padding: 2px 6px; border-radius: 4px;
  font-size: 0.92em; font-family: ui-monospace, monospace;
}
.cell-fulltext .ft-block strong, .cell-fulltext .ft-block b { font-weight: 700; }
.cell-fulltext .ft-block em, .cell-fulltext .ft-block i { font-style: italic; }
.cell-fulltext .ft-block h4, .cell-fulltext .ft-block h5, .cell-fulltext .ft-block h6 {
  font-family: var(--font-sans); margin: 1em 0 0.4em; font-weight: 700;
}
.cell-fulltext .ft-block h4 { font-size: 1.15rem; }
.cell-fulltext .ft-block h5 { font-size: 1.0rem; }
.cell-fulltext .ft-block h6 { font-size: 0.9rem; color: var(--dim); }
.cell-fulltext .ft-block figure { margin: 0; }

/* ---------- Zoom indicator ---------- */
.zoom-indicator {
  position: fixed; bottom: 20px; right: 20px;
  background: rgba(26,26,26,0.88); color: white;
  padding: 10px 14px; border-radius: 22px;
  font-family: var(--font-sans); font-size: 12px; font-weight: 600;
  display: flex; align-items: center; gap: 12px;
  z-index: 200; backdrop-filter: blur(8px); user-select: none;
}
.zoom-indicator .pct { min-width: 48px; text-align: right; font-variant-numeric: tabular-nums; }
.zoom-indicator button {
  background: rgba(255,255,255,0.15); border: none; color: white;
  width: 26px; height: 26px; border-radius: 13px; font-size: 14px; cursor: pointer;
  font-family: inherit; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.zoom-indicator button:hover { background: rgba(255,255,255,0.25); }
.zoom-indicator .label {
  background: rgba(255,255,255,0.1);
  padding: 4px 10px; border-radius: 12px; font-size: 11px;
}

/* ---------- Help hint ---------- */
.help-hint {
  position: fixed; top: 64px; left: 20px;
  background: rgba(26,26,26,0.85); color: white;
  padding: 10px 14px; border-radius: 10px;
  font-family: var(--font-sans); font-size: 11px;
  z-index: 200; backdrop-filter: blur(8px);
  max-width: 320px; line-height: 1.6; transition: opacity 0.4s;
}
.help-hint kbd {
  background: rgba(255,255,255,0.18); padding: 1px 6px; border-radius: 4px;
  font-family: ui-monospace, monospace; font-size: 10px;
}
.help-hint.fade { opacity: 0; pointer-events: none; }
</style>
</head>
<body>

<div class="topbar">
  <span class="title" id="title">Article Canvas</span>
  <span class="filepath" id="filepath"></span>
  <span class="size-switch" id="sizeSwitch" title="A: fixed tiers · B: fit-to-cell · C: equal density">
    <span>Sizing</span>
    <span class="seg">
      <button data-mode="A" onclick="setSizingMode('A')">A</button>
      <button data-mode="B" onclick="setSizingMode('B')">B</button>
      <button data-mode="C" onclick="setSizingMode('C')">C</button>
    </span>
  </span>
  <span class="status waiting" id="status">no article</span>
  <button onclick="resetToPaste()">+ New paste</button>
</div>

<div id="root"></div>

<div class="zoom-indicator" id="zoomIndicator" style="display:none">
  <button onclick="zoomStep(-1)" title="Zoom out (−)">−</button>
  <span class="pct" id="zoomPct">100%</span>
  <button onclick="zoomStep(1)" title="Zoom in (+)">+</button>
  <button onclick="fitToWindow()" title="Fit to window (F)">⛶</button>
  <span class="label" id="zoomLabel">Reading</span>
</div>

<div class="help-hint" id="helpHint" style="display:none">
  <kbd>⌘ +scroll</kbd> zoom · <kbd>2-finger</kbd> pan · <kbd>space</kbd>+drag pan · <kbd>F</kbd> fit · <kbd>0</kbd> 100%
</div>

<script>
let state = { version: 0, path: null, article: null };
const cam = { x: 0, y: 0, z: 1, minZ: 0.06, maxZ: 2.5 };
let panning = { active: false, startX: 0, startY: 0, startCamX: 0, startCamY: 0 };
let spaceHeld = false;

// Sizing mode: 'A' = fixed tiers, 'B' = fit-to-cell, 'C' = equal density
let sizingMode = (typeof localStorage !== 'undefined' && localStorage.getItem('article-canvas-sizing')) || 'A';

function el(tag, opts = {}, children = []) {
  const e = document.createElement(tag);
  if (opts.class) e.className = opts.class;
  if (opts.id) e.id = opts.id;
  if (opts.html) e.innerHTML = opts.html;
  if (opts.text) e.textContent = opts.text;
  if (opts.onclick) e.onclick = opts.onclick;
  if (opts.style) Object.assign(e.style, opts.style);
  for (const [k, v] of Object.entries(opts.attrs || {})) e.setAttribute(k, v);
  for (const c of children) if (c) e.appendChild(c);
  return e;
}
function setStatus(t, k='waiting') {
  const s = document.getElementById('status');
  s.textContent = t; s.className = 'status ' + k;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function truncate(s, n) { s = String(s||''); return s.length > n ? s.slice(0, n-1) + '…' : s; }

async function fetchArticle() {
  try { return await (await fetch('/api/article')).json(); }
  catch (e) { setStatus('connection lost'); return null; }
}
async function pollVersion() {
  try {
    const j = await (await fetch('/api/version')).json();
    if (j.version !== state.version) {
      const d = await fetchArticle();
      if (d) updateState(d);
    }
  } catch (e) {}
}
async function postPaste(html, sourceUrl) {
  setStatus('processing...');
  try {
    const r = await fetch('/api/paste', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({html, sourceUrl}),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'paste failed');
    const d = await fetchArticle();
    updateState(d);
    setStatus('saved', 'ok');
  } catch (e) { setStatus('error: ' + e.message); }
}

function updateState(d) {
  state.version = d.version; state.path = d.path; state.article = d.article;
  document.getElementById('filepath').textContent = d.path || '';
  if (state.article) {
    document.getElementById('title').textContent = state.article.title || 'Untitled';
    const has = state.article.levels && state.article.levels.tldr;
    setStatus(has ? 'levels ready' : 'levels pending', has ? 'ok' : 'waiting');
  } else { setStatus('no article'); }
  render();
}

// ---- Empty state ----
function renderEmpty() {
  const root = document.getElementById('root');
  root.innerHTML = '';
  document.getElementById('zoomIndicator').style.display = 'none';
  document.getElementById('helpHint').style.display = 'none';
  const box = el('div', { class: 'paste-box' });
  box.append(
    el('h1', { text: 'Paste an article' }),
    el('p', { text: 'Copy from Medium, Substack, a blog post — anything with structured text. Inline formatting, links, and images are preserved.' }),
    el('textarea', { id: 'pasteArea', attrs: { placeholder: 'Paste HTML or plain text here (Cmd+V)' } }),
    el('input', { id: 'sourceUrl', class: 'source-url', attrs: { placeholder: 'Source URL (optional)' } }),
    el('button', {
      class: 'btn', text: 'Load article',
      onclick: () => {
        const html = document.getElementById('pasteArea').value;
        const sourceUrl = document.getElementById('sourceUrl').value;
        if (!html.trim()) return alert('Paste some content first');
        postPaste(html, sourceUrl);
      }
    }),
    el('p', { class: 'hint', text: 'Tip: Cmd+A → Cmd+C on a rendered article page, then Cmd+V here. The HTML clipboard data preserves structure.' })
  );
  root.appendChild(el('div', { class: 'empty-state' }, [box]));
  document.addEventListener('paste', onGlobalPaste, { once: false });
}
function onGlobalPaste(e) {
  if (state.article) return;
  if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
  const html = (e.clipboardData || window.clipboardData).getData('text/html');
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  const p = html || text;
  if (p) {
    const ta = document.getElementById('pasteArea');
    if (ta) ta.value = p;
    postPaste(p, '');
  }
}

// ---- Canvas render ----
function render() {
  const root = document.getElementById('root');
  if (!state.article) { renderEmpty(); return; }
  root.innerHTML = '';

  const viewport = el('div', { class: 'viewport', id: 'viewport' });
  const world = el('div', { class: 'world', id: 'world' });

  // Article header row (TL;DR + keywords)
  world.append(renderHeaderRow(state.article));
  // One row per section
  state.article.sections.forEach((section, idx) => {
    world.append(renderSectionRow(state.article, section, idx));
  });

  viewport.appendChild(world);
  root.appendChild(viewport);

  document.getElementById('zoomIndicator').style.display = 'flex';
  document.getElementById('helpHint').style.display = 'block';
  setTimeout(() => document.getElementById('helpHint').classList.add('fade'), 5000);

  attachInteraction();
  requestAnimationFrame(() => {
    applySizing();
    fitToWindow();
    updateSwitcherUI();
  });
}

function renderHeaderRow(article) {
  const row = el('div', { class: 'row row-header' });

  // Cell 1: title + TL;DR
  const c1 = el('div', { class: 'cell cell-title', attrs: { 'data-cell': 'title' } });
  c1.append(el('div', { class: 'cell-label', text: 'TL;DR' }));
  c1.append(el('div', { class: 'article-title', text: article.title || '' }));
  const tldr = (article.levels && article.levels.tldr) || '';
  const tldrEl = tldr
    ? el('div', { class: 'tldr-text fit', text: tldr })
    : el('div', { class: 'tldr-text tldr-placeholder', text: 'Ask Claude to generate zoom levels — TL;DR appears here.' });
  c1.append(tldrEl);
  row.append(c1);

  // Cell 2: keywords
  const c2 = el('div', { class: 'cell cell-keywords', attrs: { 'data-cell': 'keywords' } });
  c2.append(el('div', { class: 'cell-label', text: 'Keywords' }));
  const kws = (article.levels && article.levels.keywords) || [];
  if (kws.length) {
    const w = el('div', { class: 'keywords' });
    kws.forEach(k => w.append(el('span', { class: 'keyword fit', text: k })));
    c2.append(w);
  } else {
    c2.append(el('div', { class: 'placeholder', text: '(no keywords yet)' }));
  }
  row.append(c2);

  // Cell 3+4: spacer
  row.append(el('div', { class: 'cell cell-spacer' }));

  return row;
}

function renderSectionRow(article, section, idx) {
  const row = el('div', { class: 'row', attrs: { 'data-section-id': section.id } });

  // Cell 1: section marker (spans full row height)
  const c1 = el('div', { class: 'cell cell-marker', attrs: { 'data-cell': 'marker' } });
  c1.append(el('div', { class: 'cell-label', text: 'Section ' + (idx + 1) }));
  if (section.heading) {
    if (section.level) c1.append(el('div', { class: 'section-level', text: 'H' + section.level }));
    c1.append(el('div', { class: 'section-heading fit', text: section.heading }));
  } else {
    c1.append(el('div', { class: 'section-heading', text: '(intro)', style: { color: 'var(--dim2)', fontStyle: 'italic' } }));
  }
  row.append(c1);

  // Cell 2: section summary (spans full row height)
  const c2 = el('div', { class: 'cell cell-summary', attrs: { 'data-cell': 'summary' } });
  c2.append(el('div', { class: 'cell-label', text: 'Summary' }));
  if (section.summary) c2.append(el('div', { class: 'section-summary fit', text: section.summary }));
  else c2.append(el('div', { class: 'section-summary placeholder', text: '(no summary yet — ask Claude to add one)' }));
  row.append(c2);

  // Cells 3 & 4: block-pair sub-rows. Each block in the section gets its own
  // horizontal sub-row containing [block-summary | full-text-block]. The two
  // cells in a sub-row share height naturally because they're in a flex-row,
  // so the block summary is always aligned with its corresponding paragraph.
  const pairs = el('div', { class: 'block-pairs', attrs: { 'data-cell': 'blocks-pairs' } });
  const sums = (article.levels && article.levels.block_summaries) || {};
  section.blocks.forEach((b, bi) => {
    const sub = el('div', { class: 'block-pair', attrs: { 'data-block-id': b.id } });

    // Left side: the block summary
    const bs = el('div', { class: 'cell cell-blocks', attrs: { 'data-cell': 'blocks' } });
    if (bi === 0) bs.append(el('div', { class: 'cell-label', text: 'Blocks' }));
    const s = sums[b.id];
    let cls = 'block-row fit', text = '';
    if (b.type === 'image') { cls += ' image'; text = s || b.alt || b.caption || 'Image'; }
    else if (b.type === 'code') { cls += ' code'; text = s || ('Code: ' + (b.lang || 'plain')); }
    else if (b.type === 'blockquote') { cls += ' blockquote'; text = s || truncate(b.text, 100); }
    else if (b.type === 'list') { text = s || ('List of ' + (b.items?.length||0) + ' items'); }
    else if (b.type === 'subheading') { cls += ' subheading'; text = b.text; }
    else { text = s || ''; }
    if (!s && b.type === 'paragraph') { cls += ' placeholder'; text = truncate(b.text, 110); }
    bs.append(el('div', { class: cls, attrs: { 'data-block-id': b.id }, text }));
    sub.append(bs);

    // Right side: the full text of this block
    const ft = el('div', { class: 'cell cell-fulltext', attrs: { 'data-cell': 'fulltext' } });
    if (bi === 0) ft.append(el('div', { class: 'cell-label', text: 'Full text' }));
    ft.append(renderFulltextBlock(b));
    sub.append(ft);

    pairs.append(sub);
  });
  row.append(pairs);

  return row;
}

function renderFulltextBlock(b) {
  const div = el('div', { class: 'ft-block ' + b.type, attrs: { 'data-block-id': b.id } });
  if (b.html) {
    // PRESERVE the original inline HTML (with proxied images already rewritten in normalizer)
    div.innerHTML = b.html;
  } else if (b.type === 'code') {
    div.textContent = b.text || '';
  } else if (b.type === 'list') {
    const list = el(b.ordered ? 'ol' : 'ul');
    (b.items || []).forEach(it => list.append(el('li', { text: it })));
    div.append(list);
  } else {
    div.textContent = b.text || '';
  }
  return div;
}

function resetToPaste() {
  state.article = null; state.path = null;
  document.getElementById('filepath').textContent = '';
  document.getElementById('title').textContent = 'Article Canvas';
  document.getElementById('zoomIndicator').style.display = 'none';
  document.getElementById('helpHint').style.display = 'none';
  setStatus('no article');
  cam.x = 0; cam.y = 0; cam.z = 1;
  render();
}

// ============================================================
// SIZING MODES
// ============================================================
// Three strategies for "how big should the text in each cell be":
//   A: Fixed tiers — simple manual jumps per cell type
//   B: Fit-to-cell — binary-search font-size so content fills its cell
//   C: Equal density — font-size ∝ sqrt(rowHeight / contentChars) so each
//      level visually weighs the same amount as the full text in its row
// All three operate on elements with the .fit class.

function setSizingMode(mode) {
  if (!['A','B','C'].includes(mode)) return;
  sizingMode = mode;
  try { localStorage.setItem('article-canvas-sizing', mode); } catch (_) {}
  // Clear any inline sizes from previous mode, then re-apply
  clearInlineSizes();
  applySizing();
  updateSwitcherUI();
}
window.setSizingMode = setSizingMode;

function updateSwitcherUI() {
  document.querySelectorAll('.size-switch .seg button').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === sizingMode);
  });
}

function clearInlineSizes() {
  document.querySelectorAll('.fit').forEach(el => {
    el.style.fontSize = '';
    el.style.lineHeight = '';
  });
}

function applySizing() {
  if (sizingMode === 'A') return applySizingA();
  if (sizingMode === 'B') return applySizingB();
  if (sizingMode === 'C') return applySizingC();
}

// --- Mode A: Fixed tiers ---
// Bump each level to its own "weight" via class-based CSS overrides.
function applySizingA() {
  // We can express this entirely in CSS by toggling a body class — modes B/C
  // use inline styles, so as long as we cleared those, we're done.
  // Sizes A-mode tiers (also set as defaults in static CSS):
  document.querySelectorAll('.cell-title .tldr-text.fit').forEach(e => {
    e.style.fontSize = '2.2rem'; e.style.lineHeight = '1.25';
  });
  document.querySelectorAll('.cell-keywords .keyword.fit').forEach(e => {
    e.style.fontSize = '1.05rem';
  });
  document.querySelectorAll('.cell-marker .section-heading.fit').forEach(e => {
    e.style.fontSize = '1.6rem'; e.style.lineHeight = '1.3';
  });
  document.querySelectorAll('.cell-summary .section-summary.fit').forEach(e => {
    e.style.fontSize = '1.7rem'; e.style.lineHeight = '1.35';
  });
  document.querySelectorAll('.cell-blocks .block-row.fit').forEach(e => {
    e.style.fontSize = '1.15rem'; e.style.lineHeight = '1.5';
  });
  // Full text stays at the CSS default (1.05rem reading size) — that's the anchor.
}

// --- Mode B: Fit-to-cell ---
// For each cell, binary-search a font-size so the cell's content fills
// ~targetFill of its available vertical space without overflowing.
function applySizingB() {
  document.querySelectorAll('.cell[data-cell]').forEach(cell => {
    const type = cell.dataset.cell;
    if (type === 'fulltext') return;  // never resize full text
    const fits = cell.querySelectorAll('.fit');
    if (!fits.length) return;

    // The row's height is dictated by the full-text cell. We want this cell's
    // content to fill (almost) that height.
    const row = cell.closest('.row');
    const rowH = row ? row.offsetHeight : cell.offsetHeight;
    const cellLabelH = 28;  // approx height of the corner label
    const padTop = 44, padBot = 32;
    const targetH = rowH - padTop - padBot - cellLabelH;

    const minPx = 12, maxPx = 80;
    const range = perCellRange(type);
    fitToHeight(cell, fits, targetH * 0.86, range.min, range.max);
  });
}

// --- Mode C: Equal density ---
// font-size for a cell ∝ sqrt(rowH * cellW / contentChars). Each cell's
// content visually "weighs" the same as its row's full-text content.
function applySizingC() {
  document.querySelectorAll('.row').forEach(row => {
    const rowH = row.offsetHeight;
    const ft = row.querySelector('[data-cell="fulltext"]');
    if (!ft) {
      // Header row: special-case using just TL;DR vs. keywords
      const tldr = row.querySelector('.cell-title .tldr-text.fit');
      if (tldr) {
        const target = sizeForDensity(tldr, rowH, 460, 1, 1, 2.6, 1.0);
        tldr.style.fontSize = target.toFixed(2) + 'rem';
        tldr.style.lineHeight = '1.25';
      }
      row.querySelectorAll('.cell-keywords .keyword.fit').forEach(k => {
        k.style.fontSize = '1.1rem';
      });
      return;
    }

    // Reference: full-text content length and font-size
    const ftText = ft.textContent || '';
    const ftChars = Math.max(ftText.length, 200);
    const ftFontPx = parseFloat(getComputedStyle(ft.querySelector('.ft-block') || ft).fontSize) || 17;

    row.querySelectorAll('.cell[data-cell]').forEach(cell => {
      if (cell.dataset.cell === 'fulltext') return;
      const fits = cell.querySelectorAll('.fit');
      if (!fits.length) return;

      const cellText = Array.from(fits).map(f => f.textContent).join(' ');
      const cellChars = Math.max(cellText.length, 8);

      // Density ratio: how much "more space per char" this cell has
      const ratio = ftChars / cellChars;
      // sqrt because we're trading horizontal AND vertical scale
      let mult = Math.sqrt(ratio);
      // Per-cell caps to avoid runaway
      const cap = perCellRange(cell.dataset.cell);
      mult = Math.max(cap.minMult, Math.min(cap.maxMult, mult));

      const targetPx = ftFontPx * mult;
      fits.forEach(f => {
        f.style.fontSize = targetPx.toFixed(1) + 'px';
        f.style.lineHeight = '1.4';
      });
    });
  });
}

function perCellRange(type) {
  // min/max font sizes per cell type (px); also min/max multipliers for mode C
  switch (type) {
    case 'title':    return { min: 22, max: 72, minMult: 1.5, maxMult: 4.5 };
    case 'keywords': return { min: 12, max: 22, minMult: 0.7, maxMult: 1.6 };
    case 'marker':   return { min: 16, max: 44, minMult: 1.2, maxMult: 3.0 };
    case 'summary':  return { min: 16, max: 44, minMult: 1.3, maxMult: 3.2 };
    case 'blocks':   return { min: 13, max: 26, minMult: 0.9, maxMult: 1.8 };
    default:         return { min: 13, max: 30, minMult: 0.9, maxMult: 2.0 };
  }
}

function sizeForDensity(el, rowH, cellW, contentChars, refChars, maxRem, minRem) {
  // Used by header row (no full-text reference)
  const target = Math.sqrt(rowH * cellW / Math.max(contentChars, 8)) / 18;
  return Math.max(minRem, Math.min(maxRem, target));
}

// Binary-search font-size on a set of elements until their summed scrollHeight
// is just under targetH. Operates on the parent cell's content area.
function fitToHeight(cell, fits, targetH, minPx, maxPx) {
  if (targetH <= 0) return;
  let lo = minPx, hi = maxPx;
  // Group identical-class siblings so they share one font-size
  // (otherwise binary search per-element produces inconsistent type)
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    fits.forEach(f => f.style.fontSize = mid + 'px');
    // Measure total content height of the cell (minus chrome)
    const contentH = measureContentHeight(cell);
    if (contentH > targetH) hi = mid;
    else lo = mid;
    if (hi - lo < 0.5) break;
  }
  fits.forEach(f => {
    f.style.fontSize = lo.toFixed(1) + 'px';
    f.style.lineHeight = '1.4';
  });
}

function measureContentHeight(cell) {
  // Sum up children heights inside the cell, excluding the label
  let total = 0;
  Array.from(cell.children).forEach(c => {
    if (c.classList.contains('cell-label')) return;
    total += c.offsetHeight + parseFloat(getComputedStyle(c).marginTop || 0) + parseFloat(getComputedStyle(c).marginBottom || 0);
  });
  return total;
}

// ============================================================
// CAMERA / TRANSFORM
// ============================================================
function applyCamera() {
  const world = document.getElementById('world');
  if (!world) return;
  world.style.transform = \`translate(\${cam.x}px, \${cam.y}px) scale(\${cam.z})\`;
  document.getElementById('zoomPct').textContent = Math.round(cam.z * 100) + '%';
  document.getElementById('zoomLabel').textContent = zoomBand(cam.z);
}
function zoomBand(z) {
  if (z < 0.2) return 'Overview';
  if (z < 0.45) return 'Structure';
  if (z < 0.75) return 'Skim';
  if (z < 1.3) return 'Reading';
  return 'Detail';
}
function fitToWindow() {
  const world = document.getElementById('world');
  const viewport = document.getElementById('viewport');
  if (!world || !viewport) return;
  const ww = world.offsetWidth, wh = world.offsetHeight;
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  if (!ww || !wh) return;
  const PAD = 40;
  const z = Math.min((vw - PAD * 2) / ww, (vh - PAD * 2) / wh);
  cam.z = clamp(z, cam.minZ, cam.maxZ);
  cam.x = (vw - ww * cam.z) / 2;
  cam.y = (vh - wh * cam.z) / 2;
  applyCamera();
}
function zoomAt(targetZ, cx, cy) {
  targetZ = clamp(targetZ, cam.minZ, cam.maxZ);
  const wx = (cx - cam.x) / cam.z;
  const wy = (cy - cam.y) / cam.z;
  cam.z = targetZ;
  cam.x = cx - wx * cam.z;
  cam.y = cy - wy * cam.z;
  applyCamera();
}
function zoomStep(dir) {
  const v = document.getElementById('viewport');
  const cx = v.clientWidth / 2, cy = v.clientHeight / 2;
  zoomAt(cam.z * (dir > 0 ? 1.25 : 1/1.25), cx, cy);
}

// ---- Interaction ----
function attachInteraction() {
  const viewport = document.getElementById('viewport');
  if (!viewport) return;

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor = Math.exp(-e.deltaY * 0.01);
      const rect = viewport.getBoundingClientRect();
      zoomAt(cam.z * factor, e.clientX - rect.left, e.clientY - rect.top);
    } else {
      cam.x -= e.deltaX; cam.y -= e.deltaY;
      applyCamera();
    }
  }, { passive: false });

  viewport.addEventListener('mousedown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'A')) return;
    panning.active = true;
    panning.startX = e.clientX; panning.startY = e.clientY;
    panning.startCamX = cam.x; panning.startCamY = cam.y;
    viewport.classList.add('panning');
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!panning.active) return;
    cam.x = panning.startCamX + (e.clientX - panning.startX);
    cam.y = panning.startCamY + (e.clientY - panning.startY);
    applyCamera();
  });
  window.addEventListener('mouseup', () => {
    if (panning.active) {
      panning.active = false;
      const v = document.getElementById('viewport');
      if (v) v.classList.remove('panning');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      spaceHeld = true;
      const v = document.getElementById('viewport'); if (v) v.classList.add('space-held');
      e.preventDefault();
    } else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(1); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomStep(-1); }
    else if (e.key === '0') { e.preventDefault(); const v = document.getElementById('viewport'); zoomAt(1, v.clientWidth/2, v.clientHeight/2); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); fitToWindow(); }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      spaceHeld = false;
      const v = document.getElementById('viewport'); if (v) v.classList.remove('space-held');
    }
  });

  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => fitToWindow(), 100);
  });
}

window.zoomStep = zoomStep;
window.fitToWindow = fitToWindow;
window.resetToPaste = resetToPaste;

(async () => {
  const d = await fetchArticle();
  if (d) updateState(d);
  else renderEmpty();
  setInterval(pollVersion, 1000);
})();
</script>

</body>
</html>`;
}
