import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBuilderStore } from './store';
import { SectionLibrary } from './SectionLibrary';
import { LeftPanel } from './LeftPanel';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';
import { TEMPLATE_NAMES, CustomTemplate } from './TemplatesDrawer';
import { LibrarySection, CanvasSection } from './types';
import { loadContentStore, hasContentToRestore, ContentStore } from './content-store';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function BuilderLayout() {
  const store = useBuilderStore();
  const panelTabRef = useRef<'properties' | 'theme'>('properties');
  const [panelTab, setPanelTabState] = useState<'properties' | 'theme'>('properties');
  const [activeBuiltinTemplate, setActiveBuiltinTemplate] = useState<number | null>(0);
  const [activeCustomTemplateId, setActiveCustomTemplateId] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('nbl-custom-templates');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  // Track previous element ID to only auto-switch when user clicks a NEW element
  const prevElIdRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedContentStore, setSavedContentStore] = useState<ContentStore | null>(null);
  const [savedCanvasSections, setSavedCanvasSections] = useState<CanvasSection[] | null>(null);
  const [showStartFreshCover, setShowStartFreshCover] = useState(false);
  const [canvasFading, setCanvasFading] = useState(false);

  // Panel open/closed state — always collapsed on load, never persisted
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(false);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(false);
  const [savedTemplatesVersion, setSavedTemplatesVersion] = useState(0);

  // Auto-open both panels when user selects a section or element on canvas
  useEffect(() => {
    if (store.selectedId !== null) {
      setLeftPanelOpen(true);
      setRightPanelOpen(true);
    }
  }, [store.selectedId]);

  const setPanelTab = (t: 'properties' | 'theme') => {
    panelTabRef.current = t;
    setPanelTabState(t);
  };

  // Get element info reactively from store
  const elementInfo = useMemo(
    () => store.getElementInfo(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.canvas, store.selectedId, store.selectedElementId, store.getElementInfo]
  );

  // Only auto-switch to element tab when user clicks a NEW element (not on data changes)
  useEffect(() => {
    if (store.selectedElementId !== null && store.selectedElementId !== prevElIdRef.current && elementInfo) {
      setPanelTab('properties');
    }
    prevElIdRef.current = store.selectedElementId;
  }, [store.selectedElementId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (!isInput) { e.preventDefault(); store.undo(); }
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        if (!isInput) { e.preventDefault(); store.redo(); }
      }
      if (e.key === 'Delete' && store.selectedId && !isInput) {
        if (store.selectedElementId !== null) {
          store.deleteSelectedElement();
          toast('Element deleted');
        } else {
          store.removeSection(store.selectedId);
          toast('Section deleted');
        }
      }
      if (e.key === 'Escape') {
        if (store.selectedElementId !== null) {
          store.setSelectedElementId(null);
        } else {
          store.setSelectedId(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);

  // On mount, check for saved canvas session first, then fall back to content store
  useEffect(() => {
    try {
      if (localStorage.getItem('startFresh') === 'true') {
        localStorage.removeItem('startFresh');
        return;
      }
    } catch {}
    try {
      const raw = localStorage.getItem('newsletterBuilderSession');
      if (raw) {
        const sections = JSON.parse(raw) as CanvasSection[];
        if (sections && sections.length > 0) {
          setSavedCanvasSections(sections);
          setShowResumeModal(true);
          return;
        }
      }
    } catch {}
    const saved = loadContentStore();
    if (saved && hasContentToRestore(saved)) {
      setSavedContentStore(saved);
      setShowResumeModal(true);
    }
  }, []);

  // Auto-save canvas on every change; skip the very first render to avoid
  // persisting the default canvas before a real session check has run.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    try {
      localStorage.setItem('newsletterBuilderSession', JSON.stringify(store.canvas));
    } catch {}
  }, [store.canvas]);

  const handleResume = useCallback(() => {
    // canvas already pre-loaded from session; only run content-store injection as fallback
    if (!savedCanvasSections && savedContentStore) {
      store.injectSavedContent(savedContentStore);
    }
    setShowResumeModal(false);
  }, [savedCanvasSections, savedContentStore, store]);

  const handleStartFresh = useCallback(() => {
    setShowStartFreshCover(true);
    try {
      localStorage.setItem('startFresh', 'true');
      localStorage.removeItem('newsletterBuilderSession');
    } catch {}
    window.location.reload();
  }, []);

  const applyTemplate = useCallback((idx: number, sections: LibrarySection[]) => {
    store.loadLibrarySections(sections);
    setActiveBuiltinTemplate(idx);
    setActiveCustomTemplateId(null);
  }, [store]);

  const handleTemplateSelect = useCallback((idx: number, sections: LibrarySection[]) => {
    setCanvasFading(true);
    setTimeout(() => {
      applyTemplate(idx, sections);
      toast.success(`Loaded ${TEMPLATE_NAMES[idx]}`);
      requestAnimationFrame(() => setCanvasFading(false));
    }, 100);
  }, [applyTemplate]);

  const applyCustomTemplate = useCallback((tpl: CustomTemplate) => {
    setCanvasFading(true);
    setTimeout(() => {
      if (tpl.contentStore && Object.keys(tpl.contentStore).length > 0) {
        const current = store.getContentStore();
        const tplStore = tpl.contentStore;
        const allCats = new Set([...Object.keys(tplStore), ...Object.keys(current)]);
        const merged: ContentStore = {};
        allCats.forEach(cat => {
          const tplSlots = tplStore[cat]?.slots || {};
          const curSlots = current[cat]?.slots || {};
          merged[cat] = { slots: { ...tplSlots, ...curSlots } };
        });
        store.setContentStoreData(merged);
      }
      store.applyCanvasTemplate(tpl.canvasSections);
      setActiveCustomTemplateId(tpl.id);
      setActiveBuiltinTemplate(null);
      toast.success(`Loaded "${tpl.name}"`);
      requestAnimationFrame(() => setCanvasFading(false));
    }, 100);
  }, [store]);

  const saveCustomTemplate = useCallback((name: string) => {
    const tpl: CustomTemplate = {
      id: 'ct-' + Date.now(),
      name,
      canvasSections: JSON.parse(JSON.stringify(store.canvas)),
      previewHtml: store.exportHtml(),
      contentStore: JSON.parse(JSON.stringify(store.getContentStore())),
      savedAt: Date.now(),
    };
    setCustomTemplates(prev => {
      const next = [...prev, tpl];
      try { localStorage.setItem('nbl-custom-templates', JSON.stringify(next)); } catch {}
      return next;
    });
    toast.success('Template saved to Templates library.');
  }, [store]);

  const deleteCustomTemplate = useCallback((id: string) => {
    setCustomTemplates(prev => {
      const next = prev.filter(t => t.id !== id);
      try { localStorage.setItem('nbl-custom-templates', JSON.stringify(next)); } catch {}
      return next;
    });
    setActiveCustomTemplateId(prev => prev === id ? null : prev);
  }, []);

  const handleSaveUserTemplate = useCallback((name: string) => {
    const tpl = {
      id: 'ut-' + Date.now(),
      name,
      thumbnail: '',
      sections: JSON.parse(JSON.stringify(store.canvas)) as CanvasSection[],
      createdAt: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem('userSavedTemplates');
      const existing = raw ? JSON.parse(raw) : [];
      existing.push(tpl);
      localStorage.setItem('userSavedTemplates', JSON.stringify(existing));
    } catch {}
    setSavedTemplatesVersion(v => v + 1);
    toast.success(`Template "${name}" saved!`);
  }, [store]);

  const handleLoadUserTemplate = useCallback((sections: CanvasSection[], name: string) => {
    setCanvasFading(true);
    setTimeout(() => {
      store.loadCanvasSections(sections);
      setActiveBuiltinTemplate(null);
      setActiveCustomTemplateId(null);
      toast.success(`Loaded "${name}"`);
      requestAnimationFrame(() => setCanvasFading(false));
    }, 100);
  }, [store]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#e8ecf2]">
      <Toolbar
        previewMode={store.previewMode}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        sectionCount={store.canvas.length}
        onUndo={store.undo}
        onRedo={store.redo}
        onPreviewMode={store.setPreviewMode}
        onExportHtml={store.exportHtml}
        onExportZip={store.exportZip}
        onValidate={store.validate}
        onClearAll={() => { store.clearAll(); setLeftPanelOpen(true); setRightPanelOpen(false); }}
        onSaveTemplate={handleSaveUserTemplate}
      />

      <div className="flex-1 overflow-hidden relative">

        {/* Left panel — slides in/out via transform; canvas never moves */}
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0, width: 260,
            transform: `translateX(${leftPanelOpen ? 0 : -260}px)`,
            transition: 'transform 200ms ease-in-out',
            zIndex: 10,
          }}
        >
          <div className="w-[260px] h-full border-r border-[#d5dbe4]">
            <LeftPanel
              library={store.library}
              search={store.searchQuery}
              category={store.categoryFilter}
              selectedCanvasId={store.selectedId}
              syncedCategory={store.selected?.category ?? null}
              syncedCode={store.selected?.libraryCode ?? null}
              onSearchChange={store.setSearchQuery}
              onCategoryChange={store.setCategoryFilter}
              onDragStart={() => {}}
              onDoubleClick={(s: LibrarySection) => {
                store.addSection(s);
                toast.success(`Added "${s.name}"`);
              }}
              onReplaceSection={(lib: LibrarySection) => {
                if (store.selectedId) {
                  store.replaceSection(store.selectedId, lib);
                  toast.success(`Replaced with "${lib.name}"`);
                }
              }}
              onImportHtml={(html, name) => {
                const count = store.importHtml(html, name);
                toast.success(`Imported ${count} section(s) from "${name}"`);
              }}
              sectionCount={store.canvas.length}
              activeBuiltinTemplate={activeBuiltinTemplate}
              onBuildFromScratch={() => { store.clearAll(); setLeftPanelOpen(true); setRightPanelOpen(false); }}
              onSelectBuiltinTemplate={handleTemplateSelect}
              onLoadUserTemplate={handleLoadUserTemplate}
              savedTemplatesVersion={savedTemplatesVersion}
            />
          </div>
        </div>

        {/* Left panel toggle — fixed to screen edge, slides with panel */}
        <button
          onClick={() => setLeftPanelOpen(v => !v)}
          title={leftPanelOpen ? 'Collapse section library' : 'Expand section library'}
          style={{
            position: 'fixed',
            left: leftPanelOpen ? 260 : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'left 200ms ease-in-out',
            zIndex: 20,
          }}
          className="w-5 h-10 bg-white border border-[#d5dbe4] rounded-r flex items-center justify-center text-[#718096] hover:bg-[#f0f2f5] hover:text-[#0E0E0E] shadow-sm cursor-pointer"
        >
          {leftPanelOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Canvas — fixed position, never shifts regardless of panel state */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            opacity: canvasFading ? 0 : 1,
            transition: 'opacity 100ms ease',
          }}
        >
          <Canvas
            sections={store.canvas}
            selectedId={store.selectedId}
            selectedElementId={store.selectedElementId}
            previewMode={store.previewMode}
            library={store.library}
            flashedElementIds={store.flashedElementIds}
            onSelect={id => {
              store.setSelectedId(id);
              if (!id) store.setSelectedElementId(null);
            }}
            onSelectEl={store.selectElement}
            onAdd={(lib, idx) => {
              const id = store.addSection(lib, idx);
              toast.success(`Added "${lib.name}"`);
              return id;
            }}
            onRemove={id => { store.removeSection(id); toast('Section removed'); }}
            onDuplicate={id => { store.duplicateSection(id); toast.success('Section duplicated'); }}
            onMove={store.moveSection}
            onSaveToLibrary={s => { store.saveToLibrary(s); toast.success('Saved to library'); }}
            onFocusSettings={() => setPanelTab('properties')}
            onPatchElement={store.patchElement}
            onToggleFeatureGroup={store.toggleFeatureGroup}
            onAddFeatureGroupAfter={store.addFeatureGroupAfter}
            onReorderFeatureGroup={store.reorderFeatureGroup}
          />
        </div>

        {/* Right panel toggle — fixed to screen edge, slides with panel */}
        <button
          onClick={() => setRightPanelOpen(v => !v)}
          title={rightPanelOpen ? 'Collapse properties panel' : 'Expand properties panel'}
          style={{
            position: 'fixed',
            right: rightPanelOpen ? 288 : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'right 200ms ease-in-out',
            zIndex: 20,
          }}
          className="w-5 h-10 bg-white border border-[#d5dbe4] rounded-l flex items-center justify-center text-[#718096] hover:bg-[#f0f2f5] hover:text-[#0E0E0E] shadow-sm cursor-pointer"
        >
          {rightPanelOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Right panel — slides in/out via transform; canvas never moves */}
        <div
          style={{
            position: 'absolute',
            right: 0, top: 0, bottom: 0, width: 288,
            transform: `translateX(${rightPanelOpen ? 0 : 288}px)`,
            transition: 'transform 200ms ease-in-out',
            zIndex: 10,
          }}
        >
          <div className="w-[288px] h-full border-l border-[#d5dbe4]">
            <PropertiesPanel
              section={store.selected}
              elementInfo={elementInfo}
              themeColors={store.themeColors}
              customPresets={store.customPresets}
              onUpdateStyles={store.updateStyles}
              onUpdateStylesLive={store.updateStylesLive}
              onUpdateHtml={store.updateHtml}
              onUpdateName={store.updateName}
              onApplyTheme={store.applyTheme}
              onSetThemeColors={store.setThemeColors}
              onSaveTheme={store.saveThemePreset}
              onDeleteCustomPreset={store.deleteCustomPreset}
              onSaveTemplate={saveCustomTemplate}
              library={store.library}
              activeBuiltinTemplate={activeBuiltinTemplate}
              activeCustomTemplateId={activeCustomTemplateId}
              customTemplates={customTemplates}
              onSelectBuiltinTemplate={handleTemplateSelect}
              onSelectCustomTemplate={applyCustomTemplate}
              onDeleteCustomTemplate={deleteCustomTemplate}
              onUpdateElement={store.updateElement}
              onUpdateElementCommit={store.updateElementAndCommit}
              onDeleteElement={() => { store.deleteSelectedElement(); toast('Element deleted'); }}
              onDuplicateElement={direction => { store.duplicateSelectedElement(direction); toast.success('Element duplicated'); }}
              onReplaceElement={store.replaceElement}
              onPatchElement={store.patchElement}
              onBatchPatchElements={store.batchPatchElements}
              allSections={store.canvas}
              onBulkReset={(snapshot: CanvasSection[]) => { store.loadCanvasSections(snapshot); }}
              canvasLength={store.canvas.length}
              getSelectedElement={store.getSelectedElement}
              onApplyStylesGlobally={store.applyStylesGlobally}
              onApplyElementGlobally={store.applyElementGlobally}
              selectedElementId={store.selectedElementId}
              activeTab={panelTab}
              onSetTab={setPanelTab}
            />
          </div>
        </div>

      </div>

      {/* Full-viewport cover to prevent canvas flash during Start Fresh reload */}
      {showStartFreshCover && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#e8ecf2]" />,
        document.body
      )}

      {/* Resume previous session modal */}
      {showResumeModal && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="px-5 py-4 border-b border-[#e2e7ee]">
              <h3 className="text-[14px] text-[#0E0E0E]" style={{ fontWeight: 600 }}>Resume Session</h3>
            </div>
            <div className="px-5 py-3">
              <p className="text-[12px] text-[#4a5568]">You have unsaved work. Would you like to continue where you left off?</p>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[#e2e7ee]">
              <button onClick={handleStartFresh}
                className="flex-1 py-2 border border-[#dce1e8] rounded-md text-[12px] text-[#4a5568] hover:bg-[#f7f8fa]" style={{ fontWeight: 500 }}>
                Start Fresh
              </button>
              <button onClick={handleResume}
                className="flex-1 py-2 bg-[#004BE2] text-white rounded-md text-[12px] hover:bg-[#003cc0] transition-colors" style={{ fontWeight: 600 }}>
                Resume
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
