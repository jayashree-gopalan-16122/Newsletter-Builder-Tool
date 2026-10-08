import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasSection, SectionElement, LibrarySection, PreviewMode, SectionStyles } from './types';
import { toReactAttrs } from './html-utils';
import { GripVertical, Trash2, ChevronUp, ChevronDown, Plus, Minus, Copy } from 'lucide-react';

// ─── Inline-edit content sanitisation ─────────────────────────

// Normalises DOM-produced innerHTML from contentEditable commits so
// spaces/breaks never round-trip as literal &nbsp;/<br> entity soup.
function sanitiseEditedContent(html: string): string {
  if (!html) return '';

  // Use a temporary DOM element to parse and 
  // clean the HTML — preserves tag structure
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  // Walk all text nodes and clean entity strings
  // that the browser wrote as literal text
  const walker = document.createTreeWalker(
    tmp,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }

  for (const textNode of textNodes) {
    let text = textNode.nodeValue || '';
    // Replace literal &nbsp; entity strings
    text = text.replace(/&nbsp;/g, '\u00A0');
    // Normalise non-breaking spaces to regular spaces
    text = text.replace(/\u00A0/g, ' ');
    // Do NOT collapse multiple spaces — intentional
    // spaces must be preserved exactly as typed
    textNode.nodeValue = text;
  }

  // IMPORTANT: Do NOT touch <br> tags — they are
  // structural line breaks intentionally placed
  // in template HTML. Removing them merges lines.

  // Remove div/p wrappers browser may insert
  // but keep their text content
  tmp.querySelectorAll('div, p').forEach(el => {
    const text = document.createTextNode(
      ' ' + el.textContent + ' '
    );
    el.replaceWith(text);
  });

  // Get the cleaned HTML
  // innerHTML preserves all spaces exactly
  // Do NOT use innerText — it collapses spaces
  let clean = tmp.innerHTML;

  // Only trim trailing whitespace — NEVER leading
  // Leading spaces are intentional user edits
  clean = clean.trimEnd();

  // Preserve space-only edits as single space
  // Never return empty string — element must 
  // stay in DOM
  if (clean.replace(/\s/g, '') === '') return ' ';

  return clean;
}

// ─── Feature group utilities ──────────────────────────────────

function isFeatureSection(code: string): boolean {
  return code === 'C1' || code === 'C2' || code === 'C3';
}

function countVisibleFeatureGroups(elements: SectionElement[]): number {
  let n = 0;
  const walk = (els: SectionElement[]) => {
    for (const el of els) {
      if (el.attrs?.['data-feature-group'] && el.attrs['data-feature-hidden'] !== 'true') n++;
      if (el.children) walk(el.children);
    }
  };
  walk(elements);
  return n;
}

function getNextHiddenGroupN(elements: SectionElement[]): number | null {
  const hidden: number[] = [];
  const walk = (els: SectionElement[]) => {
    for (const el of els) {
      if (el.attrs?.['data-feature-group'] && el.attrs['data-feature-hidden'] === 'true') {
        hidden.push(Number(el.attrs['data-feature-group']));
      }
      if (el.children) walk(el.children);
    }
  };
  walk(elements);
  if (!hidden.length) return null;
  return Math.min(...hidden);
}

function getVisibleGroupsInOrder(elements: SectionElement[]): SectionElement[] {
  const visible: SectionElement[] = [];
  const walk = (els: SectionElement[]) => {
    for (const el of els) {
      if (el.attrs?.['data-feature-group'] && el.attrs['data-feature-hidden'] !== 'true') {
        visible.push(el);
      }
      if (el.children) walk(el.children);
    }
  };
  walk(elements);
  return visible;
}

interface Props {
  sections: CanvasSection[];
  selectedId: string | null;
  selectedElementId: string | null;
  previewMode: PreviewMode;
  library: LibrarySection[];
  flashedElementIds?: string[];
  onSelect: (id: string | null) => void;
  onSelectEl: (id: string | null) => void;
  onAdd: (lib: LibrarySection, index?: number) => string;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onSaveToLibrary: (s: CanvasSection) => void;
  onFocusSettings: () => void;
  onPatchElement: (sectionId: string, elId: string, changes: Record<string, string>) => void;
  onToggleFeatureGroup: (sectionId: string, groupN: number, visible: boolean) => void;
  onAddFeatureGroupAfter: (sectionId: string, afterSlotN: number) => void;
  onReorderFeatureGroup: (sectionId: string, fromSlotN: number, insertAfterSlotN: number | null) => void;
}

function outerWrapperStyle(styles: SectionStyles): React.CSSProperties {
  const css: React.CSSProperties = {};
  if (styles.backgroundGradient) {
    css.background = styles.backgroundGradient;
    css.backgroundColor = 'transparent';
  } else if (styles.backgroundColor) {
    css.backgroundColor = styles.backgroundColor;
    css.background = 'none';
  }
  if (styles.backgroundImage) {
    css.backgroundImage = `url('${styles.backgroundImage}')`;
    css.backgroundSize = styles.backgroundFit || 'cover';
    css.backgroundPosition = styles.backgroundPosition || 'center';
    css.backgroundRepeat = styles.backgroundRepeat || 'no-repeat';
  }
  css.paddingTop = styles.paddingTop || 0;
  css.paddingRight = styles.paddingRight || 0;
  css.paddingBottom = styles.paddingBottom || 0;
  css.paddingLeft = styles.paddingLeft || 0;
  if (styles.boxShadow) css.boxShadow = styles.boxShadow;
  if (styles.borderEnabled || styles.borderWidth > 0) {
    if (styles.borderGradientEnabled && styles.borderGradient) {
      css.borderStyle = 'solid';
      css.borderWidth = styles.borderWidth;
      css.borderColor = 'transparent';
      css.borderImage = `${styles.borderGradient} 1`;
    } else {
      css.borderWidth = styles.borderWidth;
      css.borderStyle = styles.borderStyle as any;
      css.borderColor = styles.borderColor;
    }
    if (!styles.borderTop) css.borderTopWidth = 0;
    if (!styles.borderRight) css.borderRightWidth = 0;
    if (!styles.borderBottom) css.borderBottomWidth = 0;
    if (!styles.borderLeft) css.borderLeftWidth = 0;
    // Prevent background bleeding under the border
    css.backgroundClip = 'padding-box';
  }
  // Always apply border-radius even without a border (for overflow clipping)
  if (styles.borderRadius) {
    css.borderRadius = styles.borderRadius;
    css.overflow = 'hidden';
  }
  return css;
}

function innerContentStyle(styles: SectionStyles): React.CSSProperties {
  const css: React.CSSProperties = {};
  if (styles.innerBackgroundColor) css.backgroundColor = styles.innerBackgroundColor;
  if (styles.innerBackgroundGradient) css.background = styles.innerBackgroundGradient;
  return css;
}

