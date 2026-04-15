#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const [, , fileArg] = process.argv;
if (!fileArg) {
  console.error('Usage: node validate-presentation.mjs <output.html>');
  process.exit(1);
}

const filePath = resolve(process.cwd(), fileArg);
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const html = readFileSync(filePath, 'utf8');
const checks = [
  {
    label: 'Template placeholders resolved',
    pass: !html.includes('{{DECK_TITLE}}') && !html.includes('__SLIDES_HTML__') && !html.includes('__SLIDES_DATA__'),
  },
  {
    label: 'Print CSS present',
    pass: html.includes('@media print') && html.includes('@page') && html.includes('page-break-after: always'),
  },
  {
    label: 'Slides rendered',
    pass: /<section class="slide/.test(html),
  },
  {
    label: 'Speaker notes container present',
    pass: html.includes('id="speakerNotes"'),
  },
  {
    label: 'Serialized slide data present',
    pass: html.includes('window.__slidesData = ['),
  },
];

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? 'OK' : 'FAIL'} ${check.label}`);
}

if (failed.length) {
  process.exit(1);
}

console.log('Presentation HTML is valid.');
