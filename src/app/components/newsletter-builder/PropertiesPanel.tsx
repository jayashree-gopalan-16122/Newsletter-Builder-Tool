import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  CanvasSection, SectionElement, ThemeColors, ThemePreset, SectionStyles,
  LibrarySection, FONT_FAMILIES, FONT_WEIGHTS, IMAGE_FIT_MODES, BRAND_COLORS, ApplyScope,
} from './types';
import { THEME_PRESETS } from './sections-data';
import { buildTemplateSections, TEMPLATE_NAMES, CustomTemplate } from './TemplatesDrawer';
import { checkWcagAA } from './store';
import { ElementInfo, newElId } from './html-utils';
import { GradientEditor } from './GradientEditor';
import {
  Palette, Type, Settings, Image as ImageIcon, Link as LinkIcon, Sliders, ChevronDown,
  ChevronRight, Save, Paintbrush, AlertTriangle,
  Copy, Trash2, MoveVertical, Sun, Lock, Unlock, Plus, ImagePlus, Square, LayoutTemplate, X,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from 'lucide-react';

interface Props {
  section: CanvasSection | null;
  elementInfo: ElementInfo | null;
  themeColors: ThemeColors;
  customPresets: ThemePreset[];
  onUpdateStyles: (id: string, styles: Partial<SectionStyles>) => void;
  onUpdateStylesLive: (id: string, styles: Partial<SectionStyles>) => void;
  onUpdateHtml: (id: string, html: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onApplyTheme: (colors: ThemeColors) => void;
  onSetThemeColors: (colors: ThemeColors) => void;
  onSaveTheme: (name: string) => void;
  onDeleteCustomPreset: (id: string) => void;
  onSaveTemplate: (name: string) => void;
  library: LibrarySection[];
  activeBuiltinTemplate: number | null;
  activeCustomTemplateId: string | null;
  customTemplates: CustomTemplate[];
  onSelectBuiltinTemplate: (idx: number, sections: LibrarySection[]) => void;
  onSelectCustomTemplate: (tpl: CustomTemplate) => void;
  onDeleteCustomTemplate: (id: string) => void;
  onUpdateElement: (changes: Partial<Record<string, string>>) => void;
  onUpdateElementCommit: (changes: Partial<Record<string, string>>) => void;
  onDeleteElement: () => void;
  onDuplicateElement: (direction?: 'above' | 'below' | 'left' | 'right') => void;
  onReplaceElement: (newElement: SectionElement) => void;
  onPatchElement: (sectionId: string, elId: string, changes: Partial<Record<string, string>>) => void;
  onBatchPatchElements: (patches: Array<{sectionId: string; elId: string; changes: Record<string, string>}>) => void;
  canvasLength: number;
  getSelectedElement: () => SectionElement | null;
  onApplyStylesGlobally: (sourceSectionId: string, styles: Partial<SectionStyles>, scope: ApplyScope) => number;
  onApplyElementGlobally: (sourceSectionId: string, sourceElementId: string, changes: Partial<Record<string, string>>, scope: ApplyScope) => number;
  selectedElementId: string | null;
  activeTab: 'properties' | 'theme';
  onSetTab: (t: 'properties' | 'theme') => void;
  allSections: CanvasSection[];
  onBulkReset: (snapshot: CanvasSection[]) => void;
}

// ─── WCAG extraction helpers ─────────────────────────────────

function colorToHex(color: string | undefined): string | null {
  if (!color) return null;
  const c = color.trim();
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(c)) return ('#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3]).toLowerCase();
  const m = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (m) {
    if (m[4] !== undefined && parseFloat(m[4]) < 0.15) return null;
    return ('#' +
      parseInt(m[1]).toString(16).padStart(2,'0') +
      parseInt(m[2]).toString(16).padStart(2,'0') +
      parseInt(m[3]).toString(16).padStart(2,'0')
    ).toLowerCase();
  }
  return null;
}

interface WcagPair { label: string; fg: string; bg: string; large: boolean }

function extractWcagPairs(section: CanvasSection): WcagPair[] {
  const pairs: WcagPair[] = [];
  const seen = new Set<string>();

  const add = (label: string, fg: string | null, bg: string | null, large: boolean) => {
    if (!fg || !bg || fg === bg) return;
    const key = `${fg}|${bg}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ label, fg, bg, large });
  };

  const TEXT_TAGS = new Set(['p','h1','h2','h3','h4','h5','h6','span','a','li','div','td','th']);

  const isLarge = (el: SectionElement) => {
    if (el.tag === 'h1' || el.tag === 'h2') return true;
    const fw = el.styles?.fontWeight || '';
    const fs = parseFloat(el.styles?.fontSize || '0');
    return (fw === 'bold' || parseInt(fw) >= 600) || fs >= 18;
  };

  const tagLabel = (tag: string) => {
    if (tag === 'h1') return 'H1 Heading';
    if (tag === 'h2') return 'H2 Heading';
    if (tag === 'h3') return 'Subheading';
    if (tag === 'h4' || tag === 'h5' || tag === 'h6') return 'Small heading';
    if (tag === 'p') return 'Body text';
    if (tag === 'a') return 'Link';
    if (tag === 'li') return 'List item';
    return 'Text';
  };

  // Determine root background: section-level style first, then first bg found in element tree
  let rootBg = colorToHex(section.styles.backgroundColor);
  if (!rootBg) {
    const findBg = (els: SectionElement[]): string | null => {
      for (const el of els) {
        const b = colorToHex(el.styles?.backgroundColor) || colorToHex(el.styles?.background);
        if (b) return b;
        if (el.children?.length) { const r = findBg(el.children); if (r) return r; }
      }
      return null;
    };
    rootBg = findBg(section.elements) || '#ffffff';
  }

  const walk = (els: SectionElement[], parentBg: string) => {
    for (const el of els) {
      const elBg = colorToHex(el.styles?.backgroundColor) || colorToHex(el.styles?.background);
      const activeBg = elBg || parentBg;

      if (el.type === 'button') {
        const bBg = colorToHex(el.styles?.backgroundColor) || colorToHex(el.styles?.background);
        const bFg = colorToHex(el.styles?.color);
        add('Button text on Button BG', bFg, bBg, false);
      } else if (TEXT_TAGS.has(el.tag) && el.styles?.color) {
        const fg = colorToHex(el.styles.color);
        const large = isLarge(el);
        const bgCtx = activeBg === rootBg ? 'BG' : 'Container';
        add(`${tagLabel(el.tag)} on ${bgCtx}`, fg, activeBg, large);
      }

      if (el.children?.length) walk(el.children, activeBg);
    }
  };

  walk(section.elements, rootBg);
  return pairs;
}

// ─── UI Primitives ────────────────────────────────────────────

// ─── Bulk Apply helpers ───────────────────────────────────────

interface BulkPropGroup {
  id: string;
  keys: string[];
  label: string;
  displayValue: string;
}

function fmtBulkNum(v: string): string { return v ? v.replace(/px$/, '') + 'px' : '—'; }
function fmtBulkFont(v: string): string { return v?.split(',')[0]?.replace(/'/g, '').trim() || ''; }
const BULK_WEIGHT_LABELS: Record<string, string> = {
  '100': 'Thin', '300': 'Light', '400': 'Regular', '500': 'Medium',
  '600': 'Semibold', '700': 'Bold', '800': 'Extrabold', '900': 'Black',
};
function fmtBulkWeight(v: string): string { return BULK_WEIGHT_LABELS[v?.trim()] || v || '—'; }
const BULK_ALIGN_LABELS: Record<string, string> = { left: 'Left', center: 'Center', right: 'Right', justify: 'Justify' };
function fmtBulkAlign(v: string): string { return BULK_ALIGN_LABELS[v?.toLowerCase()] || v || '—'; }
function fmtBulkOpacity(v: string): string { return Math.round((parseFloat(v) || 1) * 100) + '%'; }
function fmtBulkBorderWidth(v: string): string { return (v && v !== '0px' && v !== '0') ? fmtBulkNum(v) : 'Off'; }

function getPropsForElModal(el: SectionElement, ei: ElementInfo): BulkPropGroup[] {
  const s = el.styles;
  const opacity: BulkPropGroup = { id: 'opacity', keys: ['opacity'], label: 'Opacity', displayValue: fmtBulkOpacity(ei.opacity) };
  const paddingProps: BulkPropGroup[] = [
    { id: 'paddingTop',    keys: ['paddingTop'],    label: 'Top Padding',    displayValue: fmtBulkNum(s.paddingTop || '') },
    { id: 'paddingBottom', keys: ['paddingBottom'], label: 'Bottom Padding', displayValue: fmtBulkNum(s.paddingBottom || '') },
    { id: 'paddingLeft',   keys: ['paddingLeft'],   label: 'Left Padding',   displayValue: fmtBulkNum(s.paddingLeft || '') },
    { id: 'paddingRight',  keys: ['paddingRight'],  label: 'Right Padding',  displayValue: fmtBulkNum(s.paddingRight || '') },
  ];
  const borderProps: BulkPropGroup[] = [
    { id: 'borderWidth',  keys: ['borderWidth'],  label: 'Border Thickness', displayValue: fmtBulkBorderWidth(s.borderWidth || '') },
    { id: 'borderColor',  keys: ['borderColor'],  label: 'Border Color',     displayValue: s.borderColor || '—' },
    { id: 'borderStyle',  keys: ['borderStyle'],  label: 'Border Style',     displayValue: s.borderStyle || '—' },
    { id: 'borderRadius', keys: ['borderRadius'], label: 'Roundness',        displayValue: fmtBulkNum(s.borderRadius || '') },
  ];

  if (el.type === 'text' || el.type === 'link') {
    return [
      { id: 'font',       keys: ['fontFamily'], label: 'Font',        displayValue: fmtBulkFont(ei.fontFamily) || '—' },
      { id: 'size',       keys: ['fontSize'],   label: 'Size',        displayValue: fmtBulkNum(ei.fontSize) },
      { id: 'color',      keys: ['color'],       label: 'Color',       displayValue: ei.color || '—' },
      { id: 'weight',     keys: ['fontWeight'], label: 'Weight',      displayValue: fmtBulkWeight(ei.fontWeight) },
      { id: 'align',      keys: ['textAlign'],  label: 'Align',       displayValue: fmtBulkAlign(ei.textAlign) },
      { id: 'lineHeight', keys: ['lineHeight'], label: 'Line Height', displayValue: ei.lineHeight || '—' },
      opacity,
      ...paddingProps,
      ...borderProps,
    ];
  }
  if (el.type === 'button') {
    return [
      { id: 'font',       keys: ['fontFamily'],     label: 'Font',             displayValue: fmtBulkFont(ei.fontFamily) || '—' },
      { id: 'size',       keys: ['fontSize'],        label: 'Size',             displayValue: fmtBulkNum(ei.fontSize) },
      { id: 'color',      keys: ['color'],            label: 'Text Color',       displayValue: ei.color || '—' },
      { id: 'weight',     keys: ['fontWeight'],      label: 'Weight',           displayValue: fmtBulkWeight(ei.fontWeight) },
      { id: 'bgColor',    keys: ['backgroundColor'], label: 'Background Color', displayValue: ei.backgroundColor || '—' },
      { id: 'borderRadius', keys: ['borderRadius'],  label: 'Border Radius',    displayValue: fmtBulkNum(s.borderRadius || '') },
      ...paddingProps,
      { id: 'borderWidth', keys: ['borderWidth'], label: 'Border Thickness', displayValue: fmtBulkBorderWidth(s.borderWidth || '') },
      { id: 'borderColor', keys: ['borderColor'], label: 'Border Color',     displayValue: s.borderColor || '—' },
      { id: 'borderStyle', keys: ['borderStyle'], label: 'Border Style',     displayValue: s.borderStyle || '—' },
    ];
  }
  if (el.type === 'image') {
    return [
      { id: 'borderRadius', keys: ['borderRadius'], label: 'Border Radius', displayValue: fmtBulkNum(s.borderRadius || '') },
      { id: 'borderWidth',  keys: ['borderWidth'],  label: 'Border Thickness', displayValue: fmtBulkBorderWidth(s.borderWidth || '') },
      { id: 'borderColor',  keys: ['borderColor'],  label: 'Border Color',   displayValue: s.borderColor || '—' },
      { id: 'borderStyle',  keys: ['borderStyle'],  label: 'Border Style',   displayValue: s.borderStyle || '—' },
      opacity,
      ...paddingProps,
    ];
  }
  if (el.type === 'icon') {
    const iconSize = s.fontSize || s.width || '';
    return [
      { id: 'size',  keys: ['fontSize', 'width', 'height'], label: 'Size',  displayValue: fmtBulkNum(iconSize) },
      { id: 'color', keys: ['color'],                         label: 'Color', displayValue: ei.color || '—' },
      opacity,
      ...paddingProps,
      ...borderProps,
    ];
  }
  if (el.type === 'container') {
    const bg = s.background || '';
    return [
      { id: 'bgColor',    keys: ['backgroundColor'], label: 'Background Color',    displayValue: s.backgroundColor || '—' },
      { id: 'bgGradient', keys: ['background'],       label: 'Background Gradient', displayValue: bg.includes('gradient') ? 'Custom' : 'None' },
      opacity,
      ...paddingProps,
      ...borderProps,
    ];
  }
  return [];
}

const SECTION_PRECHECKED: Record<string, string[]> = {
  'Typography':       ['font', 'size', 'color', 'weight', 'align', 'lineHeight'],
  'Background':       ['bgColor', 'bgGradient'],
  'Background Color': ['bgColor'],
  'Rounded Corners':  ['borderRadius'],
  'Appearance':       ['opacity'],
  'Padding':          ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
  'Border':           ['borderWidth', 'borderColor', 'borderStyle', 'borderRadius'],
  'Image':            ['borderRadius', 'borderWidth', 'borderColor', 'borderStyle', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
  'Icon':             ['size', 'color'],
};

function findElsByType(elements: SectionElement[], type: string): SectionElement[] {
  const result: SectionElement[] = [];
  const walk = (els: SectionElement[]) => {
    for (const el of els) {
      if (el.type === type) result.push(el);
      if (el.children?.length) walk(el.children);
    }
  };
  walk(elements);
  return result;
}

// ─── Bulk Apply Modal ─────────────────────────────────────────

interface BulkModalProps {
  sectionTitle: string;
  anchorRect: DOMRect;
  el: SectionElement;
  elementInfo: ElementInfo;
  section: CanvasSection;
  allSections: CanvasSection[];
  masterSnapshotRef: React.MutableRefObject<CanvasSection[] | null>;
  bulkApplyDone: boolean;
  onBulkApplyDone: () => void;
  onBatchPatch: (patches: Array<{ sectionId: string; elId: string; changes: Record<string, string> }>) => void;
  onBulkReset: (snapshot: CanvasSection[]) => void;
  onClose: () => void;
  onShowSuccessToast: (count: number) => void;
  onShowRevertToast: () => void;
}

function BulkApplyModal({
  sectionTitle, anchorRect, el, elementInfo, section, allSections, masterSnapshotRef,
  bulkApplyDone, onBulkApplyDone, onBatchPatch, onBulkReset, onClose,
  onShowSuccessToast, onShowRevertToast,
}: BulkModalProps) {
  const propDefs = getPropsForElModal(el, elementInfo);
  const preCheckedIds = SECTION_PRECHECKED[sectionTitle] ?? propDefs.map(p => p.id);
  const [scope, setScope] = useState<'section' | 'all' | null>(null);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(propDefs.filter(p => preCheckedIds.includes(p.id)).map(p => p.id)));
  const popoverRef = useRef<HTMLDivElement>(null);

  const allChecked = propDefs.length > 0 && propDefs.every(p => checked.has(p.id));
  const noneChecked = checked.size === 0;
  const canApply = scope !== null && !noneChecked;

  const toggleAll = () => {
    setChecked(allChecked ? new Set() : new Set(propDefs.map(p => p.id)));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleApply = () => {
    if (!canApply) return;
    if (!masterSnapshotRef.current) {
      masterSnapshotRef.current = JSON.parse(JSON.stringify(allSections));
    }
    const changes: Record<string, string> = {};
    for (const p of propDefs) {
      if (!checked.has(p.id)) continue;
      for (const key of p.keys) {
        const v = (el.styles as any)[key];
        if (v !== undefined && v !== '') changes[key] = v;
      }
    }
    const targetSections = scope === 'section' ? [section] : allSections;
    const patches: Array<{ sectionId: string; elId: string; changes: Record<string, string> }> = [];
    for (const sec of targetSections) {
      for (const target of findElsByType(sec.elements, el.type)) {
        patches.push({ sectionId: sec.id, elId: target.id, changes });
      }
    }
    onBatchPatch(patches);
    onBulkApplyDone();
    onShowSuccessToast(patches.length);
    onClose();
  };

  const handleReset = () => {
    if (!masterSnapshotRef.current) return;
    onBulkReset(masterSnapshotRef.current);
    masterSnapshotRef.current = null;
    onShowRevertToast();
    onClose();
  };

  const sectionColor = '#2563EB';

  return createPortal(
    (() => {
      const POPOVER_WIDTH = 320;
      const POPOVER_EST_HEIGHT = 500;
      const openAbove = anchorRect.bottom + POPOVER_EST_HEIGHT > window.innerHeight;
      const right = window.innerWidth - anchorRect.right;
      const caretStyle: React.CSSProperties = {
        position: 'absolute',
        width: 12, height: 12,
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        borderLeft: '1px solid #E5E7EB',
        transform: openAbove ? 'rotate(225deg)' : 'rotate(45deg)',
        right: 12,
        ...(openAbove ? { bottom: -7 } : { top: -7 }),
      };
      const posStyle: React.CSSProperties = openAbove
        ? { bottom: window.innerHeight - anchorRect.top + 8, maxHeight: anchorRect.top - 24 }
        : { top: anchorRect.bottom + 8, maxHeight: window.innerHeight - anchorRect.bottom - 24 };
      return (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed', right,
            width: POPOVER_WIDTH,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            background: 'white', border: '1px solid #E5E7EB',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            padding: 20, zIndex: 99999,
            ...posStyle,
          }}
        >
          {/* Fixed header — never scrolls */}
          <div style={{ flexShrink: 0 }}>
            <div style={caretStyle} />
            {/* Header */}
            <div style={{ fontSize: 14, color: '#111827', fontWeight: 600, marginBottom: 16 }}>
              Apply <span style={{ color: sectionColor }}>{sectionTitle}</span> style to:
            </div>

            {/* Scope */}
            {(['section', 'all'] as const).map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 0', marginBottom: s === 'section' ? 5 : 0 }}>
                <div
                  onClick={() => setScope(s)}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: scope === s ? '5px solid #2563EB' : '1.5px solid #9CA3AF', cursor: 'pointer', flexShrink: 0, background: 'white', boxSizing: 'border-box' }}
                />
                <span onClick={() => setScope(s)} style={{ fontSize: 14, color: '#111827', userSelect: 'none' }}>
                  {s === 'section' ? 'This section' : 'Entire newsletter'}
                </span>
              </label>
            ))}

            <div style={{ height: 1, background: '#F3F4F6', margin: '16px 0' }} />

            {/* Properties label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Which properties?</span>
              <button type="button" onClick={toggleAll}
                style={{ background: 'none', border: 'none', fontSize: 12, color: '#2563EB', cursor: 'pointer', padding: 0 }}>
                {allChecked ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          </div>

          {/* Scrollable checkbox list only */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
            {propDefs.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 0' }}>
                <input
                  type="checkbox"
                  checked={checked.has(p.id)}
                  onChange={() => setChecked(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                  style={{ width: 15, height: 15, accentColor: '#2563EB', cursor: 'pointer', borderRadius: 4, flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{p.label}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto', flexShrink: 0, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ({p.displayValue})
                </span>
              </label>
            ))}
          </div>

          {/* Fixed footer — never scrolls */}
          <div style={{ flexShrink: 0, marginTop: 0, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', position: 'relative', zIndex: 1 }}>
            <div>
              {bulkApplyDone && masterSnapshotRef.current && (
                <button type="button" onClick={handleReset}
                  style={{ background: 'none', border: 'none', fontSize: 13, color: '#DC2626', fontWeight: 500, cursor: 'pointer', padding: 0, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                  Reset all changes
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              style={{
                background: canApply ? '#2563EB' : '#E5E7EB',
                color: canApply ? 'white' : '#9CA3AF',
                border: 'none', borderRadius: 8, padding: '8px 20px',
                fontSize: 13, fontWeight: 600,
                cursor: canApply ? 'pointer' : 'not-allowed',
              }}>
              Apply
            </button>
          </div>
        </div>
      );
    })(),
    document.body
  );
}

// ─── Collapse component ───────────────────────────────────────

function Collapse({ title, icon, children, defaultOpen = true, applyPropKeys, onOpen, onBulkApply }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
  /** If provided, renders a chain icon in the header. When any of these keys is
   *  dirty (user changed them since selecting this section/element), clicking
   *  the icon propagates ALL dirty ones across the entire canvas. */
  applyPropKeys?: string[];
  /** Called with the root element whenever the section transitions closed → open. */
  onOpen?: (el: HTMLDivElement | null) => void;
  /** When provided, renders a bulk-apply icon button before the chevron. */
  onBulkApply?: (rect: DOMRect) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(defaultOpen); }, [defaultOpen]);

  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div ref={rootRef} className="border-b border-[#edf0f4]">
      <div className="w-full flex items-center gap-1.5 px-3 py-2.5 text-[12px] text-[#4a5568] hover:bg-[#f8f9fb] transition-colors" style={{ fontWeight: 600 }}>
        <button type="button" onClick={() => { if (!open) onOpen?.(rootRef.current); setOpen(!open); }} className="flex items-center gap-1.5 flex-1 min-w-0 text-left text-[12px]" style={{ fontWeight: 600 }}>
          <span className="text-[#718096]">{icon}</span>{title}
        </button>
        {onBulkApply && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onBulkApply((e.currentTarget as HTMLButtonElement).getBoundingClientRect()); }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#2563EB';
              (e.currentTarget as HTMLElement).style.backgroundColor = '#EFF6FF';
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
              tooltipTimerRef.current = setTimeout(() => {
                setTooltipPos({ x: rect.right, y: rect.bottom + 6 });
              }, 500);
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#9CA3AF';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
              setTooltipPos(null);
            }}
            style={{ background: 'transparent', border: 'none', padding: 3, borderRadius: 4, cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            title=""
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 4V3a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        <button type="button" onClick={() => { if (!open) onOpen?.(rootRef.current); setOpen(!open); }} className="text-[#a0aec0] flex items-center">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>
      {open && <div className="px-3 pb-3 space-y-2.5">{children}</div>}
      {tooltipPos && createPortal(
        <div style={{ position: 'fixed', top: tooltipPos.y, right: window.innerWidth - tooltipPos.x, zIndex: 999999, background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: 11, borderRadius: 4, padding: '4px 8px', pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          Apply to section or newsletter
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Apply-to-all-similar: context + wrapper ──────────────────

interface ApplyContextValue {
  /** Mark one or more property keys as "dirty" (user has changed them this selection). */
  markDirty: (keys: string[]) => void;
  /** Is this property key currently dirty? */
  isDirty: (key: string) => boolean;
  /** Apply-to-all handler. Returns number affected. */
  applyNow: (propKeys: string[], scope: ApplyScope) => number;
  /** What kind of apply is this? Drives popover copy + scope options. */
  mode: 'section' | 'element';
  /** True when there is a valid target (section selected for 'section' mode, element for 'element'). */
  ready: boolean;
}

const ApplyCtx = React.createContext<ApplyContextValue | null>(null);

/**
 * Kept as a pass-through wrapper for backwards compatibility with all existing
 * call sites. The "apply to all similar" chain icon is no longer rendered here
 * — it now lives once in the parent Collapse header (via its applyPropKeys
 * prop), applying all dirty fields in that section together.
 *
 * The propKeys param is still documented for each call site so it's obvious
 * which keys each Collapse's aggregated applyPropKeys should contain.
 */
function FieldWithApply({ children }: { propKeys: string[]; children: React.ReactNode }) {
  return <>{children}</>;
}

/** A bare numeric <input> that buffers user typing in local state and only
 *  fires onCommitValue when the user hits Enter, Tab, or blurs the field.
 *  Used by the W/H controls in the Image and Icon panels where live updates
 *  during typing distorted the canvas image (typing 5 → 50 → 500 would
 *  render the image at each intermediate value, and aspect-locked sibling
 *  fields would clear immediately when the first digit was typed). The
 *  parent owns the canonical value via the `value` prop; the local state
 *  is overwritten on every external value change so undo/redo and other
 *  sources of truth stay in sync. */
function BufferedNumInput({ value, onCommitValue, className }: {
  value: number; onCommitValue: (v: number) => void; className?: string;
}) {
  const [local, setLocal] = useState(value ? String(value) : '');
  useEffect(() => { setLocal(value ? String(value) : ''); }, [value]);
  const apply = (raw: string) => {
    const v = parseFloat(raw) || 0;
    if (v !== value) onCommitValue(v);
  };
  return (
    <input type="number"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={e => apply(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          apply((e.target as HTMLInputElement).value);
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Tab') {
          apply((e.target as HTMLInputElement).value);
        } else if (e.key === 'Escape') {
          setLocal(value ? String(value) : '');
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className} />
  );
}

function NumField({ label, value, onChange, onCommit, suffix = 'px', min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; onCommit?: (v?: number) => void; suffix?: string; min?: number; max?: number; step?: number;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value]);
  // Commit only on Enter/Tab/Blur — NOT on every keystroke. Live updates were
  // distorting images mid-typing (500 → backspace to 50 would push the canvas
  // through the intermediate 50 value and re-render the image at 50px before
  // the user finished typing) and clearing aspect-locked sibling fields the
  // moment a digit was typed. We pass the parsed new value to onCommit so
  // callers can build new state from the current input rather than relying
  // on captured-stale values from their render scope.
  const apply = (raw: string) => {
    const n = parseFloat(raw) || 0;
    onChange(n);
    onCommit?.(n);
  };
  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-[#718096] w-20 shrink-0 select-none">{label}</label>
      <input type="text" inputMode="numeric" value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={e => apply(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            apply((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Tab') {
            apply((e.target as HTMLInputElement).value);
          } else if (e.key === 'Escape') {
            setLocal(String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-16 max-w-[64px] px-2 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] text-right outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
      <span className="text-[11px] text-[#a0aec0] w-4 shrink-0">{suffix}</span>
    </div>
  );
}

function CompactNumField({ label, value, onChange, onCommit, suffix = 'px', min, max, step = 1 }: {
  label: React.ReactNode; value: number; onChange: (v: number) => void; onCommit?: (v?: number) => void; suffix?: string; min?: number; max?: number; step?: number;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value]);
  const apply = (raw: string) => {
    const n = parseFloat(raw) || 0;
    onChange(n);
    onCommit?.(n);
  };
  return (
    <div className="flex items-center gap-1">
      <label className="text-[11px] text-[#718096] w-[52px] shrink-0 select-none leading-tight">{label}</label>
      <input type="text" inputMode="numeric" value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={e => apply(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            apply((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Tab') {
            apply((e.target as HTMLInputElement).value);
          } else if (e.key === 'Escape') {
            setLocal(String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-[46px] px-1.5 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] text-right outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
      <span className="text-[11px] text-[#a0aec0] shrink-0">{suffix}</span>
    </div>
  );
}

function ColorField({ label, value, onChange, onCommit }: {
  label: string; value: string; onChange: (v: string) => void; onCommit?: () => void;
}) {
  const parseColor = (v: string): { hex: string; opacity: number } => {
    if (!v) return { hex: '', opacity: 100 };
    const rgba = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (rgba) {
      const r = parseInt(rgba[1]), g = parseInt(rgba[2]), b = parseInt(rgba[3]);
      const a = rgba[4] !== undefined ? Math.round(parseFloat(rgba[4]) * 100) : 100;
      return { hex: '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''), opacity: a };
    }
    if (v.startsWith('#')) return { hex: v.length === 4 ? '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3] : v, opacity: 100 };
    return { hex: '', opacity: 100 };
  };
  const initial = parseColor(value);
  const [hex, setHex] = useState(initial.hex);
  const [opacity, setOpacity] = useState(initial.opacity);
  useEffect(() => { const p = parseColor(value); setHex(p.hex); setOpacity(p.opacity); }, [value]);

  const buildColor = (h: string, op: number): string => {
    if (op >= 100) return h;
    if (!h.startsWith('#') || h.length < 7) return h;
    const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${(op / 100).toFixed(2)})`;
  };

  return (
    <div className="flex items-center gap-1.5">
      <label className="text-[11px] text-[#718096] w-16 shrink-0 select-none">{label}</label>
      {hex ? (
        <input type="color" value={hex.startsWith('#') && hex.length >= 7 ? hex.slice(0, 7) : '#ffffff'}
          onChange={e => { setHex(e.target.value); onChange(buildColor(e.target.value, opacity)); }}
          onBlur={onCommit}
          className="w-5 h-5 rounded border border-[#dce1e8] cursor-pointer shrink-0 p-0" />
      ) : (
        <div className="relative w-5 h-5 shrink-0">
          <input type="color" value="#ffffff"
            onChange={e => { setHex(e.target.value); onChange(buildColor(e.target.value, opacity)); }}
            onBlur={onCommit}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer p-0 border-0"
          />
          <div className="w-5 h-5 rounded border border-dashed border-[#a0aec0] flex items-center justify-center pointer-events-none">
            <Plus size={8} className="text-[#a0aec0]" />
          </div>
        </div>
      )}
      {/* Eyedropper — uses browser EyeDropper API (Chrome/Edge only) */}
      {'EyeDropper' in window && (
        <button
          type="button"
          title="Pick color from screen"
          onClick={async () => {
            try {
              const dropper = new (window as any).EyeDropper();
              const result = await dropper.open();
              if (result?.sRGBHex) {
                setHex(result.sRGBHex);
                setOpacity(100);
                onChange(result.sRGBHex);
                onCommit?.();
              }
            } catch {
              // User cancelled or API not supported
            }
          }}
          className="w-5 h-5 rounded border border-[#dce1e8] bg-[#f7f8fa] hover:bg-[#e2e7ee] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#718096]">
            <path d="m2 22 1-1h3l9-9"/>
            <path d="M3 21v-3l9-9"/>
            <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>
          </svg>
        </button>
      )}
      <input type="text" value={hex}
        onChange={e => setHex(e.target.value)}
        onBlur={e => { onChange(buildColor(e.target.value, opacity)); onCommit?.(); }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onChange(buildColor((e.target as HTMLInputElement).value, opacity));
            onCommit?.();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Tab') {
            onChange(buildColor((e.target as HTMLInputElement).value, opacity));
            onCommit?.();
          } else if (e.key === 'Escape') {
            const p = parseColor(value); setHex(p.hex);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="flex-1 min-w-0 px-1.5 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] font-mono outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
      <input type="text" inputMode="numeric" value={String(opacity)}
        onChange={e => { const op = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)); setOpacity(op); }}
        onBlur={e => { const op = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)); onChange(buildColor(hex, op)); onCommit?.(); }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            const op = Math.max(0, Math.min(100, parseInt((e.target as HTMLInputElement).value) || 0));
            onChange(buildColor(hex, op)); onCommit?.();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Tab') {
            const op = Math.max(0, Math.min(100, parseInt((e.target as HTMLInputElement).value) || 0));
            onChange(buildColor(hex, op)); onCommit?.();
          } else if (e.key === 'Escape') {
            const p = parseColor(value); setOpacity(p.opacity);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-9 shrink-0 px-1 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] text-right outline-none focus:border-[#004BE2]" />
      <span className="text-[11px] text-[#a0aec0] shrink-0">%</span>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-[#718096] w-20 shrink-0 select-none">{label}</label>
      <div className="relative flex-1 min-w-0">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-2 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20 appearance-none cursor-pointer pr-6">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a0aec0] pointer-events-none" />
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, onCommit, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; onCommit?: () => void; placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  // Same commit-on-Enter/Tab/Blur model as NumField — see NumField for rationale.
  const apply = (v: string) => { onChange(v); onCommit?.(); };
  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-[#718096] w-20 shrink-0 select-none">{label}</label>
      <input type="text" value={local} placeholder={placeholder}
        onChange={e => setLocal(e.target.value)}
        onBlur={e => apply(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            apply((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Tab') {
            apply((e.target as HTMLInputElement).value);
          } else if (e.key === 'Escape') {
            setLocal(value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="flex-1 min-w-0 px-2 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
    </div>
  );
}

function BrandSwatches({ onSelect }: { onSelect: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {BRAND_COLORS.map((c, i) => (
        <button key={`${c}-${i}`} onClick={() => onSelect(c)}
          className="w-[18px] h-[18px] rounded border border-[#dce1e8] hover:scale-125 transition-transform cursor-pointer"
          style={{ backgroundColor: c }} title={c} />
      ))}
    </div>
  );
}

// ─── Background color helpers ─────────────────────────────────
function rgbToHex(rgb: string | null | undefined): string | null {
  if (!rgb || rgb === 'transparent') return null;
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
  if (alpha === 0) return null;
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return '#' + r + g + b;
}

// ─── Element Border Controls (reusable) ───────────────────────
function ElementBorderControls({ info, onUpdate, onCommit, onBulkApply }: {
  info: ElementInfo; onUpdate: (c: Partial<Record<string, string>>) => void; onCommit: (c: Partial<Record<string, string>>) => void;
  onBulkApply?: (rect: DOMRect) => void;
}) {
  const px = (s: string) => parseInt(s) || 0;
  const borderEnabled = px(info.borderWidth) > 0;
  const [open, setOpen] = useState(true);
  const enable = () => onCommit({ borderWidth: '1px', borderStyle: info.borderStyle || 'solid', borderColor: info.borderColor || '#e2e8f0', borderImageSource: '' });
  const disable = () => onCommit({ borderWidth: '0px', borderColor: '', borderStyle: '', borderImageSource: '' });

  const [borderTooltipPos, setBorderTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const borderTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-open when border is enabled via the toggle
  useEffect(() => { if (borderEnabled) setOpen(true); }, [borderEnabled]);

  return (
    <div className="border-b border-[#edf0f4]">
      <div className="w-full flex items-center gap-1.5 px-3 py-2.5 text-[12px] text-[#4a5568] hover:bg-[#f8f9fb] transition-colors" style={{ fontWeight: 600 }}>
        <button type="button" onClick={() => setOpen(v => !v)} className="flex items-center gap-1.5 flex-1 min-w-0 text-left text-[12px]" style={{ fontWeight: 600 }}>
          <span className="text-[#718096]"><Square size={13} /></span>Border
        </button>
        {onBulkApply && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onBulkApply((e.currentTarget as HTMLButtonElement).getBoundingClientRect()); }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#2563EB';
              (e.currentTarget as HTMLElement).style.backgroundColor = '#EFF6FF';
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              if (borderTooltipTimerRef.current) clearTimeout(borderTooltipTimerRef.current);
              borderTooltipTimerRef.current = setTimeout(() => {
                setBorderTooltipPos({ x: rect.right, y: rect.bottom + 6 });
              }, 500);
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#9CA3AF';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              if (borderTooltipTimerRef.current) clearTimeout(borderTooltipTimerRef.current);
              setBorderTooltipPos(null);
            }}
            style={{ background: 'transparent', border: 'none', padding: 3, borderRadius: 4, cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 4V3a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        {/* Inline CSS toggle — thumb always stays inside the pill */}
        <div
          onClick={e => { e.stopPropagation(); borderEnabled ? disable() : enable(); }}
          title={borderEnabled ? 'Disable border' : 'Enable border'}
          style={{ width: 36, height: 20, borderRadius: 999, backgroundColor: borderEnabled ? '#2563EB' : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s ease', flexShrink: 0 }}
        >
          <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ffffff', position: 'absolute', top: 2, left: borderEnabled ? 18 : 2, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <button type="button" onClick={() => setOpen(v => !v)} className="text-[#a0aec0] flex items-center">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>
      {borderTooltipPos && createPortal(
        <div style={{ position: 'fixed', top: borderTooltipPos.y, right: window.innerWidth - borderTooltipPos.x, zIndex: 999999, background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: 11, borderRadius: 4, padding: '4px 8px', pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          Apply to section or newsletter
        </div>,
        document.body
      )}
      {open && (
        <div className={`px-3 pb-3 space-y-2.5 transition-opacity ${!borderEnabled ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          <NumField label="Thickness" value={px(info.borderWidth)}
            onChange={v => onUpdate({ borderWidth: `${v}px` })}
            onCommit={() => onCommit({})} min={0} />
          <ColorField label="Color" value={info.borderColor || '#e2e8f0'}
            onChange={v => onUpdate({ borderColor: v })}
            onCommit={() => onCommit({})} />
          <SelectField label="Style" value={info.borderStyle || 'solid'}
            options={[{ label: 'Solid', value: 'solid' }, { label: 'Dashed', value: 'dashed' }, { label: 'Dotted', value: 'dotted' }]}
            onChange={v => onCommit({ borderStyle: v })} />
          <NumField label="Roundness" value={px(info.borderRadius)}
            onChange={v => onUpdate({ borderRadius: `${v}px` })}
            onCommit={() => onCommit({})} min={0} />
        </div>
      )}
    </div>
  );
}

// ─── Drop Shadow Editor ────────────────────────────────────────
function DropShadowSection({ info, isText, onUpdate, onCommit }: {
  info: ElementInfo; isText: boolean;
  onUpdate: (c: Partial<Record<string, string>>) => void;
  onCommit: (c: Partial<Record<string, string>>) => void;
}) {
  const shadowKey = isText ? 'textShadow' : 'boxShadow';
  const rawVal = isText ? info.textShadow : info.boxShadow;
  const ZERO_DRAFT = { x: 0, y: 0, blur: 0, spread: 0, color: 'rgba(0,0,0,0)' };

  function parseShadow(v: string) {
    if (!v || v === 'none') return ZERO_DRAFT;
    const m = v.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?(?:\s+(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|\w+))?/);
    if (!m) return ZERO_DRAFT;
    return {
      x: parseFloat(m[1]) || 0, y: parseFloat(m[2]) || 0, blur: parseFloat(m[3]) || 0,
      spread: m[4] ? parseFloat(m[4]) : 0,
      color: m[5] || 'rgba(0,0,0,0)',
    };
  }

  const build = (x: number, y: number, b: number, sp: number, c: string) =>
    isText ? `${x}px ${y}px ${b}px ${c}` : `${x}px ${y}px ${b}px ${sp}px ${c}`;

  const hasRealShadow = !!rawVal && rawVal !== 'none' && rawVal !== '';
  const [shadowEnabled, setShadowEnabled] = useState(hasRealShadow);
  const [draft, setDraft] = useState<{ x: number; y: number; blur: number; spread: number; color: string }>(
    () => hasRealShadow ? parseShadow(rawVal) : { ...ZERO_DRAFT }
  );

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const hasReal = !!rawVal && rawVal !== 'none' && rawVal !== '';
    setShadowEnabled(hasReal);
    if (hasReal) setDraft(parseShadow(rawVal));
  }, [rawVal]);

  const handleToggle = (checked: boolean) => {
    setShadowEnabled(checked);
    onCommit({ [shadowKey]: checked ? build(draft.x, draft.y, draft.blur, draft.spread, draft.color) : 'none' });
  };

  return (
    <Collapse title="Drop Shadow" icon={<Sun size={13} />} defaultOpen={false} applyPropKeys={[shadowKey]}>
      <div className="flex items-center gap-2 pb-0.5">
        <input type="checkbox" checked={shadowEnabled}
          onChange={e => handleToggle(e.target.checked)}
          className="w-3 h-3 accent-[#004BE2] cursor-pointer" />
        <span className="text-[11px] text-[#4a5568] cursor-pointer select-none"
          onClick={() => handleToggle(!shadowEnabled)}>Enable shadow</span>
      </div>
      <div className="space-y-2.5" style={{ opacity: shadowEnabled ? 1 : 0.45, pointerEvents: shadowEnabled ? 'auto' : 'none' }}>
        <NumField label="X Offset" value={draft.x} min={-50} max={50}
          onChange={v => { const d = { ...draft, x: v }; setDraft(d); onUpdate({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }}
          onCommit={v => { const d = { ...draft, x: v ?? draft.x }; setDraft(d); onCommit({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }} />
        <NumField label="Y Offset" value={draft.y} min={-50} max={50}
          onChange={v => { const d = { ...draft, y: v }; setDraft(d); onUpdate({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }}
          onCommit={v => { const d = { ...draft, y: v ?? draft.y }; setDraft(d); onCommit({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }} />
        <NumField label="Blur" value={draft.blur} min={0} max={100}
          onChange={v => { const d = { ...draft, blur: v }; setDraft(d); onUpdate({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }}
          onCommit={v => { const d = { ...draft, blur: v ?? draft.blur }; setDraft(d); onCommit({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }} />
        {!isText && (
          <NumField label="Spread" value={draft.spread} min={-20} max={50}
            onChange={v => { const d = { ...draft, spread: v }; setDraft(d); onUpdate({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }}
            onCommit={v => { const d = { ...draft, spread: v ?? draft.spread }; setDraft(d); onCommit({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }} />
        )}
        <ColorField label="Color" value={draft.color}
          onChange={c => { const d = { ...draft, color: c }; setDraft(d); onUpdate({ [shadowKey]: build(d.x, d.y, d.blur, d.spread, d.color) }); }}
          onCommit={() => { onCommit({ [shadowKey]: build(draft.x, draft.y, draft.blur, draft.spread, draft.color) }); }} />
      </div>
    </Collapse>
  );
}

// ─── Section Drop Shadow ──────────────────────────────────────
function SectionShadow({ shadow, onChangeLive, onCommit }: {
  shadow: string;
  onChangeLive: (v: string) => void;
  onCommit: (v: string) => void;
}) {
  const ZERO_DRAFT = { x: 0, y: 0, blur: 0, spread: 0, color: 'rgba(0,0,0,0)' };
  function parseShadow(v: string) {
    if (!v || v === 'none') return ZERO_DRAFT;
    const m = v.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?(?:\s+(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)))?/);
    if (!m) return ZERO_DRAFT;
    return { x: parseFloat(m[1])||0, y: parseFloat(m[2])||0, blur: parseFloat(m[3])||0, spread: m[4] ? parseFloat(m[4]) : 0, color: m[5] || 'rgba(0,0,0,0)' };
  }
  const build = (x: number, y: number, b: number, sp: number, c: string) => `${x}px ${y}px ${b}px ${sp}px ${c}`;

  const hasRealShadow = !!shadow && shadow !== 'none' && shadow !== '';
  const [shadowEnabled, setShadowEnabled] = useState(hasRealShadow);
  const [draft, setDraft] = useState<{ x: number; y: number; blur: number; spread: number; color: string }>(
    () => hasRealShadow ? parseShadow(shadow) : { ...ZERO_DRAFT }
  );

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const hasReal = !!shadow && shadow !== 'none' && shadow !== '';
    setShadowEnabled(hasReal);
    if (hasReal) setDraft(parseShadow(shadow));
  }, [shadow]);

  const handleToggle = (checked: boolean) => {
    setShadowEnabled(checked);
    onCommit(checked ? build(draft.x, draft.y, draft.blur, draft.spread, draft.color) : 'none');
  };

  return (
    <Collapse title="Drop Shadow" icon={<Sun size={13} />} defaultOpen={false} applyPropKeys={['boxShadow']}>
      <div className="flex items-center gap-2 pb-0.5">
        <input type="checkbox" checked={shadowEnabled}
          onChange={e => handleToggle(e.target.checked)}
          className="w-3 h-3 accent-[#004BE2] cursor-pointer" />
        <span className="text-[11px] text-[#4a5568] cursor-pointer select-none"
          onClick={() => handleToggle(!shadowEnabled)}>Enable shadow</span>
      </div>
      <div style={{ opacity: shadowEnabled ? 1 : 0.45, pointerEvents: shadowEnabled ? 'auto' : 'none' }}>
        <NumField label="X Offset" value={draft.x} min={-50} max={50}
          onChange={v => { const d = { ...draft, x: v }; setDraft(d); onChangeLive(build(d.x, d.y, d.blur, d.spread, d.color)); }}
          onCommit={v => { const d = { ...draft, x: v ?? draft.x }; setDraft(d); onCommit(build(d.x, d.y, d.blur, d.spread, d.color)); }} />
        <NumField label="Y Offset" value={draft.y} min={-50} max={50}
          onChange={v => { const d = { ...draft, y: v }; setDraft(d); onChangeLive(build(d.x, d.y, d.blur, d.spread, d.color)); }}
          onCommit={v => { const d = { ...draft, y: v ?? draft.y }; setDraft(d); onCommit(build(d.x, d.y, d.blur, d.spread, d.color)); }} />
        <NumField label="Blur" value={draft.blur} min={0} max={100}
          onChange={v => { const d = { ...draft, blur: v }; setDraft(d); onChangeLive(build(d.x, d.y, d.blur, d.spread, d.color)); }}
          onCommit={v => { const d = { ...draft, blur: v ?? draft.blur }; setDraft(d); onCommit(build(d.x, d.y, d.blur, d.spread, d.color)); }} />
        <NumField label="Spread" value={draft.spread} min={-20} max={50}
          onChange={v => { const d = { ...draft, spread: v }; setDraft(d); onChangeLive(build(d.x, d.y, d.blur, d.spread, d.color)); }}
          onCommit={v => { const d = { ...draft, spread: v ?? draft.spread }; setDraft(d); onCommit(build(d.x, d.y, d.blur, d.spread, d.color)); }} />
        <ColorField label="Color" value={draft.color}
          onChange={c => { const d = { ...draft, color: c }; setDraft(d); onChangeLive(build(d.x, d.y, d.blur, d.spread, d.color)); }}
          onCommit={() => { onCommit(build(draft.x, draft.y, draft.blur, draft.spread, draft.color)); }} />
      </div>
    </Collapse>
  );
}

// ─── Gradient presets for container background ─────────────────────────────────
const GRADIENT_PRESETS = [
  { name: 'Ocean',    from: '#1E3A8A', to: '#3B82F6' },
  { name: 'Sunset',   from: '#DC2626', to: '#F97316' },
  { name: 'Forest',   from: '#064E3B', to: '#10B981' },
  { name: 'Lavender', from: '#5B21B6', to: '#8B5CF6' },
  { name: 'Slate',    from: '#1E293B', to: '#475569' },
  { name: 'Rose',     from: '#BE185D', to: '#F43F5E' },
  { name: 'Sky',      from: '#0369A1', to: '#38BDF8' },
  { name: 'Charcoal', from: '#111827', to: '#374151' },
  { name: 'Gold',     from: '#92400E', to: '#F59E0B' },
  { name: 'Midnight', from: '#1E1B4B', to: '#3730A3' },
  { name: 'Coral',    from: '#9F1239', to: '#FB7185' },
  { name: 'Teal',     from: '#134E4A', to: '#14B8A6' },
];
const GRADIENT_PRESETS_PASTEL = [
  { name: 'Blush',         from: '#FFD6E0', to: '#FFAFCC' },
  { name: 'Mint',          from: '#C7F9CC', to: '#A3E4D7' },
  { name: 'Sky Mist',      from: '#BDE0FE', to: '#A2D2FF' },
  { name: 'Peach',         from: '#FFCBA4', to: '#FFB347' },
  { name: 'Lavender Mist', from: '#E2D9F3', to: '#C5B3E6' },
  { name: 'Lemon',         from: '#FFF3B0', to: '#FFE566' },
  { name: 'Rose Quartz',   from: '#F8D7DA', to: '#F1A7B5' },
  { name: 'Arctic',        from: '#D0F0FD', to: '#B3E5FC' },
  { name: 'Sage',          from: '#D4EDDA', to: '#B7DEC5' },
  { name: 'Vanilla',       from: '#FFF8DC', to: '#FAEBD7' },
  { name: 'Lilac',         from: '#E8D5F5', to: '#D7B8F3' },
  { name: 'Powder',        from: '#E3F2FD', to: '#BBDEFB' },
];
const GRADIENT_DIRECTIONS = [
  { label: '\u2193', value: 'to bottom',       title: 'Top to Bottom'       },
  { label: '\u2192', value: 'to right',        title: 'Left to Right'       },
  { label: '\u2198', value: 'to bottom right', title: 'Diagonal Down-Right' },
  { label: '\u2197', value: 'to top right',    title: 'Diagonal Up-Right'   },
];

// ─── Main Panel ───────────────────────────────────────────────

export function PropertiesPanel({
  section, elementInfo, themeColors, customPresets,
  onUpdateStyles, onUpdateStylesLive, onUpdateHtml, onUpdateName,
  onApplyTheme, onSetThemeColors, onSaveTheme, onDeleteCustomPreset, onSaveTemplate,
  onUpdateElement, onUpdateElementCommit, onDeleteElement, onDuplicateElement,
  onReplaceElement, onPatchElement, onBatchPatchElements, canvasLength, getSelectedElement,
  onApplyStylesGlobally, onApplyElementGlobally, selectedElementId,
  activeTab, onSetTab,
  library, activeBuiltinTemplate, activeCustomTemplateId, customTemplates,
  onSelectBuiltinTemplate, onSelectCustomTemplate, onDeleteCustomTemplate,
  allSections, onBulkReset,
}: Props) {
  const [themeName, setThemeName] = useState('');
  const [templateName, setTemplateName] = useState('');

  const TPLSCALE = 116 / 600;
  const TPLIFRAME_H = 500;
  const TPLCONTAINER_H = Math.round(TPLIFRAME_H * TPLSCALE);
  const builtinTemplates = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => {
      const sections = buildTemplateSections(library, i);
      const body = sections.map(s => s.html).join('\n');
      return {
        name: TEMPLATE_NAMES[i],
        sections,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:0;font-family:Arial,sans-serif}table{border-collapse:collapse}img{display:block;max-width:100%}</style></head><body>${body}</body></html>`,
      };
    }),
    [library]
  );
  const [aspectLocked, setAspectLocked] = useState(true);
  // Align icon-button tooltips (hover-only, portal-rendered to escape panel clipping)
  const [alignTooltip, setAlignTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  // Link Color mode — persists while an element is selected, resets on element change
  const [linkColorMode, setLinkColorMode] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    if (elementInfo?.color === '#96BCFF') setLinkColorMode('dark');
    else setLinkColorMode('light');
  }, [selectedElementId]);

  // Adapt Text Colors banner
  const [showAdaptBanner, setShowAdaptBanner] = useState(false);
  const [adaptBannerDark, setAdaptBannerDark] = useState(false);
  const pendingBgColorRef = useRef<string>('');
  useEffect(() => { setShowAdaptBanner(false); }, [selectedElementId]);
  // Inline dropdown visibility for the Duplicate button — shown next to the
  // button itself in the Actions section. Closed when the user picks a
  // direction or clicks outside.
  const [showDuplicateDropdown, setShowDuplicateDropdown] = useState(false);
  const duplicateDropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<Record<string, number>>({});
  const actionsCollapseRef = useRef<HTMLDivElement | null>(null);

  // Close the duplicate dropdown when the user clicks outside it.
  useEffect(() => {
    if (!showDuplicateDropdown) return;
    const handler = (e: MouseEvent) => {
      if (duplicateDropdownRef.current && !duplicateDropdownRef.current.contains(e.target as Node)) {
        setShowDuplicateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDuplicateDropdown]);

  // ── Dirty-prop tracking for "Apply to all similar" ───────────
  // We track per-scope (section vs element) which style/attr keys have been
  // changed since the current section/element was selected. The 🔗 button
  // stays greyed out until at least one of its keys is dirty.
  const [sectionDirty, setSectionDirty] = useState<Set<string>>(new Set());
  const [elementDirty, setElementDirty] = useState<Set<string>>(new Set());
  // Also stash the most recent value of each dirty key so we know what to propagate.
  const sectionDirtyValsRef = useRef<Record<string, any>>({});
  const elementDirtyValsRef = useRef<Record<string, string>>({});

  // Reset when section changes
  useEffect(() => {
    setSectionDirty(new Set());
    sectionDirtyValsRef.current = {};
  }, [section?.id]);

  // Reset when selected element changes
  useEffect(() => {
    setElementDirty(new Set());
    elementDirtyValsRef.current = {};
  }, [selectedElementId]);

  // ── Bulk apply modal state ────────────────────────────────────
  const [bulkModal, setBulkModal] = useState<{ sectionTitle: string; anchorRect: DOMRect } | null>(null);
  const [bulkApplyDone, setBulkApplyDone] = useState(false);
  const masterSnapshotRef = useRef<CanvasSection[] | null>(null);

  // ── Bulk apply toast ─────────────────────────────────────────
  const [bulkToast, setBulkToast] = useState<{ message: string } | null>(null);
  const [bulkToastExiting, setBulkToastExiting] = useState(false);
  const bulkToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBulkToast = useCallback((message: string) => {
    if (bulkToastTimerRef.current) clearTimeout(bulkToastTimerRef.current);
    setBulkToast({ message });
    setBulkToastExiting(false);
    bulkToastTimerRef.current = setTimeout(() => {
      setBulkToastExiting(true);
      setTimeout(() => setBulkToast(null), 300);
    }, 3000);
  }, []);

  const openBulkModal = useCallback((sectionTitle: string, anchorRect: DOMRect) => {
    setBulkModal({ sectionTitle, anchorRect });
  }, []);

  // Wrapped update callbacks — track which keys were touched, then delegate.
  const sectionId = section?.id || '';
  const wrappedUpdateStyles = (id: string, styles: Partial<SectionStyles>) => {
    const keys = Object.keys(styles);
    if (keys.length) {
      setSectionDirty(prev => {
        const next = new Set(prev);
        keys.forEach(k => next.add(k));
        return next;
      });
      Object.assign(sectionDirtyValsRef.current, styles);
    }
    onUpdateStyles(id, styles);
  };
  const wrappedUpdateStylesLive = (id: string, styles: Partial<SectionStyles>) => {
    const keys = Object.keys(styles);
    if (keys.length) {
      setSectionDirty(prev => {
        if (keys.every(k => prev.has(k))) return prev;
        const next = new Set(prev);
        keys.forEach(k => next.add(k));
        return next;
      });
      Object.assign(sectionDirtyValsRef.current, styles);
    }
    onUpdateStylesLive(id, styles);
  };
  const wrappedUpdateElement = (changes: Partial<Record<string, string>>) => {
    const keys = Object.keys(changes);
    if (keys.length) {
      setElementDirty(prev => {
        if (keys.every(k => prev.has(k))) return prev;
        const next = new Set(prev);
        keys.forEach(k => next.add(k));
        return next;
      });
      Object.assign(elementDirtyValsRef.current, changes);
    }
    onUpdateElement(changes);
  };
  const wrappedUpdateElementCommit = (changes: Partial<Record<string, string>>) => {
    const keys = Object.keys(changes);
    if (keys.length) {
      setElementDirty(prev => {
        const next = new Set(prev);
        keys.forEach(k => next.add(k));
        return next;
      });
      Object.assign(elementDirtyValsRef.current, changes);
    }
    onUpdateElementCommit(changes);
  };

  // Detect background luminance and show the adapt text colors banner
  const detectAndShowBanner = (hex: string | null, isImage = false) => {
    if (isImage) { setAdaptBannerDark(true); setShowAdaptBanner(true); return; }
    if (!hex) { setShowAdaptBanner(false); return; }
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    setAdaptBannerDark(lum <= 0.5);
    setShowAdaptBanner(true);
  };

  // Apply light/dark text colors to all text elements in the current section
  const adaptTextColors = () => {
    if (!section) return;
    const primaryColor = adaptBannerDark ? '#FFFFFF' : '#1F2937';
    const secondaryColor = adaptBannerDark ? '#E2E8F0' : '#6B7280';
    const patches: Array<{sectionId: string; elId: string; changes: Record<string, string>}> = [];
    const walk = (elements: SectionElement[]) => {
      for (const el of elements) {
        if (el.type === 'text' || el.type === 'link') {
          const isPrimary = ['h1', 'h2', 'h3'].includes(el.tag ?? '');
          patches.push({ sectionId: section.id, elId: el.id, changes: { color: isPrimary ? primaryColor : secondaryColor } });
        }
        if (el.children?.length) walk(el.children);
      }
    };
    walk(section.elements);
    if (patches.length) onBatchPatchElements(patches);
    setShowAdaptBanner(false);
  };

  // Context values for the two modes
  const sectionApplyCtx: ApplyContextValue = useMemo(() => ({
    mode: 'section',
    ready: !!section,
    isDirty: k => sectionDirty.has(k),
    markDirty: keys => setSectionDirty(prev => {
      const next = new Set(prev);
      keys.forEach(k => next.add(k));
      return next;
    }),
    applyNow: (propKeys, scope) => {
      if (!section) return 0;
      // Build a patch of just those keys from the current section styles
      const patch: Partial<SectionStyles> = {};
      for (const k of propKeys) {
        if (!sectionDirty.has(k)) continue;
        // Read current value off the section (source of truth after live edits)
        (patch as any)[k] = (section.styles as any)[k];
      }
      if (Object.keys(patch).length === 0) return 0;
      return onApplyStylesGlobally(section.id, patch, scope);
    },
  }), [section, sectionDirty, onApplyStylesGlobally]);

  const elementApplyCtx: ApplyContextValue = useMemo(() => ({
    mode: 'element',
    ready: !!(section && selectedElementId),
    isDirty: k => elementDirty.has(k),
    markDirty: keys => setElementDirty(prev => {
      const next = new Set(prev);
      keys.forEach(k => next.add(k));
      return next;
    }),
    applyNow: (propKeys, scope) => {
      if (!section || !selectedElementId) return 0;
      // Build a patch from the most recent values we captured for these keys
      const patch: Partial<Record<string, string>> = {};
      for (const k of propKeys) {
        if (!elementDirty.has(k)) continue;
        const v = elementDirtyValsRef.current[k];
        if (v !== undefined) patch[k] = v;
      }
      if (Object.keys(patch).length === 0) return 0;
      return onApplyElementGlobally(section.id, selectedElementId, patch, scope);
    },
  }), [section, selectedElementId, elementDirty, onApplyElementGlobally]);

  const saveScroll = () => { if (scrollRef.current) scrollPosRef.current[activeTab] = scrollRef.current.scrollTop; };
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollPosRef.current[activeTab] || 0; }, [activeTab]);

  // Local display-only state for DOM-detected bg color — never written to the data model
  const [detectedBgColor, setDetectedBgColor] = useState('');

  // Read-only background color detection: sets local display state only, never mutates element data
  useEffect(() => {
    setDetectedBgColor('');
    if (!elementInfo || elementInfo.type !== 'container' || elementInfo.backgroundColor || elementInfo.backgroundImage) return;
    const timerId = setTimeout(() => {
      const domEl = selectedElementId
        ? (document.querySelector(`[data-element-id="${selectedElementId}"]`) as HTMLElement | null)
        : null;

      if (domEl) {
        // Priority 2: check inline style directly
        const inlineHex = rgbToHex(domEl.style.backgroundColor);
        if (inlineHex) { setDetectedBgColor(inlineHex); return; }

        // Priority 3: walk up the DOM tree for first non-transparent computed color
        let el: HTMLElement | null = domEl;
        while (el && el !== document.body) {
          const computedBg = window.getComputedStyle(el).backgroundColor;
          const hex = rgbToHex(computedBg);
          if (hex) { setDetectedBgColor(hex); return; }
          el = el.parentElement;
        }
      }
    }, 0);
    return () => clearTimeout(timerId);
  }, [selectedElementId]);

  // Button background color detection — display-only, never mutates data model
  const [detectedBtnBgColor, setDetectedBtnBgColor] = useState('');
  useEffect(() => {
    setDetectedBtnBgColor('');
    if (!elementInfo || elementInfo.type !== 'button' || elementInfo.backgroundColor) return;
    const timerId = setTimeout(() => {
      const domEl = selectedElementId
        ? (document.querySelector(`[data-element-id="${selectedElementId}"]`) as HTMLElement | null)
        : null;
      if (domEl) {
        const inlineHex = rgbToHex(domEl.style.backgroundColor);
        if (inlineHex) { setDetectedBtnBgColor(inlineHex); return; }
        const computedHex = rgbToHex(window.getComputedStyle(domEl).backgroundColor);
        if (computedHex) setDetectedBtnBgColor(computedHex);
      }
    }, 0);
    return () => clearTimeout(timerId);
  }, [selectedElementId]);

  const px = (s: string) => parseInt(s) || 0;

  const handleFileUpload = (callback: (dataUrl: string, naturalWidth?: number, naturalHeight?: number) => void) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const MAX_SIZE_MB = 2;
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.jpg,.jpeg,.png,.gif';
    inp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
    document.body.appendChild(inp);
    inp.onchange = () => {
      document.body.removeChild(inp);
      const file = inp.files?.[0];
      if (!file) return;
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Unsupported format: ${file.type.split('/')[1]?.toUpperCase() || 'unknown'}. Use JPG, PNG, or GIF only (required by Zoho Campaigns).`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum ${MAX_SIZE_MB}MB per image.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        const dataUrl = reader.result;
        // Probe natural dimensions so callers can update width/height attrs too.
        const probe = new Image();
        probe.onload = () => callback(dataUrl, probe.naturalWidth, probe.naturalHeight);
        probe.onerror = () => callback(dataUrl);
        probe.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  };

  const getAspectRatio = () => {
    if (!elementInfo) return 1;
    const w = px(elementInfo.width), h = px(elementInfo.height);
    return (w && h) ? w / h : 1;
  };

  return (
    <>
    <div className="flex flex-col h-full bg-white overflow-x-hidden">
      <div className="px-4 py-2.5 border-b border-[#dce1e8] shrink-0">
        <span className="text-[12px] text-[#111827]" style={{ fontWeight: 600 }}>Properties</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef}>
        {/* ═══ PROPERTIES TAB ═══ */}
        {elementInfo && section && (
          <ApplyCtx.Provider value={elementApplyCtx}>
          <>
            {/* Adapt Text Colors banner — shown after background changes on container elements */}
            {showAdaptBanner && elementInfo.type === 'container' && (
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 8,
                padding: '12px 14px',
                margin: '12px 12px 8px 12px',
                width: 'calc(100% - 24px)',
                animation: 'adaptBannerIn 0.2s ease both',
              }}>
                <style>{`@keyframes adaptBannerIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span style={{ fontSize: 12, color: '#1E40AF', fontWeight: 500 }}>
                      {adaptBannerDark ? 'Dark background detected.' : 'Light background detected.'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAdaptBanner(false)}
                    style={{ background: 'none', border: 'none', padding: '0 0 0 8px', cursor: 'pointer', color: '#93C5FD', fontSize: 14, lineHeight: 1 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1E40AF')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#93C5FD')}>
                    ×
                  </button>
                </div>
                <button
                  onClick={adaptTextColors}
                  style={{ marginTop: 10, width: '100%', height: 32, background: '#DBEAFE', color: '#1D4ED8', fontSize: 12, fontWeight: 500, border: '1px solid #BFDBFE', borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s ease, border-color 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#BFDBFE'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#DBEAFE'; e.currentTarget.style.borderColor = '#BFDBFE'; }}>
                  Adapt text colors for this section
                </button>
              </div>
            )}

            {/* 1.5 Add Link — available for every element type */}
            <Collapse title="Add Link" icon={<LinkIcon size={13} />} defaultOpen={!!elementInfo.href} applyPropKeys={['href']}>
              <FieldWithApply propKeys={['href']}>
              <input
                type="url"
                value={elementInfo.href}
                placeholder="Paste URL here"
                className="w-full px-2 py-1.5 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20"
                onChange={e => {
                  const v = e.target.value;
                  const changes: Partial<Record<string, string>> = { href: v, target: v ? '_blank' : '' };
                  if (v && (elementInfo.type === 'text' || elementInfo.type === 'link' || elementInfo.isTextContainer)) {
                    if (!elementInfo.href) {
                      changes.originalTextColor = elementInfo.color || '';
                    }
                    changes.color = linkColorMode === 'dark' ? '#96BCFF' : '#286CE5';
                  }
                  wrappedUpdateElementCommit(changes);
                }}
              />
              </FieldWithApply>
              {elementInfo.href && (
                <>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="checkbox"
                      id="add-link-new-tab"
                      checked={elementInfo.target === '_blank'}
                      onChange={e => wrappedUpdateElementCommit({ target: e.target.checked ? '_blank' : '' })}
                      className="w-3 h-3 accent-[#004BE2] cursor-pointer shrink-0"
                    />
                    <label htmlFor="add-link-new-tab" className="text-[11px] text-[#4a5568] select-none cursor-pointer">
                      Opens in new tab
                    </label>
                  </div>
                  {/* Link Color manual selector */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[12px] text-[#374151] shrink-0">Link Color</span>
                    <div className="flex gap-1.5">
                      {(['light', 'dark'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => {
                            setLinkColorMode(mode);
                            if (elementInfo.href) {
                              wrappedUpdateElementCommit({ color: mode === 'dark' ? '#96BCFF' : '#286CE5' });
                            }
                          }}
                          style={{
                            borderRadius: 999, padding: '3px 10px', fontSize: 12, cursor: 'pointer', border: '1px solid',
                            backgroundColor: linkColorMode === mode ? '#EFF6FF' : '#F3F4F6',
                            borderColor: linkColorMode === mode ? '#2563EB' : '#E5E7EB',
                            color: linkColorMode === mode ? '#2563EB' : '#6B7280',
                          }}
                        >
                          {mode === 'light' ? 'Light' : 'Dark'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Restore original text color stored when the link was first applied
                      const raw = getSelectedElement();
                      const storedOriginal = (raw?.styles as any)?.originalTextColor;
                      const restoreChanges: Partial<Record<string, string>> = { href: '', target: '' };
                      if (storedOriginal !== undefined) {
                        restoreChanges.color = storedOriginal;
                        restoreChanges.originalTextColor = '';
                      }
                      wrappedUpdateElementCommit(restoreChanges);
                    }}
                    className="mt-1.5 text-[11px] text-[#E53935] hover:text-[#c62828] transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Remove Link
                  </button>
                </>
              )}
            </Collapse>

            {/* 2. Typography */}
            {(elementInfo.type === 'text' || elementInfo.type === 'link' || elementInfo.type === 'button' || elementInfo.isTextContainer) && (
              <Collapse title="Typography" icon={<Type size={13} />} applyPropKeys={['fontFamily', 'fontSize', 'fontWeight', 'color', 'fontStyle', 'textDecoration', 'textAlign', 'lineHeight', 'letterSpacing', 'textTransform']} onBulkApply={(rect) => openBulkModal('Typography', rect)}>
                <FieldWithApply propKeys={['fontFamily']}>
                <SelectField label="Font" value={elementInfo.fontFamily.split(',')[0]?.replace(/'/g, '').trim() || 'Arial'}
                  options={FONT_FAMILIES.map(f => ({ label: f, value: f }))}
                  onChange={v => wrappedUpdateElementCommit({ fontFamily: `'${v}', Arial, sans-serif` })} />
                </FieldWithApply>
                <FieldWithApply propKeys={['fontSize']}>
                <NumField label="Size" value={px(elementInfo.fontSize) || 14}
                  onChange={v => wrappedUpdateElement({ fontSize: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={8} max={80} />
                </FieldWithApply>
                <FieldWithApply propKeys={['fontWeight']}>
                <SelectField label="Weight" value={elementInfo.fontWeight || '400'}
                  options={FONT_WEIGHTS.map(w => ({ label: w.label, value: w.value }))}
                  onChange={v => wrappedUpdateElementCommit({ fontWeight: v })} />
                </FieldWithApply>
                <FieldWithApply propKeys={['color']}>
                <ColorField label="Color" value={elementInfo.color}
                  onChange={v => {
                    // If there is an active text selection inside a contenteditable element,
                    // apply the color only to that selected range via a <span>; otherwise
                    // apply to the whole element as before.
                    const sel = window.getSelection();
                    const activeEl = document.activeElement as HTMLElement | null;
                    if (
                      sel && !sel.isCollapsed && sel.rangeCount > 0 &&
                      activeEl && activeEl.isContentEditable
                    ) {
                      const range = sel.getRangeAt(0).cloneRange();
                      const fragment = range.extractContents();
                      const span = document.createElement('span');
                      span.style.color = v;
                      span.appendChild(fragment);
                      range.insertNode(span);
                      // Persist innerHTML back to the content model via onPatchElement
                      const sectionEl = activeEl.closest('[data-section-id]') as HTMLElement | null;
                      const elId = activeEl.getAttribute('data-element-id') ||
                        // fall back: find element id from selection container
                        (sel.anchorNode?.parentElement?.closest('[data-element-id]') as HTMLElement | null)?.getAttribute('data-element-id') ||
                        selectedElementId;
                      if (sectionEl && elId && section) {
                        const secId = sectionEl.getAttribute('data-section-id') || section.id;
                        onPatchElement(secId, elId, { html: activeEl.innerHTML });
                      }
                    } else {
                      wrappedUpdateElement({ color: v });
                    }
                  }}
                  onCommit={() => wrappedUpdateElementCommit({})} />
                </FieldWithApply>
                <div className="flex gap-1.5 ml-[88px]">
                  <button onClick={() => wrappedUpdateElementCommit({ fontStyle: elementInfo.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`w-7 h-7 rounded border text-[12px] transition-colors ${elementInfo.fontStyle === 'italic' ? 'bg-[#004BE2] text-white border-[#004BE2]' : 'bg-[#f7f8fa] text-[#4a5568] border-[#dce1e8] hover:border-[#004BE2]'}`}
                    style={{ fontWeight: 600, fontStyle: 'italic' }}>I</button>
                  <button onClick={() => wrappedUpdateElementCommit({ textDecoration: elementInfo.textDecoration === 'underline' ? 'none' : 'underline' })}
                    className={`w-7 h-7 rounded border text-[12px] transition-colors ${elementInfo.textDecoration === 'underline' ? 'bg-[#004BE2] text-white border-[#004BE2]' : 'bg-[#f7f8fa] text-[#4a5568] border-[#dce1e8] hover:border-[#004BE2]'}`}
                    style={{ fontWeight: 600, textDecoration: 'underline' }}>U</button>
                  <button onClick={() => wrappedUpdateElementCommit({ textDecoration: elementInfo.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                    className={`w-7 h-7 rounded border text-[12px] transition-colors ${elementInfo.textDecoration === 'line-through' ? 'bg-[#004BE2] text-white border-[#004BE2]' : 'bg-[#f7f8fa] text-[#4a5568] border-[#dce1e8] hover:border-[#004BE2]'}`}
                    style={{ fontWeight: 600, textDecoration: 'line-through' }}>S</button>
                </div>
                <FieldWithApply propKeys={['textAlign']}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Align</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { value: 'left', Icon: AlignLeft, label: 'Left' },
                      { value: 'center', Icon: AlignCenter, label: 'Center' },
                      { value: 'right', Icon: AlignRight, label: 'Right' },
                      { value: 'justify', Icon: AlignJustify, label: 'Justify' },
                    ].map(({ value, Icon, label }) => {
                      const isActive = (elementInfo.textAlign || 'left') === value;
                      return (
                        <button
                          key={value}
                          onClick={() => wrappedUpdateElementCommit({ textAlign: value })}
                          onMouseEnter={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setAlignTooltip({ text: label, x: rect.left + rect.width / 2, y: rect.top - 8 });
                          }}
                          onMouseLeave={() => setAlignTooltip(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            border: isActive ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
                            background: isActive ? '#EFF6FF' : 'white',
                            color: isActive ? '#2563EB' : '#6B7280',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                {alignTooltip && createPortal(
                  <div style={{ position: 'fixed', left: alignTooltip.x, top: alignTooltip.y, transform: 'translate(-50%, -100%)', zIndex: 999999, background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: 11, borderRadius: 4, padding: '4px 8px', pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                    {alignTooltip.text}
                  </div>,
                  document.body
                )}
                </FieldWithApply>
                <FieldWithApply propKeys={['lineHeight']}>
                <NumField label="Line Height" value={parseFloat(elementInfo.lineHeight) || 1.5}
                  onChange={v => wrappedUpdateElement({ lineHeight: String(v) })} onCommit={() => wrappedUpdateElementCommit({})} suffix="" min={0.5} max={4} step={0.1} />
                </FieldWithApply>
              </Collapse>
            )}

            {/* 3. Button Controls — Background Color and Rounded Corners only */}
            {elementInfo.type === 'button' && (
              <>
                <Collapse title="Background Color" icon={<Palette size={13} />} applyPropKeys={['backgroundColor']} onBulkApply={(rect) => openBulkModal('Background Color', rect)}>
                  <FieldWithApply propKeys={['backgroundColor']}>
                  <ColorField label="Color" value={elementInfo.backgroundColor || detectedBtnBgColor}
                    onChange={v => wrappedUpdateElement({ backgroundColor: v })} onCommit={() => wrappedUpdateElementCommit({})} />
                  </FieldWithApply>
                  {elementInfo.backgroundColor && (
                    <button onClick={() => wrappedUpdateElementCommit({ backgroundColor: '', background: '' })}
                      className="text-[11px] text-red-500 hover:text-red-700" style={{ fontWeight: 500 }}>Clear</button>
                  )}
                </Collapse>
                <Collapse title="Rounded Corners" icon={<Square size={13} />} applyPropKeys={['borderRadius']} onBulkApply={(rect) => openBulkModal('Rounded Corners', rect)}>
                  <FieldWithApply propKeys={['borderRadius']}>
                  <NumField label="Radius" value={px(elementInfo.borderRadius)}
                    onChange={v => wrappedUpdateElement({ borderRadius: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
                  </FieldWithApply>
                </Collapse>
              </>
            )}

            {/* Icon element — emoji/symbol that can be replaced with an uploaded image */}
            {elementInfo.isEmojiIcon && (
              <Collapse title="Icon" icon={<ImageIcon size={13} />} onBulkApply={(rect) => openBulkModal('Icon', rect)}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg border border-[#dce1e8] bg-[#f7f8fa] flex items-center justify-center text-2xl select-none">
                      {elementInfo.text}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#718096]" style={{ fontWeight: 600 }}>Current: Emoji / Symbol</p>
                      <p className="text-[11px] text-[#a0aec0] mt-0.5">Replace with an image file (SVG, PNG, JPG)</p>
                    </div>
                  </div>
                  <button onClick={() => handleFileUpload(url => {
                    const el = getSelectedElement();
                    if (!el) return;
                    // Determine the inline display size for the replacement
                    // image. If the original icon-character had explicit
                    // width/height, use that; otherwise fall back to 20px
                    // (matching standard inline-text icon sizing). We force
                    // the image to render at a fixed display size regardless
                    // of the source image's natural dimensions, so a 200x200
                    // button uploaded as a play icon does NOT render at 200px
                    // tall and break the inline alignment with the adjacent
                    // text. With explicit width+height + vertical-align:middle,
                    // the image and surrounding text in the same inline box
                    // (e.g. inside an <a>) center against each other.
                    const sizeW = el.styles.width ? parseInt(el.styles.width) : 20;
                    const sizeH = el.styles.height ? parseInt(el.styles.height) : 20;
                    const imgElement: SectionElement = {
                      id: el.id,
                      type: 'image',
                      tag: 'img',
                      styles: {
                        width: `${sizeW}px`,
                        height: `${sizeH}px`,
                        ...(el.styles.marginTop ? { marginTop: el.styles.marginTop } : {}),
                        ...(el.styles.marginBottom ? { marginBottom: el.styles.marginBottom } : {}),
                        ...(el.styles.marginLeft ? { marginLeft: el.styles.marginLeft } : {}),
                        ...(el.styles.marginRight ? { marginRight: el.styles.marginRight } : {}),
                        objectFit: 'contain',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      },
                      attrs: {
                        src: url,
                        alt: 'icon',
                        width: String(sizeW),
                        height: String(sizeH),
                      },
                    };
                    onReplaceElement(imgElement);
                    // Force the parent inline container's line-height to equal
                    // the image height. CSS vertical-align:middle on an inline
                    // image only aligns the image's center with the parent's
                    // x-height middle — for image heights significantly larger
                    // than the text font-size, the surrounding text still ends
                    // up rendered at the BOTTOM of the line box (because the
                    // text baseline sits at line-bottom by default when the
                    // image dominates the line height). Setting line-height
                    // explicitly to image height makes the line a fixed-size
                    // box; the text is then centered within that box and the
                    // image (also vertical-align:middle) sits at the same
                    // center — image and text become true visual peers,
                    // regardless of how tall the image is.
                    if (section) {
                      const findParent = (els: SectionElement[]): SectionElement | null => {
                        for (const e of els) {
                          if (e.children?.some(c => c.id === el.id)) return e;
                          if (e.children) {
                            const found = findParent(e.children);
                            if (found) return found;
                          }
                        }
                        return null;
                      };
                      const parent = findParent(section.elements);
                      // Only patch parents that are inline-text containers
                      // (a, span, p, h1-h6, td) — not block layout containers
                      // where line-height would affect surrounding paragraphs.
                      const inlineParentTags = new Set(['a', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
                      if (parent && inlineParentTags.has(parent.tag)) {
                        onPatchElement(section.id, parent.id, { lineHeight: `${sizeH}px` });
                      }
                    }
                  })}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#004BE2] text-white rounded-md text-[11px] hover:bg-[#0040c0] transition-colors cursor-pointer"
                    style={{ fontWeight: 600 }}>
                    <ImagePlus size={12} /> Replace with Image
                  </button>
                  <button onClick={onDeleteElement}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded text-[11px] hover:bg-red-100 transition-colors"
                    style={{ fontWeight: 500 }}>
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              </Collapse>
            )}

            {/* 4. Image / Icon Controls */}
            {elementInfo.type === 'image' && (() => {
              const w = px(elementInfo.width), h = px(elementInfo.height);
              const altLower = (elementInfo.alt || '').toLowerCase();
              const srcLower = (elementInfo.src || '').toLowerCase();
              const isIcon = (w > 0 && h > 0 && w <= 36 && h <= 36) ||
                ['icon', 'arrow', 'bullet', 'diamond', 'logo', 'social'].some(k => altLower.includes(k) || srcLower.includes(k));

              if (isIcon) return (
                <Collapse title="Icon" icon={<ImageIcon size={13} />} onBulkApply={(rect) => openBulkModal('Icon', rect)}>
                  {elementInfo.src && elementInfo.src !== '#' ? (
                    <div className="space-y-1.5">
                      <div className="w-14 h-14 rounded border border-[#dce1e8] overflow-hidden bg-[#f7f8fa] flex items-center justify-center">
                        <img src={elementInfo.src} className="max-w-full max-h-full object-contain" alt={elementInfo.alt || ''} />
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleFileUpload(url => wrappedUpdateElementCommit({ src: url }))}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f0f2f5] text-[#4a5568] rounded text-[11px] hover:bg-[#e2e7ee]" style={{ fontWeight: 500 }}>
                          <ImagePlus size={10} /> Replace
                        </button>
                        <button onClick={onDeleteElement}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 rounded text-[11px] hover:bg-red-100" style={{ fontWeight: 500 }}>
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => handleFileUpload(url => wrappedUpdateElementCommit({ src: url }))}
                      className="w-full h-14 border-2 border-dashed border-[#dce1e8] rounded-md flex flex-col items-center justify-center text-[#a0aec0] hover:border-[#004BE2] hover:text-[#004BE2] transition-colors cursor-pointer gap-1">
                      <Plus size={14} />
                      <span className="text-[11px]" style={{ fontWeight: 500 }}>Upload Icon</span>
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <label className="text-[11px] text-[#718096] shrink-0 select-none" style={{ fontWeight: 600 }}>W</label>
                      <BufferedNumInput
                        value={w}
                        onCommitValue={v => {
                          const ch: Record<string, string> = { width: `${v}px` };
                          if (aspectLocked && h) ch.height = `${Math.round(v / getAspectRatio())}px`;
                          wrappedUpdateElementCommit(ch);
                        }}
                        className="flex-1 min-w-0 px-1.5 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
                    </div>
                    <button onClick={() => setAspectLocked(!aspectLocked)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0 ${aspectLocked ? 'text-[#004BE2] bg-[#E5EDFC]' : 'text-[#a0aec0] bg-[#f0f2f5]'}`}
                      title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
                      {aspectLocked ? <Lock size={10} /> : <Unlock size={10} />}
                    </button>
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <label className="text-[11px] text-[#718096] shrink-0 select-none" style={{ fontWeight: 600 }}>H</label>
                      <BufferedNumInput
                        value={h}
                        onCommitValue={v => {
                          const ch: Record<string, string> = { height: `${v}px` };
                          if (aspectLocked && w) ch.width = `${Math.round(v * getAspectRatio())}px`;
                          wrappedUpdateElementCommit(ch);
                        }}
                        className="flex-1 min-w-0 px-1.5 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
                    </div>
                  </div>
                  <SelectField label="Fit" value={elementInfo.objectFit || 'contain'}
                    options={[
                      { label: 'Contain (Show all)', value: 'contain' },
                      { label: 'Cover (Crop to fill)', value: 'cover' },
                      { label: 'Fill (Stretch)', value: 'fill' },
                      { label: 'None (Original)', value: 'none' },
                    ]}
                    onChange={v => wrappedUpdateElementCommit({ objectFit: v })} />
                  <p className="text-[11px] text-[#a0aec0]">Double-click image on canvas to crop &amp; reposition</p>
                  <NumField label="Roundness" value={px(elementInfo.borderRadius)}
                    onChange={v => wrappedUpdateElement({ borderRadius: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
                </Collapse>
              );

              return (
              <Collapse title="Image" icon={<ImageIcon size={13} />} onBulkApply={(rect) => openBulkModal('Image', rect)}>
                {elementInfo.src && elementInfo.src !== '#' ? (
                  <div className="space-y-1.5">
                    <div className="w-full h-20 rounded border border-[#dce1e8] overflow-hidden bg-[#f7f8fa]">
                      <img src={elementInfo.src} className="w-full h-full object-contain" alt={elementInfo.alt || 'Preview'} />
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleFileUpload(url => wrappedUpdateElementCommit({ src: url }))}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f0f2f5] text-[#4a5568] rounded text-[11px] hover:bg-[#e2e7ee]" style={{ fontWeight: 500 }}>
                        <ImagePlus size={10} /> Replace
                      </button>
                      <button onClick={onDeleteElement}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 rounded text-[11px] hover:bg-red-100" style={{ fontWeight: 500 }}>
                        <Trash2 size={10} /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => handleFileUpload(url => wrappedUpdateElementCommit({ src: url }))}
                    className="w-full h-20 border-2 border-dashed border-[#dce1e8] rounded-md flex flex-col items-center justify-center text-[#a0aec0] hover:border-[#004BE2] hover:text-[#004BE2] transition-colors cursor-pointer gap-1">
                    <Plus size={18} />
                    <span className="text-[11px]" style={{ fontWeight: 500 }}>Upload Image</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <label className="text-[11px] text-[#718096] shrink-0 select-none" style={{ fontWeight: 600 }}>W</label>
                    <BufferedNumInput
                      value={px(elementInfo.width)}
                      onCommitValue={v => {
                        const ch: Record<string, string> = { width: `${v}px` };
                        if (aspectLocked) { ch.height = `${Math.round(v / getAspectRatio())}px`; }
                        wrappedUpdateElementCommit(ch);
                      }}
                      className="flex-1 min-w-0 px-1.5 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
                  </div>
                  <button onClick={() => setAspectLocked(!aspectLocked)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0 ${aspectLocked ? 'text-[#004BE2] bg-[#E5EDFC]' : 'text-[#a0aec0] bg-[#f0f2f5]'}`}
                    title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
                    {aspectLocked ? <Lock size={10} /> : <Unlock size={10} />}
                  </button>
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <label className="text-[11px] text-[#718096] shrink-0 select-none" style={{ fontWeight: 600 }}>H</label>
                    <BufferedNumInput
                      value={px(elementInfo.height)}
                      onCommitValue={v => {
                        const ch: Record<string, string> = { height: `${v}px` };
                        if (aspectLocked) { ch.width = `${Math.round(v * getAspectRatio())}px`; }
                        wrappedUpdateElementCommit(ch);
                      }}
                      className="flex-1 min-w-0 px-1.5 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
                  </div>
                </div>
                <SelectField label="Fit" value={elementInfo.objectFit || 'cover'}
                  options={[
                    { label: 'Cover (Crop to fill)', value: 'cover' },
                    { label: 'Contain (Show all)', value: 'contain' },
                    { label: 'None (Original)', value: 'none' },
                  ]}
                  onChange={v => wrappedUpdateElementCommit({ objectFit: v })} />
                <p className="text-[11px] text-[#a0aec0]">Double-click image on canvas to crop &amp; reposition</p>
                <NumField label="Roundness" value={px(elementInfo.borderRadius)}
                  onChange={v => wrappedUpdateElement({ borderRadius: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
              </Collapse>
              ); // end regular image
            })()} {/* end image/icon IIFE */}

            {/* 5. Container Controls */}
            {elementInfo.type === 'container' && (() => {
              // Derive mode: gradient detection, then image, then color
              const bgMode: 'color' | 'gradient' | 'image' =
                elementInfo.backgroundImage ? 'image' :
                (elementInfo.background || '').includes('gradient') ? 'gradient' :
                'color';

              const parsedGrad = bgMode === 'gradient' ? (() => {
                const m = (elementInfo.background || '').match(/linear-gradient\(([^,]+),\s*(#[\da-fA-F]{3,6}),\s*(#[\da-fA-F]{3,6})\)/);
                return m ? { direction: m[1].trim(), from: m[2].trim(), to: m[3].trim() } : null;
              })() : null;
              const activeBoldIdx = parsedGrad
                ? GRADIENT_PRESETS.findIndex(p => p.from.toLowerCase() === parsedGrad.from.toLowerCase() && p.to.toLowerCase() === parsedGrad.to.toLowerCase())
                : -1;
              const activePastelIdx = parsedGrad
                ? GRADIENT_PRESETS_PASTEL.findIndex(p => p.from.toLowerCase() === parsedGrad.from.toLowerCase() && p.to.toLowerCase() === parsedGrad.to.toLowerCase())
                : -1;
              const activeDirection = parsedGrad?.direction || 'to bottom';
              const applyGradient = (from: string, to: string, direction: string) => {
                wrappedUpdateElementCommit({ backgroundColor: from, background: `linear-gradient(${direction}, ${from}, ${to})`, backgroundImage: '' });
                detectAndShowBanner(colorToHex(from));
              };

              return (
                <Collapse title="Background" icon={<Palette size={13} />} applyPropKeys={['backgroundColor', 'background', 'backgroundImage', 'backgroundSize', 'borderRadius']} onBulkApply={(rect) => openBulkModal('Background', rect)}>
                  <div className="flex items-center bg-[#f0f2f5] rounded-md p-0.5 gap-0.5 mb-2">
                    {[
                      { id: 'color' as const, label: 'Color' },
                      { id: 'gradient' as const, label: 'Gradient' },
                      { id: 'image' as const, label: 'Image' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => {
                          if (id === 'color' && bgMode !== 'color') {
                            wrappedUpdateElementCommit({ backgroundImage: '', background: '' });
                          } else if (id === 'gradient' && bgMode !== 'gradient') {
                            // sentinel value makes bgMode detect 'gradient'; preset idx stays -1 (none selected)
                            wrappedUpdateElementCommit({ backgroundImage: '', backgroundColor: '', background: 'gradient-mode' });
                          } else if (id === 'image' && bgMode !== 'image') {
                            handleFileUpload(url => wrappedUpdateElementCommit({
                              backgroundImage: `url('${url}')`,
                              backgroundColor: '', background: '', backgroundSize: 'cover',
                            }));
                          }
                        }}
                        className={`flex-1 py-1 rounded text-[11px] transition-colors ${
                          bgMode === id
                            ? 'bg-white text-[#2d3748] shadow-sm'
                            : 'text-[#718096] hover:text-[#4a5568]'
                        }`}
                        style={{ fontWeight: bgMode === id ? 600 : 400 }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {bgMode === 'color' && (
                    <ColorField label="Color" value={elementInfo.backgroundColor || detectedBgColor}
                      onChange={v => { pendingBgColorRef.current = v; wrappedUpdateElement({ backgroundColor: v, background: '' }); }}
                      onCommit={() => { wrappedUpdateElementCommit({}); detectAndShowBanner(colorToHex(pendingBgColorRef.current)); }} />
                  )}

                  {bgMode === 'gradient' && (
                    <div className="space-y-3">
                      {/* Bold group */}
                      <p className="text-[11px] text-[#6B7280]" style={{ fontWeight: 500 }}>Bold</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {GRADIENT_PRESETS.map((preset, idx) => {
                          const isActive = idx === activeBoldIdx;
                          return (
                            <button
                              key={preset.name}
                              onClick={() => applyGradient(preset.from, preset.to, activeDirection)}
                              title={preset.name}
                              style={{
                                height: 32, borderRadius: 6,
                                border: isActive ? '2.5px solid #2563EB' : '1px solid #E5E7EB',
                                background: `linear-gradient(to bottom, ${preset.from}, ${preset.to})`,
                                cursor: 'pointer', transition: 'transform 0.15s ease',
                                position: 'relative', padding: 0, overflow: 'visible',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                            >
                              {isActive && (
                                <div style={{ position: 'absolute', top: -1, right: -1, width: 18, height: 18, backgroundColor: '#2563EB', borderRadius: '0 6px 0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {/* Divider between Bold and Pastel */}
                      <div style={{ height: 1, backgroundColor: '#E5E7EB', margin: '10px 0' }} />
                      {/* Pastel group */}
                      <p className="text-[11px] text-[#6B7280]" style={{ fontWeight: 500 }}>Pastel</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {GRADIENT_PRESETS_PASTEL.map((preset, idx) => {
                          const isActive = idx === activePastelIdx;
                          return (
                            <button
                              key={preset.name}
                              onClick={() => applyGradient(preset.from, preset.to, activeDirection)}
                              title={preset.name}
                              style={{
                                height: 32, borderRadius: 6,
                                border: isActive ? '2.5px solid #2563EB' : '1px solid #E5E7EB',
                                background: `linear-gradient(to bottom, ${preset.from}, ${preset.to})`,
                                cursor: 'pointer', transition: 'transform 0.15s ease',
                                position: 'relative', padding: 0, overflow: 'visible',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                            >
                              {isActive && (
                                <div style={{ position: 'absolute', top: -1, right: -1, width: 18, height: 18, backgroundColor: '#2563EB', borderRadius: '0 6px 0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div>
                        <p className="text-[12px] text-[#374151] mb-1.5">Direction</p>
                        <div className="flex gap-1.5">
                          {GRADIENT_DIRECTIONS.map(dir => {
                            const isActiveDir = activeDirection === dir.value;
                            return (
                              <button
                                key={dir.value}
                                onClick={() => { if (parsedGrad) applyGradient(parsedGrad.from, parsedGrad.to, dir.value); }}
                                title={dir.title}
                                style={{
                                  width: 28, height: 28, borderRadius: 4, fontSize: 13,
                                  backgroundColor: isActiveDir ? '#EFF6FF' : '#F9FAFB',
                                  border: `1px solid ${isActiveDir ? '#2563EB' : '#E5E7EB'}`,
                                  cursor: parsedGrad ? 'pointer' : 'default',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                {dir.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => wrappedUpdateElementCommit({ background: '', backgroundImage: '' })}
                        className="text-[11px] text-[#EF4444] hover:text-[#DC2626]"
                        style={{ fontWeight: 500 }}
                      >
                        Clear gradient
                      </button>
                    </div>
                  )}

                  {bgMode === 'image' && (() => {
                    const bgImg = elementInfo.backgroundImage || '';
                    const imgM = bgImg.match(/url\((['"]?)([^'")\s]+)\1\)/);
                    const previewUrl = imgM ? imgM[2] : bgImg && !bgImg.includes('url(') ? bgImg : '';
                    return previewUrl ? (
                      <div className="space-y-1.5">
                        <div className="w-full h-16 rounded border border-[#dce1e8] overflow-hidden">
                          <img src={previewUrl} className="w-full h-full object-cover" alt="BG" />
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleFileUpload(url => { wrappedUpdateElementCommit({ backgroundImage: `url('${url}')` }); detectAndShowBanner(null, true); })}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#f0f2f5] text-[#4a5568] rounded text-[11px] hover:bg-[#e2e7ee]" style={{ fontWeight: 500 }}>
                            <ImagePlus size={10} /> Replace
                          </button>
                          <button onClick={() => { wrappedUpdateElementCommit({ backgroundImage: '' }); setShowAdaptBanner(false); }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-500 rounded text-[11px] hover:bg-red-100" style={{ fontWeight: 500 }}>
                            <Trash2 size={10} /> Remove
                          </button>
                        </div>
                        <SelectField label="Fit" value={elementInfo.backgroundSize || 'cover'}
                          options={IMAGE_FIT_MODES.map(m => ({ label: m, value: m }))}
                          onChange={v => wrappedUpdateElementCommit({ backgroundSize: v })} />
                      </div>
                    ) : (
                      <button onClick={() => handleFileUpload(url => { wrappedUpdateElementCommit({ backgroundImage: `url('${url}')`, backgroundSize: 'cover' }); detectAndShowBanner(null, true); })}
                        className="w-full h-12 border-2 border-dashed border-[#dce1e8] rounded-md flex items-center justify-center text-[#a0aec0] hover:border-[#004BE2] hover:text-[#004BE2] transition-colors cursor-pointer">
                        <Plus size={14} />
                      </button>
                    );
                  })()}

                  <div className="border-t border-[#edf0f4] mt-3 pt-2">
                    <NumField label="Roundness" value={px(elementInfo.borderRadius)}
                      onChange={v => wrappedUpdateElement({ borderRadius: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
                  </div>
                </Collapse>
              );
            })()}

            {/* 6. Appearance (opacity) — hidden for button */}
            {elementInfo.type !== 'button' && (
            <Collapse title="Appearance" icon={<Palette size={13} />} applyPropKeys={['opacity']} onBulkApply={(rect) => openBulkModal('Appearance', rect)}>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#718096] w-20 shrink-0 select-none">Opacity</label>
                <input type="range" min={0} max={100} step={1}
                  value={Math.round((parseFloat(elementInfo.opacity) || 1) * 100)}
                  onChange={e => wrappedUpdateElement({ opacity: String(parseInt(e.target.value) / 100) })}
                  onPointerUp={() => wrappedUpdateElementCommit({})}
                  className="flex-1 accent-[#004BE2] h-1.5 cursor-pointer min-w-0" />
                {/* direct input so spinner arrows fire onChange and update canvas live */}
                <input type="number" min={0} max={100} step={1}
                  value={Math.round((parseFloat(elementInfo.opacity) || 1) * 100)}
                  onChange={e => wrappedUpdateElement({ opacity: String(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100) })}
                  onBlur={() => wrappedUpdateElementCommit({})}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') wrappedUpdateElementCommit({}); }}
                  className="w-12 shrink-0 px-1.5 py-0.5 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] text-center outline-none focus:border-[#004BE2]" />
                <span className="text-[11px] text-[#a0aec0] shrink-0">%</span>
              </div>
            </Collapse>
            )}

            {/* 8. Padding */}
            <Collapse title="Padding" icon={<Sliders size={13} />} applyPropKeys={['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']} onBulkApply={(rect) => openBulkModal('Padding', rect)}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <CompactNumField label="Top" value={px(elementInfo.paddingTop)}
                  onChange={v => wrappedUpdateElement({ paddingTop: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label="Right" value={px(elementInfo.paddingRight)}
                  onChange={v => wrappedUpdateElement({ paddingRight: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label="Bottom" value={px(elementInfo.paddingBottom)}
                  onChange={v => wrappedUpdateElement({ paddingBottom: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label="Left" value={px(elementInfo.paddingLeft)}
                  onChange={v => wrappedUpdateElement({ paddingLeft: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
              </div>
            </Collapse>

            {/* 9. Link — for anchor elements only; button uses section 1.5 Add Link */}
            {elementInfo.tagName === 'A' && elementInfo.type !== 'button' && (
              <Collapse title="Link" icon={<LinkIcon size={13} />}>
                <TextField label="URL" value={elementInfo.href}
                  onChange={v => wrappedUpdateElement({ href: v })} onCommit={() => wrappedUpdateElementCommit({})} placeholder="https://..." />
                <div className="flex items-center gap-2 ml-[88px]">
                  <label className="text-[11px] text-[#718096] select-none">New tab</label>
                  <input type="checkbox" checked={elementInfo.target === '_blank'}
                    onChange={e => wrappedUpdateElementCommit({ target: e.target.checked ? '_blank' : '' })} className="accent-[#004BE2] cursor-pointer" />
                </div>
              </Collapse>
            )}

            {/* 10. Border / Stroke (no enable checkbox — always expanded) */}
            <ElementBorderControls info={elementInfo} onUpdate={wrappedUpdateElement} onCommit={wrappedUpdateElementCommit} onBulkApply={(rect) => openBulkModal('Border', rect)} />

          </>
          </ApplyCtx.Provider>
        )}

        {(!elementInfo || !section) && (
          <div className="flex flex-col items-center justify-center py-20 text-[#a0aec0]">
            <Paintbrush size={24} className="mb-3 text-[#dce1e8]" />
            <p className="text-[13px]" style={{ fontWeight: 500 }}>Click an element to edit</p>
            <p className="text-[11px] mt-1 text-[#c0c8d0]">Double-click text for inline editing</p>
          </div>
        )}

      </div>
    </div>

    {/* Bulk Apply Modal */}
    {bulkModal && elementInfo && section && (() => {
      const el = getSelectedElement();
      if (!el) return null;
      return (
        <BulkApplyModal
          sectionTitle={bulkModal.sectionTitle}
          anchorRect={bulkModal.anchorRect}
          el={el}
          elementInfo={elementInfo}
          section={section}
          allSections={allSections}
          masterSnapshotRef={masterSnapshotRef}
          bulkApplyDone={bulkApplyDone}
          onBulkApplyDone={() => setBulkApplyDone(true)}
          onBatchPatch={onBatchPatchElements}
          onBulkReset={onBulkReset}
          onClose={() => setBulkModal(null)}
          onShowSuccessToast={(count) => showBulkToast(`Applied to ${count} element${count !== 1 ? 's' : ''}`)}
          onShowRevertToast={() => showBulkToast('All changes reverted')}
        />
      );
    })()}

    {/* Bulk Apply Toast */}
    {bulkToast && createPortal(
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${bulkToastExiting ? '20px' : '0'})`,
        zIndex: 999999, background: '#1F2937', color: 'white', borderRadius: 8,
        padding: '10px 20px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
        opacity: bulkToastExiting ? 0 : 1,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: 'none',
      }}>
        {bulkToast.message}
      </div>,
      document.body
    )}
    </>
  );
}