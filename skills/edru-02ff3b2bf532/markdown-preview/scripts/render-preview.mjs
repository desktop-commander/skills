#!/usr/bin/env node
/**
 * markdown-preview: Medium-style markdown editor and previewer.
 *
 * Usage:
 *   node scripts/render-preview.mjs /path/to/file.md [--port 3456]
 *
 * Features:
 *   - Medium-style WYSIWYG editing (contenteditable)
 *   - Floating toolbar on text selection (bold, italic, H2, H3, link, blockquote, code)
 *   - Auto-save to .md file on edit (debounced)
 *   - GitHub-flavored markdown rendering
 *   - Syntax-highlighted code blocks
 *   - Local image support
 *   - YAML frontmatter preserved on save
 *   - Reading progress bar
 */

import { readFileSync, writeFileSync, watchFile, unwatchFile } from 'fs';
import { createServer } from 'http';
import { resolve, dirname, basename, extname, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const mdPath = resolve(args.find(a => !a.startsWith('--')) || '');
const portFlag = args.indexOf('--port');
const port = portFlag !== -1 ? parseInt(args[portFlag + 1], 10) : 3456;

if (!mdPath || !mdPath.endsWith('.md')) {
  console.error('Usage: node render-preview.mjs <file.md> [--port 3456]');
  process.exit(1);
}

const mdDir = dirname(mdPath);
const title = basename(mdPath, '.md');

// --- Frontmatter handling ---
function extractFrontmatter(md) {
  if (md.startsWith('---')) {
    const end = md.indexOf('---', 3);
    if (end !== -1) {
      return { frontmatter: md.slice(0, end + 3), body: md.slice(end + 3).trim() };
    }
  }
  return { frontmatter: '', body: md };
}

function readingTime(text) {
  return Math.ceil(text.replace(/<[^>]*>/g, '').trim().split(/\s+/).length / 238);
}

// --- Markdown → HTML ---
function md2html(md) {
  let html = md;
  html = html.replace(/<!--\s*IMAGE:\s*([\s\S]*?)\s*-->/g,
    (_, d) => `<div class="image-placeholder">${d.trim().replace(/\n/g,'<br>')}</div>`);
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const cls = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${cls}>${code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`;
  });
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^\s*[-*_]{3,}\s*$/gm, '<hr>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (block) => {
    const rows = block.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2 || !/^\|[\s-:|]+\|$/.test(rows[1])) return block;
    const hdr = rows[0].split('|').filter(c=>c.trim()).map(c=>c.trim());
    let t = '<table><thead><tr>' + hdr.map(c=>`<th>${c}</th>`).join('') + '</tr></thead><tbody>';
    rows.slice(2).forEach(r => {
      const cells = r.split('|').filter(c=>c.trim()).map(c=>c.trim());
      t += '<tr>' + cells.map(c=>`<td>${c}</td>`).join('') + '</tr>';
    });
    return t + '</tbody></table>';
  });
  const blocks = html.split(/\n{2,}/);
  html = blocks.map(b => {
    const t = b.trim();
    if (!t) return '';
    if (/^<(h[1-6]|pre|table|ul|ol|li|blockquote|hr|div|img|p)/.test(t)) return t;
    return `<p>${t.replace(/\n/g,'<br>')}</p>`;
  }).join('\n\n');
  html = html.replace(/<p>&gt;\s?(.*?)(<br>|<\/p>)/g, (m,c,e) =>
    `<blockquote><p>${c}</p></blockquote>${e==='</p>'?'':''}`);
  return html;
}

// --- Build page with Medium-style editor ---
function buildPage(mdFilePath, fileTitle) {
  const raw = readFileSync(mdFilePath, 'utf-8');
  const { body } = extractFrontmatter(raw);
  const bodyHTML = md2html(body);
  const minutes = readingTime(body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fileTitle}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600;8..60,700;8..60,800&display=swap" rel="stylesheet">
<style>
:root{--text:#1a1a1a;--dim:#6b6b6b;--bg:#fff;--surface:#f9f9f9;--border:#e6e6e6;--accent:#1a8917;--code-bg:#f6f8fa;
--font-serif:'Source Serif 4','Georgia',serif;--font-sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
--font-mono:'SFMono-Regular','Fira Code','Consolas',monospace;--content-width:728px}
*{margin:0;padding:0;box-sizing:border-box}
html{font-size:18px;-webkit-font-smoothing:antialiased}
body{font-family:var(--font-serif);color:var(--text);background:var(--bg);line-height:1.72}
.progress-bar{position:fixed;top:0;left:0;height:3px;background:var(--accent);z-index:200;transition:width .1s;width:0%}
.topbar{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.97);border-bottom:1px solid var(--border);padding:10px 24px;display:flex;align-items:center;gap:12px;font-family:var(--font-sans);font-size:13px;color:var(--dim);backdrop-filter:blur(8px)}
.topbar .dot{color:var(--accent);font-size:18px}
.topbar .filepath{font-family:var(--font-mono);font-size:12px;color:var(--dim);opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.topbar .reading-time{font-weight:600;white-space:nowrap}
.topbar .save-status{font-size:12px;padding:3px 10px;border-radius:12px;transition:all .3s}
.topbar .save-status.saved{color:var(--accent);background:rgba(26,137,23,.08)}
.topbar .save-status.saving{color:var(--dim);background:var(--surface)}
.topbar .save-status.error{color:#c00;background:rgba(200,0,0,.08)}
article{max-width:var(--content-width);margin:0 auto;padding:48px 24px 120px;outline:none}
article:focus{outline:none}
h1{font-family:var(--font-sans);font-size:2.6rem;font-weight:800;line-height:1.12;letter-spacing:-.02em;margin:0 0 12px}
h2{font-family:var(--font-sans);font-size:1.45rem;font-weight:700;line-height:1.25;letter-spacing:-.01em;margin:2.2em 0 .6em}
h3{font-family:var(--font-sans);font-size:1.15rem;font-weight:600;line-height:1.3;margin:1.8em 0 .5em}
h4{font-family:var(--font-sans);font-size:1rem;font-weight:600;margin:1.5em 0 .4em}
h1+p>em:only-child{display:block;font-family:var(--font-serif);font-size:1.25rem;color:var(--dim);line-height:1.5;margin-bottom:32px;font-style:italic}
p{margin:0 0 1.15em;font-size:1rem}
a{color:var(--accent);text-decoration:underline;text-underline-offset:2px}
strong{font-weight:700}
blockquote{border-left:3px solid var(--text);padding-left:20px;margin:1.5em 0;font-style:italic;font-size:1.1rem}
blockquote p{margin-bottom:.5em}
hr{border:none;text-align:center;margin:2.5em 0}
hr::before{content:'···';font-size:1.5rem;letter-spacing:.6em;color:var(--dim)}
ul,ol{margin:0 0 1.15em;padding-left:1.6em}
li{margin-bottom:.35em}
code{font-family:var(--font-mono);font-size:.88em;background:var(--code-bg);border-radius:4px;padding:2px 6px}
pre{background:var(--code-bg);border-radius:8px;padding:20px 24px;margin:1.5em 0;overflow-x:auto;font-size:.82rem;line-height:1.55;border:1px solid var(--border)}
pre code{background:none;padding:0;border-radius:0;font-size:inherit}
table{width:100%;border-collapse:collapse;margin:1.5em 0;font-size:.92rem;font-family:var(--font-sans)}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--border)}
th{font-weight:600;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--dim)}
tr:hover td{background:var(--surface)}
img{max-width:100%;height:auto;border-radius:4px;margin:1.5em 0;display:block}
.image-placeholder{background:var(--surface);border:2px dashed var(--border);border-radius:8px;padding:24px;margin:1.5em 0;text-align:center;font-family:var(--font-sans);font-size:.85rem;color:var(--dim)}
.image-placeholder::before{content:'🖼';display:block;font-size:1.5rem;margin-bottom:8px}

/* === Floating Toolbar === */
#toolbar{
  position:absolute;display:none;z-index:300;
  background:#1a1a1a;border-radius:6px;padding:4px;
  box-shadow:0 4px 16px rgba(0,0,0,.25);
  transform:translateX(-50%);
  transition:opacity .15s;
}
#toolbar.visible{display:flex;animation:toolbarIn .15s ease}
@keyframes toolbarIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
#toolbar button{
  background:none;border:none;color:#e0e0e0;font-family:var(--font-sans);
  font-size:14px;padding:6px 10px;cursor:pointer;border-radius:4px;
  display:flex;align-items:center;justify-content:center;min-width:32px;
  transition:background .1s,color .1s;
}
#toolbar button:hover{background:rgba(255,255,255,.15);color:#fff}
#toolbar button.active{background:rgba(26,137,23,.6);color:#fff}
#toolbar .sep{width:1px;background:rgba(255,255,255,.15);margin:4px 2px;align-self:stretch}
/* Toolbar arrow */
#toolbar::after{
  content:'';position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
  border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #1a1a1a;
}

@media print{.topbar,.progress-bar,#toolbar{display:none!important}article{padding:0;max-width:100%}}
</style>
</head>
<body>
<div class="progress-bar" id="progress"></div>
<div class="topbar">
  <span class="dot">●</span>
  <span class="filepath">${fileTitle}.md</span>
  <span class="save-status saved" id="saveStatus">Saved</span>
  <span class="reading-time">${minutes} min read</span>
</div>

<!-- Floating toolbar -->
<div id="toolbar">
  <button data-cmd="bold" title="Bold (Cmd+B)"><strong>B</strong></button>
  <button data-cmd="italic" title="Italic (Cmd+I)"><em>I</em></button>
  <button data-cmd="code" title="Inline code">‹›</button>
  <div class="sep"></div>
  <button data-cmd="h2" title="Heading 2">H2</button>
  <button data-cmd="h3" title="Heading 3">H3</button>
  <div class="sep"></div>
  <button data-cmd="link" title="Add link (Cmd+K)">🔗</button>
  <button data-cmd="blockquote" title="Blockquote">❝</button>
  <div class="sep"></div>
  <button data-cmd="hr" title="Section break">···</button>
</div>

<article id="content" contenteditable="true" spellcheck="true">${bodyHTML}</article>

<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
${editorScript()}
</body>
</html>`;
}

// --- Client-side editor JS (injected into page) ---
function editorScript() {
  return `
<script>
(function(){
  const article = document.getElementById('content');
  const toolbar = document.getElementById('toolbar');
  const saveStatus = document.getElementById('saveStatus');
  let saveTimer = null;
  let lastEditTime = 0; // track last edit/interaction time

  // === Floating toolbar ===
  function updateToolbar() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !article.contains(sel.anchorNode)) {
      toolbar.classList.remove('visible');
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    toolbar.style.top = (rect.top + window.scrollY - 48) + 'px';
    toolbar.style.left = (rect.left + rect.width / 2) + 'px';
    toolbar.classList.add('visible');

    // Highlight active states
    toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
      const cmd = btn.dataset.cmd;
      let active = false;
      if (cmd === 'bold') active = document.queryCommandState('bold') || !!getParent(sel.anchorNode, 'STRONG') || !!getParent(sel.anchorNode, 'B');
      if (cmd === 'italic') active = document.queryCommandState('italic') || !!getParent(sel.anchorNode, 'EM') || !!getParent(sel.anchorNode, 'I');
      if (cmd === 'code') { const c = getParent(sel.anchorNode, 'CODE'); active = !!c && !c.closest('pre'); }
      const block = getParentBlock(sel.anchorNode);
      if (cmd === 'h2') active = block?.tagName === 'H2';
      if (cmd === 'h3') active = block?.tagName === 'H3';
      if (cmd === 'blockquote') active = !!sel.anchorNode.closest?.('blockquote') || !!getParent(sel.anchorNode, 'BLOCKQUOTE');
      btn.classList.toggle('active', active);
    });
  }

  function getParent(node, tag) {
    while (node && node !== article) {
      if (node.tagName === tag) return node;
      node = node.parentNode;
    }
    return null;
  }

  function getParentBlock(node) {
    while (node && node !== article) {
      if (['H1','H2','H3','H4','P','BLOCKQUOTE','PRE','LI'].includes(node.tagName)) return node;
      node = node.parentNode;
    }
    return null;
  }

  document.addEventListener('selectionchange', () => requestAnimationFrame(updateToolbar));
  document.addEventListener('mouseup', () => setTimeout(updateToolbar, 10));

  // === Toolbar commands ===
  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-cmd]');
    if (!btn) return;
    e.preventDefault();
    const cmd = btn.dataset.cmd;
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    if (cmd === 'bold') {
      // Clean toggle: if already bold, unwrap; otherwise wrap
      const wrapper = getParent(sel.anchorNode, 'STRONG') || getParent(sel.anchorNode, 'B');
      if (wrapper && sel.toString().trim() && wrapper.textContent.trim() === sel.toString().trim()) {
        // Selection matches the bold wrapper — unwrap it
        const text = document.createTextNode(wrapper.textContent);
        wrapper.replaceWith(text);
        // Re-select the text node
        const r = document.createRange(); r.selectNodeContents(text);
        sel.removeAllRanges(); sel.addRange(r);
      } else {
        document.execCommand('bold');
      }
    }
    else if (cmd === 'italic') {
      const wrapper = getParent(sel.anchorNode, 'EM') || getParent(sel.anchorNode, 'I');
      if (wrapper && sel.toString().trim() && wrapper.textContent.trim() === sel.toString().trim()) {
        const text = document.createTextNode(wrapper.textContent);
        wrapper.replaceWith(text);
        const r = document.createRange(); r.selectNodeContents(text);
        sel.removeAllRanges(); sel.addRange(r);
      } else {
        document.execCommand('italic');
      }
    }
    else if (cmd === 'code') {
      const existingCode = getParent(sel.anchorNode, 'CODE');
      if (existingCode && existingCode.closest('pre') === null) {
        // Already inline code — unwrap
        const text = document.createTextNode(existingCode.textContent);
        existingCode.replaceWith(text);
        const r = document.createRange(); r.selectNodeContents(text);
        sel.removeAllRanges(); sel.addRange(r);
      } else {
        const range = sel.getRangeAt(0);
        const text = range.toString();
        if (text) {
          // Extract contents, create code element, avoid nesting
          const fragment = range.extractContents();
          const code = document.createElement('code');
          code.textContent = fragment.textContent; // flatten to text only
          range.insertNode(code);
          // Select the new code element
          const r = document.createRange(); r.selectNodeContents(code);
          sel.removeAllRanges(); sel.addRange(r);
        }
      }
    }
    else if (cmd === 'h2' || cmd === 'h3') {
      const block = getParentBlock(sel.anchorNode);
      if (!block) return;
      const tag = cmd.toUpperCase();
      if (block.tagName === tag) {
        // Toggle off — back to paragraph
        const p = document.createElement('p');
        p.innerHTML = block.innerHTML;
        block.replaceWith(p);
      } else {
        const h = document.createElement(tag);
        h.innerHTML = block.innerHTML;
        block.replaceWith(h);
      }
    }
    else if (cmd === 'link') {
      const url = prompt('URL:');
      if (url) document.execCommand('createLink', false, url);
    }
    else if (cmd === 'blockquote') {
      const block = getParentBlock(sel.anchorNode);
      const bq = getParent(sel.anchorNode, 'BLOCKQUOTE');
      if (bq) {
        // Unwrap
        const p = document.createElement('p');
        p.innerHTML = bq.querySelector('p')?.innerHTML || bq.innerHTML;
        bq.replaceWith(p);
      } else if (block) {
        const q = document.createElement('blockquote');
        const p = document.createElement('p');
        p.innerHTML = block.innerHTML;
        q.appendChild(p);
        block.replaceWith(q);
      }
    }
    else if (cmd === 'hr') {
      const block = getParentBlock(sel.anchorNode);
      if (block) {
        const hr = document.createElement('hr');
        block.parentNode.insertBefore(hr, block);
      }
    }

    scheduleSave();
    setTimeout(updateToolbar, 50);
  });

  // === Keyboard shortcuts ===
  article.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') { e.preventDefault(); document.execCommand('bold'); scheduleSave(); }
      if (e.key === 'i') { e.preventDefault(); document.execCommand('italic'); scheduleSave(); }
      if (e.key === 'k') {
        e.preventDefault();
        const url = prompt('URL:');
        if (url) { document.execCommand('createLink', false, url); scheduleSave(); }
      }
      if (e.key === 's') { e.preventDefault(); doSave(); }
    }
    // Enter in heading → create paragraph
    if (e.key === 'Enter' && !e.shiftKey) {
      const block = getParentBlock(window.getSelection()?.anchorNode);
      if (block && ['H1','H2','H3','H4'].includes(block.tagName)) {
        e.preventDefault();
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        block.after(p);
        const range = document.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  });

  // === Auto-save (debounced) ===
  article.addEventListener('input', () => scheduleSave());

  function scheduleSave() {
    lastEditTime = Date.now();
    saveStatus.textContent = 'Editing...';
    saveStatus.className = 'save-status saving';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 1500);
  }

  async function doSave() {
    saveStatus.textContent = 'Saving...';
    saveStatus.className = 'save-status saving';
    const md = html2md(article);
    try {
      const res = await fetch('/__save', {
        method: 'POST',
        headers: {'Content-Type':'text/plain'},
        body: md
      });
      const data = await res.json();
      if (data.ok) {
        saveStatus.textContent = 'Saved';
        saveStatus.className = 'save-status saved';
        // Update reading time
        const words = md.trim().split(/\\s+/).length;
        document.querySelector('.reading-time').textContent = Math.ceil(words / 238) + ' min read';
      } else {
        saveStatus.textContent = 'Error';
        saveStatus.className = 'save-status error';
      }
    } catch(e) {
      saveStatus.textContent = 'Error';
      saveStatus.className = 'save-status error';
    }
  }

  // === HTML → Markdown converter ===
  function html2md(container) {
    let md = '';
    for (const node of container.childNodes) {
      md += nodeToMd(node);
    }
    // Clean up excessive blank lines
    return md.replace(/\\n{3,}/g, '\\n\\n').trim() + '\\n';
  }

  function nodeToMd(node) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return '';
    const tag = node.tagName;

    if (tag === 'H1') return '# ' + inline(node) + '\\n\\n';
    if (tag === 'H2') return '## ' + inline(node) + '\\n\\n';
    if (tag === 'H3') return '### ' + inline(node) + '\\n\\n';
    if (tag === 'H4') return '#### ' + inline(node) + '\\n\\n';
    if (tag === 'P') return inline(node) + '\\n\\n';
    if (tag === 'HR') return '---\\n\\n';
    if (tag === 'BR') return '\\n';
    if (tag === 'BLOCKQUOTE') {
      const inner = Array.from(node.childNodes).map(n => nodeToMd(n)).join('').trim();
      return inner.split('\\n').map(l => '> ' + l).join('\\n') + '\\n\\n';
    }
    if (tag === 'PRE') {
      const code = node.querySelector('code');
      const lang = code?.className?.replace('language-','').replace('hljs','').trim() || '';
      const text = code?.textContent || node.textContent;
      return '\\x60\\x60\\x60' + lang + '\\n' + text + '\\n\\x60\\x60\\x60\\n\\n';
    }
    if (tag === 'UL') return Array.from(node.children).map(li => '- ' + inline(li)).join('\\n') + '\\n\\n';
    if (tag === 'OL') return Array.from(node.children).map((li,i) => (i+1) + '. ' + inline(li)).join('\\n') + '\\n\\n';
    if (tag === 'TABLE') return tableToMd(node) + '\\n\\n';
    if (tag === 'IMG') {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      return '![' + alt + '](' + src + ')\\n\\n';
    }
    if (tag === 'DIV' && node.classList.contains('image-placeholder')) {
      return '<!-- IMAGE: ' + node.textContent.trim() + ' -->\\n\\n';
    }
    // Fallback — recurse
    return Array.from(node.childNodes).map(n => nodeToMd(n)).join('');
  }

  function inline(node) {
    let out = '';
    for (const child of node.childNodes) {
      if (child.nodeType === 3) { out += child.textContent; continue; }
      if (child.nodeType !== 1) continue;
      const t = child.tagName;
      if (t === 'STRONG' || t === 'B') out += '**' + inline(child) + '**';
      else if (t === 'EM' || t === 'I') out += '*' + inline(child) + '*';
      else if (t === 'CODE') out += '\\x60' + child.textContent + '\\x60';
      else if (t === 'A') out += '[' + inline(child) + '](' + child.getAttribute('href') + ')';
      else if (t === 'BR') out += '\\n';
      else if (t === 'IMG') out += '![' + (child.alt||'') + '](' + child.src + ')';
      else out += inline(child);
    }
    return out;
  }

  function tableToMd(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (!rows.length) return '';
    const lines = rows.map(row =>
      '| ' + Array.from(row.cells).map(c => c.textContent.trim()).join(' | ') + ' |'
    );
    // Insert separator after header
    if (lines.length > 0) {
      const cols = rows[0].cells.length;
      lines.splice(1, 0, '| ' + Array(cols).fill('---').join(' | ') + ' |');
    }
    return lines.join('\\n');
  }

  // === Progress bar ===
  window.addEventListener('scroll',()=>{
    const h=document.documentElement.scrollHeight-window.innerHeight;
    document.getElementById('progress').style.width=(h>0?(window.scrollY/h)*100:0)+'%';
  });

  // === Live reload — ONLY if user hasn't edited recently (10s) ===
  // This prevents the reload from clobbering in-browser edits.
  // After an editor save writes to disk, the server's watchFile detects the
  // change and sets changed=true. Without this guard, the poll would reload
  // the page from the server's cached HTML, losing unsaved DOM state.
  setInterval(async()=>{
    if (Date.now() - lastEditTime < 10000) return; // user active — skip
    try{
      const r=await fetch('/__changed');
      const d=await r.json();
      if(d.changed) location.reload();
    }catch(e){}
  },2000);

  // Also track focus/clicks as "activity" to widen the safety window
  article.addEventListener('focus', () => { lastEditTime = Date.now(); });
  article.addEventListener('click', () => { lastEditTime = Date.now(); });
})();
</script>`;
}

// --- Server with editing, saving, live reload, and local images ---
function servePreview(mdFilePath, mdDirectory, fileTitle, listenPort) {
  let cachedHTML = '';
  let externalChange = false; // ONLY true when file changed outside the editor
  let lastSaveFromEditor = 0;
  const rawFull = readFileSync(mdFilePath, 'utf-8');
  let { frontmatter } = extractFrontmatter(rawFull);

  function rebuild() {
    cachedHTML = buildPage(mdFilePath, fileTitle);
  }

  rebuild();

  // Watch for external file changes (e.g. from VS Code)
  watchFile(mdFilePath, { interval: 2000 }, () => {
    // If editor saved recently, this is OUR write — ignore it
    if (Date.now() - lastSaveFromEditor < 5000) return;
    // Truly external change — rebuild and flag for reload
    rebuild();
    externalChange = true;
    console.log(`  ↻ External change detected — rebuilt at ${new Date().toLocaleTimeString()}`);
  });

  const mimeTypes = {
    '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png',
    '.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml',
    '.ico':'image/x-icon','.css':'text/css','.js':'text/javascript',
  };

  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${listenPort}`);

    // --- Save endpoint ---
    if (url.pathname === '/__save' && req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          // Reassemble with frontmatter
          const fullContent = frontmatter
            ? frontmatter + '\n\n' + body
            : body;
          lastSaveFromEditor = Date.now();
          writeFileSync(mdFilePath, fullContent, 'utf-8');
          // Don't set changed=true (we don't want reload after our own save)
          res.writeHead(200, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ok: true}));
          console.log(`  💾 Saved (${body.split('\n').length} lines) at ${new Date().toLocaleTimeString()}`);
        } catch(e) {
          res.writeHead(500, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ok: false, error: e.message}));
          console.error(`  ❌ Save error:`, e.message);
        }
      });
      return;
    }

    // --- Changed check (only reports EXTERNAL changes, never editor saves) ---
    if (url.pathname === '/__changed') {
      res.writeHead(200, {'Content-Type':'application/json'});
      const wasChanged = externalChange;
      externalChange = false;
      res.end(JSON.stringify({changed: wasChanged}));
      return;
    }

    // --- Serve local images/assets ---
    if (url.pathname !== '/' && url.pathname !== '/index.html') {
      const ext = extname(url.pathname).toLowerCase();
      const mime = mimeTypes[ext];
      if (mime) {
        try {
          const data = readFileSync(join(mdDirectory, decodeURIComponent(url.pathname)));
          res.writeHead(200, {'Content-Type': mime});
          res.end(data);
          return;
        } catch(e) { res.writeHead(404); res.end('Not found'); return; }
      }
    }

    // --- Serve editor page ---
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.end(cachedHTML);
  });

  server.listen(listenPort, () => {
    const url = `http://localhost:${listenPort}`;
    console.log(`\n  📝 Markdown Editor + Preview`);
    console.log(`  ─────────────────────────────`);
    console.log(`  File:  ${mdFilePath}`);
    console.log(`  URL:   ${url}`);
    console.log(`  ─────────────────────────────`);
    console.log(`  Click text to edit · Select text for toolbar · Auto-saves to .md`);
    console.log(`  Cmd+B bold · Cmd+I italic · Cmd+K link · Cmd+S save\n`);
    try { execSync(`open -a "Google Chrome" "${url}"`, {stdio:'ignore'}); }
    catch(e) { try { execSync(`open "${url}"`, {stdio:'ignore'}); } catch(e2){} }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`  Port ${listenPort} in use. Trying ${listenPort+1}...`);
      servePreview(mdFilePath, mdDirectory, fileTitle, listenPort+1);
    } else { console.error('Server error:', err); process.exit(1); }
  });
}

// --- Run ---
servePreview(mdPath, mdDir, title, port);
