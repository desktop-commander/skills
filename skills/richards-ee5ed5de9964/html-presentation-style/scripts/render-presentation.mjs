#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(__dirname, '..');
const templatePath = join(skillRoot, 'assets', 'deck-template.html');

function usage() {
  console.error('Usage: node render-presentation.mjs <slides.json> <output.html> [title]');
  process.exit(1);
}

function escapeScriptJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const [, , slidesArg, outputArg, titleArg] = process.argv;
if (!slidesArg || !outputArg) usage();

const slidesPath = resolve(process.cwd(), slidesArg);
const outputPath = resolve(process.cwd(), outputArg);
const deckTitle = titleArg || 'HTML Presentation';

const slides = JSON.parse(readFileSync(slidesPath, 'utf8'));
if (!Array.isArray(slides) || slides.length === 0) {
  throw new Error('Slides JSON must be a non-empty array.');
}

const normalizedSlides = slides.map((slide, index) => ({
  act: slide.act || '',
  title: slide.title || `Slide ${index + 1}`,
  notes: slide.notes || '',
  layout: slide.layout || 'custom',
  bodyHtml: slide.bodyHtml || `<h2>${slide.title || `Slide ${index + 1}`}</h2>`,
}));

const slideMarkup = normalizedSlides.map((slide, index) => {
  const actLabel = slide.act ? `<div class="act-label">${slide.act}</div>` : '';
  return `
<section class="slide${index === 0 ? ' active' : ''}" data-title="${slide.title.replace(/"/g, '&quot;')}">
  ${actLabel}
  <div class="inner ${slide.layout}">
    ${slide.bodyHtml}
  </div>
</section>`;
}).join('\n');

let html = readFileSync(templatePath, 'utf8');
html = html.replaceAll('{{DECK_TITLE}}', deckTitle);
html = html.replace('<!-- __SLIDES_HTML__ -->', slideMarkup);
html = html.replace('/* __SLIDES_DATA__ */', `window.__slidesData = ${escapeScriptJson(normalizedSlides)};`);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html, 'utf8');
console.log(`Rendered ${normalizedSlides.length} slides to ${outputPath}`);
