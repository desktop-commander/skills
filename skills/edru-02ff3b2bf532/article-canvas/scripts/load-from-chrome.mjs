#!/usr/bin/env node
/**
 * article-canvas: load-from-chrome
 *
 * Given a URL, find or open it in Chrome (via chrome-cli-2), extract the
 * article HTML from that tab, POST it to the article-canvas server, then
 * open the canvas in a new tab.
 *
 * Usage:
 *   node load-from-chrome.mjs <url> [--port 4567]
 *
 * Behavior:
 *   1. Ensure the canvas server is up (start it on demand if not)
 *   2. Find a tab matching <url> in Chrome; if none, navigate to it
 *   3. Wait until the page is loaded (document.readyState === 'complete')
 *   4. Eval Readability-style extraction in the tab — return HTML + title + URL
 *   5. POST the HTML to the canvas server's /api/paste
 *   6. Open the canvas (http://localhost:<port>/) in a new Chrome tab
 *
 * No third-party deps. Uses chrome-cli-2 at the path below.
 */

import { execFileSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME_CLI = '/Users/eduardsruzga/work/chrome-cli-2/dist/cli.js';
const SERVER_SCRIPT = resolve(__dirname, 'render-canvas.mjs');

// --- CLI parsing ---
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.error('Usage: load-from-chrome.mjs <url> [--port 4567]');
  process.exit(1);
}
const url = args[0];
const portFlag = args.indexOf('--port');
const port = portFlag !== -1 ? parseInt(args[portFlag + 1], 10) : 4567;

// --- Chrome CLI wrapper ---
function chromeCli(...cmdArgs) {
  try {
    const out = execFileSync('node', [CHROME_CLI, ...cmdArgs], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20000,
    });
    return out.trim();
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : '';
    throw new Error(`chrome-cli ${cmdArgs.join(' ')} failed: ${stderr || e.message}`);
  }
}

function chromeCliJson(...cmdArgs) {
  const raw = chromeCli(...cmdArgs);
  try { return JSON.parse(raw); }
  catch (_) { return raw; }
}

// Probe the chrome-cli pipeline before trying any real commands. If the
// extension isn't loaded we want to fail with a clear, actionable message
// rather than a hung get_tabs call.
function probeChromeCli() {
  let statusOut = '';
  try {
    statusOut = execFileSync('node', [CHROME_CLI, 'status'], {
      encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 5000,
    });
  } catch (e) {
    throw new Error(
      'chrome-cli is not installed or not working.\n' +
      `   Expected path: ${CHROME_CLI}\n` +
      '   Run setup: cd /Users/eduardsruzga/work/chrome-cli-2 && node dist/cli.js setup'
    );
  }
  if (/not connected|extension is not loaded|socket not found/i.test(statusOut)) {
    throw new Error(
      'chrome-cli is set up, but the Chrome extension is not loaded.\n' +
      '   1. Open chrome://extensions in Chrome\n' +
      '   2. Enable Developer mode (top right)\n' +
      "   3. Click 'Load unpacked' and select: /Users/eduardsruzga/.chrome-cli/extension\n" +
      '   Then re-run this command.'
    );
  }
}

// --- Server check / boot ---
function fetchJSON(path) {
  return new Promise((res, rej) => {
    const req = http.get(`http://localhost:${port}${path}`, (resp) => {
      let buf = '';
      resp.on('data', d => buf += d);
      resp.on('end', () => {
        try { res(JSON.parse(buf)); } catch (e) { rej(e); }
      });
    });
    req.on('error', rej);
    req.setTimeout(2000, () => req.destroy(new Error('timeout')));
  });
}

function postJSON(path, body) {
  return new Promise((res, rej) => {
    const data = JSON.stringify(body);
    const req = http.request({
      method: 'POST', hostname: 'localhost', port,
      path, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (resp) => {
      let buf = '';
      resp.on('data', d => buf += d);
      resp.on('end', () => {
        try { res(JSON.parse(buf)); } catch (e) { rej(e); }
      });
    });
    req.on('error', rej);
    req.write(data);
    req.end();
  });
}

async function ensureServer() {
  try {
    await fetchJSON('/api/version');
    return true;  // already running
  } catch (_) {}
  console.log('▶ Starting canvas server...');
  // Spawn detached so it survives this script
  const child = spawn('node', [SERVER_SCRIPT, '--port', String(port)], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, NO_BROWSER_OPEN: '1' },  // server normally auto-opens Chrome; we'll do it ourselves
  });
  child.unref();
  // Poll until up
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try { await fetchJSON('/api/version'); return true; } catch (_) {}
  }
  throw new Error('Canvas server did not start within 6s');
}

// --- Find or open the article tab ---
function normalizeUrl(u) {
  try {
    const x = new URL(u);
    // Compare on origin + pathname; ignore trailing slashes
    return (x.origin + x.pathname).replace(/\/$/, '').toLowerCase();
  } catch (_) { return String(u).toLowerCase(); }
}

