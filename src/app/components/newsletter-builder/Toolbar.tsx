import React, { useState } from 'react';
import { PreviewMode } from './types';
import { Undo2, Redo2, Monitor, Tablet, Smartphone, Copy, Download, Eye, Code, AlertTriangle, X, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  previewMode: PreviewMode;
  canUndo: boolean;
  canRedo: boolean;
  sectionCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onPreviewMode: (m: PreviewMode) => void;
  onExportHtml: (minify?: boolean) => string;
  onExportZip: () => Promise<void>;
  onValidate: () => string[];
  onClearAll: () => void;
  onBuildFromScratch: () => void;
}

export function Toolbar({ previewMode, canUndo, canRedo, sectionCount, onUndo, onRedo, onPreviewMode, onExportHtml, onExportZip, onValidate, onClearAll, onBuildFromScratch }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeHtml, setCodeHtml] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmScratch, setShowConfirmScratch] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(onExportHtml()).then(() => toast.success('HTML copied to clipboard'));
  };

  const handleDownload = (minify = false) => {
    // Validate first
    const w = onValidate();
    if (w.length > 0) {
      setWarnings(w);
      setShowValidation(true);
      return;
    }
    doDownload(minify);
  };

  const doDownload = (minify = false) => {
    const html = onExportHtml(minify);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `newsletter${minify ? '.min' : ''}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Downloaded ${minify ? 'minified ' : ''}HTML`);
    setShowValidation(false);
  };

  return (
    <>
      <div className="h-[44px] bg-[#0E0E0E] flex items-center px-3 gap-1 shrink-0">
        <span className="text-[13px] text-white mr-2" style={{ fontWeight: 700 }}>Newsletter Builder</span>
        <span className="text-[10px] text-[#aab4c4] bg-[#1a1a2e] px-2 py-0.5 rounded-full mr-2" style={{ fontWeight: 600 }}>{sectionCount} sections</span>

        <div className="w-px h-5 bg-[#2d3748] mx-1" />

        <button onClick={onUndo} disabled={!canUndo}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${canUndo ? 'text-[#ffffff]' : 'text-[#565656]'}`} title="Undo (Ctrl+Z)">
          <Undo2 size={15} />
        </button>
        <button onClick={onRedo} disabled={!canRedo}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${canRedo ? 'text-[#ffffff]' : 'text-[#565656]'}`} title="Redo (Ctrl+Shift+Z)">
          <Redo2 size={15} />
        </button>

        <div className="w-px h-5 bg-[#2d3748] mx-1" />

        <div className="flex items-center bg-[#1a1a2e] rounded-md p-[2px]">
          {([
            { mode: 'desktop' as const, icon: <Monitor size={12} />, label: 'Desktop', w: '600px' },
            { mode: 'tablet' as const, icon: <Tablet size={12} />, label: 'Tablet', w: '480px' },
            { mode: 'mobile' as const, icon: <Smartphone size={12} />, label: 'Mobile', w: '320px' },
          ]).map(({ mode, icon, label, w }) => (
            <button key={mode} onClick={() => onPreviewMode(mode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] transition-all ${
                previewMode === mode ? 'bg-[#004BE2] text-white shadow' : 'text-white/35 hover:text-white/60'
              }`} style={{ fontWeight: previewMode === mode ? 600 : 400 }}>
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[#2d3748] mx-1" />

        <button
          onClick={() => { if (sectionCount > 0) setShowConfirmScratch(true); else onBuildFromScratch(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded text-[11px] transition-colors" style={{ fontWeight: 600 }}>
          <RotateCcw size={12} /> Build from Scratch
        </button>

        <div className="flex-1" />

        <button onClick={() => { if (sectionCount > 0) setShowConfirmClear(true); }}
          disabled={sectionCount === 0}
          className="flex items-center gap-1 px-2.5 py-1 text-white/40 hover:text-red-400 disabled:text-white/10 rounded hover:bg-white/5 text-[11px] transition-colors" style={{ fontWeight: 500 }}>
          <Trash2 size={13} /> Clear All
        </button>
        <button onClick={async () => { await onExportZip(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004BE2] text-white rounded text-[11px] hover:bg-[#003cc0] transition-colors" style={{ fontWeight: 600 }}>
          <Download size={12} /> Export for Zoho (.zip)
        </button>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl flex flex-col max-w-4xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e7ee]">
              <h3 className="text-[14px] text-[#0E0E0E]" style={{ fontWeight: 600 }}>Email Preview</h3>
              <button onClick={() => setShowPreview(false)} className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] flex items-center justify-center text-[#718096] hover:text-[#0E0E0E] transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-auto bg-[#f4f4f7] p-6">
              <iframe srcDoc={previewHtml} className="w-full border-0 bg-white mx-auto rounded-lg shadow-lg" style={{ height: '78vh', maxWidth: 640 }} title="Preview" />
            </div>
          </div>
        </div>
      )}

      {/* Code modal */}
      {showCode && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowCode(false)}>
          <div className="bg-white rounded-xl shadow-2xl flex flex-col max-w-4xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e7ee]">
              <h3 className="text-[14px] text-[#0E0E0E]" style={{ fontWeight: 600 }}>HTML Output</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => { navigator.clipboard.writeText(codeHtml); toast.success('Copied!'); }}
                  className="text-[11px] text-[#004BE2] hover:underline" style={{ fontWeight: 600 }}>Copy All</button>
                <button onClick={() => setShowCode(false)} className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] flex items-center justify-center text-[#718096] hover:text-[#0E0E0E] transition-colors"><X size={16} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-[11px] text-[#2d3748] font-mono whitespace-pre-wrap leading-relaxed bg-[#f7f8fa] p-4 rounded-lg border border-[#e2e7ee]">{codeHtml}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Clear All confirmation */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowConfirmClear(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e2e7ee]">
              <Trash2 size={16} className="text-red-500" />
              <h3 className="text-[14px] text-[#0E0E0E] flex-1" style={{ fontWeight: 600 }}>Clear all sections?</h3>
              <button onClick={() => setShowConfirmClear(false)} className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] flex items-center justify-center text-[#718096]"><X size={16} /></button>
            </div>
            <div className="px-5 py-3">
              <p className="text-[12px] text-[#4a5568]">This will permanently remove all {sectionCount} section{sectionCount !== 1 ? 's' : ''} from the canvas. This action cannot be undone after you save.</p>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[#e2e7ee]">
              <button onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2 border border-[#dce1e8] rounded-md text-[12px] text-[#4a5568] hover:bg-[#f7f8fa]" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={() => { onClearAll(); setShowConfirmClear(false); toast('Canvas cleared'); }}
                className="flex-1 py-2 bg-red-500 text-white rounded-md text-[12px] hover:bg-red-600 transition-colors" style={{ fontWeight: 600 }}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Build from Scratch confirmation */}
      {showConfirmScratch && (
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
              <button onClick={() => { onBuildFromScratch(); setShowConfirmScratch(false); toast('Canvas cleared'); }}
                className="flex-1 py-2 bg-[#004BE2] text-white rounded-md text-[12px] hover:bg-[#003cc0] transition-colors" style={{ fontWeight: 600 }}>
                Build from Scratch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation modal */}
      {showValidation && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowValidation(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#e2e7ee]">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-[14px] text-[#0E0E0E] flex-1" style={{ fontWeight: 600 }}>{warnings.length} Warning{warnings.length > 1 ? 's' : ''} Found</h3>
              <button onClick={() => setShowValidation(false)} className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] flex items-center justify-center text-[#718096]"><X size={16} /></button>
            </div>
            <div className="px-5 py-3 max-h-60 overflow-y-auto space-y-1.5">
              {warnings.map((w, i) => (
                <p key={i} className="text-[12px] text-[#4a5568] flex items-start gap-2">
                  <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />{w}
                </p>
              ))}
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[#e2e7ee]">
              <button onClick={() => setShowValidation(false)}
                className="flex-1 py-2 border border-[#dce1e8] rounded-md text-[12px] text-[#4a5568] hover:bg-[#f7f8fa]" style={{ fontWeight: 500 }}>
                Go Back & Fix
              </button>
              <button onClick={() => doDownload(false)}
                className="flex-1 py-2 bg-[#004BE2] text-white rounded-md text-[12px] hover:bg-[#003cc0]" style={{ fontWeight: 600 }}>
                Export Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
