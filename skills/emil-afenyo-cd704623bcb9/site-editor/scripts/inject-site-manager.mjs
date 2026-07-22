#!/usr/bin/env node
// inject-site-manager.mjs
// Inject the Site Manager snippet into a single-file HTML site.
// Usage:
//   node inject-site-manager.mjs <path-to-html> [--force]
//
// Behaviour:
//   - Reads source HTML.
//   - Creates a copy at <basename>_editable.html (same directory).
//   - Inserts a CSS guard for any legacy SM modal before the first </style>.
//   - Inserts a default :root brand palette if none is present.
//   - Inserts the Site Manager snippet (CSS + UI + JS) immediately before </body>.
//   - Refuses to overwrite an existing _editable.html unless --force is passed.

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { dirname, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNIPPET_PATH = join(__dirname, '..', 'assets', 'site-manager-snippet.html');

function fail(msg) {
  console.error('Error:', msg);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) fail('No HTML file path provided.\nUsage: node inject-site-manager.mjs <path-to-html> [--force]');

const force = args.includes('--force');
const src = args.find(a => !a.startsWith('--'));
if (!src) fail('No HTML file path provided.');
if (!existsSync(src)) fail(`File not found: ${src}`);
if (!existsSync(SNIPPET_PATH)) fail(`Snippet not found at ${SNIPPET_PATH}`);

const dir = dirname(src);
const ext = extname(src);
const base = basename(src, ext);
const outPath = join(dir, `${base}_editable${ext}`);

if (existsSync(outPath) && !force) {
  fail(`Output file already exists: ${outPath}\nPass --force to overwrite, or delete it manually.`);
}

let html = readFileSync(src, 'utf-8');

if (!/<\/body>/i.test(html)) fail('No </body> tag found. This script requires a complete HTML document.');
if (!/<html[\s>]/i.test(html)) fail('No <html> tag found. This script requires a complete HTML document.');

// Detect prior injection
if (html.includes('v15 UNIFIED SITE MANAGER') || html.includes('id="v15sm-btn"')) {
  if (!force) fail('Site Manager appears to be already injected. Pass --force to re-inject anyway.');
}

const snippet = readFileSync(SNIPPET_PATH, 'utf-8');

// 1) Insert a CSS guard for any legacy Site Manager modal markers, before the first </style>.
const cssGuard = `
/* site-editor skill: hide any legacy Site Manager UI if present */
#sm-modal-overlay,
#sm-overlay,
#sm-login,
#sm-pages-grid,
#sm-content-area,
#sm-block-modal-overlay,
[data-legacy-sitemanager],
.sm-legacy { display: none !important; visibility: hidden !important; }
.v15-hidden { display: none !important; }
`;

const styleClose = html.indexOf('</style>');
if (styleClose !== -1) {
  html = html.slice(0, styleClose) + '\n' + cssGuard + '\n' + html.slice(styleClose);
} else {
  // No <style> block found — inject one in <head>
  const headOpen = html.search(/<head[^>]*>/i);
  if (headOpen !== -1) {
    const insertAt = headOpen + html.match(/<head[^>]*>/i)[0].length;
    html = html.slice(0, insertAt) + `\n<style>${cssGuard}</style>\n` + html.slice(insertAt);
  }
}

// 2) If no :root with brand variables is present, inject a default palette.
if (!/:root\s*\{[^}]*--(red|navy|gold|cream)/i.test(html)) {
  const defaultPalette = `
/* site-editor skill: default brand palette (edit colours via Site Manager) */
:root {
  --red: #992621;
  --red-d: #7f1f1b;
  --red-l: #b32a25;
  --navy: #3a0f0d;
  --navy-m: #4a1714;
  --gold: #ffc857;
  --cream: #faf7f7;
}
`;
  const styleAgain = html.indexOf('</style>');
  if (styleAgain !== -1) {
    html = html.slice(0, styleAgain) + defaultPalette + html.slice(styleAgain);
  }
}

// 3) Insert the Site Manager snippet just before </body>
const bodyClose = html.lastIndexOf('</body>');
if (bodyClose === -1) fail('Could not find </body> for injection.');
html = html.slice(0, bodyClose) + '\n' + snippet + '\n' + html.slice(bodyClose);

// Write output
writeFileSync(outPath, html, 'utf-8');

console.log('✅ Site Manager injected.');
console.log('   Source : ' + src);
console.log('   Output : ' + outPath);
console.log('');
console.log('Next steps:');
console.log('  1. Open the output file in a browser.');
console.log('  2. Click ⚙️ Site Manager (top-right).');
console.log('  3. Edit text / images / links / colours.');
console.log('  4. Click "Save → Download HTML" to export a clean, baked-in copy.');