async function findOrOpenTab(targetUrl) {
  const tabs = chromeCliJson('get_tabs');
  if (!Array.isArray(tabs)) throw new Error('Unexpected get_tabs output');
  const target = normalizeUrl(targetUrl);
  const match = tabs.find(t => normalizeUrl(t.url) === target);
  if (match) {
    chromeCli('switch_tab', String(match.id));
    return match.id;
  }
  // No match: open a new tab and grab its id
  const opened = chromeCliJson('new_tab', targetUrl);
  // `new_tab` returns the new tab object
  if (opened && opened.id) return opened.id;
  // Fall back: poll get_tabs for the new url
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    const list = chromeCliJson('get_tabs');
    const f = Array.isArray(list) ? list.find(t => normalizeUrl(t.url) === target) : null;
    if (f) return f.id;
  }
  throw new Error('Could not locate newly-opened tab for ' + targetUrl);
}

async function waitForLoaded(tabId) {
  for (let i = 0; i < 40; i++) {
    try {
      const out = chromeCliJson('eval', 'document.readyState', String(tabId));
      const ready = (out && out.result) || out;
      if (ready === 'complete' || ready === 'interactive') return;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 250));
  }
  // Don't fail — proceed even if we couldn't confirm; extraction may still work
}

// --- Article extraction (runs inside the page via eval) ---
// This is a deliberately self-contained string. It picks an article-shaped
// container, returns its outerHTML, plus title/url. We do this rather than
// JSON.stringify-ing the DOM because chrome-cli's eval channel returns the
// expression's last value as JSON.
const EXTRACT_JS = `(() => {
  function score(el) {
    if (!el) return 0;
    const tag = el.tagName;
    let s = 0;
    if (tag === 'ARTICLE') s += 50;
    if (tag === 'MAIN') s += 30;
    // class/id hints
    const id = (el.id || '').toLowerCase();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').toLowerCase();
    const text = id + ' ' + cls;
    if (/article|post|content|story|entry/.test(text)) s += 15;
    if (/sidebar|comment|footer|nav|menu|ad/.test(text)) s -= 30;
    // paragraph density
    const ps = el.querySelectorAll('p').length;
    s += Math.min(ps, 30);
    // text length
    const t = el.innerText ? el.innerText.length : 0;
    s += Math.min(t / 200, 40);
    return s;
  }
  // Prefer <article>, then highest-scoring candidate
  const articles = document.querySelectorAll('article');
  let best = null, bestScore = -1;
  const candidates = [...articles, ...document.querySelectorAll('main, [role=main], .post, .article, .entry, .content, #content, #main')];
  for (const el of candidates) {
    const s = score(el);
    if (s > bestScore) { best = el; bestScore = s; }
  }
  if (!best) best = document.body;
  // Clone so we can strip without mutating the page
  const clone = best.cloneNode(true);
  // Strip obvious junk
  clone.querySelectorAll('script, style, noscript, nav, aside, footer, header, form, iframe, button, [aria-hidden=true]').forEach(n => n.remove());
  clone.querySelectorAll('[class*="ad" i], [class*="promo" i], [class*="newsletter" i], [class*="subscribe" i], [class*="share" i], [class*="related" i], [class*="recommend" i], [class*="comments" i], [class*="paywall" i]').forEach(n => n.remove());
  return {
    html: clone.outerHTML,
    title: document.title || '',
    url: location.href,
    score: bestScore,
    tag: best.tagName,
  };
})()`;

async function extractArticle(tabId) {
  const out = chromeCliJson('eval', EXTRACT_JS, String(tabId));
  // chrome-cli eval returns either the raw result or { result: ... }
  const payload = (out && out.result !== undefined) ? out.result : out;
  if (!payload || !payload.html) throw new Error('Extraction returned no HTML');
  return payload;
}

// --- Open the canvas in a new tab ---
async function openCanvasTab() {
  const canvasUrl = `http://localhost:${port}/`;
  // Reuse an existing canvas tab if one is already open
  const tabs = chromeCliJson('get_tabs');
  const existing = Array.isArray(tabs) ? tabs.find(t => (t.url || '').startsWith(canvasUrl)) : null;
  if (existing) {
    chromeCli('switch_tab', String(existing.id));
    // Force reload so it picks up the new article
    chromeCli('eval', 'location.reload()', String(existing.id));
    return existing.id;
  }
  const opened = chromeCliJson('new_tab', canvasUrl);
  return opened && opened.id;
}

// --- Main ---
(async () => {
  try {
    console.log(`▶ Loading article: ${url}`);

    console.log('▶ Checking chrome-cli connection...');
    probeChromeCli();
    console.log('  ✓ chrome-cli is connected');

    await ensureServer();

    console.log('▶ Finding or opening source tab...');
    const tabId = await findOrOpenTab(url);
    console.log(`  source tab id: ${tabId}`);

    console.log('▶ Waiting for page load...');
    await waitForLoaded(tabId);

    console.log('▶ Extracting article HTML from the page...');
    const extracted = await extractArticle(tabId);
    console.log(`  title: ${extracted.title}`);
    console.log(`  picked container: <${extracted.tag}> (score ${extracted.score.toFixed(1)})`);
    console.log(`  html size: ${extracted.html.length} chars`);

    console.log('▶ Posting to canvas server...');
    const res = await postJSON('/api/paste', { html: extracted.html, sourceUrl: extracted.url });
    if (!res.ok) throw new Error('Paste failed: ' + (res.error || 'unknown'));
    console.log(`  saved to: ${res.path}`);

    console.log('▶ Opening canvas in browser...');
    await openCanvasTab();

    console.log('\n✅ Done. Article loaded on the canvas — switch to that tab.');
    console.log(`   JSON: ${res.path}`);
    console.log(`   Canvas: http://localhost:${port}/`);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
