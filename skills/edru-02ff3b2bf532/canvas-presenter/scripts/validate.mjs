#!/usr/bin/env node
/**
 * Canvas Presenter Validator
 *
 * Validates a presentation JSON structure before rendering.
 *
 * Usage:
 *   echo '{ "sections": [...] }' | node validate.mjs
 *   node validate.mjs < presentation.json
 */

const VALID_TEMPLATES = ['title', 'grid', 'profile', 'table', 'points', 'quote', 'blank'];
const VALID_LAYOUTS = ['linear', 'grid', 'freeform', 'stack'];
const VALID_TAG_COLORS = ['green', 'blue', 'red', 'purple', 'warn'];

let input = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const errors = [];
    const warnings = [];

    if (!data.sections || !Array.isArray(data.sections)) {
      errors.push('Missing or invalid "sections" array at root');
    } else {
      let slideIdx = 0;
      data.sections.forEach((sec, si) => {
        if (!VALID_LAYOUTS.includes(sec.layout)) {
          errors.push(`Section ${si}: invalid layout "${sec.layout}" (expected: ${VALID_LAYOUTS.join(', ')})`);
        }
        if (!sec.slides || !Array.isArray(sec.slides)) {
          errors.push(`Section ${si}: missing or invalid "slides" array`);
          return;
        }
        sec.slides.forEach((slide, sli) => {
          slideIdx++;
          if (!slide.template) {
            errors.push(`Slide ${slideIdx} (section ${si}, index ${sli}): missing "template"`);
          } else if (!VALID_TEMPLATES.includes(slide.template)) {
            errors.push(`Slide ${slideIdx}: invalid template "${slide.template}" (expected: ${VALID_TEMPLATES.join(', ')})`);
          }
          if (!slide.data && slide.template !== 'blank') {
            warnings.push(`Slide ${slideIdx}: missing "data" object`);
          }
          if (slide.data?.tagColor && !VALID_TAG_COLORS.includes(slide.data.tagColor)) {
            warnings.push(`Slide ${slideIdx}: unknown tagColor "${slide.data.tagColor}"`);
          }
          if (slide.speakerData) {
            const st = slide.speakerData.template || slide.template;
            if (!VALID_TEMPLATES.includes(st)) {
              errors.push(`Slide ${slideIdx}: speakerData has invalid template "${st}"`);
            }
            if (slide.speakerData.tagColor && !VALID_TAG_COLORS.includes(slide.speakerData.tagColor)) {
              warnings.push(`Slide ${slideIdx}: speakerData unknown tagColor "${slide.speakerData.tagColor}"`);
            }
          }
        });
      });
    }

    if (errors.length > 0) {
      console.error('❌ Validation FAILED:');
      errors.forEach(e => console.error(`  • ${e}`));
      if (warnings.length > 0) {
        console.warn('\n⚠️  Warnings:');
        warnings.forEach(w => console.warn(`  • ${w}`));
      }
      process.exit(1);
    }

    const totalSlides = (data.sections || []).reduce((n, s) => n + (s.slides?.length || 0), 0);
    console.log(`✅ Valid presentation: ${data.sections.length} section(s), ${totalSlides} slide(s)`);
    if (warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      warnings.forEach(w => console.warn(`  • ${w}`));
    }
  } catch (err) {
    console.error(`❌ Invalid JSON: ${err.message}`);
    process.exit(1);
  }
});
