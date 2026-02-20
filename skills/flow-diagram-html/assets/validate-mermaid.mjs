#!/usr/bin/env node
/**
 * validate-mermaid.mjs
 *
 * Fail-fast Mermaid syntax validation for the flow-diagram-html skill.
 *
 * Strategy (token efficient):
 * - Mermaid source exists ONLY once (embedded in the generated HTML).
 * - This script extracts it from <pre id="diagramDefinition"> ... </pre>.
 * - Then it runs Mermaid CLI (mmdc) via npx to validate by rendering to SVG.
 *
 * Usage:
 *   node validate-mermaid.mjs /absolute/path/to/diagram.html
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
  if (start === -1) {
    die(`Could not find ${startToken} in: ${htmlPath}`);
  }

  const afterStart = start + startToken.length;
  const end = html.indexOf(endToken, afterStart);
  if (end === -1) {
    die(`Could not find closing </pre> for diagramDefinition in: ${htmlPath}`);
  }

  const code = html.slice(afterStart, end).trim();
  if (!code) {
    die(`Mermaid source was empty in: ${htmlPath}`);
  }

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

async function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath) {
    die('Usage: node validate-mermaid.mjs /absolute/path/to/diagram.html');
  }

  const mermaidSource = await extractMermaidFromHtml(htmlPath);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mermaid-validate-'));
  const inputMmd = path.join(tmpDir, 'diagram.mmd');
  const outputSvg = path.join(tmpDir, 'diagram.svg');

  await fs.writeFile(inputMmd, mermaidSource, 'utf8');

  // Use npx so we don't require a global install; npx will cache packages.
  // This validates syntax by attempting a render to SVG.
  const args = ['-y', '@mermaid-js/mermaid-cli', '-i', inputMmd, '-o', outputSvg];
  const res = await run('npx', args);

  if (res.code !== 0) {
    // Print stderr first; Mermaid CLI tends to put parse errors there.
    const msg = (res.stderr || res.stdout || '').trim();
    die(msg || `Mermaid validation failed (exit code ${res.code}).`);
  }

  process.stdout.write('OK: Mermaid validated successfully.\n');
}

main().catch((err) => {
  die(err?.stack || err?.message || String(err));
});
