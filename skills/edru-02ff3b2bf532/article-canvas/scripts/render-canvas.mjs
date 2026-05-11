#!/usr/bin/env node
/**
 * article-canvas: HTTP server + zoomable canvas viewer.
 *
 * See SKILL.md for full docs.
 */

import { readFileSync, writeFileSync, watchFile, existsSync, mkdirSync } from 'fs';
import { createServer } from 'http';
import { resolve, dirname, basename, join, extname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { normalizeHTML } from './normalize-html.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- CLI ---
const args = process.argv.slice(2);
const portFlag = args.indexOf('--port');
const port = portFlag !== -1 ? parseInt(args[portFlag + 1], 10) : 4567;
const positional = args.filter((a, i) => !a.startsWith('--') && (portFlag === -1 || i !== portFlag + 1));
let initialJsonPath = positional[0] ? resolve(positional[0]) : null;

const SAVE_DIR = join(homedir(), 'Desktop', 'article-canvas');
try { mkdirSync(SAVE_DIR, { recursive: true }); } catch (_) {}

const state = {
  jsonPath: initialJsonPath,
  article: null,
  version: 0,  // incremented on each change; client polls for changes
};

function loadArticle() {
  if (!state.jsonPath || !existsSync(state.jsonPath)) {
    state.article = null;
    return;
  }
  try {
    state.article = JSON.parse(readFileSync(state.jsonPath, 'utf-8'));
    state.version++;
  } catch (e) {
    console.error('  ✗ Failed to parse article JSON:', e.message);
    state.article = null;
  }
}

loadArticle();

if (state.jsonPath) {
  watchFile(state.jsonPath, { interval: 500 }, () => loadArticle());
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
}

// --- Server ---
function startServer(listenPort) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${listenPort}`);

    // --- API: get current article ---
    if (url.pathname === '/api/article' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        version: state.version,
        path: state.jsonPath,
        article: state.article,
      }));
      return;
    }

    // --- API: poll for version changes (lightweight) ---
    if (url.pathname === '/api/version' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ version: state.version }));
      return;
    }

    // --- API: paste HTML ---
    if (url.pathname === '/api/paste' && req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { html, sourceUrl } = JSON.parse(body);
          if (!html || typeof html !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Missing html field' }));
            return;
          }
          const article = normalizeHTML(html, sourceUrl || '');
          const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const slug = slugify(article.title);
          const outPath = join(SAVE_DIR, `${slug}-${ts}.json`);
          writeFileSync(outPath, JSON.stringify(article, null, 2));

          // Switch state to new article
          state.jsonPath = outPath;
          state.article = article;
          state.version++;
          watchFile(outPath, { interval: 500 }, () => loadArticle());

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, path: outPath, article }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // --- API: proxy remote images (avoid CORS/hotlink blocks) ---
    if (url.pathname === '/api/image' && req.method === 'GET') {
      const src = url.searchParams.get('src');
      if (!src) { res.writeHead(400); res.end('missing src'); return; }
      // Fetch and pipe
      import('https').then(({ default: https }) => {
        import('http').then(({ default: http }) => {
          try {
            const u = new URL(src);
            const lib = u.protocol === 'https:' ? https : http;
            lib.get(src, { headers: { 'User-Agent': 'Mozilla/5.0 article-canvas' } }, (proxyRes) => {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
              proxyRes.pipe(res);
            }).on('error', e => { res.writeHead(502); res.end(e.message); });
          } catch (e) { res.writeHead(400); res.end('bad url'); }
        });
      });
      return;
    }

    // --- Main page ---
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderPage());
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(listenPort, () => {
    const baseUrl = `http://localhost:${listenPort}`;
    console.log(`\n  🎨 Article Canvas`);
    console.log(`  ─────────────────────────────`);
    console.log(`  URL:       ${baseUrl}`);
    if (state.jsonPath) {
      console.log(`  Article:   ${state.jsonPath}`);
    } else {
      console.log(`  Article:   (paste in browser to get started)`);
    }
    console.log(`  Save dir:  ${SAVE_DIR}`);
    console.log(`  ─────────────────────────────\n`);
    try { execSync(`open -a "Google Chrome" "${baseUrl}"`, { stdio: 'ignore' }); }
    catch (_) { try { execSync(`open "${baseUrl}"`, { stdio: 'ignore' }); } catch (_) {} }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`  Port ${listenPort} in use. Trying ${listenPort + 1}...`);
      startServer(listenPort + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

// renderPage() is defined in a separate const for readability
import { renderPage } from './canvas-page.mjs';

startServer(port);
