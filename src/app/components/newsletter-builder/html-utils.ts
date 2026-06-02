// Utilities for structured SectionElement trees: parse, render, edit, theme.

import { SectionElement } from './types';

// ─── ElementInfo (same interface — consumed by PropertiesPanel) ─

export interface ElementInfo {
  tagName: string;
  type: 'text' | 'image' | 'link' | 'button' | 'divider' | 'container' | 'icon' | 'other';
  text: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  textAlign: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
  marginTop: string;
  marginBottom: string;
  marginLeft: string;
  marginRight: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  display: string;
  opacity: string;
  backgroundColor: string;
  background: string;
  backgroundImage: string;
  backgroundSize: string;
  borderRadius: string;
  borderWidth: string;
  borderColor: string;
  borderStyle: string;
  borderImageSource: string;
  src: string;
  alt: string;
  width: string;
  height: string;
  objectFit: string;
  objectPosition: string;
  href: string;
  target: string;
  isButton: boolean;
  isTextContainer: boolean;
  isEmojiIcon: boolean;
  boxShadow: string;
  textShadow: string;
}

// ─── ID generation ────────────────────────────────────────────

let _elCount = 0;
export const newElId = () => `e${++_elCount}-${Date.now().toString(36)}`;

// ─── HTML → SectionElement parser ─────────────────────────────

const TEXT_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'li', 'b', 'strong', 'em', 'i', 'u', 's', 'small', 'label', 'caption', 'blockquote']);
const VOID_TAGS = new Set(['img', 'hr', 'br', 'input', 'meta', 'link']);

// ─── Icon / emoji character detection ─────────────────────────

// Characters that are "icon-worthy" — emoji and symbol characters users would want to replace with images.
// Excludes punctuation (middot, copyright, bullets, ellipsis, quotes, dashes).
const ICON_CHAR_REGEX = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u2190-\u21FF\u2300-\u23FF\u25A0-\u25FF\u2700-\u27BF\u2B00-\u2BFF\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u2122\u2139\u203C\u2049\u25B6\u25C0\u25AA\u25AB\u{20E3}\u{E0020}-\u{E007F}→←↑↓↔↕↗↘↙↖►◀▲▼★☆✓✔✕✖✗✘✦✧✩✪✫✬✭✮✯✰✱✲]/u;

// Characters to EXCLUDE from icon detection (punctuation, separators, common text symbols)
const NON_ICON_CHARS = new Set(['·', '©', '®', '•', '…', '–', '—', '‐', '′', '″', '\u00A0']);

/** Check if a single character is an icon character */
function isIconChar(char: string): boolean {
  if (NON_ICON_CHARS.has(char)) return false;
  return ICON_CHAR_REGEX.test(char);
}

/**
 * Split text content into segments of [text, icon] parts.
 * Only splits at leading/trailing icon boundaries.
 * Returns null if no splitting needed (no icons found at edges).
 */
function splitTextAndIcons(text: string): { text: string; isIcon: boolean }[] | null {
  if (!text || !text.trim()) return null;

  const chars = Array.from(text); // handles multi-byte emoji correctly
  const len = chars.length;
  let leadEnd = 0;
  let trailStart = len;

  // Find leading icon characters (including any whitespace immediately after)
  while (leadEnd < len && (isIconChar(chars[leadEnd]) || (leadEnd > 0 && chars[leadEnd] === ' ' && leadEnd + 1 < len && isIconChar(chars[leadEnd + 1])))) {
    leadEnd++;
  }
  // Include the whitespace separator between the leading icon and text body
  if (leadEnd > 0 && leadEnd < len && chars[leadEnd] === ' ') leadEnd++;

  // Find trailing icon characters (including any whitespace immediately before)
  while (trailStart > leadEnd && (isIconChar(chars[trailStart - 1]) || (trailStart - 1 > leadEnd && chars[trailStart - 1] === ' ' && trailStart - 2 >= 0 && isIconChar(chars[trailStart - 2])))) {
    trailStart--;
  }
  // Include the whitespace separator between text body and trailing icon
  if (trailStart < len && trailStart > leadEnd && chars[trailStart - 1] === ' ') trailStart--;

  // No leading or trailing icons found → no split needed
  if (leadEnd === 0 && trailStart === len) return null;

  const segments: { text: string; isIcon: boolean }[] = [];
  if (leadEnd > 0) {
    segments.push({ text: chars.slice(0, leadEnd).join(''), isIcon: true });
  }
  if (leadEnd < trailStart) {
    segments.push({ text: chars.slice(leadEnd, trailStart).join(''), isIcon: false });
  }
  if (trailStart < len) {
    segments.push({ text: chars.slice(trailStart).join(''), isIcon: true });
  }
  return segments.length > 0 ? segments : null;
}

/** Returns true if the string is ENTIRELY composed of icon characters and whitespace */
export function isEmojiOnly(text: string): boolean {
  if (!text || !text.trim()) return false;
  const stripped = text.replace(/\s/g, '');
  if (!stripped) return false;
  return Array.from(stripped).every(ch => isIconChar(ch));
}

// HTML attribute names → React camelCase prop names
const REACT_ATTR: Record<string, string> = {
  cellpadding: 'cellPadding', cellspacing: 'cellSpacing',
  colspan: 'colSpan', rowspan: 'rowSpan',
  tabindex: 'tabIndex', contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin', enctype: 'encType',
  accesskey: 'accessKey', class: 'className', for: 'htmlFor',
  maxlength: 'maxLength', minlength: 'minLength',
  readonly: 'readOnly', novalidate: 'noValidate',
  autofocus: 'autoFocus', autocomplete: 'autoComplete',
  frameborder: 'frameBorder', usemap: 'useMap',
  bgcolor: 'bgColor', valign: 'vAlign',
};

/** Parse raw inline style string → camelCase style object */
function parseStyle(raw: string): Record<string, string> {
  const styles: Record<string, string> = {};
  raw.split(';').forEach(decl => {
    const colon = decl.indexOf(':');
    if (colon === -1) return;
    const prop = decl.slice(0, colon).trim();
    const val = decl.slice(colon + 1).trim();
    if (!prop || !val) return;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    styles[camel] = val;
  });
  // Expand CSS shorthand properties to longhands. The right panel reads
  // longhand keys (paddingTop, marginLeft, borderColor, etc.), so without
  // this expansion an imported style="padding:10px 20px" would leave all
  // four longhand fields empty in the panel even though the visual
  // result is correct. We populate the longhands ONLY if the user didn't
  // also write them explicitly — explicit longhand wins.
  expandShorthands(styles);
  return styles;
}

/** Split a CSS shorthand value into 1–4 sides following the standard
 *  top/right/bottom/left expansion rules (1 → all, 2 → vert/horz,
 *  3 → top/horz/bottom, 4 → top/right/bottom/left). Tokenizes on
 *  whitespace but keeps function calls (rgba(...), url(...)) intact. */
