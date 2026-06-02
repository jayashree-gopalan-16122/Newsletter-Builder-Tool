import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { LibrarySection, SectionCategory } from './types';
import {
  Search, Upload, GripVertical, ChevronDown, ChevronRight, Filter, X,
  LayoutTemplate, Sparkles, Cpu, MessageSquareQuote, FileText, CalendarDays,
  ClipboardList, MousePointerClick, Mail, Grid3X3, Minus
} from 'lucide-react';

const CATEGORIES: (SectionCategory | 'All')[] = [
  'All', 'Headers', 'Heroes', 'Features', 'Testimonials', 'Articles',
  'Events', 'Registration', 'CTAs', 'Collages', 'Dividers', 'Footers',
];

const CAT_META: Record<string, { color: string; icon: React.ReactNode }> = {
  Headers: { color: '#004BE2', icon: <LayoutTemplate size={13} /> },
  Heroes: { color: '#7c3aed', icon: <Sparkles size={13} /> },
  Features: { color: '#0d9488', icon: <Cpu size={13} /> },
  Testimonials: { color: '#2563eb', icon: <MessageSquareQuote size={13} /> },
  Articles: { color: '#d97706', icon: <FileText size={13} /> },
  Events: { color: '#dc2626', icon: <CalendarDays size={13} /> },
  Registration: { color: '#059669', icon: <ClipboardList size={13} /> },
  CTAs: { color: '#E42527', icon: <MousePointerClick size={13} /> },
  Footers: { color: '#6b7280', icon: <Mail size={13} /> },
  Collages: { color: '#8b5cf6', icon: <Grid3X3 size={13} /> },
  Dividers: { color: '#9ca3af', icon: <Minus size={13} /> },
};

interface Props {
  sections: LibrarySection[];
  search: string;
  category: string;
  selectedCanvasId: string | null;
  syncedCategory: string | null;
  syncedCode: string | null;
  onSearchChange: (q: string) => void;
  onCategoryChange: (c: string) => void;
  onDragStart: (section: LibrarySection) => void;
  onDoubleClick: (section: LibrarySection) => void;
  onReplaceSection: (section: LibrarySection) => void;
  onImportHtml: (html: string, name: string) => void;
}

