/**
 * article-canvas: HTML normalizer (v2).
 *
 * Splits pasted HTML into a section/block tree while preserving original
 * inline HTML for paragraphs, lists, blockquotes, and figures. Only structural
 * containers (nav/footer/ads) are stripped — content fidelity is the priority.
 */

function normalizeHTML(rawHTML, sourceUrl = '') {
  // 1. Strip non-content noise
  let html = rawHTML
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // 2. Find article body — prefer <article>, then <main>, then <body>
  let bodyHTML = html;
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    bodyHTML = articleMatch[1];
  } else {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) bodyHTML = mainMatch[1];
    else {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) bodyHTML = bodyMatch[1];
    }
  }

  // 3. Drop nav/aside/footer/header/form and obvious junk containers
  bodyHTML = bodyHTML
    .replace(/<(nav|aside|footer|header|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<div[^>]*class="[^"]*(?:nav|menu|sidebar|footer|header|ad-|adv-|comments|share|related|recommend|newsletter|subscribe|promo|cookie|paywall|popup|modal)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 4. Walk top-level block elements in document order. We DO NOT clean their inner HTML —
  //    we preserve original markup so links, inline images, bold, etc. all survive.
  const blocks = extractTopLevelBlocks(bodyHTML);

  // 5. Group into sections, splitting on h1/h2/h3
  const sections = [];
  let currentSection = { id: 's0', heading: null, level: 0, blocks: [] };
  let sectionIdx = 0;
  let blockIdx = 0;
  let titleFound = null;

  function pushSection() {
    if (currentSection.blocks.length > 0 || currentSection.heading) {
      sections.push(currentSection);
    }
  }

  for (const b of blocks) {
    if (b.tag === 'h1' && !titleFound) {
      titleFound = stripTags(b.inner).trim();
      continue;
    }
    if (b.tag === 'h1' || b.tag === 'h2' || b.tag === 'h3') {
      pushSection();
      sectionIdx++;
      currentSection = {
        id: 's' + sectionIdx,
        heading: stripTags(b.inner).trim(),
        level: b.tag === 'h1' ? 1 : (b.tag === 'h2' ? 2 : 3),
        blocks: [],
      };
      continue;
    }
    if (b.tag === 'hr') {
      if (currentSection.blocks.length > 0) {
        pushSection();
        sectionIdx++;
        currentSection = { id: 's' + sectionIdx, heading: null, level: 0, blocks: [] };
      }
      continue;
    }

    blockIdx++;
    const blockId = 'b' + blockIdx;

    if (b.tag === 'p') {
      const text = stripTags(b.inner).trim();
      if (!text && !/<img\b/i.test(b.inner)) continue;
      currentSection.blocks.push({
        id: blockId,
        type: 'paragraph',
        // Preserve original inline HTML — links, em, strong, inline imgs, code, etc.
        html: rewriteImageSrcs(b.inner),
        text,
      });
    } else if (b.tag === 'blockquote') {
      const text = stripTags(b.inner).trim();
      if (!text) continue;
      currentSection.blocks.push({
        id: blockId,
        type: 'blockquote',
        html: rewriteImageSrcs(b.inner),
        text,
      });
    } else if (b.tag === 'pre') {
      const codeMatch = b.inner.match(/<code[^>]*class="[^"]*language-(\w+)[^"]*"[^>]*>([\s\S]*?)<\/code>/i);
      let lang = '', codeText = '';
      if (codeMatch) {
        lang = codeMatch[1];
        codeText = decodeEntities(stripTags(codeMatch[2]));
      } else {
        codeText = decodeEntities(stripTags(b.inner));
      }
      if (!codeText.trim()) continue;
      currentSection.blocks.push({ id: blockId, type: 'code', lang, text: codeText });
    } else if (b.tag === 'ul' || b.tag === 'ol') {
      // Preserve full list HTML (which keeps inline links/formatting in items)
      const items = [...b.inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(m =>
        stripTags(m[1]).trim()
      ).filter(Boolean);
      if (items.length === 0) continue;
      currentSection.blocks.push({
        id: blockId,
        type: 'list',
        ordered: b.tag === 'ol',
        items,
        html: rewriteImageSrcs('<' + b.tag + '>' + b.inner + '</' + b.tag + '>'),
        text: items.map((t, i) => `${b.tag === 'ol' ? (i+1) + '. ' : '• '}${t}`).join('\n'),
      });
    } else if (b.tag === 'figure') {
      // Figure: preserve the whole thing as html, but also extract src/alt/caption for indexing
      const imgMatch = b.inner.match(/<img\b([^>]*)>/i);
      let src = '', alt = '';
      if (imgMatch) {
        const a = imgMatch[1];
        const sm = a.match(/\bsrc=["']([^"']+)["']/i);
        const am = a.match(/\balt=["']([^"']*)["']/i);
        if (sm) src = sm[1];
        if (am) alt = am[1];
      }
      let caption = '';
      const capMatch = b.inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
      if (capMatch) caption = stripTags(capMatch[1]).trim();
      currentSection.blocks.push({
        id: blockId,
        type: 'image',
        src,
        alt,
        caption,
        html: rewriteImageSrcs('<figure>' + b.inner + '</figure>'),
      });
    } else if (b.tag === 'img') {
      // Bare image at top level
      let src = '', alt = '';
      const sm = b.attrs.match(/\bsrc=["']([^"']+)["']/i);
      const am = b.attrs.match(/\balt=["']([^"']*)["']/i);
      if (sm) src = sm[1];
      if (am) alt = am[1];
      if (!src) continue;
      currentSection.blocks.push({
        id: blockId,
        type: 'image',
        src,
        alt,
        caption: '',
        html: '<img ' + b.attrs + '>',
      });
    } else if (b.tag === 'h4' || b.tag === 'h5' || b.tag === 'h6') {
      // Treat as inline heading inside the section (don't open a new section)
      const text = stripTags(b.inner).trim();
      if (!text) continue;
      currentSection.blocks.push({
        id: blockId,
        type: 'subheading',
        level: parseInt(b.tag[1], 10),
        text,
        html: '<' + b.tag + '>' + b.inner + '</' + b.tag + '>',
      });
    }
  }
  pushSection();

  return {
    version: 2,
    title: titleFound || 'Untitled article',
    source_url: sourceUrl,
    captured_at: new Date().toISOString(),
    sections,
    levels: {
      tldr: '',
      keywords: [],
      block_summaries: {},
    },
  };
}

/**
 * Walk the HTML and return content blocks in document order, recursing
 * through structural containers (div/section/article/etc.) so deeply-nested
 * articles (Medium, Notion-like sites) flatten correctly.
 *
 * Content tags = blocks we emit verbatim
 * Container tags = we descend into them
 * Anything else = dropped
 */
function extractTopLevelBlocks(html) {
  const CONTENT_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','blockquote','pre','ul','ol','figure']);
  const VOID_CONTENT_TAGS = new Set(['img','hr']);
  const CONTAINER_TAGS = new Set(['div','section','article','main','span','header','center','small']);

  const blocks = [];
  walk(html);
  return blocks;

  function walk(fragment) {
    let pos = 0;
    const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/?)>/g;
    tagRegex.lastIndex = 0;
    let m;
    while ((m = tagRegex.exec(fragment)) !== null) {
      const isClose = m[1] === '/';
      const tag = m[2].toLowerCase();
      const attrs = m[3] || '';
      const selfClose = m[4] === '/';
      if (isClose) continue;  // we only act on opens at this level

      // Void content blocks (img, hr) — emit and continue
      if (VOID_CONTENT_TAGS.has(tag)) {
        blocks.push({ tag, attrs, inner: '', raw: m[0] });
        tagRegex.lastIndex = m.index + m[0].length;
        continue;
      }

      // Skip self-closing or non-meaningful tags entirely
      if (selfClose) continue;

      // Find the matching close tag, accounting for nesting of same-named tags
      const openEnd = m.index + m[0].length;
      const closeIdx = findMatchingClose(fragment, tag, openEnd);
      if (closeIdx === -1) continue;  // malformed, skip
      const inner = fragment.slice(openEnd, closeIdx);
      // Advance the outer regex past this element's close tag
      tagRegex.lastIndex = closeIdx + ('</' + tag + '>').length;

      if (CONTENT_TAGS.has(tag)) {
        blocks.push({ tag, attrs, inner, raw: fragment.slice(m.index, tagRegex.lastIndex) });
      } else if (CONTAINER_TAGS.has(tag)) {
        // Drop containers whose class/id suggests UI chrome rather than content
        if (looksLikeJunk(attrs)) continue;
        walk(inner);  // recurse
      }
      // else: tag is something we don't care about (script/style/button/svg/etc.) — drop
    }
  }
}

