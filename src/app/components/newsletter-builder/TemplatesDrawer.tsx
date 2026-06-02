import React, { useMemo } from 'react';
import { LibrarySection, CanvasSection } from './types';
import { ContentStore } from './content-store';
import { X, LayoutTemplate, Trash2 } from 'lucide-react';

const CATEGORY_ORDER = [
  'Headers', 'Heroes', 'Features', 'Testimonials', 'Articles',
  'Events', 'Registration', 'CTAs', 'Collages', 'Footers',
] as const;

export const TEMPLATE_NAMES = [
  'Template 1', 'Template 2', 'Template 3', 'Template 4', 'Template 5',
];

export interface CustomTemplate {
  id: string;
  name: string;
  canvasSections: CanvasSection[];
  previewHtml: string;
  contentStore?: ContentStore;
  savedAt: number;
}

export function buildTemplateSections(library: LibrarySection[], templateIdx: number): LibrarySection[] {
  return CATEGORY_ORDER
    .map(cat => {
      const catSections = library.filter(
        s => s.category === cat && !s.id.startsWith('custom-') && !s.id.startsWith('imp-')
      );
      if (catSections.length === 0) return null;
      return catSections[Math.min(templateIdx, catSections.length - 1)];
    })
    .filter((s): s is LibrarySection => s !== null);
}

function buildPreviewHtml(sections: LibrarySection[]): string {
  const body = sections.map(s => s.html).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:0;font-family:Arial,sans-serif}table{border-collapse:collapse}img{display:block;max-width:100%}</style></head><body>${body}</body></html>`;
}

// Thumbnail dimensions: scale 600px content to fit the 264px card width
const PREVIEW_SCALE = 264 / 600;
const IFRAME_H = 560;
const CONTAINER_H = Math.round(IFRAME_H * PREVIEW_SCALE);

function TemplateCard({
  name,
  previewHtml,
  isActive,
  onClick,
  onDelete,
}: {
  name: string;
  previewHtml: string;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`w-full rounded-lg border-2 overflow-hidden transition-all ${
        isActive ? 'border-[#004BE2] shadow-lg' : 'border-[#e2e7ee] hover:border-[#004BE2]/50 hover:shadow-sm'
      }`}
    >
      {/* Scaled preview — clicking anywhere on the card loads the template */}
      <button
        onClick={onClick}
        className="w-full text-left block"
      >
        <div className="relative overflow-hidden bg-white" style={{ width: 264, height: CONTAINER_H }}>
          <iframe
            srcDoc={previewHtml}
            title={name}
            scrolling="no"
            style={{
              width: 600,
              height: IFRAME_H,
              border: 'none',
              display: 'block',
              transform: `scale(${PREVIEW_SCALE})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          />
          {isActive && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-[#004BE2] rounded-full flex items-center justify-center shadow">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </button>

      {/* Label bar */}
      <div className={`flex items-center gap-1.5 px-2.5 py-2 border-t ${
        isActive ? 'bg-[#004BE2] border-[#004BE2]' : 'bg-white border-[#e2e7ee]'
      }`}>
        <LayoutTemplate size={11} className={isActive ? 'text-white/80' : 'text-[#718096]'} />
        <button
          onClick={onClick}
          className={`text-[11px] flex-1 text-left truncate ${isActive ? 'text-white' : 'text-[#2d3748]'}`}
          style={{ fontWeight: 600 }}
        >
          {name}
        </button>
        {isActive && !onDelete && (
          <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
            Active
          </span>
        )}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${
              isActive
                ? 'text-white/60 hover:text-white hover:bg-white/20'
                : 'text-[#a0aec0] hover:text-red-500 hover:bg-red-50'
            }`}
            title="Delete template"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  library: LibrarySection[];
  activeBuiltinTemplate: number | null;
  activeCustomTemplateId: string | null;
  customTemplates: CustomTemplate[];
  onSelect: (templateIdx: number, sections: LibrarySection[]) => void;
  onSelectCustom: (template: CustomTemplate) => void;
  onDeleteCustom: (id: string) => void;
  onClose: () => void;
}

export function TemplatesDrawer({
  library,
  activeBuiltinTemplate,
  activeCustomTemplateId,
  customTemplates,
  onSelect,
  onSelectCustom,
  onDeleteCustom,
  onClose,
}: Props) {
  const builtinTemplates = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => {
      const sections = buildTemplateSections(library, i);
      return { name: TEMPLATE_NAMES[i], sections, html: buildPreviewHtml(sections) };
    }),
    [library]
  );

  return (
    <div className="flex flex-col h-full bg-[#fafbfc]">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[#e2e7ee] bg-white flex items-center justify-between shrink-0">
        <h2 className="text-[11px] tracking-[0.12em] text-[#4a5568]" style={{ fontWeight: 700 }}>TEMPLATES</h2>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#718096] hover:text-[#0E0E0E] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {/* My Templates */}
        {customTemplates.length > 0 && (
          <div>
            <p className="text-[10px] text-[#a0aec0] px-1 pb-1.5 pt-0.5 tracking-[0.1em]" style={{ fontWeight: 700 }}>
              MY TEMPLATES
            </p>
            <div className="space-y-3">
              {customTemplates.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  name={tpl.name}
                  previewHtml={tpl.previewHtml}
                  isActive={activeCustomTemplateId === tpl.id}
                  onClick={() => onSelectCustom(tpl)}
                  onDelete={() => onDeleteCustom(tpl.id)}
                />
              ))}
            </div>
            <div className="border-t border-[#e2e7ee] my-3" />
            <p className="text-[10px] text-[#a0aec0] px-1 pb-1.5 tracking-[0.1em]" style={{ fontWeight: 700 }}>
              BUILT-IN TEMPLATES
            </p>
          </div>
        )}

        {/* Built-in templates */}
        <div className="space-y-3">
          {builtinTemplates.map((tpl, i) => (
            <TemplateCard
              key={i}
              name={tpl.name}
              previewHtml={tpl.html}
              isActive={activeBuiltinTemplate === i}
              onClick={() => onSelect(i, tpl.sections)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