function splitSides(value: string): string[] {
  const tokens: string[] = [];
  let depth = 0, current = '';
  for (const ch of value) {
    if (ch === '(') { depth++; current += ch; }
    else if (ch === ')') { depth--; current += ch; }
    else if (/\s/.test(ch) && depth === 0) {
      if (current) { tokens.push(current); current = ''; }
    } else current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

function fourSides(parts: string[]): [string, string, string, string] {
  const [a, b, c, d] = parts;
  if (parts.length === 1) return [a, a, a, a];
  if (parts.length === 2) return [a, b, a, b];
  if (parts.length === 3) return [a, b, c, b];
  return [a, b, c, d];
}

function expandShorthands(styles: Record<string, string>): void {
  // padding / margin — expand 1–4 value shorthand into 4 longhands
  for (const prefix of ['padding', 'margin'] as const) {
    if (styles[prefix]) {
      const parts = splitSides(styles[prefix]);
      if (parts.length >= 1 && parts.length <= 4) {
        const [t, r, b, l] = fourSides(parts);
        if (!styles[`${prefix}Top`]) styles[`${prefix}Top`] = t;
        if (!styles[`${prefix}Right`]) styles[`${prefix}Right`] = r;
        if (!styles[`${prefix}Bottom`]) styles[`${prefix}Bottom`] = b;
        if (!styles[`${prefix}Left`]) styles[`${prefix}Left`] = l;
        // Remove the shorthand so re-serialization doesn't emit both
        // shorthand AND longhand (duplicate CSS), and so the user editing
        // an individual side in the panel doesn't get overwritten by the
        // shorthand on next render.
        delete styles[prefix];
      }
    }
  }
  // border — split into width / style / color in any order. Tokens that
  // look like a length (px/em/rem/etc.) are width, named line styles
  // (solid/dashed/etc.) are style, anything else is treated as color.
  if (styles.border) {
    const parts = splitSides(styles.border);
    const lineStyles = new Set(['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']);
    let bw = '', bs = '', bc = '';
    parts.forEach(p => {
      if (/^-?[\d.]+(px|em|rem|%|pt|vh|vw)?$/.test(p)) bw = p;
      else if (lineStyles.has(p.toLowerCase())) bs = p;
      else bc = p;
    });
    if (bw && !styles.borderWidth) styles.borderWidth = bw;
    if (bs && !styles.borderStyle) styles.borderStyle = bs;
    if (bc && !styles.borderColor) styles.borderColor = bc;
    // Only drop the shorthand if we successfully extracted at least one
    // longhand from it — otherwise leave it for whatever exotic value
    // the user wrote.
    if (bw || bs || bc) delete styles.border;
  }
  // background shorthand — only extract backgroundColor and backgroundImage
  // when they're not already set explicitly. Many emails use
  // background:#fff or background:url(...). We don't try to fully parse
  // the standard background shorthand; we just look for a leading color
  // token or a url(...) call.
  if (styles.background && !styles.backgroundColor && !styles.backgroundImage) {
    const v = styles.background.trim();
    const urlM = v.match(/url\((['"]?)([^'")]+)\1\)/);
    if (urlM) styles.backgroundImage = `url('${urlM[2]}')`;
    // Color extraction: leading hex/rgb/rgba/named-color token before any
    // url() / gradient() call. We avoid touching `background` if it looks
    // like a gradient — gradients are kept in the `background` key as-is
    // because the rest of the codebase already reads them from there.
    if (!/(linear|radial|conic)-gradient\(/.test(v)) {
      const colorM = v.match(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)/);
      if (colorM) styles.backgroundColor = colorM[1];
      // Remove `background` if we extracted everything we needed (color
      // and/or image) and there's no gradient. Keeps gradients intact.
      if (colorM || urlM) delete styles.background;
    }
  }
  // font shorthand — partial expansion. Common pattern: "16px/1.5 Arial"
  // We extract fontSize / lineHeight / fontFamily when easily detectable.
  if (styles.font) {
    const fontVal = styles.font;
    let consumed = false;
    // size/line-height pair: 16px/1.5
    const sizeLh = fontVal.match(/(-?[\d.]+(?:px|em|rem|%|pt))\s*\/\s*([\d.]+(?:px|em|rem|%|pt)?)/);
    if (sizeLh) {
      if (!styles.fontSize) styles.fontSize = sizeLh[1];
      if (!styles.lineHeight) styles.lineHeight = sizeLh[2];
      consumed = true;
    } else {
      const sizeOnly = fontVal.match(/(-?[\d.]+(?:px|em|rem|%|pt))/);
      if (sizeOnly && !styles.fontSize) { styles.fontSize = sizeOnly[1]; consumed = true; }
    }
    // font-family — anything after the size/line-height block
    const after = fontVal.replace(/^.*?(?:\d(?:px|em|rem|%|pt)(?:\s*\/\s*[\d.]+(?:px|em|rem|%|pt)?)?)\s*/, '');
    if (after && !styles.fontFamily) { styles.fontFamily = after.trim(); consumed = true; }
    if (consumed) delete styles.font;
  }
}

/** Parse attrs of a DOM element → HTML-name attrs dict (excluding style) */
function parseAttrs(el: Element): Record<string, string> | undefined {
  const attrs: Record<string, string> = {};
  const SKIP = new Set(['style', 'data-el-idx']);
  Array.from(el.attributes).forEach(a => {
    if (SKIP.has(a.name)) return;
    let v = a.value;
    // For URL-bearing attributes, normalize the value so imported HTML
    // with encoded entities (&amp; → &), surrounding whitespace, or
    // protocol-relative URLs (//cdn.x/foo.png) doesn't fail to load.
    if (a.name === 'src' || a.name === 'href' || a.name === 'srcset' || a.name === 'data-src') {
      v = v.trim();
      // Decode common HTML entities that might appear in URL query strings
      // (&amp; is the most common). Use a textarea decode trick to handle
      // any HTML-encoded chars without pulling in a library.
      if (v.includes('&')) {
        const ta = document.createElement('textarea');
        ta.innerHTML = v;
        v = ta.value;
      }
      // Protocol-relative URL → assume https. The canvas isn't always
      // served over https (dev mode), and protocol-relative URLs don't
      // resolve cleanly when the page itself is opened from a file:// or
      // similar non-http context.
      if (v.startsWith('//')) v = 'https:' + v;
    }
    // Some imported HTML uses data-src for lazy-loaded images and leaves
    // the actual src empty or pointing to a placeholder. Promote data-src
    // to src so the image loads on the canvas.
    if (a.name === 'data-src' && v) attrs.src = v;
    attrs[a.name] = v;
  });
  // If the element ended up with both an empty `src` and a populated
  // `data-src`, the loop above already promoted data-src. Strip the
  // empty src so the browser doesn't try (and fail) to load "".
  if (attrs.src === '' && attrs['data-src']) delete attrs.src;
  return Object.keys(attrs).length > 0 ? attrs : undefined;
}

/** Determine element type from tag and styles */
function determineType(tag: string, styles: Record<string, string>): SectionElement['type'] {
  if (tag === 'img') return 'image';
  if (tag === 'hr') return 'divider';
  if (tag === 'a') {
    const hasBg = !!(styles.backgroundColor || (styles.background && styles.background !== 'none'));
    const hasPad = !!(styles.padding || styles.paddingTop || styles.paddingBottom ||
      styles.paddingLeft || styles.paddingRight);
    // display:inline-block or inline-flex marks bulletproof button patterns
    const hasBlock = styles.display === 'inline-block' || styles.display === 'inline-flex';
    return (hasBg || hasPad || hasBlock) ? 'button' : 'link';
  }
  if (TEXT_TAGS.has(tag)) return 'text';
  return 'container';
}

function parseNode(el: Element): SectionElement {
  const tag = el.tagName.toLowerCase();
  const styles = parseStyle(el.getAttribute('style') || '');
  const type = determineType(tag, styles);
  const attrs = parseAttrs(el);

  const element: SectionElement = { id: newElId(), type, tag, styles };
  if (attrs) element.attrs = attrs;

  if (VOID_TAGS.has(tag)) {
    // void — no children or content
    return element;
  }

  // Parse all child nodes — element nodes recursively, text nodes as virtual <span> wrappers
  const children: SectionElement[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(parseNode(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const rawText = child.textContent || '';
      if (rawText.trim()) {
        // Try to split text+icon content into separate elements
        const segments = splitTextAndIcons(rawText);
        if (segments) {
          for (const seg of segments) {
            if (seg.isIcon) {
              children.push({ id: newElId(), type: 'icon' as const, tag: 'span', content: seg.text, styles: { fontSize: 'inherit', lineHeight: 'inherit' } });
            } else {
              children.push({ id: newElId(), type: 'text' as const, tag: 'span', content: seg.text, styles: {} });
            }
          }
        } else {
          // Plain text — preserve original text (including surrounding spaces)
          children.push({ id: newElId(), type: 'text', tag: 'span', content: rawText, styles: {} });
        }
      }
    }
  }

  if (children.length > 0) {
    element.children = children;
  } else {
    // Leaf element — apply icon splitting to the full text content
    const textContent = el.textContent || '';
    const segments = splitTextAndIcons(textContent);
    if (segments && segments.length > 1) {
      element.children = segments.map(seg => {
        if (seg.isIcon) {
          return { id: newElId(), type: 'icon' as const, tag: 'span', content: seg.text, styles: { fontSize: 'inherit', lineHeight: 'inherit' } };
        }
        return { id: newElId(), type: 'text' as const, tag: 'span', content: seg.text, styles: {} };
      });
    } else if (segments && segments.length === 1 && segments[0].isIcon) {
      element.type = 'icon';
      element.content = textContent;
    } else {
      element.content = textContent;
    }
  }

  return element;
}

/** Parse HTML string → array of SectionElement (top-level children of root) */
export function htmlToElements(html: string): SectionElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild!;
  return Array.from(root.children).map(parseNode);
}

// ─── SectionElement → HTML serializer ─────────────────────────

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

function styleToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${camelToKebab(k)}:${v}`)
    .join(';');
}

/** Convert a SectionElement back to email-compatible HTML */
export function elementToHtml(el: SectionElement): string {
  const styleStr = styleToString(el.styles);
  const stylePart = styleStr ? ` style="${styleStr}"` : '';
  const attrPart = el.attrs
    ? Object.entries(el.attrs).map(([k, v]) => ` ${k}="${v}"`).join('')
    : '';

  if (VOID_TAGS.has(el.tag)) {
    return `<${el.tag}${attrPart}${stylePart} />`;
  }

  const inner = el.children
    ? el.children.map(elementToHtml).join('')
    : (el.content || '');

  return `<${el.tag}${attrPart}${stylePart}>${inner}</${el.tag}>`;
}

export function elementsToHtml(elements: SectionElement[]): string {
  return elements.map(elementToHtml).join('');
}

// ─── Email-safe export serializer ─────────────────────────────

/** Convert rgb(r,g,b) / rgba(r,g,b,a) to #rrggbb hex */
function rgbToHex(color: string): string {
  const m = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return color;
  return `#${parseInt(m[1]).toString(16).padStart(2, '0')}${parseInt(m[2]).toString(16).padStart(2, '0')}${parseInt(m[3]).toString(16).padStart(2, '0')}`;
}

const COLOR_STYLE_PROPS = new Set([
  'color', 'backgroundColor', 'borderColor',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'outlineColor',
]);

/** Expand CSS shorthand (padding/margin) and convert colors to hex */
function emailSafeStyles(styles: Record<string, string>): Record<string, string> {
  const r: Record<string, string> = {};

  for (const [k, v] of Object.entries(styles)) {
    if (!v) continue;

    // Strip CSS properties not supported by email clients
    if (k === 'objectFit' || k === 'objectPosition' || k === 'overflow') continue;

    // Convert color values to hex
    const val = COLOR_STYLE_PROPS.has(k) && v.startsWith('rgb') ? rgbToHex(v) : v;

    // Drop flex display — not supported in Outlook
    if (k === 'display' && (val === 'flex' || val === 'inline-flex')) continue;

    // Expand padding shorthand
    if (k === 'padding') {
      const [t, ri, b, l] = expandBoxShorthand(val);
      if (!styles.paddingTop) r.paddingTop = t;
      if (!styles.paddingRight) r.paddingRight = ri;
      if (!styles.paddingBottom) r.paddingBottom = b;
      if (!styles.paddingLeft) r.paddingLeft = l;
      continue;
    }
    // Expand margin shorthand
    if (k === 'margin') {
      const [t, ri, b, l] = expandBoxShorthand(val);
      if (!styles.marginTop) r.marginTop = t;
      if (!styles.marginRight) r.marginRight = ri;
      if (!styles.marginBottom) r.marginBottom = b;
      if (!styles.marginLeft) r.marginLeft = l;
      continue;
    }

    r[k] = val;
  }

  // Font-family: add generic fallback if none present
  if (r.fontFamily && !/sans-serif|serif|monospace|cursive|fantasy/.test(r.fontFamily)) {
    r.fontFamily = `${r.fontFamily}, Arial, sans-serif`;
  }

  return r;
}

function expandBoxShorthand(val: string): [string, string, string, string] {
  const parts = val.trim().split(/\s+/);
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
  return [parts[0], parts[1], parts[2], parts[3]];
}

/** Walk a td's descendants looking for the first <a> button (display:
 *  inline-block with text-align in its inline style). Returns the alignment
 *  value to apply to the parent td as an HTML `align` attribute, or null
 *  if no button-align is found. Used by the export pipeline to propagate
 *  button text-align (set via the Typography panel) into email-safe
 *  align="center" on the parent td so the button table actually centers
 *  in email clients — without this, Typography → Align → Center on a
 *  button has no visible effect in exported emails because the wrapper
 *  table is treated as inline content by its parent td and the parent's
 *  default align is "left". */
function findButtonTextAlign(el: SectionElement): string | null {
  if (!el.children) return null;
  for (const child of el.children) {
    if (child.tag === 'a' && child.styles) {
      const display = child.styles.display || (child.styles as any)['display'];
      const ta = child.styles.textAlign || (child.styles as any)['text-align'];
      if (display === 'inline-block' && ta && (ta === 'center' || ta === 'left' || ta === 'right')) {
        return ta;
      }
    }
    const found = findButtonTextAlign(child);
    if (found) return found;
  }
  return null;
}

/** Export-oriented serializer — email-safe styles + image border="0".
 * parentCentered tracks whether any ancestor element has align="center" or
 * text-align:center set; when true, block-level images under that ancestor
 * get margin:0 auto so they honor the centering (email clients only center
 * inline content via align="center", so display:block images need explicit
 * auto-margins). */
export function exportElementToHtml(el: SectionElement, parentCentered: boolean = false): string {
  const styles = emailSafeStyles(el.styles);

  // Build attrs
  const attrs: Record<string, string> = { ...(el.attrs || {}) };

  // Wrap non-anchor elements that have an href in an outer <a> block for export.
  // Table structural elements cannot be wrapped (invalid HTML) — strip href from them instead.
  const LINK_WRAP_SKIP = new Set(['td', 'tr', 'tbody', 'thead', 'tfoot', 'th']);
  if (attrs.href && el.tag !== 'a') {
    if (!TEXT_TAGS.has(el.tag) && !LINK_WRAP_SKIP.has(el.tag)) {
      const linkHref = attrs.href;
      const linkTarget = attrs.target || '_blank';
      const attrsNoLink: Record<string, string> = { ...(el.attrs || {}) };
      delete attrsNoLink.href;
      delete attrsNoLink.target;
      const elNoLink: SectionElement = { ...el, attrs: Object.keys(attrsNoLink).length ? attrsNoLink : undefined };
      const innerHtml = exportElementToHtml(elNoLink, parentCentered);
      return `<a href="${linkHref}" target="${linkTarget}" rel="noopener noreferrer" style="display:block;text-decoration:none;">${innerHtml}</a>`;
    }
    if (LINK_WRAP_SKIP.has(el.tag)) {
      delete attrs.href;
      delete attrs.target;
    }
  }

  if (el.tag === 'img') {
    if (!attrs.border) attrs.border = '0';
    if (attrs.alt === undefined) attrs.alt = '';
    // Set width from styles if not in attrs
    if (!attrs.width && styles.width) attrs.width = styles.width.replace('px', '');
    // Capture what object-fit was BEFORE we strip it, so we can handle height correctly.
    const hadObjectFit = !!styles.objectFit;
    const wasContain = styles.objectFit === 'contain';

    // Detect inline icon images: images originally styled as display:inline-block or
    // display:inline are meant to sit beside text (e.g. calendar icons, arrow icons,
    // logo images in a header row). Forcing display:block on these would push the icon
    // onto its own line and break the intended inline layout in email clients (Gmail,
    // Outlook, Zoho Mail).
    const originalDisplay = el.styles.display || '';
    const isInlineIcon = originalDisplay === 'inline-block' || originalDisplay === 'inline';

    if (isInlineIcon) {
      // Inline icon: preserve inline-block display and vertical-align:middle so the
      // icon stays beside its adjacent text. Keep both width and height attrs set to
      // exact pixel values — inline icons must render at the intended size.
      styles.display = 'inline-block';
      if (!styles.verticalAlign) styles.verticalAlign = 'middle';
      // max-width:100% prevents overflow on narrow mobile screens while still letting
      // the icon render at its declared pixel width on larger viewports.
      styles.maxWidth = '100%';
      if (el.attrs?.height) attrs.height = el.attrs.height;
      // Mark with a CSS class so the stylesheet can (a) reinforce display:inline-block
      // with !important to beat the global img { display:block } reset, and (b) exclude
      // the icon from the mobile media-query rule that applies width:100% !important to
      // images — which would otherwise stretch a 16px/20px icon to full container width
      // on phones regardless of inline styles.
      if (!attrs.class) attrs.class = 'img-icon';
      else if (!attrs.class.includes('img-icon')) attrs.class += ' img-icon';
    } else {
      // Regular block image: REMOVE height attribute — let it auto-calculate from width
      // to preserve aspect ratio. Email clients stretch images when both width and height
      // are set and don't match the actual ratio.
      delete attrs.height;
      // Responsive inline styles
      styles.maxWidth = '100%';
      styles.display = 'block';
      // Height handling: the existing width attr forces the width, and we want
      // the image's natural aspect ratio to determine the rendered height.
      // Setting `height:auto` is the standard hint, but some email clients
      // (notably older Outlooks and Zoho Mail on certain webmail paths)
      // ignore `height:auto` and pick up the image's natural pixel height
      // instead — which when combined with an enforced width ATTRIBUTE causes
      // visible stretching. When the source had object-fit:contain (meaning
      // the author asked for proportional scaling without cropping), we
      // remove the height style entirely rather than forcing auto; the only
      // dimension constraint then is `width`, and email clients compute
      // height proportionally by default.
      if (wasContain) {
        delete styles.height;
      } else {
        styles.height = 'auto';
      }
      // When an ancestor has align="center" or text-align:center, add auto
      // horizontal margins so this block-level image actually renders centered
      // in email clients. display:block images don't respect parent text-align
      // or align attrs — they need auto margins for visible centering.
      if (parentCentered && !styles.marginLeft && !styles.marginRight && !styles.margin) {
        styles.marginLeft = 'auto';
        styles.marginRight = 'auto';
      }
    }
    // Remove object-fit/position — not supported in email clients
    delete styles.objectFit;
    delete styles.objectPosition;
    // Suppress unused-var lint for hadObjectFit (kept for readability)
    void hadObjectFit;

    // Logo image: mark with img-logo class so the mobile stylesheet caps it at
    // max-width:150px. Without this, logos with width="140" or width="180" fall
    // outside the exclusion list in the media query and get stretched to 100% of
    // the container width on narrow screens — appearing disproportionately large.
    if (attrs['data-slot'] === 'logo') {
      if (!attrs.class) attrs.class = 'img-logo';
      else if (!attrs.class.includes('img-logo')) attrs.class += ' img-logo';
    }

    // Social media icon image: mark with img-social class so the mobile stylesheet
    // constrains each icon to a fixed 32px size. Without this, 28px social icons
    // (width="28") fall outside the exclusion list and balloon to 100% container
    // width on narrow screens.
    if (/^social-\d+-image$/.test(attrs['data-slot'] || '')) {
      if (!attrs.class) attrs.class = 'img-social';
      else if (!attrs.class.includes('img-social')) attrs.class += ' img-social';
    }
  }

  // ── Circular background with centred image ──────────────────────────────────
  // Detect a <div> with border-radius:50%, a background colour, fixed equal
  // dimensions, and exactly one <img> child. On canvas these circles centre their
  // image via line-height or flexbox, but both techniques are stripped or ignored
  // by email clients (Gmail, Outlook, Zoho Mail, Apple Mail). The only reliable
  // email-safe approach is display:table on the circle and display:table-cell +
  // vertical-align:middle on an inner wrapper div, which works universally.
  // Fixed pixel width AND height are always preserved so the circle stays a
  // perfect circle (not an oval) at every viewport — never use width:100%.
  if (
    el.tag === 'div' &&
    (styles.borderRadius === '50%' || el.styles.borderRadius === '50%') &&
    (styles.backgroundColor || styles.background) &&
    (styles.width || el.styles.width) &&
    (styles.height || el.styles.height) &&
    el.children?.length === 1 &&
    el.children[0].tag === 'img'
  ) {
    const imgEl = el.children[0];

    // Image styles: force display:block + margin:0 auto for centering inside the
    // table-cell. Bypass the normal inline-icon path — the circle controls alignment.
    const imgSafeStyles = emailSafeStyles(imgEl.styles);
    imgSafeStyles.display = 'block';
    imgSafeStyles.marginLeft = 'auto';
    imgSafeStyles.marginRight = 'auto';
    imgSafeStyles.maxWidth = '100%';
    delete imgSafeStyles.verticalAlign;   // table-cell handles vertical alignment
    delete imgSafeStyles.objectFit;
    delete imgSafeStyles.objectPosition;
    // Declared pixel dimensions are preserved as-is; do NOT force height:auto —
    // that would break pixel-exact icon sizing inside the circle.

    const imgAttrs: Record<string, string> = { ...(imgEl.attrs || {}) };
    if (!imgAttrs.border) imgAttrs.border = '0';
    if (imgAttrs.alt === undefined) imgAttrs.alt = '';
    if (!imgAttrs.width && imgSafeStyles.width) imgAttrs.width = imgSafeStyles.width.replace('px', '');
    if (imgEl.attrs?.height) imgAttrs.height = imgEl.attrs.height;
    // Remove img-icon class if present: img.img-icon has display:inline-block !important
    // in the stylesheet which would override the display:block we set above.
    if (imgAttrs.class) {
      imgAttrs.class = imgAttrs.class.replace(/\bimg-icon\b/, '').trim();
      if (!imgAttrs.class) delete imgAttrs.class;
    }

    const imgStyleStr = styleToString(imgSafeStyles);
    const imgAttrStr = Object.entries(imgAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
    const imgHtml = `<img${imgAttrStr}${imgStyleStr ? ` style="${imgStyleStr}"` : ''} />`;

    // Circle container: switch display to table so the inner table-cell div can
    // vertically centre the image. Strip line-height and font-size (they were sized
    // for the original emoji text and are irrelevant for an image child). Preserve
    // dimensions, background colour, and outer spacing. Fixed pixel width + height
    // (never width:100%) guarantee the circle never becomes an oval at small viewports.
    const cw = styles.width || el.styles.width || '';
    const ch = styles.height || el.styles.height || '';
    const circleStyles: Record<string, string> = {
      width: cw,
      height: ch,
      borderRadius: '50%',
      display: 'table',
      marginLeft: 'auto',
      marginRight: 'auto',
      maxWidth: '100%',
    };
    if (styles.backgroundColor) circleStyles.backgroundColor = styles.backgroundColor;
    else if (styles.background) circleStyles.background = styles.background;
    if (styles.marginTop) circleStyles.marginTop = styles.marginTop;
    if (styles.marginBottom) circleStyles.marginBottom = styles.marginBottom;
    if (styles.paddingTop) circleStyles.paddingTop = styles.paddingTop;
    if (styles.paddingRight) circleStyles.paddingRight = styles.paddingRight;
    if (styles.paddingBottom) circleStyles.paddingBottom = styles.paddingBottom;
    if (styles.paddingLeft) circleStyles.paddingLeft = styles.paddingLeft;

    const circleStyleStr = styleToString(circleStyles);
    return `<div style="${circleStyleStr}"><div style="display:table-cell;vertical-align:middle;text-align:center;">${imgHtml}</div></div>`;
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── Rounded container box with centred image (e.g. C9 icon grid boxes) ──────
  // Detect: a <div> with a non-50% border-radius, explicit background colour,
  // explicit width+height, and exactly one <img> child. Email clients ignore
  // line-height vertical-centering for images; replace with a table cell.
  if (
    el.tag === 'div' &&
    (styles.borderRadius || el.styles.borderRadius) &&
    styles.borderRadius !== '50%' &&
    el.styles.borderRadius !== '50%' &&
    (styles.backgroundColor || styles.background) &&
    (styles.width || el.styles.width) &&
    (styles.height || el.styles.height) &&
    el.children?.length === 1 &&
    el.children[0].tag === 'img'
  ) {
    const iconBoxChild = el.children[0];
    const boxW = styles.width || el.styles.width || '40px';
    const boxH = styles.height || el.styles.height || '40px';
    const boxTableStyles: Record<string, string> = {
      width: boxW,
      height: boxH,
    };
    if (styles.backgroundColor) boxTableStyles.backgroundColor = styles.backgroundColor;
    else if (styles.background) boxTableStyles.backgroundColor = styles.background;
    if (styles.borderRadius) boxTableStyles.borderRadius = styles.borderRadius;
    else if (el.styles.borderRadius) boxTableStyles.borderRadius = el.styles.borderRadius;
    if (styles.marginBottom) boxTableStyles.marginBottom = styles.marginBottom;
    if (styles.marginTop) boxTableStyles.marginTop = styles.marginTop;
    if (styles.marginLeft) boxTableStyles.marginLeft = styles.marginLeft;
    if (styles.marginRight) boxTableStyles.marginRight = styles.marginRight;
    const boxTableStyleStr = styleToString(boxTableStyles);
    const iconBoxSafeStyles = emailSafeStyles(iconBoxChild.styles);
    iconBoxSafeStyles.display = 'block';
    iconBoxSafeStyles.marginLeft = 'auto';
    iconBoxSafeStyles.marginRight = 'auto';
    delete iconBoxSafeStyles.verticalAlign;
    delete iconBoxSafeStyles.maxWidth;
    const iconBoxAttrs: Record<string, string> = { ...(iconBoxChild.attrs || {}) };
    if (!iconBoxAttrs.border) iconBoxAttrs.border = '0';
    if (iconBoxAttrs.alt === undefined) iconBoxAttrs.alt = '';
    if (!iconBoxAttrs.width && iconBoxSafeStyles.width) iconBoxAttrs.width = iconBoxSafeStyles.width.replace('px', '');
    if (iconBoxChild.attrs?.height) iconBoxAttrs.height = iconBoxChild.attrs.height;
    if (iconBoxAttrs.class) {
      iconBoxAttrs.class = iconBoxAttrs.class.replace(/\bimg-icon\b/, '').trim();
      if (!iconBoxAttrs.class) delete iconBoxAttrs.class;
    }
    const iconBoxImgStyleStr = styleToString(iconBoxSafeStyles);
    const iconBoxAttrStr = Object.entries(iconBoxAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
    const iconBoxImgHtml = `<img${iconBoxAttrStr}${iconBoxImgStyleStr ? ` style="${iconBoxImgStyleStr}"` : ''} />`;
    return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${boxTableStyleStr}"><tr><td align="center" valign="middle" style="width:${boxW};height:${boxH};text-align:center;vertical-align:middle;">${iconBoxImgHtml}</td></tr></table>`;
  }

  // ── B9 Video Hero: inline-block relative div with block image + abs overlay ──
  // Detect: a <div> with position:relative AND display:inline-block containing
  // a regular block <img> (NOT position:absolute) as the background image, plus
  // a sibling <div> with position:absolute + top:50% + left:50% as the centred
  // overlay (e.g. a play button circle). Email clients strip position:absolute
  // and transform:translate(-50%,-50%), causing the play button to fall below the
  // image. Email-safe fix: convert the block image to a CSS background-image on a
  // table, and use align/valign to centre the overlay inside the same td.
  if (
    el.tag === 'div' &&
    el.styles.position === 'relative' &&
    (el.styles.display === 'inline-block' || el.styles.display === 'inline') &&
    el.children && el.children.length >= 2
  ) {
    const b9BgImg = el.children.find(c =>
      c.tag === 'img' &&
      c.styles.position !== 'absolute'
    );
    const b9Overlay = el.children.find(c =>
      c !== b9BgImg &&
      c.styles.position === 'absolute' &&
      c.styles.top === '50%' &&
      c.styles.left === '50%'
    );

    if (b9BgImg && b9Overlay) {
      const b9Src = b9BgImg.attrs?.src || '';
      const b9W = b9BgImg.attrs?.width || '';
      const b9H = b9BgImg.attrs?.height || '';
      const b9WPx = b9W ? (b9W.endsWith('px') ? b9W : `${b9W}px`) : '';
      const b9HPx = b9H ? (b9H.endsWith('px') ? b9H : `${b9H}px`) : '';

      // Use a real <img> tag so Zoho Campaigns can re-host the src (data URI or URL).
      // CSS background-image with a data URI is ignored by Zoho Campaigns.
      const b9ImgAttrs: Record<string, string> = { ...(b9BgImg.attrs || {}) };
      if (!b9ImgAttrs.border) b9ImgAttrs.border = '0';
      if (b9ImgAttrs.alt === undefined) b9ImgAttrs.alt = '';
      const b9ImgSafe = emailSafeStyles(b9BgImg.styles);
      const b9ImgStyles: Record<string, string> = { display: 'block' };
      if (b9WPx) b9ImgStyles.width = b9WPx;
      if (b9HPx) b9ImgStyles.height = b9HPx;
      if (b9WPx) b9ImgStyles.maxWidth = b9WPx;
      if (b9ImgSafe.borderRadius) b9ImgStyles.borderRadius = b9ImgSafe.borderRadius;
      const b9ImgStyleStr = styleToString(b9ImgStyles);
      const b9ImgAttrStr = Object.entries(b9ImgAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
      const b9ImgHtml = `<img${b9ImgAttrStr} style="${b9ImgStyleStr}" />`;

      const b9OverlaySafe = emailSafeStyles(b9Overlay.styles);
      const b9CircleStyles: Record<string, string> = { display: 'inline-block' };
      if (b9OverlaySafe.width) b9CircleStyles.width = b9OverlaySafe.width;
      if (b9OverlaySafe.height) b9CircleStyles.height = b9OverlaySafe.height;
      if (b9OverlaySafe.borderRadius) b9CircleStyles.borderRadius = b9OverlaySafe.borderRadius;
      if (b9OverlaySafe.backgroundColor) b9CircleStyles.backgroundColor = b9OverlaySafe.backgroundColor;
      else if (b9OverlaySafe.background) b9CircleStyles.background = b9OverlaySafe.background;
      if (b9OverlaySafe.textAlign) b9CircleStyles.textAlign = b9OverlaySafe.textAlign;
      if (b9OverlaySafe.lineHeight) b9CircleStyles.lineHeight = b9OverlaySafe.lineHeight;

      const b9OverlayInner = b9Overlay.children
        ? b9Overlay.children.map(c => {
            if (c.tag === 'img') {
              const playBtnSafe = emailSafeStyles(c.styles);
              const playBtnAttrs: Record<string, string> = { ...(c.attrs || {}) };
              if (!playBtnAttrs.border) playBtnAttrs.border = '0';
              if (playBtnAttrs.alt === undefined) playBtnAttrs.alt = '';
              const playW = playBtnAttrs.width ? parseInt(playBtnAttrs.width) : 0;
              const playH = playBtnAttrs.height ? parseInt(playBtnAttrs.height) : 0;
              const playSize = playW > 0 ? playW : (playH > 0 ? playH : 60);
              const playHFinal = playH > 0 ? playH : playSize;
              playBtnAttrs.width = String(playSize);
              playBtnAttrs.height = String(playHFinal);
              if (!playBtnAttrs.class) playBtnAttrs.class = 'img-icon';
              else if (!playBtnAttrs.class.includes('img-icon')) playBtnAttrs.class = `img-icon ${playBtnAttrs.class}`.trim();
              playBtnSafe.display = 'block';
              playBtnSafe.width = `${playSize}px`;
              playBtnSafe.height = `${playHFinal}px`;
              playBtnSafe.maxWidth = `${playSize}px`;
              delete playBtnSafe.objectFit;
              delete playBtnSafe.objectPosition;
              const playStyleStr = styleToString(playBtnSafe);
              const playAttrStr = Object.entries(playBtnAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
              return `<img${playAttrStr}${playStyleStr ? ` style="${playStyleStr}"` : ''} />`;
            }
            return exportElementToHtml(c, false);
          }).join('')
        : (b9Overlay.content || '');

      const b9CircleStyleStr = styleToString(b9CircleStyles);
      // Overlay covers the full image; display:table/table-cell centres the circle.
      const b9OverlayDivHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:table;table-layout:fixed;text-align:center;"><div style="display:table-cell;vertical-align:middle;text-align:center;"><div style="${b9CircleStyleStr}">${b9OverlayInner}</div></div></div>`;

      const b9WrapStyle = `position:relative;font-size:0;line-height:0;display:inline-block;${b9WPx ? `width:${b9WPx};` : ''}`;
      return `<div style="${b9WrapStyle}">${b9ImgHtml}${b9OverlayDivHtml}</div>`;
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── D9 Video Testimonial Card: full-fill absolute img + circular play overlay ──
  // Detect: a <td> with position:relative containing an <img> that fills the cell
  // 100%×100% (position:absolute;top:0;left:0;width:100%;height:100%) plus a
  // circular div overlay (border-radius:50%) at position:absolute;top:50%;left:50%.
  // The generic handler below converts the image to CSS background-image on the
  // container, but Zoho Campaigns does not process data URIs inside CSS
  // background-image (it only re-hosts images found in <img> src attributes).
  // This causes a blank white area whenever the user replaces the image.
  // Fix: render the image as a proper <img> tag inside a position:relative wrapper
  // div, with the overlay absolutely positioned over it and centred via
  // display:table/table-cell. The <img> tag lets Zoho Campaigns process the src
  // (data URI or external URL) on all three device views (desktop, tablet, mobile),
  // and the wrapper keeps the play button centred over the image at every width.
  if (
    el.tag === 'td' &&
    el.styles.position === 'relative' &&
    el.children && el.children.length >= 2
  ) {
    const d9BgImg = el.children.find(c =>
      c.tag === 'img' &&
      c.styles.position === 'absolute' &&
      (c.styles.top === '0' || c.styles.top === '0px') &&
      (c.styles.left === '0' || c.styles.left === '0px') &&
      c.styles.width === '100%' &&
      c.styles.height === '100%'
    );
    const d9Overlay = el.children.find(c =>
      c !== d9BgImg &&
      c.styles.position === 'absolute' &&
      c.styles.top === '50%' &&
      c.styles.left === '50%' &&
      typeof c.styles.borderRadius === 'string' &&
      c.styles.borderRadius.includes('50%')
    );

    if (d9BgImg && d9Overlay) {
      // <img>: block, full-width, auto height so it scales on all viewport sizes.
      const d9ImgAttrs: Record<string, string> = { ...(d9BgImg.attrs || {}) };
      if (!d9ImgAttrs.border) d9ImgAttrs.border = '0';
      if (d9ImgAttrs.alt === undefined) d9ImgAttrs.alt = '';
      delete d9ImgAttrs.height;
      const d9ImgStyleStr = styleToString({ display: 'block', width: '100%', height: 'auto', maxWidth: '100%' });
      const d9ImgAttrStr = Object.entries(d9ImgAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
      const d9ImgHtml = `<img${d9ImgAttrStr} style="${d9ImgStyleStr}" />`;

      // Overlay circle: visual styles only, display:inline-block (no position/transform).
      const d9OverlaySafe = emailSafeStyles(d9Overlay.styles);
      const d9CircleStyles: Record<string, string> = { display: 'inline-block' };
      if (d9OverlaySafe.width) d9CircleStyles.width = d9OverlaySafe.width;
      if (d9OverlaySafe.height) d9CircleStyles.height = d9OverlaySafe.height;
      if (d9OverlaySafe.borderRadius) d9CircleStyles.borderRadius = d9OverlaySafe.borderRadius;
      if (d9OverlaySafe.backgroundColor) d9CircleStyles.backgroundColor = d9OverlaySafe.backgroundColor;
      else if (d9OverlaySafe.background) d9CircleStyles.background = d9OverlaySafe.background;
      if (d9OverlaySafe.textAlign) d9CircleStyles.textAlign = d9OverlaySafe.textAlign;
      if (d9OverlaySafe.lineHeight) d9CircleStyles.lineHeight = d9OverlaySafe.lineHeight;

      const d9OverlayInner = d9Overlay.children
        ? d9Overlay.children.map(c => exportElementToHtml(c, false)).join('')
        : (d9Overlay.content || '');
      const d9CircleStyleStr = styleToString(d9CircleStyles);
      // Overlay div covers the full image; table/table-cell centres the circle vertically.
      const d9OverlayHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:table;table-layout:fixed;text-align:center;"><div style="display:table-cell;vertical-align:middle;text-align:center;"><div style="${d9CircleStyleStr}">${d9OverlayInner}</div></div></div>`;

      // Outer <td>: keep all original HTML attrs; drop position and min-height from
      // styles (position:relative is moved inside the wrapper div).
      const d9TdAttrs: Record<string, string> = { ...(el.attrs || {}) };
      const d9TdStyles: Record<string, string> = {};
      for (const [k, v] of Object.entries(styles)) {
        if (k !== 'position' && k !== 'minHeight') d9TdStyles[k] = v;
      }
      const d9TdStyleStr = styleToString(d9TdStyles);
      const d9TdAttrStr = Object.entries(d9TdAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');

      return `<td${d9TdAttrStr}${d9TdStyleStr ? ` style="${d9TdStyleStr}"` : ''}><div style="position:relative;font-size:0;line-height:0;">${d9ImgHtml}${d9OverlayHtml}</div></td>`;
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── C10 Timeline: position:absolute vertical line inside a position:relative <td> ──
  // Detect: a <td> with position:relative containing a line div (position:absolute;
  // left:50%;width:2px — the vertical connecting line) plus a circular dot div
  // (border-radius:50%, NOT position:absolute). Zoho Campaigns strips
  // position:relative from <td> elements, so the absolutely-positioned line div
  // escapes the cell and uses a wider ancestor as its positioning parent. With
  // left:50% of that wide ancestor the line lands far to the RIGHT of the dots
  // instead of behind them. Fix: drop the line div from the output entirely and
  // replace it with a background-image linear-gradient on the <td> that draws a
  // 2px vertical stripe centred horizontally across the full cell height. The dot
  // div renders in normal flow directly on top of the stripe. calc(50% ± 1px)
  // keeps the stripe centred regardless of the cell width, and works in all
  // browser-based email clients (Zoho Campaigns desktop, tablet, and mobile views).
  if (
    el.tag === 'td' &&
    el.styles.position === 'relative' &&
    el.children && el.children.length >= 2
  ) {
    const c10LineDiv = el.children.find(c =>
      c.tag === 'div' &&
      c.styles.position === 'absolute' &&
      c.styles.left === '50%' &&
      c.styles.width === '2px'
    );
    const c10DotDiv = el.children.find(c =>
      c !== c10LineDiv &&
      c.tag === 'div' &&
      typeof c.styles.borderRadius === 'string' &&
      c.styles.borderRadius.includes('50%') &&
      c.styles.position !== 'absolute'
    );

    if (c10LineDiv && c10DotDiv) {
      const c10LineSafe = emailSafeStyles(c10LineDiv.styles);
      const lineColor = c10LineSafe.background || c10LineSafe.backgroundColor || '#e2e8f0';

      // <td> styles: remove position:relative; add centred 2px gradient stripe.
      const c10TdStyles: Record<string, string> = {};
      for (const [k, v] of Object.entries(styles)) {
        if (k !== 'position') c10TdStyles[k] = v;
      }
      c10TdStyles.backgroundImage = `linear-gradient(to right, transparent calc(50% - 1px), ${lineColor} calc(50% - 1px), ${lineColor} calc(50% + 1px), transparent calc(50% + 1px))`;
      c10TdStyles.backgroundRepeat = 'no-repeat';

      const c10DotHtml = exportElementToHtml(c10DotDiv, false);
      const c10TdAttrs: Record<string, string> = { ...(el.attrs || {}) };
      const c10TdStyleStr = styleToString(c10TdStyles);
      const c10TdAttrStr = Object.entries(c10TdAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
      return `<td${c10TdAttrStr} style="${c10TdStyleStr}">${c10DotHtml}</td>`;
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── Absolutely-positioned background image with centred overlay ─────────────
  // Detect: a <td> or <div> with position:relative containing two children —
  // (1) an <img> with position:absolute + top:0 + left:0 (fills the container
  // as a background image) and (2) a sibling element with position:absolute +
  // top:50% + left:50% (centred overlay, e.g. a play button circle). Email
  // clients (Gmail, Outlook, Zoho Mail) strip position:absolute and
  // transform:translate, causing both elements to fall into normal block flow
  // and stack vertically instead of overlaying. Email-safe fix: promote the
  // background image to CSS background-image on the container with an explicit
  // pixel height, and centre the overlay using HTML align/valign attributes.
  if (
    (el.tag === 'td' || el.tag === 'div') &&
    el.styles.position === 'relative' &&
    el.children && el.children.length >= 2
  ) {
    const bgImgChild = el.children.find(c =>
      c.tag === 'img' &&
      c.styles.position === 'absolute' &&
      (c.styles.top === '0' || c.styles.top === '0px') &&
      (c.styles.left === '0' || c.styles.left === '0px')
    );
    const overlayChild = el.children.find(c =>
      c.tag !== 'img' &&
      c.styles.position === 'absolute' &&
      c.styles.top === '50%' &&
      c.styles.left === '50%'
    );

    if (bgImgChild && overlayChild) {
      const imgSrc = bgImgChild.attrs?.src || '';
      const imgH = bgImgChild.attrs?.height || '';

      // Keep existing HTML attrs (width etc.) but force centre alignment so
      // the overlay renders in the middle of the background image.
      const containerAttrs: Record<string, string> = { ...(el.attrs || {}) };
      containerAttrs.align = 'center';
      containerAttrs.valign = 'middle';

      // Build container styles: swap position:relative + min-height for
      // background-image + explicit pixel height from the original image.
      const containerStyles: Record<string, string> = {};
      for (const [k, v] of Object.entries(styles)) {
        if (k !== 'position' && k !== 'minHeight') containerStyles[k] = v;
      }
      if (imgH) containerStyles.height = imgH.endsWith('px') ? imgH : `${imgH}px`;
      if (imgSrc) {
        containerStyles.backgroundImage = `url('${imgSrc}')`;
        containerStyles.backgroundSize = 'cover';
        containerStyles.backgroundPosition = 'center center';
        containerStyles.backgroundRepeat = 'no-repeat';
      }

      // Overlay circle: strip all positioning props; apply visual styles
      // (background colour, border-radius, size) to a <td> so email-safe
      // valign="middle" can centre the play icon inside the circle.
      const overlaySafe = emailSafeStyles(overlayChild.styles);
      const overlayCircleStyles: Record<string, string> = { textAlign: 'center' };
      if (overlaySafe.width) overlayCircleStyles.width = overlaySafe.width;
      if (overlaySafe.height) overlayCircleStyles.height = overlaySafe.height;
      if (overlaySafe.borderRadius) overlayCircleStyles.borderRadius = overlaySafe.borderRadius;
      if (overlaySafe.backgroundColor) overlayCircleStyles.backgroundColor = overlaySafe.backgroundColor;
      else if (overlaySafe.background) overlayCircleStyles.background = overlaySafe.background;

      // Render the overlay's children (the play icon character/span)
      const overlayInner = overlayChild.children
        ? overlayChild.children.map(c => exportElementToHtml(c, false)).join('')
        : (overlayChild.content || '');

      const overlayCircleStyleStr = styleToString(overlayCircleStyles);
      const overlayHtml = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto;"><tr><td align="center" valign="middle" style="${overlayCircleStyleStr}">${overlayInner}</td></tr></table>`;

      const containerStyleStr = styleToString(containerStyles);
      const containerAttrStr = Object.entries(containerAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
      return `<${el.tag}${containerAttrStr} style="${containerStyleStr}">${overlayHtml}</${el.tag}>`;
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── Inline icon <img> + text label inside an anchor link ────────────────────
  // Detect: a non-button <a> element whose children include an inline-icon
  // <img> (display:inline-block, created by the emoji→image replacement) plus
  // one or more text/span children. On canvas the icon and text sit side-by-side
  // via inline CSS. In email clients this breaks in two ways: (1) the global
  // stylesheet `img { display:block }` reset overrides inline styles on the icon,
  // and (2) Outlook's Word engine ignores CSS class selectors (img.img-icon) that
  // override the reset. Email-safe fix: a 2-cell table with vertical-align:middle
  // on both cells guarantees side-by-side layout in all email clients.
  // display:inline-table on the wrapper keeps the unit inline so align="right"
  // on the parent <td> still positions the whole icon+text block correctly.
  if (
    el.tag === 'a' &&
    el.type !== 'button' &&
    el.children && el.children.length >= 2
  ) {
    const iconImgChild = el.children.find(c =>
      c.tag === 'img' &&
      (c.styles.display === 'inline-block' || c.styles.display === 'inline')
    );
    const textChildren = el.children.filter(c => c !== iconImgChild);

    if (iconImgChild && textChildren.length > 0) {
      const href = el.attrs?.href || '#';
      const target = el.attrs?.target || '';
      const targetAttr = target ? ` target="${target}"` : '';

      // Build icon <img>: force display:block so no phantom whitespace appears
      // below the image inside its table cell. The cell's valign handles alignment.
      const iconSafeStyles = emailSafeStyles(iconImgChild.styles);
      const iconAttrs: Record<string, string> = { ...(iconImgChild.attrs || {}) };
      if (!iconAttrs.border) iconAttrs.border = '0';
      if (iconAttrs.alt === undefined) iconAttrs.alt = '';
      if (!iconAttrs.width && iconSafeStyles.width) iconAttrs.width = iconSafeStyles.width.replace('px', '');
      if (iconImgChild.attrs?.height) iconAttrs.height = iconImgChild.attrs.height;
      iconSafeStyles.display = 'block';
      delete iconSafeStyles.verticalAlign;
      delete iconSafeStyles.maxWidth;
      delete iconSafeStyles.objectFit;
      delete iconSafeStyles.objectPosition;
      // img-icon class is not needed: display:block is explicit, no CSS class required.
      if (iconAttrs.class) {
        iconAttrs.class = iconAttrs.class.replace(/\bimg-icon\b/, '').trim();
        if (!iconAttrs.class) delete iconAttrs.class;
      }

      const iconStyleStr = styleToString(iconSafeStyles);
      const iconAttrStr = Object.entries(iconAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
      const iconImgHtml = `<img${iconAttrStr}${iconStyleStr ? ` style="${iconStyleStr}"` : ''} />`;
      const iconCellHtml = `<a href="${href}"${targetAttr} style="display:block;text-decoration:none;">${iconImgHtml}</a>`;

      // Gap between icon and text: read from img's marginRight if explicitly set,
      // otherwise fall back to 6px.
      const iconGap = iconImgChild.styles.marginRight || '6px';

      // Build text <a>: carry the link's typography styles. white-space:nowrap
      // prevents the label from wrapping to a new line on narrow screens,
      // ensuring icon and text always remain on the same row.
      const linkSafeStyles = emailSafeStyles(el.styles);
      const textAStyleMap: Record<string, string> = {
        textDecoration: linkSafeStyles.textDecoration || 'none',
        whiteSpace: 'nowrap',
      };
      if (linkSafeStyles.color) textAStyleMap.color = linkSafeStyles.color;
      if (linkSafeStyles.fontSize) textAStyleMap.fontSize = linkSafeStyles.fontSize;
      if (linkSafeStyles.fontWeight) textAStyleMap.fontWeight = linkSafeStyles.fontWeight;
      if (linkSafeStyles.fontFamily) textAStyleMap.fontFamily = linkSafeStyles.fontFamily;

      const textInner = textChildren.map(c => exportElementToHtml(c, false)).join('');
      const textAStyleStr = styleToString(textAStyleMap);
      const textCellHtml = `<a href="${href}"${targetAttr} style="${textAStyleStr}">${textInner}</a>`;

      return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="display:inline-table;"><tr><td style="vertical-align:middle;padding-right:${iconGap};">${iconCellHtml}</td><td style="vertical-align:middle;">${textCellHtml}</td></tr></table>`;
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── Timeline row: position:absolute vertical line → email-safe border-left ─────
  // Detect: a <tr> with exactly two <td> children where the first <td> is a
  // timeline dot+line column — it contains a small circle <div> (border-radius:50%)
  // and optionally an absolutely-positioned thin <div> (the vertical connecting
  // line, width:2px, bottom:0). Email clients strip position:absolute, making the
  // line div collapse to nothing so only the blue dots remain visible. Email-safe
  // fix: split the dot+line <td> into two cells — a narrow <td> with border-left
  // (continuous vertical line) and a <td> containing just the circle dot — then
  // keep the original content <td> as the third column.
  if (el.tag === 'tr' && el.children && el.children.length === 2) {
    const dotColTd = el.children[0];
    const contentColTd = el.children[1];

    if (dotColTd.tag === 'td' && contentColTd.tag === 'td') {
      const dotDivEl = dotColTd.children?.find(c =>
        c.tag === 'div' &&
        c.styles.borderRadius === '50%' &&
        (c.styles.backgroundColor || c.styles.background)
      );
      // Exclude tds that contain an <img> — those are image+overlay patterns
      // handled by a separate detection block (e.g. D9 play button circle).
      const hasBgImg = dotColTd.children?.some(c => c.tag === 'img');
      const dotSizePx = parseInt(dotDivEl?.styles.width || '0');

      if (dotDivEl && !hasBgImg && dotSizePx > 0 && dotSizePx <= 20) {
        // Line div: position:absolute, width:2px, bottom:0 (extends to row bottom)
        const lineDivEl = dotColTd.children?.find(c =>
          c.tag === 'div' &&
          c.styles.position === 'absolute' &&
          c.styles.width === '2px' &&
          c.styles.bottom === '0'
        );

        // Dot visual properties
        const dotSafe = emailSafeStyles(dotDivEl.styles);
        const dotColor = dotSafe.backgroundColor || '#004BE2';
        const dotW = dotDivEl.styles.width || '12px';
        const dotH = dotDivEl.styles.height || dotW;
        // Top padding for the dot cell — derived from the original margin-top
        const dotTopPad = (dotDivEl.styles.marginTop && dotDivEl.styles.marginTop !== '0')
          ? dotDivEl.styles.marginTop : '2px';

        // Line color from the line div; null means this is the last row (no line)
        const lineColor = lineDivEl
          ? (emailSafeStyles(lineDivEl.styles).backgroundColor || '#e2e8f0')
          : null;

        // Row bottom spacing (read from whichever td has it set)
        const rowPb = dotColTd.styles.paddingBottom || contentColTd.styles.paddingBottom || '';
        const pbStyle = rowPb ? `;padding-bottom:${rowPb}` : '';

        // Content indent from original content td
        const contentPl = contentColTd.styles.paddingLeft || '12px';

        // Render the content td children through the normal export pipeline
        const contentCentered =
          contentColTd.attrs?.align === 'center' ||
          contentColTd.styles?.textAlign === 'center';
        const contentInner = contentColTd.children
          ? contentColTd.children.map(c => exportElementToHtml(c, contentCentered || parentCentered)).join('')
          : (contentColTd.content || '');

        // Distribute original dot column width across line column + dot column
        const origDotColPx = parseInt(dotColTd.attrs?.width || '30') || 30;
        const lineColPx = Math.max(origDotColPx - dotSizePx, 4);

        // Line <td>: border-left draws the continuous vertical line for non-last rows
        const lineStyle = `width:${lineColPx}px${lineColor ? `;border-left:2px solid ${lineColor}` : ''};vertical-align:top${pbStyle}`;
        // Dot <td>: contains the filled circle
        const dotStyle = `width:${dotSizePx}px;vertical-align:top;padding-top:${dotTopPad}${pbStyle}`;
        const dotCircle = `<div style="width:${dotW};height:${dotH};background-color:${dotColor};border-radius:50%;"></div>`;
        // Content <td>: pass through original HTML attributes (align, valign, etc.)
        const contentTdAttrStr = Object.entries(contentColTd.attrs || {}).map(([k, v]) => ` ${k}="${v}"`).join('');
        const contentStyle = `vertical-align:top;padding-left:${contentPl}${pbStyle}`;

        const trAttrStr = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
        return `<tr${trAttrStr}><td width="${lineColPx}" style="${lineStyle}"></td><td width="${dotSizePx}" style="${dotStyle}">${dotCircle}</td><td${contentTdAttrStr} style="${contentStyle}">${contentInner}</td></tr>`;
      }
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── Pixel-width icon-bullet TD with single image → prevent mobile stretch ───
  // Detect a <td> with a fixed pixel width (no %) that contains exactly one
  // <img> child. This is the bullet-icon pattern used in C1–C5 feature lists:
  // a narrow td (e.g. width="56") holds a small icon beside feature text.
  // When the user uploads a custom icon image the exported <img> gets
  // display:block (not inline-block), so the isInlineIcon path above is
  // skipped and class="img-icon" is never added. The mobile CSS rule
  // img[width]:not(.img-icon) { width:100% !important } then stretches the
  // icon to full screen width. Fix: add class="img-icon" and enforce explicit
  // pixel dimensions so the image is capped at its designed size on all
  // viewport sizes without touching the desktop layout.
  if (
    el.tag === 'td' &&
    el.attrs?.width &&
    !el.attrs.width.endsWith('%') &&
    parseInt(el.attrs.width) > 0 &&
    parseInt(el.attrs.width) <= 80 &&
    el.children?.length === 1 &&
    el.children[0].tag === 'img'
  ) {
    const iconEl = el.children[0];
    const iconSafe = emailSafeStyles(iconEl.styles);
    const iconAttrs: Record<string, string> = { ...(iconEl.attrs || {}) };
    if (!iconAttrs.border) iconAttrs.border = '0';
    if (iconAttrs.alt === undefined) iconAttrs.alt = '';

    // Determine display size from the img's own declared attrs; fall back to td width
    const tdPx = parseInt(el.attrs.width);
    const declaredW = iconAttrs.width ? parseInt(iconAttrs.width) : 0;
    const declaredH = iconAttrs.height ? parseInt(iconAttrs.height) : 0;
    const iconW = declaredW > 0 ? declaredW : tdPx;
    const iconH = declaredH > 0 ? declaredH : iconW;

    iconAttrs.width = String(iconW);
    iconAttrs.height = String(iconH);

    // Add img-icon class — excluded from the mobile img[width] { width:100% } rule
    if (!iconAttrs.class) iconAttrs.class = 'img-icon';
    else if (!iconAttrs.class.includes('img-icon')) iconAttrs.class = `img-icon ${iconAttrs.class}`.trim();

    // Inline style: enforce exact pixel dimensions and cap via max-width
    iconSafe.display = 'block';
    iconSafe.width = `${iconW}px`;
    iconSafe.height = `${iconH}px`;
    iconSafe.maxWidth = `${iconW}px`;
    delete iconSafe.objectFit;
    delete iconSafe.objectPosition;

    const iconStyleStr = styleToString(iconSafe);
    const iconAttrStr = Object.entries(iconAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
    const iconImgHtml = `<img${iconAttrStr}${iconStyleStr ? ` style="${iconStyleStr}"` : ''} />`;

    const tdStyleStr = styleToString(styles);
    const tdAttrStr = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
    return `<td${tdAttrStr}${tdStyleStr ? ` style="${tdStyleStr}"` : ''}>${iconImgHtml}</td>`;
  }

  // Add role="presentation" to layout tables for accessibility and email client compatibility
  if (el.tag === 'table' && !attrs.role) {
    attrs.role = 'presentation';
  }
  // ── C9 Icon Grid TD: explicit left-align for correct mobile/tablet stacking ──
  // Detect: a <td width="50%"> whose first child is a rounded colour box div
  // (non-50% border-radius, bg-color, explicit pixel dimensions) with only
  // emoji/text content (no <img> child). On mobile/tablet Zoho Campaigns can
  // inherit text-align:center from the outer <center> tag or its own responsive
  // rules when stacking these columns, centering the icon box and text instead
  // of keeping them flush-left. Adding align="left" + text-align:left to the
  // TD ensures left alignment is preserved in all email clients on all viewports.
  if (
    el.tag === 'td' &&
    el.attrs?.width === '50%' &&
    !attrs.align &&
    el.children && el.children.length >= 2
  ) {
    const c9Fc = el.children[0];
    if (
      c9Fc.tag === 'div' &&
      c9Fc.styles.borderRadius && c9Fc.styles.borderRadius !== '50%' &&
      (c9Fc.styles.backgroundColor || c9Fc.styles.background) &&
      (c9Fc.styles.width || c9Fc.styles.height) &&
      !(c9Fc.children?.some(c => c.tag === 'img'))
    ) {
      attrs.align = 'left';
      if (!styles.textAlign) styles.textAlign = 'left';
      // Right-column TDs carry padding-left from the desktop column gap (e.g. 10px).
      // When these TDs stack on mobile they indent by that amount relative to
      // left-column TDs whose padding-left is 0. Zero it out so all four items
      // share identical left alignment when stacked.
      if (styles.paddingLeft && styles.paddingLeft !== '0' && styles.paddingLeft !== '0px') {
        styles.paddingLeft = '0';
      }
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── C11 45%/55% TDs: left-align for correct mobile/tablet stacking ─────────
  // C11 alternating-feature rows use <td width="45%"> for images and
  // <td width="55%"> for text. When stacked on mobile they can inherit
  // text-align:center from the outer <center> tag. align="left" +
  // text-align:left keeps all content flush-left. A4 and B5 also use
  // 45%/55% widths but their image TDs have position:relative (absolute-
  // positioned background images) — those are excluded by the !el.styles.position
  // guard. The 55% text TD in C11 row 1 carries padding-left from the desktop
  // column gap; zero it only when the first child is <h3> (C11-specific
  // structure) so B5's <h1>-first text TD keeps its original padding.
  if (
    el.tag === 'td' &&
    (el.attrs?.width === '45%' || el.attrs?.width === '55%') &&
    !el.styles.position
  ) {
    if (!attrs.align) {
      attrs.align = 'left';
      if (!styles.textAlign) styles.textAlign = 'left';
    }
    if (
      el.attrs?.width === '55%' &&
      el.children && el.children[0]?.tag === 'h3' &&
      styles.paddingLeft && styles.paddingLeft !== '0' && styles.paddingLeft !== '0px'
    ) {
      styles.paddingLeft = '0';
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── H2 image TD (42%, align="right"): force left-align for mobile stacking ──
  // H2's two-column CTA places the image in a dir="rtl" table's right column
  // with align="right". When stacked on mobile the image appears right-aligned.
  // Override to align="left". The !el.styles.position guard excludes G4's
  // 42% TD which uses position:relative for an absolutely-positioned bg image.
  if (
    el.tag === 'td' &&
    el.attrs?.width === '42%' &&
    attrs.align === 'right' &&
    !el.styles.position
  ) {
    attrs.align = 'left';
    styles.textAlign = 'left';
  }
  // ── H2 text TD (58%, dir="ltr"): left-align for mobile stacking ────────────
  // H2's 58% text/button column carries dir="ltr" to cancel the parent
  // table's dir="rtl". Without an explicit align, content can inherit
  // centring when stacked. align="left" keeps heading, body, and button
  // flush-left on mobile and tablet. G4 and J7 also have 58% TDs but
  // neither carries dir="ltr", so they are not affected.
  if (
    el.tag === 'td' &&
    el.attrs?.width === '58%' &&
    el.attrs?.dir === 'ltr' &&
    !attrs.align
  ) {
    attrs.align = 'left';
    if (!styles.textAlign) styles.textAlign = 'left';
  }
  // ───────────────────────────────────────────────────────────────────────────

  // Button-alignment propagation: when a <td> contains a button-wrapper
  // <table> whose inner <a> button has text-align in its inline style, copy
  // that alignment to the outer <td> as an `align` HTML attribute. Email
  // clients only center/align inline content (a wrapper <table> reads as
  // inline-block when seen by the parent td), so without this the button
  // text-align chosen via the Typography panel has no visible effect on
  // export — the button always renders flush-left. We only apply this when
  // the user hasn't already set `align` on the td themselves, so deliberate
  // section-level alignment isn't overridden. Limited to td elements to
  // avoid touching other structural containers.
  if (el.tag === 'td' && !attrs.align) {
    const buttonAlign = findButtonTextAlign(el);
    if (buttonAlign) {
      attrs.align = buttonAlign;
    }
  }
  // Determine if THIS element establishes a centered context for its descendants.
  // Any of: align="center" attribute, text-align:center in raw or processed styles.
  const selfCentersChildren = (
    attrs.align === 'center' ||
    el.styles?.textAlign === 'center' ||
    (el.styles as any)?.['text-align'] === 'center' ||
    styles.textAlign === 'center'
  );
  const childrenCentered = parentCentered || selfCentersChildren;

  // Text element with a user-assigned hyperlink. Since non-anchor block tags
  // (p, h1-h6, span, etc.) don't support href natively, move the link into
  // an inner <a> and strip href/target from the outer element.
  if (TEXT_TAGS.has(el.tag) && attrs.href) {
    const linkHref = attrs.href;
    const linkTarget = attrs.target || '_blank';
    delete attrs.href;
    delete attrs.target;
    // Carry the element's text styles onto the <a> so browser default link
    // styling (blue color, underline) is overridden by the user's choices.
    const linkStyles: Record<string, string> = { textDecoration: 'none' };
    if (styles.color) linkStyles.color = styles.color;
    if (styles.fontSize) linkStyles.fontSize = styles.fontSize;
    if (styles.fontFamily) linkStyles.fontFamily = styles.fontFamily;
    if (styles.fontWeight) linkStyles.fontWeight = styles.fontWeight;
    if (styles.textDecoration) linkStyles.textDecoration = styles.textDecoration;
    const linkStyleStr = styleToString(linkStyles);
    const outerStyleStr = styleToString(styles);
    const outerAttrPart = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
    const outerStylePart = outerStyleStr ? ` style="${outerStyleStr}"` : '';
    const innerContent = el.children
      ? el.children.map(c => exportElementToHtml(c, childrenCentered)).join('')
      : (el.content || '');
    return `<${el.tag}${outerAttrPart}${outerStylePart}><a href="${linkHref}" target="${linkTarget}" rel="noopener noreferrer"${linkStyleStr ? ` style="${linkStyleStr}"` : ''}>${innerContent}</a></${el.tag}>`;
  }

  // ── Diamond bullet icon (C1–C5): tag for mobile font-size reduction ──────────
  // The ◆ icon is a text character at font-size:42px. There is no inline way to
  // conditionally resize text for mobile without a media query. Adding the
  // "diamond-bullet" class lets the stylesheet halve the size on mobile/tablet
  // without affecting the desktop rendering.
  if (el.tag === 'div' && el.styles.fontSize === '42px') {
    if (attrs.class) attrs.class += ' diamond-bullet';
    else attrs.class = 'diamond-bullet';
  }

  const styleStr = styleToString(styles);
  const stylePart = styleStr ? ` style="${styleStr}"` : '';
  const attrPart = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('');

  if (VOID_TAGS.has(el.tag)) {
    return `<${el.tag}${attrPart}${stylePart} />`;
  }

  const inner = el.children
    ? el.children.map(c => exportElementToHtml(c, childrenCentered)).join('')
    : (el.content || '');

  return `<${el.tag}${attrPart}${stylePart}>${inner}</${el.tag}>`;
}

export function exportElementsToHtml(elements: SectionElement[]): string {
  return elements.map(exportElementToHtml).join('');
}

// ─── Tree operations ──────────────────────────────────────────

/** Find element by ID in tree */
export function findElement(elements: SectionElement[], id: string): SectionElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findElement(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Find an element by ID and also return its chain of ancestors
 *  (deepest-first — the immediate parent comes first, the section root
 *  comes last). Used by getElementInfo to feed CSS-inheritance resolution
 *  in elementToInfo so the right panel shows the typography actually
 *  rendering on a leaf wrapper span (whose own styles are empty). */
export function findElementWithAncestors(
  elements: SectionElement[],
  id: string,
  ancestors: SectionElement[] = []
): { el: SectionElement; ancestors: SectionElement[] } | null {
  for (const el of elements) {
    if (el.id === id) return { el, ancestors };
    if (el.children) {
      const found = findElementWithAncestors(el.children, id, [el, ...ancestors]);
      if (found) return found;
    }
  }
  return null;
}

/** Update element styles/attrs/content by ID; returns new tree */
export function updateElementInTree(
  elements: SectionElement[],
  id: string,
  changes: Partial<Record<string, string>>
): SectionElement[] {
  return elements.map(el => {
    if (el.id === id) {
      const next = { ...el };
      // Route each change key to the right field
      const styleChanges: Record<string, string> = {};
      const attrChanges: Record<string, string> = {};
      let contentChange: string | undefined;

      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined) continue;
        switch (key) {
          // Attributes
          case 'src': case 'alt': case 'href': case 'target':
          case 'width': case 'height':
            attrChanges[key] = value;
            // Also mirror width/height into styles for CSS dimension
            if (key === 'width' || key === 'height') styleChanges[key] = value + (value.match(/^\d+$/) ? 'px' : '');
            break;
          // Text content (plain) or HTML content (rich-text inline editing)
          case 'text':
          case 'html':
            contentChange = value;
            break;
          // Everything else is a style property (camelCase)
          default:
            styleChanges[key] = value;
        }
      }

      if (Object.keys(styleChanges).length) {
        next.styles = { ...el.styles, ...styleChanges };
      }
      if (Object.keys(attrChanges).length) {
        next.attrs = { ...el.attrs, ...attrChanges };
      }
      if (contentChange !== undefined) {
        next.content = contentChange;
      }
      return next;
    }
    if (el.children) {
      const newChildren = updateElementInTree(el.children, id, changes);
      if (newChildren !== el.children) return { ...el, children: newChildren };
    }
    return el;
  });
}

/** Replace element entirely by ID; returns new tree */
export function replaceElementInTree(
  elements: SectionElement[],
  id: string,
  newElement: SectionElement
): SectionElement[] {
  return elements.map(el => {
    if (el.id === id) return newElement;
    if (el.children) {
      const newChildren = replaceElementInTree(el.children, id, newElement);
      if (newChildren !== el.children) return { ...el, children: newChildren };
    }
    return el;
  });
}

/** Delete element by ID; returns new tree.
 *
 *  Historical bug: the previous implementation only replaced children when
 *  `newChildren.length !== el.children.length`. That check misses the case
 *  where the deleted element lives deeper than one level — e.g. deleting E
 *  inside B → D → [E, F] updated D's children correctly, but B's children
 *  array (containing D) had unchanged length, so B was returned with its
 *  OLD children reference and the deletion was silently discarded. We now
 *  detect change by comparing any child reference, which propagates nested
 *  deletions all the way up to the root. */
export function deleteElementInTree(elements: SectionElement[], id: string): SectionElement[] {
  const filtered = elements.filter(el => el.id !== id);
  let changed = filtered.length !== elements.length;
  const mapped = filtered.map(el => {
    if (el.children) {
      const newChildren = deleteElementInTree(el.children, id);
      if (newChildren !== el.children && newChildren.length !== el.children.length) {
        changed = true;
        return { ...el, children: newChildren };
      }
      // Even when the immediate children length is unchanged, a deletion may
      // have happened deeper — detect that by reference-comparing entries.
      const deepChanged = newChildren.some((c, i) => c !== el.children![i]);
      if (deepChanged) {
        changed = true;
        return { ...el, children: newChildren };
      }
    }
    return el;
  });
  return changed ? mapped : elements;
}

function deepCloneElement(el: SectionElement): SectionElement {
  return {
    ...el,
    id: newElId(),
    children: el.children?.map(deepCloneElement),
  };
}

/** Default horizontal/vertical gap (in px) used ONLY as a last-resort fallback
 *  when the original element has no margin in the relevant direction, has no
 *  siblings to copy a rhythm from, and the parent doesn't define a flex/grid
 *  gap. 16px matches the typical email newsletter rhythm and the marginBottom
 *  of most paragraph templates. */
const DEFAULT_DUPLICATE_GAP_PX = 16;

/** Parse a CSS pixel-ish value to a number. Returns 0 for missing/unparseable. */
function parsePx(v: string | undefined): number {
  if (!v) return 0;
  const m = v.match(/^(-?[\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

/** Read the existing px gap from an element's margin in the given direction.
 *  Returns 0 if no margin set or value can't be parsed.
 *  Newsletter HTML overwhelmingly uses marginBottom (vertical) and marginRight
 *  (horizontal) for spacing — check those first, then fall back to the opposing
 *  side so sections that use marginTop/marginLeft still work. */
function readGapPx(el: SectionElement, dir: 'above' | 'below' | 'left' | 'right'): number {
  const isVertical = dir === 'above' || dir === 'below';
  // Primary: marginBottom / marginRight (the outward-facing gap in newsletter templates)
  // Fallback: marginTop / marginLeft for templates that use the opposing side
  const primary = parsePx(el.styles[isVertical ? 'marginBottom' : 'marginRight']);
  if (primary > 0) return primary;
  return parsePx(el.styles[isVertical ? 'marginTop' : 'marginLeft']);
}

/** Detect whether the parent element provides its own gap between children
 *  (flex/grid `gap`, `rowGap`, `columnGap`). When the parent already defines
 *  spacing, we must NOT add an extra margin to the clone — the parent gap
 *  will handle it, and adding a margin would push the clone visibly further
 *  from the original than other siblings. Returns the parent's relevant gap
 *  in px, or 0 if none defined. */
function readParentGapPx(parent: SectionElement | null, dir: 'above' | 'below' | 'left' | 'right'): number {
  if (!parent) return 0;
  const isVertical = dir === 'above' || dir === 'below';
  const s = parent.styles;
  // Specific axis gaps win over the shorthand `gap`.
  const axisGap = parsePx(s[isVertical ? 'rowGap' : 'columnGap']);
  if (axisGap > 0) return axisGap;
  return parsePx(s.gap);
}

/** Resolve the gap to apply to the duplicate. Order of preference:
 *   1. The original element's own margin in the duplication direction —
 *      preserves the user's existing spacing intent exactly.
 *   2. A sibling's margin in that same direction — matches the surrounding
 *      rhythm (e.g. when duplicating the LAST item which has no marginBottom
 *      while the others all have marginBottom:8px).
 *   3. DEFAULT_DUPLICATE_GAP_PX as a final fallback so the duplicate never
 *      sits flush against the original. */
function resolveGapPx(parentChildren: SectionElement[], target: SectionElement, dir: 'above' | 'below' | 'left' | 'right'): number {
  const own = readGapPx(target, dir);
  if (own > 0) return own;
  for (const sib of parentChildren) {
    if (sib.id === target.id) continue;
    const sibGap = readGapPx(sib, dir);
    if (sibGap > 0) return sibGap;
  }
  return DEFAULT_DUPLICATE_GAP_PX;
}

/** The CSS margin property that should carry the inter-element gap, given the
 *  direction we're duplicating in. The gap sits on whichever element comes
 *  SECOND in the layout flow, so it lives between the pair rather than
 *  pushing the surrounding context around. */
function gapMarginKey(direction: 'above' | 'below' | 'left' | 'right'): 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' {
  return (
    direction === 'above' ? 'marginBottom'   // gap below the new element above the original
    : direction === 'below' ? 'marginTop'    // gap above the new element below the original
    : direction === 'left' ? 'marginRight'   // gap to the right of the new element on the left
    : 'marginLeft'                           // gap to the left of the new element on the right
  );
}

/** Apply the inter-element gap to the clone's styles WITHOUT clobbering any
 *  spacing the deep-clone already inherited from the original. The clone
 *  carries every margin/padding the original had (deepCloneElement preserves
 *  them); we only need to ensure it has a margin on the side that faces the
 *  original so the two don't sit flush. If the clone already has a margin
 *  on that side (because the original did), keep it as-is — that's the
 *  user's existing spacing intent. */
function applyGapToCloneStyles(
  cloneStyles: Record<string, string>,
  direction: 'above' | 'below' | 'left' | 'right',
  gapPx: number,
  parentGapPx: number,
): Record<string, string> {
  // Parent already defines a flex/grid gap — adding margin on the clone would
  // create extra spacing only between this pair (not its other siblings), so
  // skip injection entirely.
  if (parentGapPx > 0) return cloneStyles;
  const key = gapMarginKey(direction);
  const existing = parsePx(cloneStyles[key]);
  if (existing > 0) return cloneStyles; // user's spacing already provides a gap
  return { ...cloneStyles, [key]: `${gapPx}px` };
}

/** Insert a deep clone of the target element as a sibling in the chosen
 *  direction. Used by the directional Duplicate button.
 *
 *  Spacing: the clone inherits ALL the original's styles (margin/padding/etc.)
 *  via deepCloneElement. We additionally guarantee a visible gap between the
 *  pair by applying a margin on the side facing the original — but only when
 *  the clone doesn't already have one in that direction and the parent
 *  doesn't supply a flex/grid gap.
 *
 *  Horizontal layout: for left/right we force display:inline-block on both
 *  the target and the clone so they sit side-by-side instead of stacking.
 *  We also strip the width="100%" HTML attribute from those two when present
 *  — once the elements are inline-block with an explicit calc(50% - gap)
 *  width, the attribute is redundant and (in some browsers) it leaks into
 *  the layout of adjacent block-level siblings, making them appear narrower
 *  even though they were never selected. */
export function duplicateInDirection(
  elements: SectionElement[],
  id: string,
  direction: 'above' | 'below' | 'left' | 'right',
  parent: SectionElement | null = null,
): SectionElement[] {
  // Find the index of the target among `elements` (this depth's siblings).
  // If found here, do the insertion; otherwise recurse into children.
  const idx = elements.findIndex(e => e.id === id);
  if (idx >= 0) {
    const target = elements[idx];
    const gap = resolveGapPx(elements, target, direction);
    const parentGap = readParentGapPx(parent, direction);
    const clone = deepCloneElement(target);
    // Preserve every spacing property the original had (deep clone already
    // copied them). Only ensure the clone has a margin on the side facing
    // the original so the two don't sit flush — see applyGapToCloneStyles.
    clone.styles = applyGapToCloneStyles(clone.styles, direction, gap, parentGap);

    // For horizontal directions force inline-block so the two elements
    // render side-by-side. Block-level elements (the default for most
    // template structures) would otherwise stack vertically regardless
    // of which "direction" the user picked.
    if (direction === 'left' || direction === 'right') {
      // The target carries every styling/attribute it always had. We need
      // to add display:inline-block + an explicit width so the pair sits
      // side-by-side. When the element has width="100%" as an HTML
      // attribute, that attribute can affect the layout of OTHER block-level
      // siblings (rows that were never selected) by participating in the
      // browser's mixed block/inline-block width resolution. Removing the
      // attribute on just the inline-block pair eliminates that influence
      // entirely — we replace it with the explicit calc width below, so
      // the visible size of the pair is unchanged.
      const hasFullWidthAttr = target.attrs?.width === '100%';
      const halfGap = Math.round(gap / 2);
      const widthOverride: Record<string, string> = hasFullWidthAttr ? { width: `calc(50% - ${halfGap}px)` } : {};

      // Build new attrs objects (don't share refs with the original — other
      // elements in the tree may share `attrs` with this target via earlier
      // deepCloneElement calls, and we mustn't mutate them).
      const cleanAttrs = (a: Record<string, string> | undefined): Record<string, string> | undefined => {
        if (!a) return a;
        if (a.width !== '100%') return { ...a }; // keep all attrs, just unshare
        const { width: _w, ...rest } = a;
        return rest;
      };

      const updatedTarget: SectionElement = {
        ...target,
        attrs: cleanAttrs(target.attrs),
        styles: { ...target.styles, display: 'inline-block', verticalAlign: 'top', ...widthOverride },
      };
      clone.attrs = cleanAttrs(clone.attrs);
      clone.styles = { ...clone.styles, display: 'inline-block', verticalAlign: 'top', ...widthOverride };
      const result = [...elements];
      result[idx] = updatedTarget;
      const insertAt = direction === 'left' ? idx : idx + 1;
      result.splice(insertAt, 0, clone);
      return result;
    }
    // Vertical directions: simple sibling insert.
    const result = [...elements];
    const insertAt = direction === 'above' ? idx : idx + 1;
    result.splice(insertAt, 0, clone);
    return result;
  }
  // Recurse into children of this depth with <tr>-aware logic.
  // When the target is a DIRECT child of a <tr>, inserting it as a sibling
  // <td> always produces a horizontal result (extra column in the same row)
  // regardless of direction. For "above"/"below" we instead wrap the clone
  // in a new <tr> and insert that row before/after the current row. For
  // "left"/"right" inside a <tr>, TDs are already horizontal so we just
  // insert the clone as a sibling TD — no inline-block forcing needed.
  let changed = false;
  const next: SectionElement[] = [];
  for (const el of elements) {
    if (el.tag === 'tr' && el.children) {
      const childIdx = el.children.findIndex(c => c.id === id);
      if (childIdx >= 0) {
        const targetTd = el.children[childIdx];
        const clone = deepCloneElement(targetTd);
        if (direction === 'above' || direction === 'below') {
          // Wrap clone in a new <tr> and insert the row above/below.
          // margin on <td> is ignored by CSS table layout — use padding instead.
          // Preserve the clone's existing padding and only top it up to the
          // default if it falls short, so an item with generous padding keeps it.
          const padKey = direction === 'above' ? 'paddingBottom' : 'paddingTop';
          const existingPad = parsePx(clone.styles[padKey]);
          if (existingPad < DEFAULT_DUPLICATE_GAP_PX) {
            clone.styles = { ...clone.styles, [padKey]: `${DEFAULT_DUPLICATE_GAP_PX}px` };
          }
          const newTr: SectionElement = {
            id: newElId(),
            type: el.type,
            tag: 'tr',
            styles: {},
            children: [clone],
          };
          if (direction === 'above') {
            next.push(newTr, el);
          } else {
            next.push(el, newTr);
          }
        } else {
          // left/right: insert clone as a new column in the same row.
          // margin on <td> is ignored by CSS table layout — use padding instead.
          const padKey = direction === 'left' ? 'paddingRight' : 'paddingLeft';
          const existingPad = parsePx(clone.styles[padKey]);
          if (existingPad < DEFAULT_DUPLICATE_GAP_PX) {
            clone.styles = { ...clone.styles, [padKey]: `${DEFAULT_DUPLICATE_GAP_PX}px` };
          }
          const newChildren = [...el.children];
          newChildren.splice(direction === 'left' ? childIdx : childIdx + 1, 0, clone);
          next.push({ ...el, children: newChildren });
        }
        changed = true;
        continue;
      }
    }
    // Normal deep recursion for all other elements. Pass `el` as the parent
    // so the recursive call can detect a flex/grid gap on the actual parent.
    if (!el.children) {
      next.push(el);
      continue;
    }
    const updatedChildren = duplicateInDirection(el.children, id, direction, el);
    if (updatedChildren === el.children) {
      next.push(el);
    } else {
      next.push({ ...el, children: updatedChildren });
      changed = true;
    }
  }
  return changed ? next : elements;
}

/** Insert clone of element after itself; returns new tree */
export function duplicateElementInTree(elements: SectionElement[], id: string): SectionElement[] {
  const result: SectionElement[] = [];
  let found = false;
  for (const el of elements) {
    if (el.id === id) {
      result.push(el);
      result.push(deepCloneElement(el));
      found = true;
    } else if (!found && el.children) {
      const newChildren = duplicateElementInTree(el.children, id);
      result.push(newChildren !== el.children ? { ...el, children: newChildren } : el);
    } else {
      result.push(el);
    }
  }
  return result;
}

// ─── ElementInfo derivation ───────────────────────────────────

/** Resolve a style value by checking the element first, then walking up the
 *  ancestor chain (deepest-first). Returns the first non-empty value found.
 *  Used only for CSS-inherited typography properties (font-family, font-size,
 *  color, etc.) — non-inherited properties (padding, margin, background,
 *  etc.) read directly from the element to match CSS semantics.
 *
 *  Why this matters: when the user clicks a leaf text-wrapper span (the
 *  parser creates these with empty styles to wrap raw text-node content
 *  under <p>/<h1>/<a>), the panel needs to show the typography that's
 *  ACTUALLY rendering — and that comes from the parent up the chain. */
function resolveInherited(key: string, el: SectionElement, ancestors: SectionElement[]): string {
  if (el.styles[key]) return el.styles[key];
  for (const a of ancestors) {
    if (a.styles[key]) return a.styles[key];
  }
  return '';
}

/** Convert a SectionElement to the ElementInfo shape expected by PropertiesPanel.
 *  `ancestors` is the chain of parent elements from immediate parent up to the
 *  section root (deepest-first). When omitted, behavior matches the old
 *  no-inheritance model — kept for backward compat with any caller that still
 *  passes a single arg. */
export function elementToInfo(el: SectionElement, ancestors: SectionElement[] = []): ElementInfo {
  const s = el.styles;
  const a = el.attrs || {};
  const hasChildren = !!(el.children?.length);
  const isTextContainer = el.type === 'container' && !hasChildren && !!(el.content?.trim());
  const inh = (k: string) => resolveInherited(k, el, ancestors);

  return {
    tagName: el.tag.toUpperCase(),
    type: el.type as ElementInfo['type'],
    text: el.content || '',
    // Typography — inherits from ancestors per CSS semantics.
    fontFamily: inh('fontFamily'),
    fontSize: inh('fontSize'),
    fontWeight: inh('fontWeight'),
    fontStyle: inh('fontStyle'),
    textDecoration: inh('textDecoration'),
    color: inh('color'),
    textAlign: inh('textAlign'),
    lineHeight: inh('lineHeight'),
    letterSpacing: inh('letterSpacing'),
    textTransform: inh('textTransform'),
    // Box model + appearance — does NOT inherit, read only from the element.
    marginTop: s.marginTop || '',
    marginBottom: s.marginBottom || '',
    marginLeft: s.marginLeft || '',
    marginRight: s.marginRight || '',
    paddingTop: s.paddingTop || '',
    paddingRight: s.paddingRight || '',
    paddingBottom: s.paddingBottom || '',
    paddingLeft: s.paddingLeft || '',
    display: s.display || '',
    opacity: s.opacity || '',
    backgroundColor: s.backgroundColor || '',
    background: s.background || '',
    backgroundImage: s.backgroundImage || '',
    backgroundSize: s.backgroundSize || '',
    borderRadius: s.borderRadius || '',
    borderWidth: s.borderWidth || '',
    borderColor: s.borderColor || '',
    borderStyle: s.borderStyle || '',
    borderImageSource: s.borderImageSource || '',
    src: a.src || '',
    alt: a.alt || '',
    width: a.width || s.width || '',
    height: a.height || s.height || '',
    objectFit: s.objectFit || '',
    objectPosition: s.objectPosition || 'center center',
    href: a.href || '',
    target: a.target || '',
    isButton: el.type === 'button',
    isTextContainer,
    isEmojiIcon: el.type === 'icon',
    boxShadow: s.boxShadow || '',
    // textShadow inherits like other typography
    textShadow: inh('textShadow'),
  };
}

// ─── Theme system ──────────────────────────────────────────────

// WCAG contrast helpers
function luminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 0;
  const m = clean.match(/.{2}/g);
  if (!m) return 0;
  const rgb = m.map(h => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(h1: string, h2: string): number {
  const l1 = luminance(h1); const l2 = luminance(h2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function isHex(c: string): boolean { return /^#[0-9a-fA-F]{6}$/.test(c); }

function toHex(c: string): string {
  if (!c) return '';
  if (isHex(c)) return c;
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return '#' + [m[1], m[2], m[3]].map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
  const named: Record<string, string> = { white: '#ffffff', black: '#000000', red: '#ff0000', blue: '#0000ff', green: '#008000' };
  return named[c.toLowerCase()] || '';
}

function isDark(hex: string): boolean { return luminance(hex) < 0.25; }
function isNearWhite(hex: string): boolean { return luminance(hex) > 0.85; }
function isLightAccent(hex: string): boolean { const l = luminance(hex); return l >= 0.25 && l <= 0.85; }

function bestText(bg: string, preferred: string): string {
  const bgH = toHex(bg);
  if (!bgH) return preferred;
  const prefH = toHex(preferred);
  if (prefH && contrastRatio(prefH, bgH) >= 4.5) return preferred;
  return luminance(bgH) > 0.179 ? '#0E0E0E' : '#ffffff';
}

interface ThemeInput {
  primary: string; secondary: string; background: string;
  textPrimary: string; textSecondary: string; textOnDark: string;
  accent: string; button: string; buttonText: string;
  divider: string; strokeBorder?: string;
}

function ancestorBg(el: SectionElement, tree: SectionElement[]): string {
  // Simple heuristic — walk up finding parent with bg style
  function findParentBg(elements: SectionElement[], targetId: string): string | null {
    for (const e of elements) {
      if (e.children) {
        const hasTarget = findElement(e.children, targetId);
        if (hasTarget) {
          const bg = toHex(e.styles.backgroundColor || '') || toHex(e.styles.background || '');
          if (bg) return bg;
          return findParentBg(e.children, targetId);
        }
      }
    }
    return null;
  }
  return findParentBg(tree, el.id) || '';
}

/** Returns true when a container element directly wraps a single button child —
 *  the "bulletproof button" td pattern (td > a.button). These wrappers must
 *  follow the button colour, not the section primary/secondary colour, so the
 *  wrapper bg never bleeds around the button edges after a theme change. */
function isSingleButtonWrapper(el: SectionElement): boolean {
  const children = el.children || [];
  return children.length === 1 && children[0].type === 'button';
}

function applyThemeToElement(
  el: SectionElement,
  theme: ThemeInput,
  tree: SectionElement[]
): SectionElement {
  const s = { ...el.styles };
  const stroke = theme.strokeBorder || theme.divider;
  const type = el.type;

  // Container backgrounds
  if (type === 'container') {
    const bgH = toHex(s.backgroundColor || '') || toHex(s.background || '');
    if (bgH) {
      if (isSingleButtonWrapper(el)) {
        // Button-wrapper td: always follow the button colour so no bleed shows
        s.backgroundColor = theme.button;
        if (s.background) s.background = theme.button;
      } else if (isDark(bgH)) {
        s.backgroundColor = theme.primary;
        if (s.background) s.background = theme.primary;
      } else if (isLightAccent(bgH)) {
        s.backgroundColor = theme.secondary;
        if (s.background) s.background = theme.secondary;
      } else if (isNearWhite(bgH) || bgH === '#ffffff' || bgH === '#fff') {
        s.backgroundColor = theme.background;
        if (s.background) s.background = theme.background;
      }
    }
    // Container stroke
    if (s.borderColor) {
      const bc = toHex(s.borderColor);
      if (bc && bc !== toHex(s.backgroundColor)) s.borderColor = stroke;
    }
  }

  // Buttons — always sync border colour to button colour so no prior colour bleeds
  if (type === 'button') {
    s.background = '';
    s.backgroundColor = theme.button;
    s.color = theme.buttonText;
    s.borderColor = theme.button;
  }

  // Plain links
  if (type === 'link' && s.color) {
    s.color = theme.accent;
  }

  // Text elements
  if (type === 'text') {
    if (s.color) {
      const parentBg = toHex(s.backgroundColor || '') || ancestorBg(el, tree) || theme.background;
      if (isDark(parentBg)) {
        s.color = theme.textOnDark;
      } else {
        const origLum = luminance(toHex(s.color) || '#000');
        s.color = (origLum > 0.15 && origLum < 0.5)
          ? bestText(parentBg, theme.textSecondary)
          : bestText(parentBg, theme.textPrimary);
      }
    }
  }

  // Dividers
  if (type === 'divider' && s.borderColor) {
    s.borderColor = theme.divider;
  }

  const updated: SectionElement = { ...el, styles: s };
  if (el.children) {
    updated.children = el.children.map(c => applyThemeToElement(c, theme, tree));
  }
  return updated;
}

export function applyThemeToElements(
  elements: SectionElement[],
  theme: ThemeInput
): SectionElement[] {
  return elements.map(el => applyThemeToElement(el, theme, elements));
}

// ─── Legacy compat: applyThemeToHtml (used by store until fully migrated) ────

export function applyThemeToHtml(html: string, theme: ThemeInput): string {
  const els = htmlToElements(html);
  const themed = applyThemeToElements(els, theme);
  return elementsToHtml(themed);
}

// ─── React render attrs converter ─────────────────────────────

/** Convert HTML attr names to React prop names */
export function toReactAttrs(attrs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    out[REACT_ATTR[k] || k] = v;
  }
  return out;
}