/**
 * Find the index of the matching close tag for `tag` starting at `from`.
 * Tracks nesting depth so <div><div>...</div></div> resolves correctly.
 * Returns the index of '<' of the matching close, or -1 if not found.
 */
function findMatchingClose(html, tag, from) {
  const open = new RegExp('<' + tag + '\\b', 'gi');
  const close = new RegExp('</' + tag + '\\s*>', 'gi');
  open.lastIndex = from;
  close.lastIndex = from;
  let depth = 1;
  while (depth > 0) {
    open.lastIndex = Math.max(open.lastIndex, from);
    close.lastIndex = Math.max(close.lastIndex, from);
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) return -1;
    if (o && o.index < c.index) {
      depth++;
      from = o.index + o[0].length;
      open.lastIndex = from;
      close.lastIndex = c.index;  // reset close to current position
    } else {
      depth--;
      if (depth === 0) return c.index;
      from = c.index + c[0].length;
      open.lastIndex = from;
      close.lastIndex = from;
    }
  }
  return -1;
}

/**
 * Heuristic: container looks like nav/footer/sidebar/etc. by class or id.
 * If it does, skip recursing into it.
 */
function looksLikeJunk(attrs) {
  const text = String(attrs).toLowerCase();
  if (!/\b(class|id|role)=/.test(text)) return false;
  return /(?:^|[\s"'\-_])(nav|menu|sidebar|footer|header-(?!image|h)|topbar|toolbar|ad|adv|advert|promo|newsletter|subscribe|cookie|paywall|popup|modal|comments?|share|social|recommend|related|related-posts|toc|breadcrumb|skip-link|hidden|sr-only|speechify-ignore)(?:[\s"'\-_]|$)/.test(text) ||
    /role=["']?(navigation|banner|complementary|search)/.test(text);
}

/**
 * Route image src attributes through our /api/image proxy.
 * This avoids hotlink protection / CORS issues on Medium, Substack, etc.
 */
function rewriteImageSrcs(html) {
  return String(html).replace(/<img\b([^>]*)>/gi, (m, attrs) => {
    // Rewrite src
    const newAttrs = attrs
      .replace(/\bsrc=(["'])([^"']+)\1/i, (_, q, src) => {
        if (src.startsWith('/api/image') || src.startsWith('data:')) return `src=${q}${src}${q}`;
        return `src=${q}/api/image?src=${encodeURIComponent(src)}${q}`;
      })
      // Strip srcset (would bypass our proxy) but keep everything else
      .replace(/\s+srcset=["'][^"']*["']/i, '')
      .replace(/\s+data-src=["'][^"']*["']/i, '');
    return `<img${newAttrs}>`;
  });
}

function stripTags(s) {
  return decodeEntities(String(s).replace(/<[^>]+>/g, ''));
}

function decodeEntities(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
}

export { normalizeHTML };
