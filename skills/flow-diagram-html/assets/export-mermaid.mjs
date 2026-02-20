#!/usr/bin/env node
/**
 * export-mermaid.mjs
 *
 * Server-side export helper for flow-diagram-html.
 *
 * Why:
 * - Some browsers block client-side SVG->Canvas->PNG export with:
 *   "Tainted canvases may not be exported".
 * - This script extracts Mermaid from the generated HTML and uses
 *   @mermaid-js/mermaid-cli (via npx) to export PNG/SVG files next to the HTML.
 *
 * Usage:
 *   node export-mermaid.mjs /absolute/path/to/diagram.html
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function extractMermaidFromHtml(htmlPath) {
  const html = await fs.readFile(htmlPath, 'utf8');

  const startToken = '<pre id="diagramDefinition">';
  const endToken = '</pre>';

  const start = html.indexOf(startToken);
  if (start === -1) die(`Could not find ${startToken} in: ${htmlPath}`);

  const afterStart = start + startToken.length;
  const end = html.indexOf(endToken, afterStart);
  if (end === -1) die(`Could not find closing </pre> for diagramDefinition in: ${htmlPath}`);

  const code = html.slice(afterStart, end).trim();
  if (!code) die(`Mermaid source was empty in: ${htmlPath}`);

  return code;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function exportWithMmdc(inputMmd, outPath) {
  const args = ['-y', '@mermaid-js/mermaid-cli', '-i', inputMmd, '-o', outPath];
  const res = await run('npx', args);

  if (res.code !== 0) {
    const msg = (res.stderr || res.stdout || '').trim();
    die(msg || `Mermaid export failed (exit code ${res.code}).`);
  }
}

async function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath) {
    die('Usage: node export-mermaid.mjs /absolute/path/to/diagram.html');
  }

  const mermaidSource = await extractMermaidFromHtml(htmlPath);

  const outDir = path.dirname(htmlPath);
  const baseName = path.basename(htmlPath, path.extname(htmlPath));

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mermaid-export-'));
  const inputMmd = path.join(tmpDir, 'diagram.mmd');
  await fs.writeFile(inputMmd, mermaidSource, 'utf8');

  const outSvg = path.join(outDir, `${baseName}.svg`);
  const outPng = path.join(outDir, `${baseName}.png`);

  // Export both; SVG is fast and also useful for editing.
  await exportWithMmdc(inputMmd, outSvg);
  await exportWithMmdc(inputMmd, outPng);

  process.stdout.write(`OK: Exported\n- ${outSvg}\n- ${outPng}\n`);
}

main().catch((err) => {
  die(err?.stack || err?.message || String(err));
});