function getResponsiveCSS(mode: PreviewMode): string {
  if (mode === 'desktop') return '';

  // For both tablet (480px) and mobile (320px), the strategy is:
  //   1. Shrink fixed-width outer tables/images so they fit the narrower viewport.
  //   2. Stack the outermost <tr>/<td> as block elements (they're always
  //      single-column in practice — this just neutralizes their table layout).
  //   3. Stack any INNER <tr> that uses percentage-width columns
  //      (e.g. <td width="45%"> + <td width="55%">) vertically, so horizontal
  //      card layouts (image-left + text-right, side-by-side cards, etc.)
  //      become stacked cards instead of two squished columns.
  //
  // We target `td[width$="%"]` specifically because those are always
  // "column"-style tds intended for side-by-side layout on desktop. Small
  // horizontal patterns like headers (logo-left + nav-right) or countdown
  // timers use align="left/right/center" WITHOUT percent widths, so they
  // correctly stay horizontal on narrow viewports.
  //
  // The `:has()` selector (supported in all modern browsers) lets us force
  // the parent <tr> to display:block only when it actually contains those
  // percent-width columns — avoiding the old right-gap bug where <tr> stayed
  // as display:table-row while its children went block.
  //
  // Mobile adds a small type-scale reduction so headings don't overflow at 320px.
  const base = `
    /* Images scale proportionally to their cell width, preserving natural aspect
       ratio. Never force an image to fill a cell's height — that would either
       crop content or leave empty space when the image's aspect doesn't match
       the cell's. This rule works for all sections:
       - Hero/content images with inline style="width:100%" fill their cell
         width and scale height proportionally.
       - Small logos/avatars/badges (no width:100% style) stay at natural size.
       - Both kinds are safely capped by max-width:100% so they never overflow. */
    .section-content img { max-width: 100% !important; height: auto !important; }
    .section-content img[style*="width:100%"],
    .section-content img[style*="width: 100%"] { width: 100% !important; height: auto !important; }

    .section-content table[width="480"], .section-content table[width="540"], .section-content table[width="600"], .section-content table[width="400"] { width: 100% !important; }
    .section-content > table { width: 100% !important; }
    .section-content > table > tbody > tr { display: block !important; }
    .section-content > table > tbody > tr > td { width: auto !important; box-sizing: border-box !important; display: block !important; }

    /* Stack horizontal card layouts into vertical cards.
       Any <tr> containing percent-width column <td>s becomes a block
       container; those <td>s each take full width and stack top-to-bottom.
       The selector specificity intentionally matches the rule above
       (.section-content > table > tbody > tr > td) so its width:auto rule
       doesn't win for percentage cells — without this, a B7-style 50/50
       split has its image cell collapse to image-natural-width /
       image-natural-height-of-zero in tablet, hiding the image entirely. */
    .section-content tr:has(> td[width$="%"]) { display: block !important; width: 100% !important; }
    .section-content > table > tbody > tr > td[width$="%"],
    .section-content td[width$="%"] {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    /* Per-table opt-out: tables tagged data-no-stack="1" stay horizontal even
       in tablet/mobile. Used by header layouts like A7 where a left text +
       right button row should NEVER stack — the button must remain at the
       right edge in all viewports because the contents are small enough to
       fit side-by-side at 320px. */
    .section-content table[data-no-stack="1"] > tbody > tr {
      display: table-row !important;
      width: auto !important;
    }
    .section-content table[data-no-stack="1"] > tbody > tr > td[width="50%"] { display: table-cell !important; width: 50% !important; }
    .section-content table[data-no-stack="1"] > tbody > tr > td[width="100%"] { display: table-cell !important; width: 100% !important; }
    /* Spacer cells like <td width="4%"></td> between two columns should
       disappear entirely in the stacked layout (they become empty gaps). */
    .section-content td[width$="%"]:empty { display: none !important; }
    /* When a text column used padding-left / padding-right to create inter-column
       spacing on desktop, zero that out in the stacked layout so the content
       aligns with its neighbor's edges instead of looking indented. These
       selectors only match the shorthand-free forms (padding-left:/padding-right:),
       so card padding written as e.g. "padding:20px 24px;" is preserved. */
    .section-content tr:has(> td[width$="%"]) > td[style*="padding-left:"] { padding-left: 0 !important; }
    .section-content tr:has(> td[width$="%"]) > td[style*="padding-right:"] { padding-right: 0 !important; }
    /* Give stacked cards a small gap between them so they don't touch. */
    .section-content tr:has(> td[width$="%"]) > td[width$="%"] + td[width$="%"] { margin-top: 12px !important; }
    /* Per-table opt-in: tables tagged data-stack-spacing="20" use a wider 20px
       gap between stacked image and text cells (used by C11 where the default
       12px felt cramped). Targets both forward-stacked and reverse-stacked
       (flex column-reverse) layouts. */
    .section-content table[data-stack-spacing="20"] > tbody > tr:has(> td[width$="%"]) > td[width$="%"] + td[width$="%"] { margin-top: 20px !important; }
    .section-content table[data-stack-reverse="1"][data-stack-spacing="20"] > tbody > tr:has(> td[width$="%"]) { gap: 20px !important; }

    /* Opt-in per-section: when an inner <table> is tagged data-stack-reverse="1",
       its stacked columns reverse order (image ends up on top). Also left-align
       any image that was desktop-aligned to the right, so it sits flush with
       the text/button below it in the stacked layout. */
    .section-content table[data-stack-reverse="1"] > tbody > tr:has(> td[width$="%"]) {
      display: flex !important;
      flex-direction: column-reverse !important;
      gap: 16px !important;
    }
    .section-content table[data-stack-reverse="1"] > tbody > tr > td[width$="%"] + td[width$="%"] { margin-top: 0 !important; }
    .section-content table[data-stack-reverse="1"][data-stack-nogap="1"] > tbody > tr:has(> td[width$="%"]) { gap: 0 !important; }
    .section-content table[data-stack-reverse="1"] td[align="right"] { text-align: left !important; }
    .section-content table[data-stack-reverse="1"] td[align="right"] > img {
      margin-left: 0 !important;
      margin-right: auto !important;
    }

    /* Inline-block anchor buttons inside table cells: allow text wrapping and
       cap their width at their cell so a long button label (or a large global
       font-size) doesn't push the button beyond the 320px / 480px viewport.
       Previously these had white-space:nowrap, which kept buttons on one line
       but let them overflow the frame. Wrapping is the right trade-off for
       narrow previews — the button still renders, just across two lines. */
    .section-content td a[style*="display:inline-block"],
    .section-content td a[style*="display: inline-block"] {
      white-space: normal !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      overflow-wrap: anywhere !important;
    }
    /* Inner content-sized tables (like button wrappers without a width attr)
       must not grow beyond their parent cell width, otherwise their content
       pushes past the viewport edge. max-width:100% on every table caps them
       to the parent — full-width tables (width="100%") are already 100% so
       this is a no-op for them, and wrapper tables that were shrink-to-fit
       can still be narrower than 100%, they just can't exceed it. */
    .section-content table { max-width: 100% !important; }

    /* Horizontal cards (A4/B5/C11/D9/E6/G4) use position:absolute on their
       image to fill the cell's table-row-forced height in DESKTOP view.
       In stacked tablet/mobile view that trick breaks — the image td becomes
       a normal block element with no defined height beyond its min-height,
       and an absolute image with height:100% covers a 220px container while
       the text td below renders into space the user can't see (the section
       padding makes it look like the card just ended at the image).
       Reset to normal flow when stacked: image returns to width:100%/
       height:auto (natural aspect), the cell shrinks to image height, and
       the text td appears below it as expected. */
    .section-content td[width$="%"][style*="position:relative"] > img[style*="position:absolute"],
    .section-content td[width$="%"][style*="position: relative"] > img[style*="position:absolute"],
    .section-content td[width$="%"][style*="position:relative"] > img[style*="position: absolute"],
    .section-content td[width$="%"][style*="position: relative"] > img[style*="position: absolute"] {
      position: static !important;
      width: 100% !important;
      height: auto !important;
    }
    .section-content td[width$="%"][style*="min-height"] {
      min-height: 0 !important;
    }
  `;

  if (mode === 'tablet') return base + `
    /* Tablet-only constraint for D9 and E6 specifically (the two sections
       the user flagged where the stacked image dominated the 480px viewport
       and pushed text out of the visible area). Targeted via their specific
       min-height values so other horizontal-card sections (A4, B5, G4) are
       not affected — those keep their current proportional-scaling behavior.
       At 480px width with aspect-ratio:16/9, the image renders ~480 x 270px,
       leaving room for the text+button to sit visibly below. */
    .section-content td[width$="%"][style*="min-height:200px"] > img[style*="position:absolute"],
    .section-content td[width$="%"][style*="min-height:240px"] > img[style*="position:absolute"] {
      aspect-ratio: 16 / 9 !important;
      object-fit: cover !important;
    }
  `;

  return base + `
    .section-content h1 { font-size: 22px !important; }
    .section-content h2 { font-size: 20px !important; }
    .section-content h3 { font-size: 15px !important; }
  `;
}

// ─── Recursive element renderer ───────────────────────────────

interface RenderProps {
  el: SectionElement;
  selectedElementId: string | null;
  flashedElementIds?: string[];
  onSelectEl: (id: string, e: React.MouseEvent) => void;
  onDoubleClickEl: (el: SectionElement, domEl: HTMLElement) => void;
  onImageHover: (info: { elId: string; rect: DOMRect } | null) => void;
}

