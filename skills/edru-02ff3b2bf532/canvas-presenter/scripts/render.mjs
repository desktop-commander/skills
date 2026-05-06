#!/usr/bin/env node
/**
 * Canvas Presenter Renderer
 *
 * Reads presentation JSON from stdin, injects it into the bundled HTML template,
 * and writes a self-contained .html file.
 *
 * Usage:
 *   echo '{"title":"My Deck","outputPath":"/tmp/deck.html","presentation":{...}}' | node render.mjs
 *
 * Or pipe from a file:
 *   cat presentation.json | node render.mjs
 *
 * Input JSON:
 *   {
 *     "title": "Presentation Title",        // optional, defaults to "Canvas Presenter"
 *     "outputPath": "/path/to/output.html",  // required
 *     "presentation": { sections: [...] }    // required - the presentation data object
 *   }
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '..', 'assets', 'template.html');

let input = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const { title, outputPath, presentation } = JSON.parse(input);

    if (!outputPath) {
      console.error('❌ Missing outputPath in input JSON');
      process.exit(1);
    }
    if (!presentation) {
      console.error('❌ Missing presentation data in input JSON');
      process.exit(1);
    }

    const template = readFileSync(TEMPLATE_PATH, 'utf-8');

    const presentationJson = JSON.stringify(presentation, null, 2);
    const pageTitle = title || 'Canvas Presenter';

    const output = template
      .replace('{{TITLE}}', pageTitle)
      .replace('{{PRESENTATION_DATA}}', presentationJson);

    writeFileSync(outputPath, output);
    console.log(`✅ Presentation written to ${outputPath}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
});
