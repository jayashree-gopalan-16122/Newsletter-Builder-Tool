import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SectionLibrary } from './SectionLibrary';
import { LibrarySection, CanvasSection } from './types';
import { buildTemplateSections, TEMPLATE_NAMES } from './TemplatesDrawer';
import { exportElementsToHtml } from './html-utils';
import { LayoutTemplate, Trash2, RotateCcw, X, Pencil } from 'lucide-react';

interface SavedTemplate {
  id: string;
  name: string;
  thumbnail: string;
  sections: CanvasSection[];
  createdAt: string;
}

const PREVIEW_SCALE = 264 / 600;
const IFRAME_H = 560;
const CONTAINER_H = Math.round(IFRAME_H * PREVIEW_SCALE);

function buildCanvasPreviewHtml(sections: CanvasSection[]): string {
  const body = sections.map(s => exportElementsToHtml(s.elements)).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:0;font-family:Arial,sans-serif}table{border-collapse:collapse}img{display:block;max-width:100%}</style></head><body>${body}</body></html>`;
}

function buildLibraryPreviewHtml(sections: LibrarySection[]): string {
  const body = sections.map(s => s.html).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:0;font-family:Arial,sans-serif}table{border-collapse:collapse}img{display:block;max-width:100%}</style></head><body>${body}</body></html>`;
}