// Canvas selection is intentionally limited to meaningful design objects.
// Email HTML contains many layout-only wrappers (table/tr/td/div, etc.) that
// must remain in the DOM for rendering/export but should not surface as
// accidental selections when they have no visible styling of their own.
function isCanvasSelectable(el: SectionElement): boolean {
  if (el.tag === 'br') return false;
  if (el.type !== 'container') return true;

  const s = el.styles || {};
  const hasVisibleBackground = !!(
    s.backgroundColor ||
    s.backgroundImage ||
    (s.background && s.background !== 'none' && s.background !== 'transparent')
  );
  const hasVisibleBorder = !!(
    (s.borderWidth && s.borderWidth !== '0' && s.borderWidth !== '0px') ||
    (s.borderTopWidth && s.borderTopWidth !== '0' && s.borderTopWidth !== '0px') ||
    (s.borderRightWidth && s.borderRightWidth !== '0' && s.borderRightWidth !== '0px') ||
    (s.borderBottomWidth && s.borderBottomWidth !== '0' && s.borderBottomWidth !== '0px') ||
    (s.borderLeftWidth && s.borderLeftWidth !== '0' && s.borderLeftWidth !== '0px')
  );
  const hasVisibleShape = !!(
    (s.borderRadius && s.borderRadius !== '0' && s.borderRadius !== '0px') ||
    (s.boxShadow && s.boxShadow !== 'none')
  );

  return hasVisibleBackground || hasVisibleBorder || hasVisibleShape;
}

function RenderElement({ el, selectedElementId, flashedElementIds, onSelectEl, onDoubleClickEl, onImageHover }: RenderProps) {
  const isSelectable = isCanvasSelectable(el);
  const isSelected = isSelectable && selectedElementId === el.id;
  const isFlashed = flashedElementIds?.includes(el.id);

  // Build React style object (already camelCase)
  const style: React.CSSProperties = { ...(el.styles as any) };
  if (isSelected) {
    style.outline = '2px solid #004BE2';
    style.outlineOffset = '1px';
  } else if (isFlashed) {
    // Flash outline for "apply to all similar" feedback
    style.outline = '2px solid #22c55e';
    style.outlineOffset = '2px';
    style.transition = 'outline-color 0.9s ease-out';
  }
  // Clip child content to border-radius for any element with rounded corners
  if (el.styles.borderRadius && el.styles.borderRadius !== '0px' && el.styles.borderRadius !== '0') {
    style.overflow = 'hidden';
  }

  // Prevent background color from bleeding under/past the border (non-button elements only —
  // buttons get their border colour synced to their background below, so background-clip
  // would make the border area transparent and reveal a differently-coloured parent td).
  if (el.type !== 'button' &&
      (el.styles.backgroundColor || el.styles.background) &&
      ((el.styles.borderWidth && el.styles.borderWidth !== '0px' && el.styles.borderWidth !== '0') ||
      (el.styles.borderColor && el.styles.borderColor !== ''))) {
    style.backgroundClip = 'padding-box';
  }

  // For buttons inside rounded containers, inherit radius so fill aligns with the stroke
  if (el.type === 'button' && !el.styles.borderRadius) {
    style.borderRadius = 'inherit';
  }

  // Button canvas fixes (display only — not exported):
  //   1. Sync border colour to background so manual bg-colour changes don't bleed red/old colour
  //   2. Flex-centre the label both horizontally and vertically
  if (el.type === 'button') {
    const bg = (style.backgroundColor || style.background) as string | undefined;
    if (bg) style.borderColor = bg;
    style.display = 'inline-flex';
    (style as any).alignItems = 'center';
    (style as any).justifyContent = 'center';
  }

  // Space-only text content renders with near-zero width — force a minimum
  // width so adjacent text doesn't visually collapse to the left
  if (el.content !== undefined && el.content !== null && el.content.trim() === '' && el.content.length > 0) {
    style.minWidth = '1em';
    style.display = style.display || 'inline-block';
  }

  // Leading spaces in text content get collapsed by default CSS white-space
  // handling — preserve them visually without affecting other text elements
  if (el.type === 'text' && el.content && typeof el.content === 'string' && el.content.startsWith(' ')) {
    style.whiteSpace = style.whiteSpace || 'pre-wrap';
  }

  // Convert HTML attrs to React props
  const reactAttrs = el.attrs ? toReactAttrs(el.attrs) : {};
  // Mark non-anchor elements that carry a URL so the canvas CSS can show an indicator
  if (el.attrs?.href && el.tag !== 'a') {
    (reactAttrs as any)['data-linked'] = '1';
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isSelectable) return;
    e.stopPropagation();
    onSelectEl(el.id, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isSelectable) return;
    e.stopPropagation();
    const dom = e.currentTarget as HTMLElement;
    onDoubleClickEl(el, dom);
  };

  const renderChildren = () => {
    if (el.children && el.children.length > 0) {
      return el.children.map(child => (
        <RenderElement key={child.id} el={child}
          selectedElementId={selectedElementId}
          flashedElementIds={flashedElementIds}
          onSelectEl={onSelectEl}
          onDoubleClickEl={onDoubleClickEl}
          onImageHover={onImageHover}
          />
      ));
    }
    // Inline-formatted content (bold, italic, color spans) stored as HTML string.
    // Detect real tags rather than a bare '<', so entities like &nbsp;/&amp; don't
    // get misclassified as HTML.
    const containsHtmlTags = el.content ? /<[a-zA-Z][^>]*>/i.test(el.content) : false;
    if (containsHtmlTags) {
      return <span dangerouslySetInnerHTML={{ __html: el.content! }} />;
    }
    // Never render null for text elements — empty content shows a non-breaking
    // space so the element stays in the DOM and remains clickable/editable
    if (el.content === ' ' || (el.content !== undefined && el.content !== null && el.content.trim() === '' && el.content.length > 0)) {
      return '\u00A0';
    }
    return el.content || '\u00A0';
  };

  if (el.tag === 'img') {
    return (
      <img
        {...reactAttrs}
        src={el.attrs?.src || ''}
        alt={el.attrs?.alt || ''}
        style={style}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
    );
  }

  if (el.tag === 'hr') {
    return <hr {...reactAttrs} style={style} onClick={handleClick} />;
  }

  if (el.tag === 'br') {
    return <br />;
  }

  if (el.tag === 'a') {
    return (
      <a
        {...reactAttrs}
        href={el.attrs?.href}
        target={el.attrs?.target}
        style={style}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {renderChildren()}
      </a>
    );
  }

  // Generic element
  const Tag = el.tag as React.ElementType;

  return (
    <Tag
      {...reactAttrs as any}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {renderChildren()}
    </Tag>
  );
}

// ─── Main Canvas ──────────────────────────────────────────────

function isElementInSection(
  elements: SectionElement[],
  elementId: string | null
): boolean {
  if (!elementId) return false;
  for (const el of elements) {
    if (el.id === elementId) return true;
    if (el.children && isElementInSection(el.children, elementId)) {
      return true;
    }
  }
  return false;
}