export function SectionLibrary({
  sections, search, category, selectedCanvasId,
  syncedCategory, syncedCode,
  onSearchChange, onCategoryChange, onDragStart, onDoubleClick, onReplaceSection, onImportHtml
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  // Collapsed by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const needScrollRef = useRef(false);
  const highlightedItemRef = useRef<HTMLDivElement | null>(null);

  // When canvas selection changes, expand only the matching category
  useEffect(() => {
    if (!syncedCategory) return;
    setExpanded({ [syncedCategory]: true });
    needScrollRef.current = true;
  }, [syncedCategory, syncedCode]);

  // After the expand state update causes a re-render, scroll the highlighted item into view
  useEffect(() => {
    if (!needScrollRef.current) return;
    needScrollRef.current = false;
    highlightedItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [expanded]);

  const filtered = sections.filter(s => {
    const catOk = category === 'All' || s.category === category;
    const q = search.toLowerCase();
    const searchOk = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) ||
      s.source.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    return catOk && searchOk;
  });

  // Group by category preserving order
  const grouped: [string, LibrarySection[]][] = [];
  const catOrder = CATEGORIES.filter(c => c !== 'All');
  const groupMap: Record<string, LibrarySection[]> = {};
  filtered.forEach(s => { (groupMap[s.category] = groupMap[s.category] || []).push(s); });
  catOrder.forEach(c => { if (groupMap[c]) grouped.push([c, groupMap[c]]); });

  /** Convert a JSZip file entry to a base64 data URI of the form
   *  data:<mime>;base64,<...>. Returns null if the entry can't be read.
   *  Used to inline image and font assets so the canvas can render them
   *  without needing the original asset files on the server. */
  const fileToDataUri = async (entry: JSZip.JSZipObject, mime: string): Promise<string | null> => {
    try {
      const data = await entry.async('base64');
      return `data:${mime};base64,${data}`;
    } catch {
      return null;
    }
  };

  /** Map an asset file extension to the appropriate MIME type for the
   *  data: URI. Anything we don't recognize falls back to octet-stream
   *  (browsers will still attempt to render images by sniffing). */
  const mimeForExt = (ext: string): string => {
    const e = ext.toLowerCase();
    if (e === 'png') return 'image/png';
    if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
    if (e === 'gif') return 'image/gif';
    if (e === 'webp') return 'image/webp';
    if (e === 'svg') return 'image/svg+xml';
    if (e === 'avif') return 'image/avif';
    if (e === 'ico') return 'image/x-icon';
    if (e === 'woff') return 'font/woff';
    if (e === 'woff2') return 'font/woff2';
    if (e === 'ttf') return 'font/ttf';
    if (e === 'otf') return 'font/otf';
    if (e === 'eot') return 'application/vnd.ms-fontobject';
    return 'application/octet-stream';
  };

  /** Process a ZIP file: locate the main HTML doc, build a map of all
   *  asset paths → data URIs, then rewrite every image/font reference in
   *  the HTML so they point at the inlined data URIs. We try multiple
   *  match strategies (full path, basename, stripped leading ./ or /)
   *  because emails are inconsistent about how they reference assets. */
  const processZip = async (file: File): Promise<{ html: string; name: string } | null> => {
    const zip = await JSZip.loadAsync(file);
    // First pass: identify the main HTML/JSON file and all assets.
    let mainEntry: JSZip.JSZipObject | null = null;
    let mainName = '';
    const assetEntries: { entry: JSZip.JSZipObject; path: string; ext: string }[] = [];
    zip.forEach((relPath, entry) => {
      if (entry.dir) return;
      // Skip macOS resource forks and other hidden noise
      if (relPath.startsWith('__MACOSX/') || relPath.includes('/.DS_Store')) return;
      const lower = relPath.toLowerCase();
      const dot = lower.lastIndexOf('.');
      const ext = dot >= 0 ? lower.slice(dot + 1) : '';
      // Pick the FIRST html/json found at the shallowest depth
      if (ext === 'html' || ext === 'htm' || ext === 'json') {
        if (!mainEntry || relPath.split('/').length < mainName.split('/').length) {
          mainEntry = entry;
          mainName = relPath;
        }
      } else if (['png','jpg','jpeg','gif','webp','svg','avif','ico','woff','woff2','ttf','otf','eot'].includes(ext)) {
        assetEntries.push({ entry, path: relPath, ext });
      }
    });
    if (!mainEntry) return null;
    let html = await (mainEntry as JSZip.JSZipObject).async('string');
    // If the main entry is JSON (some tools export builder state as JSON),
    // try to extract HTML from common shapes; otherwise treat as-is.
    if (mainName.toLowerCase().endsWith('.json')) {
      try {
        const parsed = JSON.parse(html);
        // Common shapes: { html: "..." } or { content: "..." } or just a string
        if (typeof parsed === 'string') html = parsed;
        else if (typeof parsed?.html === 'string') html = parsed.html;
        else if (typeof parsed?.content === 'string') html = parsed.content;
      } catch {
        // Not valid JSON — fall through with the raw text.
      }
    }
    // Second pass: inline all assets as data URIs in parallel.
    const dataUris = await Promise.all(
      assetEntries.map(async ({ entry, path, ext }) => ({
        path,
        uri: await fileToDataUri(entry, mimeForExt(ext)),
      }))
    );
    // Build a lookup table keyed by both the full path and the basename
    // so references like "logo.png", "./logo.png", "/assets/logo.png", and
    // "assets/logo.png" all match the same asset.
    const pathToUri: Record<string, string> = {};
    dataUris.forEach(({ path, uri }) => {
      if (!uri) return;
      pathToUri[path] = uri;
      pathToUri['./' + path] = uri;
      pathToUri['/' + path] = uri;
      const base = path.split('/').pop()!;
      // Don't overwrite an earlier full-path match with a basename match —
      // if two assets share a basename, the first wins.
      if (!pathToUri[base]) pathToUri[base] = uri;
    });
    // Replace all references to local asset paths with their data URIs.
    // We rewrite three contexts:
    //   1. <img src="..."> and srcset
    //   2. CSS url(...) inside <style> blocks and inline style attributes
    //   3. <link href="..."> for fonts (rare but possible)
    // We skip absolute http(s):// and existing data: URIs — those resolve
    // on their own.
    const rewriteRef = (raw: string): string => {
      const v = raw.trim();
      if (!v) return raw;
      if (v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('//')) return raw;
      // Try lookup variants in order of specificity
      if (pathToUri[v]) return pathToUri[v];
      const stripped = v.replace(/^\.?\//, '');
      if (pathToUri[stripped]) return pathToUri[stripped];
      const base = v.split('/').pop()!;
      if (pathToUri[base]) return pathToUri[base];
      return raw;
    };
    // src="..." and href="..." (quoted)
    html = html.replace(/(\s(?:src|href|data-src)\s*=\s*)("([^"]*)"|'([^']*)')/gi, (_m, prefix, _full, dq, sq) => {
      const val = dq !== undefined ? dq : sq;
      const newVal = rewriteRef(val);
      const quote = dq !== undefined ? '"' : "'";
      return `${prefix}${quote}${newVal}${quote}`;
    });
    // CSS url(...) — handles url(foo), url('foo'), url("foo")
    html = html.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi, (m, q, val) => {
      const newVal = rewriteRef(val);
      return newVal === val ? m : `url(${q}${newVal}${q})`;
    });
    return { html, name: file.name.replace(/\.zip$/i, '') };
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const f of files) {
      const isZip = /\.zip$/i.test(f.name) || f.type === 'application/zip' || f.type === 'application/x-zip-compressed';
      if (isZip) {
        try {
          const result = await processZip(f);
          if (result) onImportHtml(result.html, result.name);
        } catch (err) {
          console.error('ZIP import failed:', err);
        }
      } else {
        // Existing flow for plain .html / .htm — read as text and forward.
        const r = new FileReader();
        r.onload = () => typeof r.result === 'string' && onImportHtml(r.result, f.name.replace(/\.html?$/i, ''));
        r.readAsText(f);
      }
    }
  };

  const toggle = (cat: string) => setExpanded(p => ({ ...p, [cat]: !p[cat] }));

  // Auto-expand when searching
  const isExpanded = (cat: string) => search ? true : !!expanded[cat];

  return (
    <div className="flex flex-col h-full bg-[#fafbfc]">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 space-y-2 border-b border-[#e2e7ee] bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] tracking-[0.12em] text-[#4a5568]" style={{ fontWeight: 700 }}>SECTION LIBRARY</h2>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a0aec0]" />
          <input type="text" placeholder="Search sections..." value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 py-[7px] bg-[#f4f6f8] border border-[#dce1e8] rounded-md text-[12px] text-[#2d3748] placeholder:text-[#a0aec0] outline-none focus:border-[#004BE2] focus:ring-1 focus:ring-[#004BE2]/20" />
          {search && (
            <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a0aec0] hover:text-[#4a5568]">
              <X size={12} />
            </button>
          )}
        </div>

      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        {grouped.map(([cat, items]) => {
          const meta = CAT_META[cat] || { color: '#718096', icon: null };
          const open = isExpanded(cat);

          return (
            <div key={cat} className="mb-1">
              {/* Category header */}
              <button onClick={() => toggle(cat)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-[#edf0f5] transition-colors group">
                <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: meta.color + '15', color: meta.color }}>
                  {meta.icon}
                </div>
                <span className="text-[12px] text-[#2d3748] flex-1 text-left" style={{ fontWeight: 600 }}>{cat}</span>
                <span className="text-[10px] text-[#a0aec0] bg-[#f0f2f5] px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{items.length}</span>
                <span className="text-[#a0aec0] transition-transform" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  <ChevronDown size={12} />
                </span>
              </button>

              {/* Section items */}
              {open && (
                <div className="ml-2 pl-3 border-l-2 mt-0.5 mb-2" style={{ borderColor: meta.color + '30' }}>
                  {items.map(s => (
                    <div key={s.id}
                      ref={el => { if (s.code === syncedCode) highlightedItemRef.current = el; }}
                      draggable
                      onDragStart={e => { e.dataTransfer.setData('library-id', s.id); onDragStart(s); }}
                      onDoubleClick={() => onDoubleClick(s)}
                      onClick={() => { if (syncedCode) onReplaceSection(s); }}
                      className={`group/item flex items-center gap-2 px-2 py-[8px] rounded-md cursor-grab active:cursor-grabbing transition-all border ${
                        s.code === syncedCode
                          ? 'bg-[#e5edfc] border-[#004BE2]'
                          : 'border-transparent hover:bg-white hover:shadow-sm hover:border-[#dce1e8]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-[#a0aec0] shrink-0 bg-[#f0f2f5] px-1 py-0.5 rounded" style={{ fontWeight: 600 }}>{s.code}</span>
                          <span className="text-[11px] text-[#2d3748] truncate" style={{ fontWeight: 500 }}>{s.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-14 text-[#a0aec0]">
            <Search size={20} className="mb-2 text-[#dce1e8]" />
            <p className="text-[12px]" style={{ fontWeight: 500 }}>No sections found</p>
            {search && (
              <button onClick={() => onSearchChange('')}
                className="mt-2 text-[11px] text-[#004BE2] hover:underline" style={{ fontWeight: 500 }}>
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