function TemplateCard({
  name,
  previewHtml,
  isActive,
  onLoad,
  onDelete,
  onRename,
}: {
  name: string;
  previewHtml: string;
  isActive?: boolean;
  onLoad: () => void;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [showRenameTip, setShowRenameTip] = useState(false);
  const [showDeleteTip, setShowDeleteTip] = useState(false);

  useEffect(() => { setEditName(name); }, [name]);

  const commitRename = () => {
    setEditing(false);
    if (editName.trim() && editName.trim() !== name) onRename?.(editName.trim());
    else setEditName(name);
  };

  // Shared tooltip style — dark pill, white text, fades in
  const tip = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: 'white',
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 4,
    whiteSpace: 'nowrap',
    zIndex: 200,
    pointerEvents: 'none',
    opacity: 1,
    transition: 'opacity 0.15s ease',
    ...extra,
  });

  return (
    <div
      style={{
        borderRadius: 8,
        border: isActive ? '2px solid #2563EB' : '1px solid #E5E7EB',
        backgroundColor: 'white',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        position: 'relative',
        // No overflow:hidden — children manage their own clipping; tooltips can escape
      }}
      onMouseEnter={() => { setHovered(true); }}
      onMouseLeave={() => { setHovered(false); setShowRenameTip(false); setShowDeleteTip(false); }}
      onClick={onLoad}
    >
      {/* Thumbnail — has its own overflow:hidden + top border-radius to clip the iframe */}
      <div style={{ position: 'relative', height: 110, overflow: 'hidden', borderRadius: '7px 7px 0 0' }}>
        <iframe
          srcDoc={previewHtml}
          title=""
          scrolling="no"
          style={{
            width: 600,
            height: 560,
            border: 'none',
            display: 'block',
            transform: `scale(${110 / 560})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        />
        {hovered && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.04)', pointerEvents: 'none' }} />}
      </div>

      {/* Action buttons — child of outer card (not thumbnail) so tooltips are never clipped */}
      {(onRename || onDelete) && (
        <div
          style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 6, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s ease', zIndex: 10 }}
          onClick={e => e.stopPropagation()}
        >
          {onRename && (
            <div style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setShowRenameTip(true)}
                onMouseLeave={() => setShowRenameTip(false)}
                onClick={e => { e.stopPropagation(); setEditing(true); setEditName(name); }}
                style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 5, padding: '5px 6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Pencil size={12} color="white" />
              </button>
              {showRenameTip && (
                <div style={tip({ top: 'calc(100% + 4px)', right: 0 })}>Rename</div>
              )}
            </div>
          )}
          {onDelete && (
            <div style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setShowDeleteTip(true)}
                onMouseLeave={() => setShowDeleteTip(false)}
                onClick={e => { e.stopPropagation(); onDelete(); }}
                style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 5, padding: '5px 6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={12} color="white" />
              </button>
              {showDeleteTip && (
                <div style={tip({ top: 'calc(100% + 4px)', right: 0 })}>Delete</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Name label — bottom border-radius completes the rounded card shape */}
      <div
        style={{ padding: '6px 8px', backgroundColor: 'white', borderRadius: '0 0 7px 7px', position: 'relative' }}
        onClick={e => editing && e.stopPropagation()}
      >
        {/* Tooltip above name label — My Templates only, never clips outside the card */}
        {hovered && !editing && (onRename || onDelete) && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.75)', color: 'white', fontSize: 11, padding: '4px 8px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none', opacity: 1, transition: 'opacity 0.15s ease' }}>
            {name}
          </div>
        )}
        {editing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') { setEditing(false); setEditName(name); }
            }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', fontSize: 12, fontWeight: 500, color: '#111827', border: '1px solid #2563EB', borderRadius: 4, padding: '2px 4px', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
          />
        ) : (
          <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', textAlign: 'center', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  library: LibrarySection[];
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
  sectionCount: number;
  activeBuiltinTemplate: number | null;
  onBuildFromScratch: () => void;
  onSelectBuiltinTemplate: (idx: number, sections: LibrarySection[]) => void;
  onLoadUserTemplate: (sections: CanvasSection[], name: string) => void;
  savedTemplatesVersion?: number;
}

export function LeftPanel({
  library,
  search, category, selectedCanvasId, syncedCategory, syncedCode,
  onSearchChange, onCategoryChange, onDragStart, onDoubleClick, onReplaceSection, onImportHtml,
  sectionCount, activeBuiltinTemplate,
  onBuildFromScratch, onSelectBuiltinTemplate, onLoadUserTemplate,
  savedTemplatesVersion,
}: Props) {
  const [activeTab, setActiveTab] = useState<'library' | 'templates'>('library');
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showConfirmScratch, setShowConfirmScratch] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadSavedTemplates = () => {
    try {
      const raw = localStorage.getItem('userSavedTemplates');
      setSavedTemplates(raw ? JSON.parse(raw) : []);
    } catch { setSavedTemplates([]); }
  };

  useEffect(() => {
    loadSavedTemplates();
  }, []);

  // Reload when switching to the templates tab
  useEffect(() => {
    if (activeTab === 'templates') loadSavedTemplates();
  }, [activeTab]);

  // Always reload when a template is saved, regardless of active tab
  useEffect(() => {
    loadSavedTemplates();
  }, [savedTemplatesVersion]);

  const handleRenameTemplate = (id: string, newName: string) => {
    const next = savedTemplates.map(t => t.id === id ? { ...t, name: newName } : t);
    try { localStorage.setItem('userSavedTemplates', JSON.stringify(next)); } catch {}
    setSavedTemplates(next);
  };

  const builtinTemplates = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => {
      const secs = buildTemplateSections(library, i);
      return { name: TEMPLATE_NAMES[i], sections: secs, html: buildLibraryPreviewHtml(secs) };
    }),
    [library]
  );

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;
    const next = savedTemplates.filter(t => t.id !== deleteConfirmId);
    try { localStorage.setItem('userSavedTemplates', JSON.stringify(next)); } catch {}
    setSavedTemplates(next);
    setDeleteConfirmId(null);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Tab bar */}
        <div className="flex shrink-0 bg-white border-b border-[#e2e7ee]">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-2.5 text-[12px] border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-[#004BE2] text-[#004BE2]'
                : 'border-transparent text-[#111827] hover:text-[#2d3748]'
            }`}
            style={{ fontWeight: 600 }}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-2.5 text-[12px] border-b-2 transition-colors ${
              activeTab === 'library'
                ? 'border-[#004BE2] text-[#004BE2]'
                : 'border-transparent text-[#111827] hover:text-[#2d3748]'
            }`}
            style={{ fontWeight: 600 }}
          >
            Section Library
          </button>
        </div>

        {/* Section Library tab */}
        {activeTab === 'library' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <SectionLibrary
              sections={library}
              search={search}
              category={category}
              selectedCanvasId={selectedCanvasId}
              syncedCategory={syncedCategory}
              syncedCode={syncedCode}
              onSearchChange={onSearchChange}
              onCategoryChange={onCategoryChange}
              onDragStart={onDragStart}
              onDoubleClick={onDoubleClick}
              onReplaceSection={onReplaceSection}
              onImportHtml={onImportHtml}
            />
          </div>
        )}

        {/* Templates tab */}
        {activeTab === 'templates' && (
          <div className="flex-1 min-h-0 overflow-y-auto bg-[#fafbfc]">
            {/* Build from Scratch */}
            <div className="px-2 pt-3 pb-2">
              <button
                onClick={() => { if (sectionCount > 0) setShowConfirmScratch(true); else onBuildFromScratch(); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-[#dce1e8] bg-white rounded-lg text-[12px] text-[#2d3748] hover:border-[#004BE2] hover:text-[#004BE2] hover:bg-[#f0f5ff] transition-colors"
                style={{ fontWeight: 600 }}
              >
                <RotateCcw size={13} /> Build from Scratch
              </button>
            </div>

            {/* My Templates */}
            <div className="px-3 pt-2">
              <div className="pb-2 mb-2 border-b border-[#E5E7EB]">
                <p className="text-[12px] text-[#4A5568]" style={{ fontWeight: 600 }}>My Templates</p>
              </div>
              {savedTemplates.length === 0 ? (
                <p className="text-[12px] text-[#9CA3AF] text-center">No saved templates yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
                  {[...savedTemplates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(tpl => (
                    <TemplateCard
                      key={tpl.id}
                      name={tpl.name}
                      previewHtml={buildCanvasPreviewHtml(tpl.sections)}
                      onLoad={() => onLoadUserTemplate(tpl.sections, tpl.name)}
                      onDelete={() => setDeleteConfirmId(tpl.id)}
                      onRename={newName => handleRenameTemplate(tpl.id, newName)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Built-in Templates */}
            <div className="px-3 pb-4 mt-5">
              <div className="pb-2 mb-2 border-b border-[#E5E7EB]">
                <p className="text-[12px] text-[#4A5568]" style={{ fontWeight: 600 }}>Built-in Templates</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {builtinTemplates.map((tpl, i) => (
                  <TemplateCard
                    key={i}
                    name={tpl.name}
                    previewHtml={tpl.html}
                    isActive={activeBuiltinTemplate === i}
                    onLoad={() => onSelectBuiltinTemplate(i, tpl.sections)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Build from Scratch confirmation */}
      {showConfirmScratch && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowConfirmScratch(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e2e7ee]">
              <RotateCcw size={16} className="text-[#004BE2]" />
              <h3 className="text-[14px] text-[#0E0E0E] flex-1" style={{ fontWeight: 600 }}>Build from Scratch?</h3>
              <button onClick={() => setShowConfirmScratch(false)} className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] flex items-center justify-center text-[#718096]"><X size={16} /></button>
            </div>
            <div className="px-5 py-3">
              <p className="text-[12px] text-[#4a5568]">This will clear all {sectionCount} section{sectionCount !== 1 ? 's' : ''} from the canvas and start fresh. This action cannot be undone.</p>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[#e2e7ee]">
              <button onClick={() => setShowConfirmScratch(false)}
                className="flex-1 py-2 border border-[#dce1e8] rounded-md text-[12px] text-[#4a5568] hover:bg-[#f7f8fa]" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={() => { onBuildFromScratch(); setShowConfirmScratch(false); }}
                className="flex-1 py-2 bg-[#004BE2] text-white rounded-md text-[12px] hover:bg-[#003cc0] transition-colors" style={{ fontWeight: 600 }}>
                Build from Scratch
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete template confirmation */}
      {deleteConfirmId && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e2e7ee]">
              <Trash2 size={16} className="text-red-500" />
              <h3 className="text-[14px] text-[#0E0E0E] flex-1" style={{ fontWeight: 600 }}>Delete this template?</h3>
              <button onClick={() => setDeleteConfirmId(null)} className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] flex items-center justify-center text-[#718096]"><X size={16} /></button>
            </div>
            <div className="px-5 py-3">
              <p className="text-[12px] text-[#4a5568]">This will permanently delete the template. This action cannot be undone.</p>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[#e2e7ee]">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-[#dce1e8] rounded-md text-[12px] text-[#4a5568] hover:bg-[#f7f8fa]" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm}
                className="flex-1 py-2 bg-red-500 text-white rounded-md text-[12px] hover:bg-red-600 transition-colors" style={{ fontWeight: 600 }}>
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