export function Canvas({
  sections, selectedId, selectedElementId, previewMode, library,
  flashedElementIds = [],
  onSelect, onSelectEl, onAdd, onRemove, onDuplicate, onMove,
  onPatchElement, onToggleFeatureGroup, onAddFeatureGroupAfter, onReorderFeatureGroup,
}: Props) {
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const dropIdxRef = useRef<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const dragFromRef = useRef<number | null>(null);

  const setDropIndicator = useCallback((idx: number | null) => {
    dropIdxRef.current = idx;
    setDropIdx(idx);
  }, []);
  const [visibleToolbar, setVisibleToolbar] = useState<string | null>(null);
  const [richToolbar, setRichToolbar] = useState<{ top: number; left: number } | null>(null);
  const [richToolbarActive, setRichToolbarActive] = useState<{ bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean }>({ bold: false, italic: false, underline: false, strikethrough: false });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  // Saved selection state for the inline rich-text toolbar
  const savedRangeRef = useRef<Range | null>(null);
  const editingDomElRef = useRef<HTMLElement | null>(null);
  const editingElIdRef = useRef<string | null>(null);
  // Range captured just before the native OS color picker opens (which causes selection loss)
  const colorPickerRangeRef = useRef<Range | null>(null);
  void colorPickerRangeRef; // retained for applyInlineFormat (color path, used from PropertiesPanel)
  const [cropMode, setCropMode] = useState<{
    sectionId: string;
    elId: string;
    el: SectionElement;
    domEl: HTMLImageElement;
    frameW: number;
    frameH: number;
    panX: number;
    panY: number;
    naturalW: number;
    naturalH: number;
    origFrameW: number;
    origFrameH: number;
    origPanX: number;
    origPanY: number;
  } | null>(null);

  const width = previewMode === 'mobile' ? 320 : previewMode === 'tablet' ? 480 : 600;

  useEffect(() => {
    if (!cropMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cropMode.domEl.style.objectPosition = '';
        cropMode.domEl.style.width = '';
        cropMode.domEl.style.height = '';
        setCropMode(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cropMode]);

  // Feature group hover state (delete button positioning)
  const [featureGroupHover, setFeatureGroupHover] = useState<{
    sectionId: string;
    groupN: number;
    top: number;
    right: number;
  } | null>(null);
  const featureHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const featureDragRef = useRef<{ sectionId: string; slotN: number; groups: SectionElement[] } | null>(null);
  const featureDragInsertAfterRef = useRef<number | null | undefined>(undefined);
  const [featureDragOver, setFeatureDragOver] = useState<{ sectionId: string; insertAfterSlotN: number | null; indicatorTop: number } | null>(null);

  const cancelFeatureHoverHide = useCallback(() => {
    if (featureHoverTimerRef.current) { clearTimeout(featureHoverTimerRef.current); featureHoverTimerRef.current = null; }
  }, []);

  const scheduleFeatureGroupHide = useCallback(() => {
    if (featureHoverTimerRef.current) clearTimeout(featureHoverTimerRef.current);
    featureHoverTimerRef.current = setTimeout(() => setFeatureGroupHover(null), 300);
  }, []);

  const handleFeatureDragStart = useCallback((e: React.MouseEvent, sectionId: string, slotN: number, groups: SectionElement[]) => {
    e.preventDefault();
    e.stopPropagation();
    featureDragRef.current = { sectionId, slotN, groups };
    featureDragInsertAfterRef.current = undefined;

    const onMove = (me: MouseEvent) => {
      if (!featureDragRef.current) return;
      const { sectionId: secId, groups: grps } = featureDragRef.current;
      const sectionWrap = document.querySelector(`[data-section-id="${secId}"]`) as HTMLElement | null;
      if (!sectionWrap) return;
      const sRect = sectionWrap.getBoundingClientRect();

      let insertAfter: number | null = null;
      for (let i = 0; i < grps.length; i++) {
        const gN = Number(grps[i].attrs?.['data-feature-group']);
        const groupDom = sectionWrap.querySelector(`[data-feature-group="${gN}"]`) as HTMLElement | null;
        if (!groupDom) continue;
        const rect = groupDom.getBoundingClientRect();
        if (me.clientY > rect.top + rect.height / 2) insertAfter = gN;
      }

      let indicatorTop = 0;
      if (insertAfter === null) {
        const firstGN = Number(grps[0]?.attrs?.['data-feature-group']);
        const firstDom = sectionWrap.querySelector(`[data-feature-group="${firstGN}"]`) as HTMLElement | null;
        if (firstDom) indicatorTop = firstDom.getBoundingClientRect().top - sRect.top;
      } else {
        const grpDom = sectionWrap.querySelector(`[data-feature-group="${insertAfter}"]`) as HTMLElement | null;
        if (grpDom) indicatorTop = grpDom.getBoundingClientRect().bottom - sRect.top;
      }

      featureDragInsertAfterRef.current = insertAfter;
      setFeatureDragOver({ sectionId: secId, insertAfterSlotN: insertAfter, indicatorTop });
    };

    const onUp = () => {
      if (featureDragRef.current) {
        const { sectionId: secId, slotN: fromSlot, groups: grps } = featureDragRef.current;
        const insertAfter = featureDragInsertAfterRef.current;
        if (insertAfter !== undefined) {
          const fromIdx = grps.findIndex(g => Number(g.attrs?.['data-feature-group']) === fromSlot);
          const afterIdx = insertAfter === null ? -1 : grps.findIndex(g => Number(g.attrs?.['data-feature-group']) === insertAfter);
          if (fromIdx !== afterIdx && fromIdx !== afterIdx + 1) {
            onReorderFeatureGroup(secId, fromSlot, insertAfter);
          }
        }
      }
      featureDragRef.current = null;
      featureDragInsertAfterRef.current = undefined;
      setFeatureDragOver(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [onReorderFeatureGroup]);

  const showToolbar = useCallback((id: string) => {
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    setVisibleToolbar(id);
  }, []);

  const scheduleHideToolbar = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisibleToolbar(null), 500);
  }, []);

  const handleSectionDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragFromRef.current === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newIdx = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
    if (dropIdxRef.current !== newIdx) setDropIndicator(newIdx);
  }, [setDropIndicator]);

  const handleSectionDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('canvas-idx', String(index));
    e.dataTransfer.effectAllowed = 'move';
    dragFromRef.current = index;
    setDragFrom(index);
  }, []);

  const handleSectionDragEnd = useCallback(() => {
    dragFromRef.current = null;
    setDragFrom(null);
    setDropIndicator(null);
  }, [setDropIndicator]);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const idx = dropIdxRef.current;
    setDropIndicator(null);
    dragFromRef.current = null;
    setDragFrom(null);
    const libId = e.dataTransfer.getData('library-id');
    const canvasIdx = e.dataTransfer.getData('canvas-idx');
    if (canvasIdx !== '') {
      const from = parseInt(canvasIdx);
      const to = idx ?? sections.length;
      if (from !== to && from !== to - 1) onMove(from, from < to ? to - 1 : to);
    } else if (libId) {
      const ls = library.find(s => s.id === libId);
      if (ls) onAdd(ls, idx ?? sections.length);
    }
  }, [library, onAdd, onMove, sections.length, setDropIndicator]);

  const handleContentClick = (e: React.MouseEvent, sectionId: string) => {
    e.stopPropagation();
    onSelect(sectionId);
    onSelectEl(null);
  };

  const handleDoubleClickEl = useCallback((el: SectionElement, domEl: HTMLElement) => {
    // Image crop mode — enter React overlay
    if (el.type === 'image' || el.tag === 'img') {
      const sec = domEl.closest('[data-section-id]') as HTMLElement | null;
      if (!sec) return;
      const secId = sec.getAttribute('data-section-id')!;
      const imgEl = domEl as HTMLImageElement;

      if (!el.styles.objectFit || el.styles.objectFit !== 'cover') {
        onPatchElement(secId, el.id, { objectFit: 'cover' });
      }

      const posStr = el.styles.objectPosition || '50% 50%';
      const posMap: Record<string, number> = { left: 0, center: 50, right: 100, top: 0, bottom: 100 };
      const parts = posStr.trim().split(/\s+/);
      const posX = posMap[parts[0]] ?? parseFloat(parts[0]) ?? 50;
      const posY = posMap[parts[1]] ?? parseFloat(parts[1]) ?? 50;

      const frameW = parseInt(el.attrs?.width || el.styles.width || '0') || imgEl.clientWidth;
      const frameH = parseInt(el.attrs?.height || el.styles.height || '0') || imgEl.clientHeight;

      setCropMode({
        sectionId: secId, elId: el.id, el, domEl: imgEl,
        frameW, frameH, panX: posX, panY: posY,
        naturalW: imgEl.naturalWidth, naturalH: imgEl.naturalHeight,
        origFrameW: frameW, origFrameH: frameH, origPanX: posX, origPanY: posY,
      });

      return;
    }

    const editableTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'li', 'td', 'div', 'th'];
    // Only edit leaf text elements (no structured children)
    if (!editableTags.includes(el.tag) || el.children?.length) return;

    domEl.contentEditable = 'true';
    domEl.focus();
    domEl.style.outline = '2px solid #004BE2';
    domEl.style.outlineOffset = '1px';

    // Decode any previously double-encoded entities (from earlier corrupted
    // saves) before the user edits, so re-saving doesn't re-encode them again
    if (domEl.innerHTML.includes('&amp;')) {
      domEl.innerHTML = domEl.innerHTML
        .replace(/&amp;nbsp;/gi, ' ')
        .replace(/&amp;lt;/gi, '<')
        .replace(/&amp;gt;/gi, '>')
        .replace(/&amp;amp;/gi, '&');
    }

    // Show rich-text mini-toolbar on text selection; save range for formatting
    const handleSelChange = () => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && domEl.contains(sel.anchorNode)) {
        const r = sel.getRangeAt(0);
        savedRangeRef.current = r.cloneRange();
        editingDomElRef.current = domEl;
        editingElIdRef.current = el.id;
        const rect = r.getBoundingClientRect();
        setRichToolbar({ top: rect.top - 44, left: rect.left + rect.width / 2 });
        // Detect active formats by checking computed style of the range's common ancestor
        const ancestor = r.commonAncestorContainer;
        const node = ancestor.nodeType === 3 ? ancestor.parentElement : ancestor as HTMLElement;
        if (node) {
          const cs = window.getComputedStyle(node);
          setRichToolbarActive({
            bold: cs.fontWeight === 'bold' || parseInt(cs.fontWeight) >= 700,
            italic: cs.fontStyle === 'italic',
            underline: cs.textDecorationLine.includes('underline'),
            strikethrough: cs.textDecorationLine.includes('line-through'),
          });
        }
      } else {
        setRichToolbar(null);
      }
    };
    document.addEventListener('selectionchange', handleSelChange);

    const cleanup = () => {
      domEl.contentEditable = 'false';
      domEl.style.outline = '';
      domEl.style.outlineOffset = '';
      setRichToolbar(null);
      savedRangeRef.current = null;
      editingDomElRef.current = null;
      editingElIdRef.current = null;
      document.removeEventListener('selectionchange', handleSelChange);
      // Save innerHTML (preserves inline <b>, <i>, <span style> formatting),
      // sanitised so plain spaces/breaks never persist as &nbsp;/<br> entities
      const sectionEl = domEl.closest('[data-section-id]') as HTMLElement | null;
      if (sectionEl) {
        const secId = sectionEl.getAttribute('data-section-id')!;
        const rawHtml = domEl.innerHTML;
        const sanitised = sanitiseEditedContent(rawHtml);
        onPatchElement(secId, el.id, { html: sanitised });
      }
      domEl.removeEventListener('blur', cleanup);
      domEl.removeEventListener('keydown', handleKey);
      domEl.removeEventListener('paste', handlePaste);
    };
    const handleKey = (ke: KeyboardEvent) => {
      if (ke.key === 'Enter' && !ke.shiftKey) { ke.preventDefault(); domEl.blur(); }
      if (ke.key === 'Escape') domEl.blur();
    };
    // Sanitize pasted content: strip background-color, font-family, color,
    // classes, data-* attrs, and any wrapper tags that carry visual styling
    // from the source (Word, web pages, Google Docs, etc). Preserve only the
    // text content plus SEMANTIC inline formatting (bold, italic, underline,
    // strikethrough, links) so the pasted text picks up the newsletter's own
    // typography rather than the source's.
    const handlePaste = (pe: ClipboardEvent) => {
      pe.preventDefault();
      const clip = pe.clipboardData;
      if (!clip) return;
      const html = clip.getData('text/html');
      const text = clip.getData('text/plain');
      let cleaned = '';
      if (html) {
        // Parse the pasted HTML in a detached document so scripts/styles
        // never execute, then walk it and rebuild a minimal clean tree.
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const KEEP_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'A', 'BR', 'P', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
        const walk = (node: Node): string => {
          if (node.nodeType === 3) {
            // Text node — escape basic HTML chars
            return (node.textContent || '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          }
          if (node.nodeType !== 1) return '';
          const el = node as HTMLElement;
          const tag = el.tagName;
          const inner = Array.from(el.childNodes).map(walk).join('');
          if (!KEEP_TAGS.has(tag)) return inner; // unwrap unknown tags
          if (tag === 'A') {
            const href = el.getAttribute('href') || '#';
            // Basic href safety: allow only http(s), mailto, tel, and relative
            const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : '#';
            return `<a href="${safe.replace(/"/g, '&quot;')}">${inner}</a>`;
          }
          if (tag === 'BR') return '<br/>';
          // For everything else, drop all attributes (style, class, id, data-*)
          // and just keep the tag wrapper.
          return `<${tag.toLowerCase()}>${inner}</${tag.toLowerCase()}>`;
        };
        cleaned = Array.from(doc.body.childNodes).map(walk).join('').trim();
      }
      if (!cleaned) {
        // Fallback to plain text (with minimal escaping and newline → <br/>).
        cleaned = (text || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\r?\n/g, '<br/>');
      }
      // Insert at current selection using execCommand so the caret/selection
      // state stays sensible and the change is undoable.
      document.execCommand('insertHTML', false, cleaned);
    };
    domEl.addEventListener('blur', cleanup);
    domEl.addEventListener('keydown', handleKey);
    domEl.addEventListener('paste', handlePaste);
  }, [onPatchElement]);

  // Apply an inline style to only the saved selection range by wrapping it in a <span>.
  // If the selection is already fully wrapped in a span with that style, toggle it off instead.
  const applyInlineFormat = useCallback((styleProp: string, styleVal: string) => {
    // Prefer the color-picker-specific saved range (captured right before the OS
    // picker opens and steals focus) over the general savedRangeRef, which may
    // have been cleared by a selectionchange event when focus left the editor.
    const range = colorPickerRangeRef.current ?? savedRangeRef.current;
    colorPickerRangeRef.current = null;
    const domEl = editingDomElRef.current;
    const elId = editingElIdRef.current;
    if (!range || range.collapsed || !domEl || !elId) return;

    // Restore the saved selection
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Toggle detection: if the range's ancestor node already has this style applied,
    // unwrap/reset it instead of wrapping again.
    const ancestor = range.commonAncestorContainer;
    const ancestorEl = ancestor.nodeType === 3 ? ancestor.parentElement : ancestor as HTMLElement;
    let isActive = false;
    if (ancestorEl) {
      const cs = window.getComputedStyle(ancestorEl);
      if (styleProp === 'fontWeight') isActive = cs.fontWeight === 'bold' || parseInt(cs.fontWeight) >= 700;
      else if (styleProp === 'fontStyle') isActive = cs.fontStyle === 'italic';
      else if (styleProp === 'textDecoration' && styleVal === 'underline') isActive = cs.textDecorationLine.includes('underline');
      else if (styleProp === 'textDecoration' && styleVal === 'line-through') isActive = cs.textDecorationLine.includes('line-through');
    }

    if (isActive) {
      // Remove the formatting: extract the fragment, strip the matched style from
      // any direct span wrappers, and re-insert the cleaned content.
      const fragment = range.extractContents();
      const wrapper = document.createElement('span');
      // Walk all spans in the fragment and clear the matching style property
      const spans = Array.from(fragment.querySelectorAll('span'));
      spans.forEach(s => { (s.style as any)[styleProp] = ''; });
      // If the immediate container is a span with only this style, unwrap its content too
      if (ancestorEl && ancestorEl.tagName === 'SPAN' && ancestorEl !== domEl) {
        (ancestorEl.style as any)[styleProp] = '';
      }
      wrapper.appendChild(fragment);
      range.insertNode(wrapper);
      // Flatten: replace the wrapper with its children
      const parent = wrapper.parentNode;
      if (parent) {
        while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
        parent.removeChild(wrapper);
      }
    } else {
      // Apply the formatting by wrapping the selection in a styled span
      const fragment = range.extractContents();
      const span = document.createElement('span');
      (span.style as any)[styleProp] = styleVal;
      span.appendChild(fragment);
      range.insertNode(span);

      // Re-select the content of the new span so further formatting stacks correctly
      if (sel) {
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
        const rect = newRange.getBoundingClientRect();
        setRichToolbar({ top: rect.top - 44, left: rect.left + rect.width / 2 });
      }
    }

    // Persist the updated innerHTML back to the element content model
    const sectionEl = domEl.closest('[data-section-id]') as HTMLElement | null;
    if (sectionEl) {
      const secId = sectionEl.getAttribute('data-section-id')!;
      onPatchElement(secId, elId, { html: domEl.innerHTML });
    }
  }, [onPatchElement]);

  return (
    <div className="flex-1 overflow-auto bg-[#e8ecf2] flex justify-center relative"
      onClick={() => { onSelect(null); onSelectEl(null); }}
      onScroll={() => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); setHintPos(null); }}>
      <div className="py-6 px-4" ref={canvasRef}>
        {previewMode !== 'desktop' && (
          <div className="mb-3 text-center">
            <span className="inline-block px-3 py-1 bg-[#1a1a2e] text-[10px] text-[#a0aec0] rounded-full" style={{ fontWeight: 600 }}>
              {previewMode === 'tablet' ? 'Tablet — 480px' : 'Mobile — 320px'}
            </span>
          </div>
        )}
        <div
          className="mx-auto transition-all duration-300 relative"
          style={{ width, minHeight: 300, borderRadius: 2, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', background: '#fff', overflow: 'visible', fontFamily: "'Zoho Puvi', Arial, sans-serif" }}
          onDragOver={e => e.preventDefault()}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropIndicator(null); }}
          onDrop={handleCanvasDrop}
        >
          {/* Override Tailwind's border-collapse:collapse so border-radius works on td elements */}
          <style>{`
            .section-content table { border-collapse: separate !important; border-spacing: 0 !important; }
            .section-content td, .section-content th { border-spacing: 0; }

            /* Prevent long unbreakable strings (URLs, random characters, pasted
               content) from overflowing their cell and pushing the card width
               past the section/viewport. overflow-wrap:anywhere tells the browser
               to break mid-word only when there's no other wrapping opportunity,
               and critically to CONSIDER those break opportunities when computing
               min-content intrinsic sizes — so tables actually shrink cells to
               fit their container instead of growing to fit the longest word.
               Applies at every viewport, not just mobile. */
            .section-content td, .section-content p, .section-content h1, .section-content h2, .section-content h3, .section-content h4, .section-content h5, .section-content h6, .section-content span, .section-content div, .section-content li, .section-content a {
              overflow-wrap: anywhere !important;
              word-break: break-word !important;
            }
            /* Full-width outer tables must obey their 100% width declaration even
               when a descendant contains a long unbreakable string. Without
               table-layout:fixed, tables default to auto which lets any cell
               grow the table beyond its declared width to fit the longest
               content. Scoped to OUTERMOST section tables (direct children of
               section-content) only — nested inner tables stay on auto layout
               so patterns like A7's "left text, right button" split (where the
               left cell has width=100% to push the right cell to the edge)
               continue to work. Auto layout is required for that pattern; with
               fixed, the right cell collapses to 0 width. */
            .section-content > table { table-layout: fixed !important; }

            /* Button alignment fix: an inline-block <a> button sized to its content
               doesn't respond to text-align directly (no extra space to center within).
               When the user sets text-align on a button via the Typography panel,
               propagate that alignment to the OUTER container td so the entire button
               (its small wrapper table) moves left/center/right within the section.
               Also force the button-wrapper table to display:inline-block so its
               parent's text-align positions it horizontally. */
            .section-content td > table:has(> tbody > tr > td > a[style*="display:inline-block"]):not([width="100%"]):not([width="100"]),
            .section-content td > table:has(> tbody > tr > td > a[style*="display: inline-block"]):not([width="100%"]):not([width="100"]) {
              display: inline-block !important;
            }
            .section-content td:has(> table > tbody > tr > td > a[style*="text-align:center"]),
            .section-content td:has(> table > tbody > tr > td > a[style*="text-align: center"]) { text-align: center !important; }
            .section-content td:has(> table > tbody > tr > td > a[style*="text-align:right"]),
            .section-content td:has(> table > tbody > tr > td > a[style*="text-align: right"]) { text-align: right !important; }
            .section-content td:has(> table > tbody > tr > td > a[style*="text-align:left"]),
            .section-content td:has(> table > tbody > tr > td > a[style*="text-align: left"]) { text-align: left !important; }

            /* Equal-height image-top-text-bottom cards (F4, E5, and anything
               marked with class="stack-card"). Strategy:
               1) Convert the row containing .stack-card tds into a flex row so
                  sibling cards genuinely stretch to equal height (align-items:
                  stretch). This bypasses any browser quirk where a td with
                  overflow:hidden + border-radius doesn't stretch its bg to the
                  table-forced row height.
               2) Convert each card <td> into a flex column. The image sits at
                  the top; the text block gets margin-top:auto to pin it to the
                  bottom of the cell. Both cards' text baselines now align
                  regardless of how their images differ in height.
               3) Keep the 4% spacer tds at their declared width via flex-basis.
               Tablet/mobile CSS overrides both with display:block (stacked),
               so this only applies at desktop. */
            .section-content tr:has(> td.stack-card) {
              display: flex !important;
              flex-direction: row !important;
              align-items: stretch !important;
              width: 100% !important;
            }
            .section-content tr:has(> td.stack-card) > td.stack-card {
              display: flex !important;
              flex-direction: column !important;
              flex: 1 1 0 !important;
            }
            .section-content tr:has(> td.stack-card) > td:not(.stack-card) {
              flex: 0 0 auto !important;
              width: 4% !important;
            }
            .section-content td.stack-card > img {
              flex: 0 0 auto;
              max-width: 100%;
              width: 100%;
              height: auto;
              aspect-ratio: 16 / 9;
              object-fit: cover;
              display: block;
            }
            .section-content td.stack-card > .stack-text {
              margin-top: auto !important;
              width: 100%;
              box-sizing: border-box;
            }
            /* Canvas-only indicator for text elements that have a URL assigned */
            .section-content [data-linked="1"] { cursor: pointer; outline: 1px dotted rgba(0,75,226,0.45); outline-offset: 1px; }

            @keyframes nbl-section-in { from { opacity: 0; } to { opacity: 1; } }

            /* After a Dup Left/Right operation, inline-block sibling tables can cause
               adjacent block-level section tables (e.g. a prior Dup Above clone that has
               width="100%" as an HTML attr but no CSS width override) to appear narrower
               due to a browser mixed block/inline-block layout quirk. Force all direct-child
               tables that are NOT inline-block to 100% width at all viewport sizes. */
            .section-content > table:not([style*="display:inline-block"]):not([style*="display: inline-block"]) { width: 100% !important; }
          `}</style>
          {previewMode !== 'desktop' && (
            <style>{getResponsiveCSS(previewMode)}</style>
          )}

          {sections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 text-[#a0aec0] select-none">
              <div className="w-14 h-14 rounded-full bg-[#f0f4f8] flex items-center justify-center mb-3">
                <GripVertical size={22} className="text-[#cbd5e0]" />
              </div>
              <p className="text-[14px]" style={{ fontWeight: 600, color: '#718096' }}>Drop sections here</p>
              <p className="text-[12px] mt-1 text-[#a0aec0]">Drag from library or double-click to add</p>
            </div>
          )}

          {sections.map((section, index) => {
            const isSelected = selectedId === section.id;
            const hasSelectedChild = isElementInSection(section.elements, selectedElementId);
            const isFeatSec = isFeatureSection(section.libraryCode);
            const isPointHovered = isFeatSec && featureGroupHover?.sectionId === section.id;
            const isToolbarVisible = !hasSelectedChild && !isPointHovered && (isSelected || visibleToolbar === section.id);
            const visGroups = isFeatSec ? getVisibleGroupsInOrder(section.elements) : [];
            const nextHiddenGroup = isFeatSec ? getNextHiddenGroupN(section.elements) : null;

            return (
              <React.Fragment key={section.id + '-' + section.libraryCode}>
                {/* Visual-only drop indicator — drag events handled by section divs */}
                <div className={`transition-all duration-150 pointer-events-none ${dropIdx === index ? 'h-1.5 bg-[#004BE2]' : 'h-0'}`} />

                <div
                  data-section-id={section.id}
                  draggable
                  onDragStart={e => handleSectionDragStart(e, index)}
                  onDragEnd={handleSectionDragEnd}
                  onDragOver={e => handleSectionDragOver(e, index)}
                  className={`relative ${isSelected ? 'ring-2 ring-[#004BE2] ring-inset z-10' : flashedElementIds.includes('section:' + section.id) ? 'ring-2 ring-[#22c55e] ring-inset z-10 transition-all' : 'hover:ring-1 hover:ring-[#93b5f7] ring-inset'} ${dragFrom === index ? 'opacity-30' : ''}`}
                  onClick={e => handleContentClick(e, section.id)}
                  onMouseEnter={() => showToolbar(section.id)}
                  onMouseLeave={() => { scheduleHideToolbar(); if (isFeatSec) scheduleFeatureGroupHide(); }}
                  style={{ marginTop: section.styles.marginTop || 0, marginBottom: section.styles.marginBottom || 0 }}
                >
                  {/* Floating toolbar */}
                  <div
                    className={`section-toolbar absolute -top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-[#1a1a2e] rounded-md shadow-lg px-1.5 py-1 whitespace-nowrap transition-opacity ${
                      isToolbarVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    onMouseEnter={() => showToolbar(section.id)}
                  >
                    {/* Keep the toolbar and section as one continuous pointer interaction zone. */}
                    <div
                      aria-hidden="true"
                      className="absolute top-full left-0 right-0 h-3"
                      onMouseEnter={() => showToolbar(section.id)}
                    />
                    <span className="text-[10px] text-[#a0aec0] px-1 max-w-[140px] truncate" style={{ fontWeight: 500 }}>{section.libraryCode} · {section.name}</span>
                    <div className="w-px h-3.5 bg-[#334155] mx-0.5" />
                    <button onClick={e => { e.stopPropagation(); index > 0 && onMove(index, index - 1); }} disabled={index === 0} className="p-1 text-white/50 hover:text-white disabled:text-white/20 rounded hover:bg-white/10 transition-colors" title="Move Up"><ChevronUp size={13} /></button>
                    <button onClick={e => { e.stopPropagation(); index < sections.length - 1 && onMove(index, index + 1); }} disabled={index === sections.length - 1} className="p-1 text-white/50 hover:text-white disabled:text-white/20 rounded hover:bg-white/10 transition-colors" title="Move Down"><ChevronDown size={13} /></button>
                    <button onClick={e => { e.stopPropagation(); onDuplicate(section.id); }} className="p-1 text-white/50 hover:text-white rounded hover:bg-white/10 transition-colors" title="Duplicate"><Copy size={13} /></button>
                    <div className="w-px h-3.5 bg-[#334155] mx-0.5" />
                    <button onClick={e => { e.stopPropagation(); onRemove(section.id); }} className="p-1 text-white/50 hover:text-[#f87171] rounded hover:bg-white/10 transition-colors" title="Delete"><Trash2 size={13} /></button>
                  </div>

                  {/* Section outer wrapper */}
                  <div style={outerWrapperStyle(section.styles)}>
                    {/* Section inner content */}
                    <div
                      className="section-content"
                      style={{ ...innerContentStyle(section.styles), animation: 'nbl-section-in 150ms ease' }}
                      onMouseOver={(e: React.MouseEvent) => {
                        // Feature group hover (only for feature sections)
                        if (isFeatSec) {
                          const groupEl = (e.target as HTMLElement).closest('[data-feature-group]') as HTMLElement | null;
                          if (groupEl && groupEl.getAttribute('data-feature-hidden') !== 'true') {
                            cancelFeatureHoverHide();
                            const sectionWrap = (e.currentTarget as HTMLElement).closest('[data-section-id]') as HTMLElement;
                            const gRect = groupEl.getBoundingClientRect();
                            const sRect = sectionWrap.getBoundingClientRect();
                            setFeatureGroupHover({
                              sectionId: section.id,
                              groupN: Number(groupEl.getAttribute('data-feature-group')),
                              top: gRect.top - sRect.top + 4,
                              right: sRect.right - gRect.right + 4,
                            });
                          } else if (!groupEl) {
                            scheduleFeatureGroupHide();
                          }
                        }
                      }}
                      onMouseLeave={() => {
                        if (isFeatSec) scheduleFeatureGroupHide();
                      }}
                    >
                      {section.elements.map(el => (
                        <RenderElement
                          key={el.id}
                          el={el}
                          selectedElementId={selectedElementId}
                          flashedElementIds={flashedElementIds}
                          onSelectEl={(elId, e) => {
                            e.stopPropagation();
                            onSelect(section.id);
                            onSelectEl(elId);
                            // Clear feature row controls immediately when any element is selected
                            if (isFeatSec) {
                              setFeatureGroupHover(null);
                            }
                            setVisibleToolbar(null);
                          }}
                          onDoubleClickEl={handleDoubleClickEl}
                          onImageHover={() => {}}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Feature group action bar — shown on hover of each visible group */}
                  {isFeatSec && !hasSelectedChild && featureGroupHover?.sectionId === section.id && (() => {
                    const hoveredSlotN = featureGroupHover.groupN;
                    const isFirst = visGroups.length > 0 && Number(visGroups[0].attrs?.['data-feature-group']) === hoveredSlotN;
                    const showMinus = !isFirst && visGroups.length > 1;
                    const showPlus = nextHiddenGroup !== null;
                    return (
                      <div
                        style={{ position: 'absolute', top: featureGroupHover.top, right: featureGroupHover.right, zIndex: 30, display: 'flex', gap: 4 }}
                        onMouseEnter={cancelFeatureHoverHide}
                        onMouseLeave={scheduleFeatureGroupHide}
                      >
                        {showPlus && (
                          <button
                            title="Add feature after this"
                            onClick={e => { e.stopPropagation(); onAddFeatureGroupAfter(section.id, hoveredSlotN); setFeatureGroupHover(null); }}
                            style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background-color 150ms ease' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.55)')}
                          >
                            <Plus size={12} />
                          </button>
                        )}
                        {showMinus && (
                          <button
                            title="Remove this feature"
                            onClick={e => { e.stopPropagation(); onToggleFeatureGroup(section.id, hoveredSlotN, false); setFeatureGroupHover(null); }}
                            style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background-color 150ms ease' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.55)')}
                          >
                            <Minus size={12} />
                          </button>
                        )}
                        <button
                          title="Drag to reorder"
                          onMouseDown={e => { e.stopPropagation(); handleFeatureDragStart(e, section.id, hoveredSlotN, visGroups); }}
                          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.55)', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background-color 150ms ease' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.55)')}
                        >
                          <GripVertical size={12} />
                        </button>
                      </div>
                    );
                  })()}

                  {/* Feature group drag drop indicator */}
                  {isFeatSec && featureDragOver?.sectionId === section.id && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: featureDragOver.indicatorTop, height: 2, backgroundColor: '#004BE2', zIndex: 31, pointerEvents: 'none' }} />
                  )}
                </div>
              </React.Fragment>
            );
          })}

          {sections.length > 0 && (
            <div className={`transition-all duration-150 pointer-events-none ${dropIdx === sections.length ? 'h-1.5 bg-[#004BE2]' : 'h-0'}`} />
          )}
        </div>
      </div>

      {/* Rich-text mini-toolbar */}
      {richToolbar && (
        <div
          className="fixed z-50 flex items-center gap-0.5 bg-[#1a1a2e] rounded-md shadow-lg px-1.5 py-1 pointer-events-auto select-none"
          style={{ top: richToolbar.top, left: richToolbar.left, transform: 'translateX(-50%)' }}
          onMouseDown={e => e.preventDefault()}
        >
          <button onMouseDown={e => { e.preventDefault(); applyInlineFormat('fontWeight', 'bold'); }}
            className={`w-6 h-6 text-white rounded flex items-center justify-center ${richToolbarActive.bold ? 'bg-white/20' : 'hover:bg-white/10'}`}
            style={{ fontWeight: 700, fontSize: 12 }}>B</button>
          <button onMouseDown={e => { e.preventDefault(); applyInlineFormat('fontStyle', 'italic'); }}
            className={`w-6 h-6 text-white rounded flex items-center justify-center ${richToolbarActive.italic ? 'bg-white/20' : 'hover:bg-white/10'}`}
            style={{ fontStyle: 'italic', fontSize: 12 }}>I</button>
          <button onMouseDown={e => { e.preventDefault(); applyInlineFormat('textDecoration', 'underline'); }}
            className={`w-6 h-6 text-white rounded flex items-center justify-center ${richToolbarActive.underline ? 'bg-white/20' : 'hover:bg-white/10'}`}
            style={{ textDecoration: 'underline', fontSize: 12 }}>U</button>
          <button onMouseDown={e => { e.preventDefault(); applyInlineFormat('textDecoration', 'line-through'); }}
            className={`w-6 h-6 text-white rounded flex items-center justify-center ${richToolbarActive.strikethrough ? 'bg-white/20' : 'hover:bg-white/10'}`}
            style={{ textDecoration: 'line-through', fontSize: 12 }}>S</button>
        </div>
      )}


      {/* Figma-style crop overlay */}
      {cropMode && (() => {
        const cm = cropMode;
        const imgRect = cm.domEl.getBoundingClientRect();

        // Full-image display size under "cover" fit
        const frameAspect = cm.frameW / cm.frameH;
        const imgAspect = cm.naturalW / cm.naturalH;
        let fullDisplayW: number, fullDisplayH: number;
        if (imgAspect > frameAspect) {
          fullDisplayH = imgRect.height;
          fullDisplayW = imgRect.height * imgAspect;
        } else {
          fullDisplayW = imgRect.width;
          fullDisplayH = imgRect.width / imgAspect;
        }
        const offsetX = -(fullDisplayW - imgRect.width) * (cm.panX / 100);
        const offsetY = -(fullDisplayH - imgRect.height) * (cm.panY / 100);

        let isDragging = false;
        let dragStartX = 0, dragStartY = 0;
        let dragStartPanX = cm.panX, dragStartPanY = cm.panY;

        const handlePanStart = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          dragStartPanX = cm.panX;
          dragStartPanY = cm.panY;
          const rangeX = fullDisplayW - imgRect.width;
          const rangeY = fullDisplayH - imgRect.height;

          const onMove = (me: MouseEvent) => {
            if (!isDragging) return;
            const dx = me.clientX - dragStartX;
            const dy = me.clientY - dragStartY;
            const pctDx = rangeX > 0 ? (dx / rangeX) * 100 : 0;
            const pctDy = rangeY > 0 ? (dy / rangeY) * 100 : 0;
            const newPanX = Math.max(0, Math.min(100, dragStartPanX - pctDx));
            const newPanY = Math.max(0, Math.min(100, dragStartPanY - pctDy));
            setCropMode(prev => prev ? { ...prev, panX: Math.round(newPanX), panY: Math.round(newPanY) } : null);
            cm.domEl.style.objectPosition = `${Math.round(newPanX)}% ${Math.round(newPanY)}%`;
          };
          const onUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        };

        const handleResize = (e: React.MouseEvent, handle: string) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX, startY = e.clientY;
          const startW = cm.frameW, startH = cm.frameH;
          const aspect = startW / startH;
          const onMove = (me: MouseEvent) => {
            const dx = me.clientX - startX, dy = me.clientY - startY;
            let newW = startW, newH = startH;
            if (handle.includes('r')) newW = Math.max(30, startW + dx);
            if (handle.includes('l')) newW = Math.max(30, startW - dx);
            if (handle.includes('b')) newH = Math.max(30, startH + dy);
            if (handle.includes('t')) newH = Math.max(30, startH - dy);
            if (handle.length === 2) newH = Math.round(newW / aspect);
            setCropMode(prev => prev ? { ...prev, frameW: Math.round(newW), frameH: Math.round(newH) } : null);
            cm.domEl.style.width = `${Math.round(newW)}px`;
            cm.domEl.style.height = `${Math.round(newH)}px`;
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        };

        const handleApply = () => {
          onPatchElement(cm.sectionId, cm.elId, {
            objectPosition: `${cm.panX}% ${cm.panY}%`,
            objectFit: 'cover',
            width: String(cm.frameW),
            height: String(cm.frameH),
          });
          setCropMode(null);
        };

        const handleCancel = () => {
          cm.domEl.style.objectPosition = '';
          cm.domEl.style.width = '';
          cm.domEl.style.height = '';
          setCropMode(null);
        };

        const HS = 8;
        const handles = [
          { key: 'tl', cursor: 'nwse-resize', top: imgRect.top - HS/2,                        left: imgRect.left - HS/2 },
          { key: 't',  cursor: 'ns-resize',   top: imgRect.top - HS/2,                        left: imgRect.left + imgRect.width/2 - HS/2 },
          { key: 'tr', cursor: 'nesw-resize', top: imgRect.top - HS/2,                        left: imgRect.right - HS/2 },
          { key: 'l',  cursor: 'ew-resize',   top: imgRect.top + imgRect.height/2 - HS/2,     left: imgRect.left - HS/2 },
          { key: 'r',  cursor: 'ew-resize',   top: imgRect.top + imgRect.height/2 - HS/2,     left: imgRect.right - HS/2 },
          { key: 'bl', cursor: 'nesw-resize', top: imgRect.bottom - HS/2,                     left: imgRect.left - HS/2 },
          { key: 'b',  cursor: 'ns-resize',   top: imgRect.bottom - HS/2,                     left: imgRect.left + imgRect.width/2 - HS/2 },
          { key: 'br', cursor: 'nwse-resize', top: imgRect.bottom - HS/2,                     left: imgRect.right - HS/2 },
        ];

        return (
          <>
            {/* Dimmed backdrop */}
            <div className="fixed inset-0 bg-black/30" style={{ zIndex: 40 }} />

            {/* Full uncropped image (dimmed) */}
            <img src={cm.domEl.src} alt="" draggable={false}
              className="pointer-events-none select-none"
              style={{ position: 'fixed', zIndex: 41, opacity: 0.35,
                top: imgRect.top + offsetY, left: imgRect.left + offsetX,
                width: fullDisplayW, height: fullDisplayH }} />

            {/* Crop frame — drag to pan */}
            <div
              className="cursor-grab active:cursor-grabbing"
              style={{ position: 'fixed', zIndex: 42,
                top: imgRect.top, left: imgRect.left,
                width: imgRect.width, height: imgRect.height, overflow: 'hidden' }}
              onMouseDown={handlePanStart}
            >
              <img src={cm.domEl.src} alt="" draggable={false}
                className="pointer-events-none select-none"
                style={{ width: fullDisplayW, height: fullDisplayH,
                  marginLeft: offsetX, marginTop: offsetY }} />
            </div>

            {/* Dashed border */}
            <div className="pointer-events-none"
              style={{ position: 'fixed', zIndex: 43,
                top: imgRect.top, left: imgRect.left,
                width: imgRect.width, height: imgRect.height,
                border: '2px dashed #004BE2' }} />

            {/* Resize handles */}
            {handles.map(h => (
              <div key={h.key}
                className="bg-white border-2 border-[#004BE2] rounded-sm"
                style={{ position: 'fixed', zIndex: 44,
                  width: HS, height: HS, cursor: h.cursor,
                  top: h.top, left: h.left }}
                onMouseDown={e => handleResize(e, h.key)} />
            ))}

            {/* Position indicator */}
            <div className="px-2 py-1 bg-black/70 rounded text-[10px] text-white pointer-events-none"
              style={{ position: 'fixed', zIndex: 45, fontWeight: 500,
                top: imgRect.bottom - 28, left: imgRect.right - 110 }}
            >
              {cm.panX}%, {cm.panY}% · {cm.frameW}×{cm.frameH}
            </div>

            {/* Apply / Cancel */}
            <div className="flex gap-2"
              style={{ position: 'fixed', zIndex: 45,
                top: imgRect.bottom + 10,
                left: imgRect.left + imgRect.width / 2,
                transform: 'translateX(-50%)' }}
            >
              <button onClick={handleApply}
                className="px-4 py-1.5 bg-[#004BE2] text-white rounded-md text-[11px] shadow-lg hover:bg-[#0040c0] transition-colors"
                style={{ fontWeight: 600 }}>Apply</button>
              <button onClick={handleCancel}
                className="px-4 py-1.5 bg-white text-[#4a5568] border border-[#dce1e8] rounded-md text-[11px] shadow-lg hover:bg-[#f7f8fa] transition-colors"
                style={{ fontWeight: 500 }}>Cancel</button>
            </div>
          </>
        );
      })()}

    </div>
  );
}
