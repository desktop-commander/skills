#!/usr/bin/env node
/**
 * render-template.mjs
 *
 * Token-efficient HTML generator for flow-diagram-html.
 *
 * Why this exists:
 * - The LLM should NOT read/copy the full HTML template (token waste).
 * - This script reads assets/template.html locally and injects placeholders.
 * - Mermaid source is provided via STDIN so it's sent only once.
 *
 * Usage:
 *   cat diagram.mmd | node render-template.mjs \
 *     --output "/abs/path/output.html" \
 *     --pageTitle "Page <title>" \
 *     --headerTitle "Header label"
 *
 * Or (recommended in skills):
 *   node render-template.mjs --output "/abs/path/output.html" --pageTitle "..." --headerTitle "..." <<'EOF'
 *   flowchart LR
 *     A-->B
 *   EOF
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { output: '', pageTitle: '', headerTitle: '' };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];

    if (a === '--output') {
      args.output = next;
      i += 1;
    } else if (a === '--pageTitle') {
      args.pageTitle = next;
      i += 1;
    } else if (a === '--headerTitle') {
      args.headerTitle = next;
      i += 1;
    } else {
      die(`Unknown argument: ${a}`);
    }
  }

  if (!args.output) die('Missing required --output "/absolute/path/file.html"');
  if (!args.pageTitle) args.pageTitle = path.basename(args.output);
  if (!args.headerTitle) args.headerTitle = args.pageTitle;

  return args;
}

async function readStdin() {
  return await new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const { output, pageTitle, headerTitle } = parseArgs(process.argv.slice(2));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, 'template.html');

  const [template, mermaidRaw] = await Promise.all([
    fs.readFile(templatePath, 'utf8'),
    readStdin(),
  ]);

  const mermaidCode = (mermaidRaw || '').trim();
  if (!mermaidCode) die('Mermaid source was empty. Provide Mermaid code via STDIN.');

  const html = template
    .replaceAll('{{PAGE_TITLE}}', pageTitle)
    .replaceAll('{{HEADER_TITLE}}', headerTitle)
    // IMPORTANT: Mermaid is inserted verbatim into a <pre> tag.
    .replace('{{MERMAID_CODE}}', mermaidCode);

  await fs.writeFile(output, html, 'utf8');
  process.stdout.write(`OK: Wrote ${output}\n`);
}

main().catch((err) => {
  die(err?.stack || err?.message || String(err));
});
