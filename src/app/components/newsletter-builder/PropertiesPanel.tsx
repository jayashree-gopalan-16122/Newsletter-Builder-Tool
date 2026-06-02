import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Copy, Trash2, MoveVertical, Sun, Lock, Unlock, Plus, ImagePlus, Square, Link2, LayoutTemplate,
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
  getSelectedElement: () => SectionElement | null;
  onApplyStylesGlobally: (sourceSectionId: string, styles: Partial<SectionStyles>, scope: ApplyScope) => number;
  onApplyElementGlobally: (sourceSectionId: string, sourceElementId: string, changes: Partial<Record<string, string>>, scope: ApplyScope) => number;
  selectedElementId: string | null;
  activeTab: 'properties' | 'theme';
  onSetTab: (t: 'properties' | 'theme') => void;
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

function Collapse({ title, icon, children, defaultOpen = true, applyPropKeys, onOpen }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
  /** If provided, renders a chain icon in the header. When any of these keys is
   *  dirty (user changed them since selecting this section/element), clicking
   *  the icon propagates ALL dirty ones across the entire canvas. */
  applyPropKeys?: string[];
  /** Called with the root element whenever the section transitions closed → open. */
  onOpen?: (el: HTMLDivElement | null) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(defaultOpen); }, [defaultOpen]);
  const ctx = React.useContext(ApplyCtx);
  const enabledApply = !!(ctx && ctx.ready && applyPropKeys && applyPropKeys.some(k => ctx.isDirty(k)));
  const handleApply = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation(); // don't toggle collapse
    if (!ctx || !applyPropKeys || !enabledApply) return;
    const n = ctx.applyNow(applyPropKeys, 'allCanvas');
    if (n > 0) {
      const what = ctx.mode === 'section' ? 'section' : 'element';
      toast.success(`Applied to ${n} similar ${what}${n === 1 ? '' : 's'} across the canvas`);
    } else {
      toast(`No similar ${ctx.mode === 'section' ? 'sections' : 'elements'} found`);
    }
  };
  return (
    <div ref={rootRef} className="border-b border-[#edf0f4]">
      <div className="w-full flex items-center gap-1.5 px-3 py-2.5 text-[12px] text-[#4a5568] hover:bg-[#f8f9fb] transition-colors" style={{ fontWeight: 600 }}>
        <button type="button" onClick={() => { if (!open) onOpen?.(rootRef.current); setOpen(!open); }} className="flex items-center gap-1.5 flex-1 min-w-0 text-left text-[12px]" style={{ fontWeight: 600 }}>
          <span className="text-[#718096]">{icon}</span>{title}
        </button>
        {applyPropKeys && (
          <button
            type="button"
            disabled={!enabledApply}
            onClick={handleApply}
            title={enabledApply ? 'Apply changes to all similar across the entire canvas' : 'Change a value first, then click to apply everywhere'}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              enabledApply
                ? 'text-[#004BE2] hover:bg-[#e5edfc] cursor-pointer'
                : 'text-[#cbd5e0] cursor-not-allowed'
            }`}
          >
            <Link2 size={11} />
          </button>
        )}
        <button type="button" onClick={() => { if (!open) onOpen?.(rootRef.current); setOpen(!open); }} className="text-[#a0aec0] flex items-center">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>
      {open && <div className="px-3 pb-3 space-y-2.5">{children}</div>}
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
    if (!v) return { hex: '#000000', opacity: 100 };
    const rgba = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (rgba) {
      const r = parseInt(rgba[1]), g = parseInt(rgba[2]), b = parseInt(rgba[3]);
      const a = rgba[4] !== undefined ? Math.round(parseFloat(rgba[4]) * 100) : 100;
      return { hex: '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''), opacity: a };
    }
    if (v.startsWith('#')) return { hex: v.length === 4 ? '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3] : v, opacity: 100 };
    return { hex: '#000000', opacity: 100 };
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
      <input type="color" value={hex.startsWith('#') && hex.length >= 7 ? hex.slice(0, 7) : '#000000'}
        onChange={e => { setHex(e.target.value); onChange(buildColor(e.target.value, opacity)); }}
        onBlur={onCommit}
        className="w-5 h-5 rounded border border-[#dce1e8] cursor-pointer shrink-0 p-0" />
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

// ─── Element Border Controls (reusable) ───────────────────────
function ElementBorderControls({ info, onUpdate, onCommit }: {
  info: ElementInfo; onUpdate: (c: Partial<Record<string, string>>) => void; onCommit: (c: Partial<Record<string, string>>) => void;
}) {
  const px = (s: string) => parseInt(s) || 0;
  const [gradientMode, setGradientMode] = useState(!!info.borderImageSource);

  return (
    <Collapse title="Border / Stroke" icon={<Square size={13} />} defaultOpen={px(info.borderWidth) > 0} applyPropKeys={['borderWidth', 'borderColor', 'borderStyle', 'borderRadius', 'borderImageSource']}>
      <NumField label="Width" value={px(info.borderWidth)}
        onChange={v => onUpdate({ borderWidth: `${v}px` })}
        onCommit={() => onCommit({})} min={0} />
      <div className="flex items-center gap-2">
        <label className="text-[11px] text-[#718096] w-20 shrink-0 select-none">Mode</label>
        <div className="flex bg-[#f0f2f5] rounded overflow-hidden">
          <button onClick={() => { setGradientMode(false); onCommit({ borderImageSource: '' }); }}
            className={`px-2.5 py-0.5 text-[11px] transition-colors ${!gradientMode ? 'bg-[#004BE2] text-white' : 'text-[#718096]'}`}
            style={{ fontWeight: 600 }}>Solid</button>
          <button onClick={() => setGradientMode(true)}
            className={`px-2.5 py-0.5 text-[11px] transition-colors ${gradientMode ? 'bg-[#004BE2] text-white' : 'text-[#718096]'}`}
            style={{ fontWeight: 600 }}>Gradient</button>
        </div>
      </div>
      {gradientMode ? (
        <GradientEditor
          value={info.borderImageSource || 'linear-gradient(90deg, #004BE2, #E42527)'}
          onChange={v => onCommit({ borderStyle: 'solid', borderColor: 'transparent', borderImageSource: v })} />
      ) : (
        <>
          <ColorField label="Color" value={info.borderColor || '#e2e8f0'}
            onChange={v => onUpdate({ borderColor: v })}
            onCommit={() => onCommit({})} />
          <SelectField label="Style" value={info.borderStyle || 'solid'}
            options={[{ label: 'Solid', value: 'solid' }, { label: 'Dashed', value: 'dashed' }, { label: 'Dotted', value: 'dotted' }]}
            onChange={v => onCommit({ borderStyle: v })} />
        </>
      )}
      <NumField label="Radius" value={px(info.borderRadius)}
        onChange={v => onUpdate({ borderRadius: `${v}px` })}
        onCommit={() => onCommit({})} min={0} />
      {(px(info.borderWidth) > 0 || info.borderColor) && (
        <button
          onClick={() => onCommit({ borderWidth: '0px', borderColor: '', borderStyle: '', borderRadius: info.borderRadius, borderImageSource: '' })}
          className="text-[11px] text-red-500 hover:text-red-700 mt-1" style={{ fontWeight: 500 }}>
          Remove Stroke
        </button>
      )}
    </Collapse>
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

// ─── Main Panel ───────────────────────────────────────────────

export function PropertiesPanel({
  section, elementInfo, themeColors, customPresets,
  onUpdateStyles, onUpdateStylesLive, onUpdateHtml, onUpdateName,
  onApplyTheme, onSetThemeColors, onSaveTheme, onDeleteCustomPreset, onSaveTemplate,
  onUpdateElement, onUpdateElementCommit, onDeleteElement, onDuplicateElement,
  onReplaceElement, onPatchElement, getSelectedElement,
  onApplyStylesGlobally, onApplyElementGlobally, selectedElementId,
  activeTab, onSetTab,
  library, activeBuiltinTemplate, activeCustomTemplateId, customTemplates,
  onSelectBuiltinTemplate, onSelectCustomTemplate, onDeleteCustomTemplate,
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

  const px = (s: string) => parseInt(s) || 0;

  const handleFileUpload = (callback: (dataUrl: string, naturalWidth?: number, naturalHeight?: number) => void) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const MAX_SIZE_MB = 2;
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.jpg,.jpeg,.png,.gif';
    inp.onchange = () => {
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
    <div className="flex flex-col h-full bg-white overflow-x-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#dce1e8] shrink-0">
        {(['properties', 'theme'] as const).map(t => (
          <button key={t} onClick={() => { saveScroll(); onSetTab(t); }}
            className={`flex-1 py-2.5 text-[12px] transition-colors border-b-2 ${
              activeTab === t ? 'text-[#004BE2] border-[#004BE2]' : 'text-[#718096] border-transparent hover:text-[#2d3748]'
            }`} style={{ fontWeight: 600 }}>
            {t === 'properties' ? 'Properties' : 'Theme'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef}>
        {/* ═══ PROPERTIES TAB ═══ */}
        {activeTab === 'properties' && elementInfo && section && (
          <ApplyCtx.Provider value={elementApplyCtx}>
          <>
            {/* 1. Element Info */}
            <Collapse title="Element" icon={<Settings size={13} />}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-1.5 py-0.5 bg-[#f0f4f8] rounded text-[#4a5568]" style={{ fontWeight: 600 }}>{elementInfo.tagName}</span>
                <span className="text-[11px] text-[#a0aec0]">{elementInfo.type}{elementInfo.isTextContainer ? ' (text)' : ''}</span>
              </div>
              {elementInfo.type !== 'image' && elementInfo.type !== 'icon' && (elementInfo.type !== 'container' || elementInfo.isTextContainer) && elementInfo.text && (
                <TextField label="Text" value={elementInfo.text}
                  onChange={v => wrappedUpdateElement({ text: v })}
                  onCommit={() => wrappedUpdateElementCommit({})} />
              )}
            </Collapse>

            {/* 1.5 Link URL — available for every element type */}
            <Collapse title="Link URL" icon={<LinkIcon size={13} />} defaultOpen={!!elementInfo.href} applyPropKeys={['href']}>
              <FieldWithApply propKeys={['href']}>
              <TextField label="URL" value={elementInfo.href}
                placeholder="https://example.com"
                onChange={v => wrappedUpdateElementCommit({ href: v, target: v ? '_blank' : '' })} />
              </FieldWithApply>
              {elementInfo.href && (
                <p className="text-[11px] text-[#718096] ml-[88px] flex items-center gap-1">
                  <LinkIcon size={10} /> Opens in new tab
                </p>
              )}
            </Collapse>

            {/* 2. Typography */}
            {(elementInfo.type === 'text' || elementInfo.type === 'link' || elementInfo.type === 'button' || elementInfo.isTextContainer) && (
              <Collapse title="Typography" icon={<Type size={13} />} applyPropKeys={['fontFamily', 'fontSize', 'fontWeight', 'color', 'fontStyle', 'textDecoration', 'textAlign', 'lineHeight', 'letterSpacing', 'textTransform']}>
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
                <BrandSwatches onSelect={c => {
                    const sel = window.getSelection();
                    const activeEl = document.activeElement as HTMLElement | null;
                    if (
                      sel && !sel.isCollapsed && sel.rangeCount > 0 &&
                      activeEl && activeEl.isContentEditable
                    ) {
                      const range = sel.getRangeAt(0).cloneRange();
                      const fragment = range.extractContents();
                      const span = document.createElement('span');
                      span.style.color = c;
                      span.appendChild(fragment);
                      range.insertNode(span);
                      const sectionEl = activeEl.closest('[data-section-id]') as HTMLElement | null;
                      const elId = activeEl.getAttribute('data-element-id') ||
                        (sel.anchorNode?.parentElement?.closest('[data-element-id]') as HTMLElement | null)?.getAttribute('data-element-id') ||
                        selectedElementId;
                      if (sectionEl && elId && section) {
                        const secId = sectionEl.getAttribute('data-section-id') || section.id;
                        onPatchElement(secId, elId, { html: activeEl.innerHTML });
                      }
                    } else {
                      wrappedUpdateElementCommit({ color: c });
                    }
                  }} />
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
                <SelectField label="Align" value={elementInfo.textAlign || 'left'}
                  options={[{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }, { label: 'Justify', value: 'justify' }]}
                  onChange={v => wrappedUpdateElementCommit({ textAlign: v })} />
                </FieldWithApply>
                <FieldWithApply propKeys={['lineHeight']}>
                <NumField label="Line H" value={parseFloat(elementInfo.lineHeight) || 1.5}
                  onChange={v => wrappedUpdateElement({ lineHeight: String(v) })} onCommit={() => wrappedUpdateElementCommit({})} suffix="" min={0.5} max={4} step={0.1} />
                </FieldWithApply>
                <FieldWithApply propKeys={['letterSpacing']}>
                <NumField label="Spacing" value={parseFloat(elementInfo.letterSpacing) || 0}
                  onChange={v => wrappedUpdateElement({ letterSpacing: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={-5} max={20} step={0.5} />
                </FieldWithApply>
                <FieldWithApply propKeys={['textTransform']}>
                <SelectField label="Transform" value={elementInfo.textTransform || 'none'}
                  options={[{ label: 'None', value: 'none' }, { label: 'Uppercase', value: 'uppercase' }, { label: 'Lowercase', value: 'lowercase' }, { label: 'Capitalize', value: 'capitalize' }]}
                  onChange={v => wrappedUpdateElementCommit({ textTransform: v })} />
                </FieldWithApply>
              </Collapse>
            )}

            {/* 3. Button Controls */}
            {elementInfo.type === 'button' && (
              <Collapse title="Button" icon={<Paintbrush size={13} />} applyPropKeys={['backgroundColor', 'background', 'width', 'height', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'textAlign']}>
                <FieldWithApply propKeys={['backgroundColor']}>
                <ColorField label="Fill Color" value={elementInfo.backgroundColor}
                  onChange={v => wrappedUpdateElement({ backgroundColor: v })} onCommit={() => wrappedUpdateElementCommit({})} />
                <BrandSwatches onSelect={c => wrappedUpdateElementCommit({ backgroundColor: c })} />
                </FieldWithApply>
                {elementInfo.backgroundColor && (
                  <button onClick={() => wrappedUpdateElementCommit({ backgroundColor: '', background: '' })}
                    className="text-[11px] text-red-500 hover:text-red-700" style={{ fontWeight: 500 }}>Clear fill</button>
                )}
                <p className="text-[11px] text-[#718096] mt-1" style={{ fontWeight: 600 }}>Fill Gradient</p>
                <FieldWithApply propKeys={['background']}>
                <GradientEditor value={elementInfo.background || ''}
                  onChange={v => wrappedUpdateElementCommit({ background: v, backgroundColor: '' })} />
                </FieldWithApply>
                {elementInfo.background && (
                  <button onClick={() => wrappedUpdateElementCommit({ background: '' })}
                    className="text-[11px] text-red-500 hover:text-red-700" style={{ fontWeight: 500 }}>Clear gradient</button>
                )}
                <FieldWithApply propKeys={['width']}>
                <NumField label="Width" value={px(elementInfo.width)}
                  onChange={v => wrappedUpdateElement({ width: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
                </FieldWithApply>
                <FieldWithApply propKeys={['height']}>
                <NumField label="Height" value={px(elementInfo.height)}
                  onChange={v => wrappedUpdateElement({ height: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
                </FieldWithApply>
                <FieldWithApply propKeys={['borderRadius']}>
                <NumField label="Roundness" value={px(elementInfo.borderRadius)}
                  onChange={v => wrappedUpdateElement({ borderRadius: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
                </FieldWithApply>
                <FieldWithApply propKeys={['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <CompactNumField label="P-Top" value={px(elementInfo.paddingTop)}
                    onChange={v => wrappedUpdateElement({ paddingTop: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                  <CompactNumField label="P-Right" value={px(elementInfo.paddingRight)}
                    onChange={v => wrappedUpdateElement({ paddingRight: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                  <CompactNumField label="P-Bottom" value={px(elementInfo.paddingBottom)}
                    onChange={v => wrappedUpdateElement({ paddingBottom: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                  <CompactNumField label="P-Left" value={px(elementInfo.paddingLeft)}
                    onChange={v => wrappedUpdateElement({ paddingLeft: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                </div>
                </FieldWithApply>
                <FieldWithApply propKeys={['textAlign']}>
                <SelectField label="Align" value={elementInfo.textAlign || 'center'}
                  options={[{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }]}
                  onChange={v => wrappedUpdateElementCommit({ textAlign: v })} />
                </FieldWithApply>
              </Collapse>
            )}

            {/* Icon element — emoji/symbol that can be replaced with an uploaded image */}
            {elementInfo.isEmojiIcon && (
              <Collapse title="Icon" icon={<ImageIcon size={13} />}>
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
                <Collapse title="Icon" icon={<ImageIcon size={13} />}>
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
                  <NumField label="Radius" value={px(elementInfo.borderRadius)}
                    onChange={v => wrappedUpdateElement({ borderRadius: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
                  <TextField label="Alt" value={elementInfo.alt}
                    onChange={v => wrappedUpdateElement({ alt: v })} onCommit={() => wrappedUpdateElementCommit({})} placeholder="Describe icon" />
                </Collapse>
              );

              return (
              <Collapse title="Image" icon={<ImageIcon size={13} />}>
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
                <NumField label="Radius" value={px(elementInfo.borderRadius)}
                  onChange={v => wrappedUpdateElement({ borderRadius: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
                <TextField label="Alt" value={elementInfo.alt}
                  onChange={v => wrappedUpdateElement({ alt: v })} onCommit={() => wrappedUpdateElementCommit({})} placeholder="Describe the image" />
                {!elementInfo.alt && (
                  <div className="flex items-center gap-1 text-[11px] text-[#d97706] ml-[88px]">
                    <AlertTriangle size={10} /> Missing alt text
                  </div>
                )}
              </Collapse>
              ); // end regular image
            })()} {/* end image/icon IIFE */}

            {/* 5. Container Controls */}
            {elementInfo.type === 'container' && (
              <Collapse title="Container" icon={<Square size={13} />} applyPropKeys={['backgroundColor', 'background', 'backgroundImage', 'backgroundSize', 'borderRadius']}>
                <ColorField label="BG Color" value={elementInfo.backgroundColor}
                  onChange={v => wrappedUpdateElement({ backgroundColor: v })} onCommit={() => wrappedUpdateElementCommit({})} />
                <BrandSwatches onSelect={c => wrappedUpdateElementCommit({ backgroundColor: c })} />
                {elementInfo.backgroundColor && (
                  <button onClick={() => wrappedUpdateElementCommit({ backgroundColor: '', background: '' })}
                    className="text-[11px] text-red-500 hover:text-red-700" style={{ fontWeight: 500 }}>Clear background</button>
                )}
                <p className="text-[11px] text-[#718096] mt-1" style={{ fontWeight: 600 }}>BG Gradient</p>
                <GradientEditor value={elementInfo.background || ''}
                  onChange={v => wrappedUpdateElementCommit({ background: v, backgroundColor: '' })} />
                {elementInfo.background && (
                  <button onClick={() => wrappedUpdateElementCommit({ background: '' })}
                    className="text-[11px] text-red-500 hover:text-red-700" style={{ fontWeight: 500 }}>Clear gradient</button>
                )}
                {/* BG Image — mirrors the Outer Background pattern from the
                    Section tab. Stores into elementInfo.backgroundImage which
                    serializes to the element's inline style as
                    background-image:url(...) plus background-size for fit.
                    The stored value is a CSS url('...') expression; we
                    strip it for the preview img tag and re-wrap on save. */}
                <p className="text-[11px] text-[#718096] mt-1" style={{ fontWeight: 600 }}>BG Image</p>
                {(() => {
                  const bgImg = elementInfo.backgroundImage || '';
                  // Parse url('...'), url("..."), or url(...) variants
                  const m = bgImg.match(/url\((['"]?)([^'")]+)\1\)/);
                  const previewUrl = m ? m[2] : bgImg && !bgImg.includes('url(') ? bgImg : '';
                  return previewUrl ? (
                    <div className="space-y-1.5">
                      <div className="w-full h-16 rounded border border-[#dce1e8] overflow-hidden">
                        <img src={previewUrl} className="w-full h-full object-cover" alt="BG" />
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleFileUpload(url => wrappedUpdateElementCommit({ backgroundImage: `url('${url}')` }))}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#f0f2f5] text-[#4a5568] rounded text-[11px] hover:bg-[#e2e7ee]" style={{ fontWeight: 500 }}>
                          <ImagePlus size={10} /> Replace
                        </button>
                        <button onClick={() => wrappedUpdateElementCommit({ backgroundImage: '' })}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-500 rounded text-[11px] hover:bg-red-100" style={{ fontWeight: 500 }}>
                          <Trash2 size={10} /> Remove
                        </button>
                      </div>
                      <SelectField label="Fit" value={elementInfo.backgroundSize || 'cover'}
                        options={IMAGE_FIT_MODES.map(m => ({ label: m, value: m }))}
                        onChange={v => wrappedUpdateElementCommit({ backgroundSize: v })} />
                    </div>
                  ) : (
                    <button onClick={() => handleFileUpload(url => wrappedUpdateElementCommit({ backgroundImage: `url('${url}')`, backgroundSize: 'cover' }))}
                      className="w-full h-12 border-2 border-dashed border-[#dce1e8] rounded-md flex items-center justify-center text-[#a0aec0] hover:border-[#004BE2] hover:text-[#004BE2] transition-colors cursor-pointer">
                      <Plus size={14} />
                    </button>
                  );
                })()}
                <NumField label="Roundness" value={px(elementInfo.borderRadius)}
                  onChange={v => wrappedUpdateElement({ borderRadius: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} min={0} />
              </Collapse>
            )}

            {/* 6. Appearance (opacity) */}
            <Collapse title="Appearance" icon={<Palette size={13} />} applyPropKeys={['opacity']}>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#718096] w-20 shrink-0 select-none">Opacity</label>
                <input type="range" min={0} max={100} step={1}
                  value={Math.round((parseFloat(elementInfo.opacity) || 1) * 100)}
                  onChange={e => wrappedUpdateElement({ opacity: String(parseInt(e.target.value) / 100) })}
                  onMouseUp={() => wrappedUpdateElementCommit({})}
                  className="flex-1 accent-[#004BE2] h-1.5 cursor-pointer min-w-0" />
                <BufferedNumInput
                  value={Math.round((parseFloat(elementInfo.opacity) || 1) * 100)}
                  onCommitValue={n => wrappedUpdateElementCommit({ opacity: String(Math.max(0, Math.min(100, n)) / 100) })}
                  className="w-12 shrink-0 px-1.5 py-0.5 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] text-[#2d3748] text-center outline-none focus:border-[#004BE2]" />
                <span className="text-[11px] text-[#a0aec0] shrink-0">%</span>
              </div>
            </Collapse>

            {/* 7. Drop Shadow */}
            <DropShadowSection
              key={selectedElementId ?? undefined}
              info={elementInfo}
              isText={elementInfo.type === 'text'}
              onUpdate={wrappedUpdateElement}
              onCommit={wrappedUpdateElementCommit} />

            {/* 8. Spacing */}
            <Collapse title="Spacing" icon={<Sliders size={13} />} applyPropKeys={['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <CompactNumField label={<>Gap<br/>above</>} value={px(elementInfo.marginTop)}
                  onChange={v => wrappedUpdateElement({ marginTop: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label="M-Right" value={px(elementInfo.marginRight)}
                  onChange={v => wrappedUpdateElement({ marginRight: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label={<>Gap<br/>below</>} value={px(elementInfo.marginBottom)}
                  onChange={v => wrappedUpdateElement({ marginBottom: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label="M-Left" value={px(elementInfo.marginLeft)}
                  onChange={v => wrappedUpdateElement({ marginLeft: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <CompactNumField label="P-Top" value={px(elementInfo.paddingTop)}
                  onChange={v => wrappedUpdateElement({ paddingTop: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label="P-Right" value={px(elementInfo.paddingRight)}
                  onChange={v => wrappedUpdateElement({ paddingRight: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label="P-Bottom" value={px(elementInfo.paddingBottom)}
                  onChange={v => wrappedUpdateElement({ paddingBottom: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
                <CompactNumField label="P-Left" value={px(elementInfo.paddingLeft)}
                  onChange={v => wrappedUpdateElement({ paddingLeft: `${v}px` })} onCommit={() => wrappedUpdateElementCommit({})} />
              </div>
            </Collapse>

            {/* 9. Link */}
            {(elementInfo.tagName === 'A' || elementInfo.type === 'button') && (
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
            <ElementBorderControls info={elementInfo} onUpdate={wrappedUpdateElement} onCommit={wrappedUpdateElementCommit} />

            {/* 11. Actions */}
            <Collapse title="Actions" icon={<Settings size={13} />} defaultOpen={false}
              onOpen={el => {
                actionsCollapseRef.current = el;
                el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}>
              <div className="flex gap-2">
                <div className="relative" ref={duplicateDropdownRef}>
                  <button onClick={() => setShowDuplicateDropdown(s => !s)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f0f2f5] text-[#4a5568] rounded text-[11px] hover:bg-[#e2e7ee] transition-colors" style={{ fontWeight: 500 }}>
                    <Copy size={10} /> Duplicate
                  </button>
                  {showDuplicateDropdown && (
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-[#dce1e8] rounded-md shadow-lg overflow-hidden min-w-[88px]">
                      {(['above', 'below', 'left', 'right'] as const).map(dir => (
                        <button
                          key={dir}
                          onClick={() => { onDuplicateElement(dir); setShowDuplicateDropdown(false); actionsCollapseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}
                          className="w-full px-3 py-1.5 text-left text-[11px] text-[#4a5568] hover:bg-[#f0f2f5] capitalize transition-colors"
                          style={{ fontWeight: 500 }}>
                          {dir}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={onDeleteElement}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded text-[11px] hover:bg-red-100 transition-colors" style={{ fontWeight: 500 }}>
                  <Trash2 size={10} /> Delete
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#718096] select-none">Visible</label>
                <input type="checkbox" checked={elementInfo.display !== 'none'}
                  onChange={e => wrappedUpdateElementCommit({ display: e.target.checked ? '' : 'none' })} className="accent-[#004BE2] cursor-pointer" />
              </div>
              <p className="text-[10px] text-[#a0aec0] mt-1">M-Top/M-Bottom: vertical gap. M-Left/M-Right: horizontal.</p>
            </Collapse>
          </>
          </ApplyCtx.Provider>
        )}

        {activeTab === 'properties' && (!elementInfo || !section) && (
          <div className="flex flex-col items-center justify-center py-20 text-[#a0aec0]">
            <Paintbrush size={24} className="mb-3 text-[#dce1e8]" />
            <p className="text-[13px]" style={{ fontWeight: 500 }}>Click an element to edit</p>
            <p className="text-[11px] mt-1 text-[#c0c8d0]">Double-click text for inline editing</p>
          </div>
        )}

        {/* ═══ THEME TAB ═══ */}
        {activeTab === 'theme' && (
          <>
            <Collapse title="Presets" icon={<Palette size={13} />}>
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map(p => (
                  <button key={p.id} onClick={() => { onSetThemeColors(p.colors); onApplyTheme(p.colors); }}
                    className="p-2.5 border border-[#dce1e8] rounded-lg hover:border-[#004BE2] hover:shadow-sm transition-all text-left group">
                    <div className="flex gap-0.5 mb-1.5">
                      {[p.colors.primary, p.colors.secondary, p.colors.accent, p.colors.button].map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-sm border border-black/5" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className="text-[11px] text-[#4a5568] truncate group-hover:text-[#004BE2]" style={{ fontWeight: 500 }}>{p.name}</p>
                  </button>
                ))}
              </div>
              {customPresets.length > 0 && (
                <>
                  <p className="text-[10px] text-[#a0aec0] px-0.5 pt-2.5 pb-1 tracking-[0.1em]" style={{ fontWeight: 700 }}>MY PRESETS</p>
                  <div className="grid grid-cols-2 gap-2">
                    {customPresets.map(p => (
                      <div key={p.id} className="relative group/presetcard">
                        <button onClick={() => { onSetThemeColors(p.colors); onApplyTheme(p.colors); }}
                          className="w-full p-2.5 border border-[#dce1e8] rounded-lg hover:border-[#004BE2] hover:shadow-sm transition-all text-left group">
                          <div className="flex gap-0.5 mb-1.5">
                            {[p.colors.primary, p.colors.secondary, p.colors.accent, p.colors.button].map((c, i) => (
                              <div key={i} className="w-4 h-4 rounded-sm border border-black/5" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <p className="text-[11px] text-[#4a5568] truncate group-hover:text-[#004BE2]" style={{ fontWeight: 500 }}>{p.name}</p>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); onDeleteCustomPreset(p.id); }}
                          className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center text-[#FF0000] opacity-0 group-hover/presetcard:opacity-100 transition-opacity"
                          title="Remove preset"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-1.5 mt-2">
                <input type="text" value={themeName} onChange={e => setThemeName(e.target.value)} placeholder="Save current as..."
                  className="flex-1 px-2 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] outline-none focus:border-[#004BE2]" />
                <button onClick={() => { if (themeName.trim()) { onSaveTheme(themeName.trim()); setThemeName(''); } }}
                  className="px-3 py-1 bg-[#004BE2] text-white rounded text-[11px] hover:bg-[#0040c0] transition-colors" style={{ fontWeight: 600 }}>Save</button>
              </div>
            </Collapse>

            <Collapse title="WCAG AA Compliance" icon={<AlertTriangle size={13} />} defaultOpen={false}>
              <p className="text-[11px] text-[#4a5568] leading-relaxed mb-2">
                Checks contrast ratio between text and background colors. 4.5:1 for normal text, 3:1 for large text.
              </p>
              {!section ? (
                <p className="text-[11px] text-[#a0aec0] text-center py-3">
                  Click any section on the canvas to check its WCAG AA compliance.
                </p>
              ) : (() => {
                const wcagPairs = extractWcagPairs(section);
                if (wcagPairs.length === 0) return (
                  <p className="text-[11px] text-[#a0aec0] text-center py-3">No color pairs detected in this section.</p>
                );
                return (
                  <div className="space-y-1.5">
                    {wcagPairs.map(({ label, fg, bg, large }) => {
                      const pass = checkWcagAA(fg, bg, large);
                      return (
                        <div key={`${fg}|${bg}`} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] ${pass ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`} style={{ fontWeight: 500 }}>
                          <span>{pass ? '✓' : '✗'}</span>
                          <span className="flex-1">{label}</span>
                          <div className="flex gap-0.5">
                            <div className="w-3.5 h-3.5 rounded border border-black/10" style={{ backgroundColor: fg }} />
                            <div className="w-3.5 h-3.5 rounded border border-black/10" style={{ backgroundColor: bg }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Collapse>

            <Collapse title="Templates" icon={<Save size={13} />} defaultOpen={false}>
              <div className="flex gap-1.5">
                <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name"
                  className="flex-1 px-2 py-1 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[11px] outline-none focus:border-[#004BE2]" />
                <button onClick={() => { if (templateName.trim()) { onSaveTemplate(templateName.trim()); setTemplateName(''); } }}
                  className="px-3 py-1 bg-[#004BE2] text-white rounded text-[11px] hover:bg-[#0040c0]" style={{ fontWeight: 600 }}>Save</button>
              </div>

              {customTemplates.length > 0 && (
                <>
                  <p className="text-[10px] text-[#a0aec0] pt-4 pb-2 tracking-[0.1em]" style={{ fontWeight: 700 }}>MY TEMPLATES</p>
                  <div className="grid grid-cols-2 gap-2">
                    {customTemplates.map(tpl => {
                      const isActive = activeCustomTemplateId === tpl.id;
                      return (
                        <div key={tpl.id} className={`relative group/tplcard rounded overflow-hidden border transition-all cursor-pointer ${isActive ? 'border-[#004BE2] shadow-sm' : 'border-[#e2e7ee] hover:border-[#a0aec0]'}`}>
                          <button onClick={() => onSelectCustomTemplate(tpl)} className="w-full block">
                            <div className="overflow-hidden bg-[#f7f8fa]" style={{ height: TPLCONTAINER_H }}>
                              <iframe srcDoc={tpl.previewHtml} title={tpl.name} scrolling="no"
                                style={{ width: 600, height: TPLIFRAME_H, border: 'none', display: 'block', transform: `scale(${TPLSCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }} />
                            </div>
                          </button>
                          <div className={`px-1.5 py-1.5 border-t ${isActive ? 'bg-[#004BE2] border-[#004BE2]' : 'bg-white border-[#e2e7ee]'}`}>
                            <p className={`text-[10px] truncate leading-tight ${isActive ? 'text-white' : 'text-[#4a5568]'}`} style={{ fontWeight: 500 }}>{tpl.name}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); onDeleteCustomTemplate(tpl.id); }}
                            className="absolute top-[6px] right-[6px] w-6 h-6 rounded-full flex items-center justify-center text-white opacity-0 group-hover/tplcard:opacity-100 transition-opacity hover:bg-black/75"
                            style={{ background: 'rgba(0,0,0,0.5)' }}
                            title="Delete"><Trash2 size={11} /></button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <p className="text-[10px] text-[#a0aec0] pt-4 pb-2 tracking-[0.1em]" style={{ fontWeight: 700 }}>DEFAULT TEMPLATES</p>
              <div className="grid grid-cols-2 gap-2">
                {builtinTemplates.slice(0, 3).map((tpl, i) => {
                  const isActive = activeBuiltinTemplate === i;
                  return (
                    <div key={i} className={`rounded overflow-hidden border transition-all cursor-pointer ${isActive ? 'border-[#004BE2] shadow-sm' : 'border-[#e2e7ee] hover:border-[#a0aec0]'}`}>
                      <button onClick={() => onSelectBuiltinTemplate(i, tpl.sections)} className="w-full block">
                        <div className="overflow-hidden bg-[#f7f8fa]" style={{ height: TPLCONTAINER_H }}>
                          <iframe srcDoc={tpl.html} title={tpl.name} scrolling="no"
                            style={{ width: 600, height: TPLIFRAME_H, border: 'none', display: 'block', transform: `scale(${TPLSCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }} />
                        </div>
                      </button>
                      <div className={`px-1.5 py-1.5 border-t ${isActive ? 'bg-[#004BE2] border-[#004BE2]' : 'bg-white border-[#e2e7ee]'}`}>
                        <p className={`text-[10px] truncate leading-tight ${isActive ? 'text-white' : 'text-[#4a5568]'}`} style={{ fontWeight: 500 }}>{tpl.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Collapse>
          </>
        )}
      </div>
    </div>
  );
}