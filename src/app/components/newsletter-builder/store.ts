import { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { toast } from 'sonner';
import {
  CanvasSection, SectionElement, LibrarySection, ThemeColors, ThemePreset,
  PreviewMode, defaultSectionStyles, SectionStyles, ApplyScope,
} from './types';
import { ALL_SECTIONS, THEME_PRESETS } from './sections-data';
import {
  htmlToElements, elementsToHtml, exportElementsToHtml, findElement, findElementWithAncestors, updateElementInTree,
  replaceElementInTree, deleteElementInTree, duplicateElementInTree, duplicateInDirection, elementToInfo,
  applyThemeToElements, ElementInfo, newElId,
} from './html-utils';
import {
  ContentStore, categoryKey, extractSlots, injectSlots,
  makeEmptyContentStore, saveContentStore, clearContentStoreStorage,
} from './content-store';

let _uid = 0;
const uid = () => `s${++_uid}-${Date.now().toString(36)}`;

// ─── Feature group helpers (C1/C2/C3) ────────────────────────

function toggleFeatureGroupInTree(
  elements: SectionElement[],
  groupN: number,
  visible: boolean
): SectionElement[] {
  return elements.map(el => {
    if (el.attrs?.['data-feature-group'] === String(groupN)) {
      return {
        ...el,
        attrs: { ...el.attrs, 'data-feature-hidden': visible ? 'false' : 'true' },
        styles: { ...el.styles, display: visible ? '' : 'none' },
      };
    }
    if (el.children) {
      const newChildren = toggleFeatureGroupInTree(el.children, groupN, visible);
      if (newChildren !== el.children) return { ...el, children: newChildren };
    }
    return el;
  });
}

// Recalculates sequential numbers (1,2,3…) for visible C3 groups
function recalculateC3Numbers(elements: SectionElement[]): SectionElement[] {
  const visibleGroups: SectionElement[] = [];
  const collect = (els: SectionElement[]) => {
    for (const el of els) {
      if (el.attrs?.['data-feature-group'] && el.attrs['data-feature-hidden'] !== 'true') {
        visibleGroups.push(el);
      }
      if (el.children) collect(el.children);
    }
  };
  collect(elements);
  // Numbers are assigned in array/visual order — do NOT sort by slot number,
  // as groups can be reordered independently of their slot numbers.

  // Map number element ID → new sequential number string.
  // The number lives in: tr > td[0] > div > span (text node).
  // parseNode wraps bare text nodes in a <span> child, so the <div> is
  // a container; targeting its first leaf child (the span) is required.
  const findLeaf = (el: SectionElement): SectionElement =>
    el.children?.length ? findLeaf(el.children[0]) : el;
  const idToNum: Record<string, string> = {};
  visibleGroups.forEach((group, idx) => {
    const numContainer = group.children?.[0]?.children?.[0]; // tr > td[0] > div
    if (!numContainer) return;
    const numEl = numContainer.children?.length ? findLeaf(numContainer) : numContainer;
    idToNum[numEl.id] = String(idx + 1);
  });
  if (!Object.keys(idToNum).length) return elements;

  const update = (els: SectionElement[]): SectionElement[] =>
    els.map(el => {
      if (idToNum[el.id] !== undefined) return { ...el, content: idToNum[el.id] };
      if (el.children) {
        const nc = update(el.children);
        if (nc !== el.children) return { ...el, children: nc };
      }
      return el;
    });

  return update(elements);
}

// Removes hidden feature groups from the element tree (used at export time)
function filterHiddenFeatureGroups(elements: SectionElement[]): SectionElement[] {
  return elements
    .filter(el => el.attrs?.['data-feature-hidden'] !== 'true')
    .map(el => {
      if (!el.children?.length) return el;
      const filtered = filterHiddenFeatureGroups(el.children);
      if (filtered.length === el.children.length) return el;
      return { ...el, children: filtered };
    });
}

// Strips data-feature-* implementation attrs from exported HTML
function cleanFeatureGroupAttrs(elements: SectionElement[]): SectionElement[] {
  return elements.map(el => {
    let next = el;
    if (el.attrs?.['data-feature-group'] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { 'data-feature-group': _g, 'data-feature-hidden': _h, ...rest } = el.attrs;
      next = { ...el, attrs: rest };
    }
    if (next.children?.length) {
      const nc = cleanFeatureGroupAttrs(next.children);
      if (nc !== next.children) next = { ...next, children: nc };
    }
    return next;
  });
}

// Moves the element with data-feature-group=fromSlotN to come after insertAfterSlotN.
// Pass insertAfterSlotN=null to move it to the first position in its container.
function reorderFeatureGroupInContainer(
  elements: SectionElement[],
  fromSlotN: number,
  insertAfterSlotN: number | null
): SectionElement[] | null {
  if (elements.some(el => el.attrs?.['data-feature-group'])) {
    const fromEl = elements.find(el => el.attrs?.['data-feature-group'] === String(fromSlotN));
    if (!fromEl) return null;
    const without = elements.filter(el => el !== fromEl);
    if (insertAfterSlotN === null) return [fromEl, ...without];
    const afterIdx = without.findIndex(el => el.attrs?.['data-feature-group'] === String(insertAfterSlotN));
    if (afterIdx === -1) return null;
    return [...without.slice(0, afterIdx + 1), fromEl, ...without.slice(afterIdx + 1)];
  }
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].children?.length) {
      const r = reorderFeatureGroupInContainer(elements[i].children!, fromSlotN, insertAfterSlotN);
      if (r !== null) return [...elements.slice(0, i), { ...elements[i], children: r }, ...elements.slice(i + 1)];
    }
  }
  return null;
}

function reorderFeatureGroupInTree(
  elements: SectionElement[],
  fromSlotN: number,
  insertAfterSlotN: number | null
): SectionElement[] {
  return reorderFeatureGroupInContainer(elements, fromSlotN, insertAfterSlotN) ?? elements;
}

const FEATURE_VIS_KEY = 'featureVisibility';

// Snapshots group1..group8 visibility from a C section's element tree
function getFeatureVisibilitySlots(elements: SectionElement[]): Record<string, string> {
  const slots: Record<string, string> = {};
  const walk = (els: SectionElement[]) => {
    for (const el of els) {
      if (el.attrs?.['data-feature-group']) {
        slots[`group${el.attrs['data-feature-group']}`] =
          el.attrs['data-feature-hidden'] === 'true' ? 'false' : 'true';
      }
      if (el.children) walk(el.children);
    }
  };
  walk(elements);
  return slots;
}

// Applies persisted group visibility to a freshly-built C section element tree
function applyFeatureVisibility(
  elements: SectionElement[],
  visSlots: Record<string, string>,
  libraryCode: string
): SectionElement[] {
  let result = elements;
  for (let n = 1; n <= 8; n++) {
    const key = `group${n}`;
    if (key in visSlots) {
      result = toggleFeatureGroupInTree(result, n, visSlots[key] === 'true');
    }
  }
  if (libraryCode === 'C3') result = recalculateC3Numbers(result);
  return result;
}

const CATEGORY_ORDER = [
  'Headers', 'Heroes', 'Features', 'Testimonials', 'Articles',
  'Events', 'Registration', 'CTAs', 'Collages', 'Footers',
] as const;

function makeDefaultCanvas(): CanvasSection[] {
  return CATEGORY_ORDER
    .map(cat => ALL_SECTIONS.find(s => s.category === cat))
    .filter((s): s is LibrarySection => !!s)
    .map(lib => ({
      id: uid(),
      libraryCode: lib.code,
      name: lib.name,
      category: lib.category,
      elements: htmlToElements(lib.html),
      styles: { ...defaultSectionStyles },
    }));
}

// WCAG AA contrast helpers (exported for panel use)
function luminance(hex: string): number {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return 0;
  const rgb = m.map(h => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function checkWcagAA(textColor: string, bgColor: string, isLargeText = false): boolean {
  try {
    const ratio = contrastRatio(textColor, bgColor);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  } catch { return true; }
}

// Helper: physically crop a base64 image using canvas
export function cropImageToFrame(
  base64Src: string,
  containerWidth: number,
  containerHeight: number,
  objectPosition: string
): Promise<string> {
  return new Promise((resolve) => {
    if (!containerWidth || !containerHeight) {
      resolve(base64Src);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      const ctx = canvas.getContext('2d')!;

      // Parse object-position (e.g., "30% 70%" or "center top")
      const posMap: Record<string, number> = { left: 0, center: 50, right: 100, top: 0, bottom: 100 };
      const parts = (objectPosition || 'center center').trim().split(/\s+/);
      const posX = (posMap[parts[0]] ?? parseFloat(parts[0]) ?? 50) / 100;
      const posY = (posMap[parts[1]] ?? parseFloat(parts[1]) ?? 50) / 100;

      // Calculate "cover" fit dimensions
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const frameRatio = containerWidth / containerHeight;
      let drawW: number, drawH: number;
      if (imgRatio > frameRatio) {
        drawH = containerHeight;
        drawW = containerHeight * imgRatio;
      } else {
        drawW = containerWidth;
        drawH = containerWidth / imgRatio;
      }

      const drawX = (containerWidth - drawW) * posX;
      const drawY = (containerHeight - drawH) * posY;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // For GIFs, skip crop (breaks animation)
      if (base64Src.includes('image/gif')) {
        resolve(base64Src);
        return;
      }

      const isPng = base64Src.includes('image/png');
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      const quality = isPng ? undefined : 0.92;
      resolve(canvas.toDataURL(mimeType, quality));
    };
    img.onerror = () => resolve(base64Src);
    img.src = base64Src;
  });
}

export function useBuilderStore() {
  const [library, setLibrary] = useState<LibrarySection[]>(ALL_SECTIONS);
  const [canvas, setCanvas] = useState<CanvasSection[]>(() => {
    try {
      const raw = localStorage.getItem('newsletterBuilderSession');
      if (raw) {
        const sections = JSON.parse(raw) as CanvasSection[];
        if (sections && sections.length > 0) return sections;
      }
    } catch {}
    return makeDefaultCanvas();
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Keep refs in sync with the selection state so callbacks can read the
  // *current* value instead of a stale one captured in a closure. This matters
  // for actions like deleteSelectedElement that might fire after a re-render
  // where the useCallback dependency list hadn't caught up yet.
  const selectedIdRef = useRef(selectedId);
  const selectedElementIdRef = useRef(selectedElementId);
  selectedIdRef.current = selectedId;
  selectedElementIdRef.current = selectedElementId;
  const contentStoreRef = useRef<ContentStore>(makeEmptyContentStore());
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [themeColors, setThemeColors] = useState<ThemeColors>(THEME_PRESETS[0].colors);
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>(() => {
    try { const s = localStorage.getItem('nbl-theme-presets'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [savedTemplates, setSavedTemplates] = useState<{ id: string; name: string; sections: CanvasSection[] }[]>(() => {
    try { const s = localStorage.getItem('nbl-saved-templates'); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  // Transient: IDs of elements (or section IDs with prefix 'section:') to flash-highlight on canvas
  // after an "Apply to all similar" action. Auto-clears after ~900ms.
  const [flashedElementIds, setFlashedElementIds] = useState<string[]>([]);
  const flashTimer = useRef<number | null>(null);
  const triggerFlash = useCallback((ids: string[]) => {
    setFlashedElementIds(ids);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashedElementIds([]), 900);
  }, []);

  // Tracks whether the user is in "Build from Scratch" / "Clear All" mode.
  // In this mode, adding a section from the same category replaces the
  // existing one instead of appending a duplicate.
  const scratchModeRef = useRef(false);

  // Undo/Redo
  const history = useRef<CanvasSection[][]>([]);
  const histIdx = useRef(-1);
  const [, forceRender] = useState(0);

  const pushHist = useCallback((s: CanvasSection[]) => {
    history.current = history.current.slice(0, histIdx.current + 1);
    history.current.push(JSON.parse(JSON.stringify(s)));
    histIdx.current = history.current.length - 1;
    forceRender(v => v + 1);
  }, []);

  const undo = useCallback(() => {
    if (histIdx.current > 0) {
      histIdx.current--;
      setCanvas(JSON.parse(JSON.stringify(history.current[histIdx.current])));
      forceRender(v => v + 1);
    }
  }, []);

  const redo = useCallback(() => {
    if (histIdx.current < history.current.length - 1) {
      histIdx.current++;
      setCanvas(JSON.parse(JSON.stringify(history.current[histIdx.current])));
      forceRender(v => v + 1);
    }
  }, []);

  const canUndo = histIdx.current > 0;
  const canRedo = histIdx.current < history.current.length - 1;

  // Canvas ops
  const addSection = useCallback((lib: LibrarySection, index?: number) => {
    const catKey = categoryKey(lib.category);
    const storedSlots = contentStoreRef.current[catKey]?.slots || {};
    let addEls = injectSlots(htmlToElements(lib.html), storedSlots);
    if (['C1', 'C2', 'C3'].includes(lib.code)) {
      const visSlots = contentStoreRef.current[FEATURE_VIS_KEY]?.slots;
      if (visSlots && Object.keys(visSlots).length > 0) {
        addEls = applyFeatureVisibility(addEls, visSlots, lib.code);
      }
    }
    const cs: CanvasSection = {
      id: uid(), libraryCode: lib.code, name: lib.name, category: lib.category,
      elements: addEls,
      styles: { ...defaultSectionStyles },
    };
    setCanvas(prev => {
      // If a same-category section already exists, replace it in-place
      const sameIdx = prev.findIndex(s => s.category === lib.category);
      if (sameIdx !== -1) {
        const replaced: CanvasSection = { ...cs, id: prev[sameIdx].id };
        const next = [...prev.slice(0, sameIdx), replaced, ...prev.slice(sameIdx + 1)];
        pushHist(next);
        return next;
      }
      // No same-category section: insert at the position that matches CATEGORY_ORDER.
      // Dividers and unrecognised categories (rank -1) fall through to append.
      const catRank = CATEGORY_ORDER.findIndex(c => c === lib.category);
      let insertAt = prev.length;
      if (catRank !== -1) {
        for (let i = 0; i < prev.length; i++) {
          const secRank = CATEGORY_ORDER.findIndex(c => c === prev[i].category);
          if (secRank !== -1 && secRank > catRank) { insertAt = i; break; }
        }
      }
      const next = [...prev.slice(0, insertAt), cs, ...prev.slice(insertAt)];
      pushHist(next);
      return next;
    });
    return cs.id;
  }, [pushHist]);

  const removeSection = useCallback((id: string) => {
    setCanvas(prev => { const n = prev.filter(s => s.id !== id); pushHist(n); return n; });
    setSelectedId(p => p === id ? null : p);
    setSelectedElementId(null);
  }, [pushHist]);

  const replaceSection = useCallback((id: string, lib: LibrarySection) => {
    setCanvas(prev => {
      const i = prev.findIndex(s => s.id === id);
      if (i === -1) return prev;
      const catKey = categoryKey(lib.category);
      const storedSlots = contentStoreRef.current[catKey]?.slots || {};
      let repEls = injectSlots(htmlToElements(lib.html), storedSlots);
      if (['C1', 'C2', 'C3'].includes(lib.code)) {
        const visSlots = contentStoreRef.current[FEATURE_VIS_KEY]?.slots;
        if (visSlots && Object.keys(visSlots).length > 0) {
          repEls = applyFeatureVisibility(repEls, visSlots, lib.code);
        }
      }
      const cs: CanvasSection = {
        id: prev[i].id,
        libraryCode: lib.code,
        name: lib.name,
        category: lib.category,
        elements: repEls,
        styles: { ...prev[i].styles },
      };
      const next = [...prev.slice(0, i), cs, ...prev.slice(i + 1)];
      pushHist(next);
      return next;
    });
  }, [pushHist]);

  const duplicateSection = useCallback((id: string) => {
    setCanvas(prev => {
      const i = prev.findIndex(s => s.id === id);
      if (i === -1) return prev;
      const clone: CanvasSection = { ...JSON.parse(JSON.stringify(prev[i])), id: uid() };
      // Re-assign IDs in cloned element tree to avoid ID collisions
      function reId(el: SectionElement): SectionElement {
        return { ...el, id: newElId(), children: el.children?.map(reId) };
      }
      clone.elements = clone.elements.map(reId);
      const n = [...prev.slice(0, i + 1), clone, ...prev.slice(i + 1)];
      pushHist(n);
      return n;
    });
  }, [pushHist]);

  const moveSection = useCallback((from: number, to: number) => {
    setCanvas(prev => {
      const n = [...prev];
      const [m] = n.splice(from, 1);
      n.splice(to, 0, m);
      pushHist(n);
      return n;
    });
  }, [pushHist]);

  // HTML source edit (from the raw HTML textarea in the panel)
  const updateHtml = useCallback((id: string, html: string) => {
    setCanvas(prev => {
      const n = prev.map(s => s.id === id
        ? { ...s, elements: htmlToElements(html) }
        : s);
      pushHist(n);
      return n;
    });
  }, [pushHist]);

  const updateHtmlLive = useCallback((id: string, html: string) => {
    setCanvas(prev => prev.map(s => s.id === id
      ? { ...s, elements: htmlToElements(html) }
      : s));
  }, []);

  const commitHtml = useCallback((id: string) => {
    setCanvas(prev => { pushHist(prev); return prev; });
  }, [pushHist]);

  const updateStyles = useCallback((id: string, styles: Partial<SectionStyles>) => {
    setCanvas(prev => {
      const n = prev.map(s => s.id === id ? { ...s, styles: { ...s.styles, ...styles } } : s);
      pushHist(n);
      return n;
    });
  }, [pushHist]);

  const updateStylesLive = useCallback((id: string, styles: Partial<SectionStyles>) => {
    setCanvas(prev => prev.map(s => s.id === id ? { ...s, styles: { ...s.styles, ...styles } } : s));
  }, []);

  const updateName = useCallback((id: string, name: string) => {
    setCanvas(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  }, []);

  // Element editing via structured tree
  const getElementInfo = useCallback((): ElementInfo | null => {
    if (!selectedId || !selectedElementId) return null;
    const sec = canvas.find(s => s.id === selectedId);
    if (!sec) return null;
    const found = findElementWithAncestors(sec.elements, selectedElementId);
    if (!found) return null;
    return elementToInfo(found.el, found.ancestors);
  }, [canvas, selectedId, selectedElementId]);

  const updateElement = useCallback((changes: Partial<Record<string, string>>) => {
    if (!selectedId || !selectedElementId) return;
    setCanvas(prev => prev.map(s => {
      if (s.id !== selectedId) return s;
      return { ...s, elements: updateElementInTree(s.elements, selectedElementId, changes) };
    }));
  }, [selectedId, selectedElementId]);

  const updateElementAndCommit = useCallback((changes: Partial<Record<string, string>>) => {
    if (!selectedId || !selectedElementId) return;
    setCanvas(prev => {
      const n = prev.map(s => {
        if (s.id !== selectedId) return s;
        return { ...s, elements: updateElementInTree(s.elements, selectedElementId, changes) };
      });
      pushHist(n);
      const updatedSection = n.find(s => s.id === selectedId);
      if (updatedSection) {
        const catKey = categoryKey(updatedSection.category);
        const slots = extractSlots(updatedSection.elements);
        if (Object.keys(slots).length > 0) {
          contentStoreRef.current = {
            ...contentStoreRef.current,
            [catKey]: { slots: { ...(contentStoreRef.current[catKey]?.slots || {}), ...slots } },
          };
          saveContentStore(contentStoreRef.current);
        }
      }
      return n;
    });
  }, [selectedId, selectedElementId, pushHist]);

  const deleteSelectedElement = useCallback(() => {
    const sId = selectedIdRef.current;
    const eId = selectedElementIdRef.current;
    // eslint-disable-next-line no-console
    console.log('[deleteSelectedElement] start', { sId, eId });
    if (!sId || !eId) {
      // eslint-disable-next-line no-console
      console.warn('[deleteSelectedElement] aborted — no selection');
      return;
    }
    let nextState: CanvasSection[] | null = null;
    let matchFound = false;
    setCanvas(prev => {
      const section = prev.find(s => s.id === sId);
      if (section) {
        matchFound = !!findElement(section.elements, eId);
      }
      const n = prev.map(s => {
        if (s.id !== sId) return s;
        return { ...s, elements: deleteElementInTree(s.elements, eId) };
      });
      nextState = n;
      return n;
    });
    // eslint-disable-next-line no-console
    console.log('[deleteSelectedElement] done', { matchFound, changed: nextState !== null });
    if (nextState) pushHist(nextState);
    setSelectedElementId(null);
  }, [pushHist]);

  const duplicateSelectedElement = useCallback((direction?: 'above' | 'below' | 'left' | 'right') => {
    const sId = selectedIdRef.current;
    const eId = selectedElementIdRef.current;
    if (!sId || !eId) return;
    let nextState: CanvasSection[] | null = null;
    setCanvas(prev => {
      const n = prev.map(s => {
        if (s.id !== sId) return s;
        // No direction passed → preserve the simple "insert below"
        // behavior from the existing duplicateElementInTree.
        if (!direction) {
          return { ...s, elements: duplicateElementInTree(s.elements, eId) };
        }
        // Directional duplicate: walk the tree, find the parent that
        // contains the target element, insert a deep-cloned copy as a
        // sibling at the correct index, and add a margin so the new
        // element doesn't sit flush against the original.
        return { ...s, elements: duplicateInDirection(s.elements, eId, direction) };
      });
      nextState = n;
      return n;
    });
    if (nextState) pushHist(nextState);
  }, [pushHist]);

  // Patch an element by sectionId + elementId without selecting it
  // (used for image replace from the hover overlay)
  const patchElement = useCallback((sectionId: string, elId: string, changes: Partial<Record<string, string>>) => {
    setCanvas(prev => {
      const n = prev.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, elements: updateElementInTree(s.elements, elId, changes) };
      });
      pushHist(n);
      const updatedSection = n.find(s => s.id === sectionId);
      if (updatedSection) {
        const catKey = categoryKey(updatedSection.category);
        const slots = extractSlots(updatedSection.elements);
        if (Object.keys(slots).length > 0) {
          contentStoreRef.current = {
            ...contentStoreRef.current,
            [catKey]: { slots: { ...(contentStoreRef.current[catKey]?.slots || {}), ...slots } },
          };
          saveContentStore(contentStoreRef.current);
        }
      }
      return n;
    });
  }, [pushHist]);

  // Show or hide a feature group (C1/C2/C3) by slot number; syncs across all C sections; pushes to undo history
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleFeatureGroup = useCallback((_sectionId: string, groupN: number, visible: boolean) => {
    setCanvas(prev => {
      const n = prev.map(s => {
        if (!['C1', 'C2', 'C3'].includes(s.libraryCode)) return s;
        let newElements = toggleFeatureGroupInTree(s.elements, groupN, visible);
        if (s.libraryCode === 'C3') newElements = recalculateC3Numbers(newElements);
        return { ...s, elements: newElements };
      });
      // Persist visibility so newly-added C sections inherit the current state
      const cSec = n.find(s => ['C1', 'C2', 'C3'].includes(s.libraryCode));
      if (cSec) {
        contentStoreRef.current = {
          ...contentStoreRef.current,
          [FEATURE_VIS_KEY]: { slots: getFeatureVisibilitySlots(cSec.elements) },
        };
        saveContentStore(contentStoreRef.current);
      }
      pushHist(n);
      return n;
    });
  }, [pushHist]);

  // Reveal next hidden feature group and insert it after afterSlotN in all C sections
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addFeatureGroupAfter = useCallback((_sectionId: string, afterSlotN: number) => {
    setCanvas(prev => {
      const anyCSection = prev.find(s => ['C1', 'C2', 'C3'].includes(s.libraryCode));
      if (!anyCSection) return prev;
      let nextHidden: number | null = null;
      const findHidden = (els: SectionElement[]) => {
        for (const el of els) {
          if (el.attrs?.['data-feature-group'] && el.attrs['data-feature-hidden'] === 'true') {
            const n = Number(el.attrs['data-feature-group']);
            if (nextHidden === null || n < nextHidden) nextHidden = n;
          }
          if (el.children) findHidden(el.children);
        }
      };
      findHidden(anyCSection.elements);
      if (nextHidden === null) return prev;
      const slotToReveal = nextHidden;
      const n = prev.map(s => {
        if (!['C1', 'C2', 'C3'].includes(s.libraryCode)) return s;
        let els = toggleFeatureGroupInTree(s.elements, slotToReveal, true);
        els = reorderFeatureGroupInTree(els, slotToReveal, afterSlotN);
        if (s.libraryCode === 'C3') els = recalculateC3Numbers(els);
        return { ...s, elements: els };
      });
      const cSec = n.find(s => ['C1', 'C2', 'C3'].includes(s.libraryCode));
      if (cSec) {
        contentStoreRef.current = {
          ...contentStoreRef.current,
          [FEATURE_VIS_KEY]: { slots: getFeatureVisibilitySlots(cSec.elements) },
        };
        saveContentStore(contentStoreRef.current);
      }
      pushHist(n);
      return n;
    });
  }, [pushHist]);

  // Move a visible feature group to a new position in all C sections
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const reorderFeatureGroup = useCallback((_sectionId: string, fromSlotN: number, insertAfterSlotN: number | null) => {
    setCanvas(prev => {
      const n = prev.map(s => {
        if (!['C1', 'C2', 'C3'].includes(s.libraryCode)) return s;
        let els = reorderFeatureGroupInTree(s.elements, fromSlotN, insertAfterSlotN);
        if (s.libraryCode === 'C3') els = recalculateC3Numbers(els);
        return { ...s, elements: els };
      });
      pushHist(n);
      return n;
    });
  }, [pushHist]);

  // Replace a selected element entirely (e.g. emoji → img)
  const replaceElement = useCallback((newElement: SectionElement) => {
    if (!selectedId || !selectedElementId) return;
    setCanvas(prev => {
      const n = prev.map(s => {
        if (s.id !== selectedId) return s;
        return { ...s, elements: replaceElementInTree(s.elements, selectedElementId, newElement) };
      });
      pushHist(n);
      return n;
    });
  }, [selectedId, selectedElementId, pushHist]);

  // ─── Apply to all similar ────────────────────────────────────

  /**
   * Propagate a Partial<SectionStyles> patch to every section matching the scope.
   * Source section is also updated (idempotent — patch merges onto its current styles).
   * Emits a single history entry. Flashes matching section IDs for visual feedback.
   * Returns the number of sections affected.
   */
  const applyStylesGlobally = useCallback(
    (sourceSectionId: string, styles: Partial<SectionStyles>, scope: ApplyScope): number => {
      let affectedIds: string[] = [];
      setCanvas(prev => {
        const src = prev.find(s => s.id === sourceSectionId);
        if (!src) return prev;
        const matches = (s: CanvasSection) => {
          if (scope === 'sameCode') return s.libraryCode === src.libraryCode;
          if (scope === 'sameCategory') return s.category === src.category;
          return true; // allCanvas
        };
        const n = prev.map(s => matches(s)
          ? { ...s, styles: { ...s.styles, ...styles } }
          : s);
        affectedIds = n.filter(matches).map(s => 'section:' + s.id);
        pushHist(n);
        return n;
      });
      triggerFlash(affectedIds);
      return affectedIds.length;
    },
    [pushHist, triggerFlash]
  );

  /**
   * Propagate element-level property changes to all elements whose `type` matches the
   * source element's type, within the chosen scope.
   * Scope interpretation for elements:
   *  - sameCode     → only sections sharing source section's libraryCode
   *  - sameCategory → only sections with same category
   *  - allCanvas    → every section
   * Source element itself is included in the update (idempotent).
   * Emits a single history entry. Returns number of elements affected.
   */
  const applyElementGlobally = useCallback(
    (
      sourceSectionId: string,
      sourceElementId: string,
      changes: Partial<Record<string, string>>,
      scope: ApplyScope
    ): number => {
      let affectedElementIds: string[] = [];
      setCanvas(prev => {
        const src = prev.find(s => s.id === sourceSectionId);
        if (!src) return prev;
        const srcEl = findElement(src.elements, sourceElementId);
        if (!srcEl) return prev;
        const targetType = srcEl.type;

        const sectionMatches = (s: CanvasSection) => {
          if (scope === 'sameCode') return s.libraryCode === src.libraryCode;
          if (scope === 'sameCategory') return s.category === src.category;
          return true;
        };

        // Walk tree, collect IDs of every element with matching type field
        const collect = (els: SectionElement[], acc: string[]) => {
          els.forEach(e => {
            if (e.type === targetType) acc.push(e.id);
            if (e.children) collect(e.children, acc);
          });
        };

        const n = prev.map(s => {
          if (!sectionMatches(s)) return s;
          const ids: string[] = [];
          collect(s.elements, ids);
          if (ids.length === 0) return s;
          affectedElementIds.push(...ids);
          let nextEls = s.elements;
          for (const id of ids) {
            nextEls = updateElementInTree(nextEls, id, changes);
          }
          return { ...s, elements: nextEls };
        });
        pushHist(n);
        return n;
      });
      triggerFlash(affectedElementIds);
      return affectedElementIds.length;
    },
    [pushHist, triggerFlash]
  );

  // Get the currently selected SectionElement
  const getSelectedElement = useCallback((): SectionElement | null => {
    if (!selectedId || !selectedElementId) return null;
    const sec = canvas.find(s => s.id === selectedId);
    if (!sec) return null;
    return findElement(sec.elements, selectedElementId);
  }, [canvas, selectedId, selectedElementId]);

  // Clear all sections — activates scratch mode so subsequent adds
  // replace same-category sections instead of stacking them.
  const clearAll = useCallback(() => {
    scratchModeRef.current = true;
    contentStoreRef.current = makeEmptyContentStore();
    clearContentStoreStorage();
    setCanvas([]);
    setSelectedId(null);
    setSelectedElementId(null);
    pushHist([]);
  }, [pushHist]);

  // Replace canvas with a saved CanvasSection array (used by custom template loader)
  const loadCanvasSections = useCallback((sections: CanvasSection[]) => {
    scratchModeRef.current = false;
    const visSlots = contentStoreRef.current[FEATURE_VIS_KEY]?.slots;
    const next = sections.map(s => {
      const catKey = categoryKey(s.category);
      const storedSlots = contentStoreRef.current[catKey]?.slots || {};
      let els = injectSlots(s.elements, storedSlots);
      if (['C1', 'C2', 'C3'].includes(s.libraryCode) && visSlots && Object.keys(visSlots).length > 0) {
        els = applyFeatureVisibility(els, visSlots, s.libraryCode);
      }
      return { ...s, id: uid(), elements: els };
    });
    setCanvas(next);
    setSelectedId(null);
    setSelectedElementId(null);
    pushHist(next);
  }, [pushHist]);

  // Replace canvas with sections built from library entries (used by template loader)
  const loadLibrarySections = useCallback((libs: LibrarySection[]) => {
    scratchModeRef.current = false;
    const visSlots = contentStoreRef.current[FEATURE_VIS_KEY]?.slots;
    const next: CanvasSection[] = libs.map(lib => {
      const catKey = categoryKey(lib.category);
      const storedSlots = contentStoreRef.current[catKey]?.slots || {};
      let els = injectSlots(htmlToElements(lib.html), storedSlots);
      if (['C1', 'C2', 'C3'].includes(lib.code) && visSlots && Object.keys(visSlots).length > 0) {
        els = applyFeatureVisibility(els, visSlots, lib.code);
      }
      return {
        id: uid(),
        libraryCode: lib.code,
        name: lib.name,
        category: lib.category,
        elements: els,
        styles: { ...defaultSectionStyles },
      };
    });
    setCanvas(next);
    setSelectedId(null);
    setSelectedElementId(null);
    pushHist(next);
  }, [pushHist]);

  // Library
  const saveToLibrary = useCallback((section: CanvasSection) => {
    const ls: LibrarySection = {
      id: 'custom-' + uid(), code: 'X' + (library.length + 1),
      name: section.name + ' (My Section)', category: section.category,
      source: 'My Sections', html: elementsToHtml(section.elements), isCustom: true,
    };
    setLibrary(prev => [...prev, ls]);
  }, [library.length]);

  const importHtml = useCallback((html: string, fileName: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    const tables = body.querySelectorAll(':scope > table, :scope > div > table, :scope > center > table');
    const sections: LibrarySection[] = [];
    const items = tables.length > 1 ? Array.from(tables) : [body];
    items.forEach((el, i) => {
      sections.push({
        id: 'imp-' + uid(), code: 'IMP' + i,
        name: `${fileName} - Section ${i + 1}`, category: 'Headers',
        source: 'Imported',
        html: el instanceof HTMLElement ? (el === body ? el.innerHTML : el.outerHTML) : '',
        isCustom: true,
      });
    });
    setLibrary(prev => [...prev, ...sections]);
    // Also place the imported sections directly on the canvas — without this,
    // imports landed in the library but the user had no visible feedback on
    // the canvas, and finding them in a library of 80+ sections is awkward.
    // The user can still drag the same library entries to add additional
    // copies later. We use a function-form setState to avoid stale captures
    // of `canvas` from earlier renders, and push a single history entry for
    // the whole batch (not one per section) so undo restores all at once.
    const newCanvasSections: CanvasSection[] = sections.map(lib => ({
      id: uid(), libraryCode: lib.code, name: lib.name, category: lib.category,
      elements: htmlToElements(lib.html),
      styles: { ...defaultSectionStyles },
    }));
    setCanvas(prev => {
      const next = [...prev, ...newCanvasSections];
      pushHist(next);
      return next;
    });
    return sections.length;
  }, [pushHist]);

  // Theme
  const applyTheme = useCallback((colors: ThemeColors) => {
    setThemeColors(colors);
    setCanvas(prev => {
      const next = prev.map(section => ({
        ...section,
        elements: applyThemeToElements(section.elements, colors),
      }));
      pushHist(next);
      return next;
    });
  }, [pushHist]);

  const saveThemePreset = useCallback((name: string) => {
    setCustomPresets(prev => {
      const next = [...prev, { id: uid(), name, colors: { ...themeColors } }];
      try { localStorage.setItem('nbl-theme-presets', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [themeColors]);

  const deleteCustomPreset = useCallback((id: string) => {
    setCustomPresets(prev => {
      const next = prev.filter(p => p.id !== id);
      try { localStorage.setItem('nbl-theme-presets', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Templates
  const saveTemplate = useCallback((name: string) => {
    setSavedTemplates(prev => {
      const next = [...prev, { id: uid(), name, sections: JSON.parse(JSON.stringify(canvas)) }];
      try { localStorage.setItem('nbl-saved-templates', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [canvas]);

  const deleteCustomTemplate = useCallback((id: string) => {
    setSavedTemplates(prev => {
      const next = prev.filter(t => t.id !== id);
      try { localStorage.setItem('nbl-saved-templates', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const loadTemplate = useCallback((id: string) => {
    const tpl = savedTemplates.find(t => t.id === id);
    if (tpl) {
      const next = tpl.sections.map(s => ({ ...s, id: uid() }));
      setCanvas(next);
      pushHist(next);
    }
  }, [savedTemplates, pushHist]);

  /** Transform data-accordion-item markers in the exported HTML into
   *  <details>/<summary> structures so the rendered output (Zoho Campaigns
   *  preview, localhost iframe, modern browsers) behaves as a fully
   *  interactive accordion. The editor canvas keeps the original markup
   *  with all bodies visible — this transform only runs at export time.
   *
   *  - Each data-accordion-group="X" ancestor provides a unique name
   *    attribute; <details name="..."> with the same name are mutually
   *    exclusive (HTML5.3, supported in Chrome 120+ / Safari 17.2+ /
   *    Firefox 121+). For older browsers a small inline script fills
   *    in the exclusivity by listening to the toggle event.
   *  - The first data-accordion-item in each group gets `open` so the
   *    accordion is open by default on load.
   *  - The arrow rotation is controlled by CSS in the <style> block via
   *    the `details:not([open]) [data-accordion-arrow]` selector.
   *  - Returns whether any transformation occurred so the caller can
   *    decide whether to inject the fallback script. */
  const transformAccordions = (html: string): { html: string; changed: boolean } => {
    if (!html.includes('data-accordion-item')) return { html, changed: false };
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let changed = false;
    // Process each group separately so item-counters reset per group.
    const groups = doc.querySelectorAll('[data-accordion-group]');
    groups.forEach(group => {
      const groupName = `acc-${group.getAttribute('data-accordion-group') || 'g'}`;
      const items = group.querySelectorAll('[data-accordion-item]');
      items.forEach((item, i) => {
        // Inside the item table is a <td> containing the header (h3) and
        // body (div). We wrap them in <details>/<summary> in place.
        const td = item.querySelector('td');
        if (!td) return;
        const header = td.querySelector('[data-accordion-header]');
        const body = td.querySelector('[data-accordion-body]');
        if (!header || !body) return;
        const summary = doc.createElement('summary');
        summary.setAttribute('style', 'list-style:none;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;');
        // Move the header element into the summary
        summary.appendChild(header);
        const details = doc.createElement('details');
        details.setAttribute('name', groupName);
        // Mark with a class so the fallback script can find them and
        // enforce exclusive-open in browsers that ignore `name`.
        details.setAttribute('data-accordion-group-name', groupName);
        if (i === 0) details.setAttribute('open', '');
        details.appendChild(summary);
        details.appendChild(body);
        // Clear td and insert the details
        td.innerHTML = '';
        td.appendChild(details);
        changed = true;
      });
    });
    return { html: doc.body.innerHTML, changed };
  };
  const exportHtml = useCallback((minify = false) => {
    const sectionsHtml = canvas.map(s => {
      // For features sections, strip hidden groups and clean implementation attrs
      let exportElements = s.elements;
      if (['C1', 'C2', 'C3'].includes(s.libraryCode)) {
        exportElements = filterHiddenFeatureGroups(exportElements);
        if (s.libraryCode === 'C3') exportElements = recalculateC3Numbers(exportElements);
        exportElements = cleanFeatureGroupAttrs(exportElements);
      }
      let inner = exportElementsToHtml(exportElements);
      const st = s.styles;

      // Outer table row styles (full-width section background)
      const outerTdStyles: string[] = ['padding:0'];
      if (st.backgroundColor) outerTdStyles.push(`background-color:${st.backgroundColor}`);
      if (st.backgroundGradient) outerTdStyles.push(`background:${st.backgroundGradient}`);
      if (st.backgroundImage) {
        outerTdStyles.push(
          `background-image:url('${st.backgroundImage}')`,
          `background-size:${st.backgroundFit}`,
          `background-position:${st.backgroundPosition}`,
          `background-repeat:${st.backgroundRepeat}`,
        );
      }
      if (st.marginTop) outerTdStyles.push(`padding-top:${st.marginTop}px`);
      if (st.marginBottom) outerTdStyles.push(`padding-bottom:${st.marginBottom}px`);

      // Inner content cell (paddings + optional card background)
      const innerTdStyles: string[] = [];
      if (st.paddingTop) innerTdStyles.push(`padding-top:${st.paddingTop}px`);
      if (st.paddingRight) innerTdStyles.push(`padding-right:${st.paddingRight}px`);
      if (st.paddingBottom) innerTdStyles.push(`padding-bottom:${st.paddingBottom}px`);
      if (st.paddingLeft) innerTdStyles.push(`padding-left:${st.paddingLeft}px`);
      if (st.innerBackgroundColor) innerTdStyles.push(`background-color:${st.innerBackgroundColor}`);
      if (st.innerBackgroundGradient) innerTdStyles.push(`background:${st.innerBackgroundGradient}`);
      if (st.borderEnabled) {
        innerTdStyles.push(
          `border-top-width:${st.borderTop ? st.borderWidth : 0}px`,
          `border-right-width:${st.borderRight ? st.borderWidth : 0}px`,
          `border-bottom-width:${st.borderBottom ? st.borderWidth : 0}px`,
          `border-left-width:${st.borderLeft ? st.borderWidth : 0}px`,
          `border-style:${st.borderStyle}`,
          `border-color:${st.borderColor}`,
        );
        if (st.borderRadius) innerTdStyles.push(`border-radius:${st.borderRadius}px`);
      }
      // User-set drop shadow: emit it exactly once on the inner content td so
      // the exported HTML matches the canvas. Applied here (not on the outer
      // full-width wrapper) so the shadow hugs the content card, not the
      // entire viewport-wide row. Skipped when empty or explicitly 'none'.
      if (st.boxShadow && st.boxShadow !== 'none') {
        innerTdStyles.push(`box-shadow:${st.boxShadow}`);
      }

      if (innerTdStyles.length) {
        inner = `<table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="email-container" style="width:600px;max-width:100%;">
<tr><td style="${innerTdStyles.join(';')}">${inner}</td></tr>
</table>`;
      }

      return `<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
<tr><td align="center" valign="top" style="${outerTdStyles.join(';')}">${inner}</td></tr>
</table>`;
    }).join('\n');

    // Convert any data-accordion-item markers into <details>/<summary> for
    // interactive open/close in browser-rendered contexts (Zoho preview,
    // localhost iframe). The editor canvas keeps the raw markup with all
    // bodies expanded — this transform only runs at export.
    const accResult = transformAccordions(sectionsHtml);
    const sectionsHtmlAcc = accResult.html;
    // Fallback script for browsers that don't support <details name="...">
    // exclusive-open semantics. Listens to the toggle event and closes any
    // sibling <details> in the same group when one opens. Self-contained,
    // 800 bytes uncompressed. Only injected if the export actually contains
    // accordions, so non-C12 newsletters don't carry dead code.
    const accordionScript = accResult.changed ? `
<script>
(function(){
  // Use a fresh querySelectorAll on each toggle so dynamically-inserted
  // accordion groups (rare but possible) are handled too.
  document.addEventListener('toggle', function(e){
    var el = e.target;
    if (!el || !el.matches || !el.matches('details[data-accordion-group-name]')) return;
    if (!el.open) return;
    var name = el.getAttribute('data-accordion-group-name');
    var siblings = document.querySelectorAll('details[data-accordion-group-name="' + name + '"]');
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] !== el && siblings[i].open) siblings[i].open = false;
    }
  }, true);
})();
</script>` : '';

    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<!-- Tell email clients (Apple Mail, iOS Mail, Outlook iOS/Android) NOT to
     auto-invert colors in dark mode. Without these, dark backgrounds get
     lightened and light backgrounds get darkened, which mangles the
     newsletter palette (e.g. black "What's New?" sections turn light gray,
     blue buttons turn light blue, warning icons get auto-tinted, etc).
     Three layers of defense: meta color-scheme, supported-color-schemes
     for Apple Mail, and a CSS root rule. -->
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Newsletter</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style>
:root { color-scheme: light only; supported-color-schemes: light only; }
/* [data-ogsc] / [data-ogsb] are added by Outlook iOS/Android in dark mode.
   Forcing color-scheme:light here prevents their inversion of bgs/text. */
[data-ogsc] body, [data-ogsb] body { color-scheme: light !important; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; display: block; max-width: 100%; }
table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }

/* iOS Mail (especially in dark mode) renders standalone emoji entities at
   the system's default emoji size — 30-40px — even when the surrounding
   <p> has font-size:13px. The font-size on the parent doesn't always
   inherit through to the emoji glyph because iOS Mail picks an emoji-
   specific font. Wrapping risky inline emojis in <span class="email-icon">
   forces an explicit font-size on the glyph itself so it renders at the
   intended small size in iOS Mail and matches the surrounding text. */
.email-icon { font-size: 13px !important; line-height: 1 !important; vertical-align: middle; }
/* Inline icon images (PNG/JPG/WebP replacing emoji or used as text-adjacent icons).
   display:inline-block !important beats the global img { display:block } reset so the
   icon never breaks onto its own line. max-width:100% prevents overflow on phones while
   the declared pixel width keeps the icon at its intended size on larger viewports. */
img.img-icon { display: inline-block !important; vertical-align: middle; max-width: 100%; }

@media only screen and (max-width: 620px) {
  .email-container { width: 100% !important; max-width: 100% !important; }
  /* Only scale up images intended to be wide (>= 250px source). Small
     icon-sized images (logos replacing emoji slots, warning triangles,
     status pills, etc — typically 20-200px wide) should keep their
     declared size in mobile rather than stretching to 100% of the
     container. The previous blanket img[width] { width:100% } made every
     icon balloon to viewport-width on phones.
     img-icon is also excluded: inline icon images must stay at their declared
     pixel size on all viewports — the max-width:100% on the element itself
     is the only responsive constraint they need. */
  img[width]:not(.img-icon):not(.img-logo):not(.img-social):not([width="20"]):not([width="24"]):not([width="32"]):not([width="40"]):not([width="48"]):not([width="56"]):not([width="64"]):not([width="80"]):not([width="100"]):not([width="120"]):not([width="150"]):not([width="200"]) {
    width: 100% !important; height: auto !important;
  }
  /* Logo images: cap at 150px on mobile so a 140px/180px logo doesn't stretch
     to full container width when the general 100%-width rule is bypassed above. */
  img.img-logo { max-width: 150px !important; width: auto !important; height: auto !important; }
  /* Social media icons: keep each icon at a fixed 32px — prevents 28px icons from
     ballooning to 100% container width on narrow screens. */
  img.img-social { max-width: 32px !important; width: 32px !important; height: 32px !important; }
  table[width="480"], table[width="540"], table[width="600"], table[width="400"] { width: 100% !important; }
  tr:has(> td[width$="%"]:not([width="2%"]):not([width="4%"]):not([width="100%"])) { display: block !important; }
  /* Use margin-bottom (not padding-bottom) so the gap between stacked cards
     sits OUTSIDE each card's white background — without this, cards with
     border-radius / colored bg show all the spacing INSIDE the card, and
     the cards visually touch each other with no gap between them. */
  td[width$="%"]:not([width="2%"]):not([width="4%"]):not([width="100%"]) {
    display: block !important; width: 100% !important; box-sizing: border-box !important; margin-bottom: 12px !important;
  }
  td[width$="%"]:not([width="2%"]):not([width="4%"]):not([width="100%"]):last-child { margin-bottom: 0 !important; }
  td[width="2%"], td[width="4%"] { display: none !important; }
  /* C1–C5 diamond bullet: 42px renders oversized on narrow screens.
     Scale down to 24px on tablet/mobile while leaving desktop unchanged. */
  .diamond-bullet { font-size: 24px !important; }
}

@media only screen and (max-width: 480px) {
  td[width$="%"]:not([width="2%"]):not([width="4%"]):not([width="100%"]) { margin-bottom: 16px !important; }
  td[width$="%"]:not([width="2%"]):not([width="4%"]):not([width="100%"]):last-child { margin-bottom: 0 !important; }
  h1 { font-size: 22px !important; } h2 { font-size: 20px !important; } h3 { font-size: 15px !important; }
  p, li { font-size: 14px !important; line-height: 1.6 !important; }
}

/* Accordion (data-accordion-item → <details>/<summary> at export):
   - Hide the default disclosure triangle so our own arrow span is the
     only indicator the user sees.
   - Make the summary look like a plain header (no outline, no
     selection caret) and remain clickable.
   - Rotate the arrow span 90° counter-clockwise when the parent
     <details> is closed (the default ▼ arrow becomes a ▶ visually).
     The 0.2s transition keeps the rotation feeling responsive.
   - Hide the default text-selection on rapid clicks so the click reads
     as an interaction, not a selection. */
details > summary { list-style: none; cursor: pointer; outline: none; user-select: none; }
details > summary::-webkit-details-marker { display: none; }
details > summary::marker { content: ''; }
[data-accordion-arrow] { display: inline-block; transition: transform 0.2s ease; }
details:not([open]) [data-accordion-arrow] { transform: rotate(-90deg); }

/* Dark mode: suppress drop shadows to prevent the glowing white/light halo
   that appears around section cards on dark-themed devices (Gmail app,
   Apple Mail, Zoho Mail). The shadow is still visible in light mode. */
@media (prefers-color-scheme: dark) {
  .section-card, [class*="card"], [class*="section"],
  [class*="wrapper"], [class*="container"] {
    box-shadow: none !important;
    -webkit-box-shadow: none !important;
    filter: none !important;
    -webkit-filter: none !important;
  }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Zoho Puvi',Arial,sans-serif;">
<center style="width:100%;background-color:#ffffff;">
<!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width:600px;"><tr><td><![endif]-->
<div class="email-container" style="max-width:600px;margin:0 auto;">
${sectionsHtmlAcc}
</div>
<!--[if mso | IE]></td></tr></table><![endif]-->
</center>${accordionScript}
</body>
</html>`;
    return minify ? html.replace(/\n\s*/g, '').replace(/<!--.*?-->/g, '') : html;
  }, [canvas]);

  const exportZip = useCallback(async () => {
    const zip = new JSZip();
    const imgFolder = zip.folder('images')!;

    const rawHtml = exportHtml(false);

    // Process all img tags — physically crop those with object-fit:cover before extracting
    const processImages = async (html: string): Promise<{ html: string; images: { filename: string; data: Uint8Array }[] }> => {
      const images: { filename: string; data: Uint8Array }[] = [];
      let count = 0;
      let result = html;
      const replacements: { full: string; newSrc: string; filename: string; bytes: Uint8Array }[] = [];

      const imgRegex = /<img([^>]*)src="(data:image\/(jpeg|jpg|png|gif);base64,([^"]+))"([^>]*)>/g;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        count++;
        const beforeSrc = imgMatch[1];
        const fullDataUrl = imgMatch[2];
        const ext = imgMatch[3] === 'jpeg' ? 'jpg' : imgMatch[3];
        const base64Data = imgMatch[4];
        const afterSrc = imgMatch[5];

        const styleMatch = (beforeSrc + afterSrc).match(/style="([^"]*)"/);
        const style = styleMatch ? styleMatch[1] : '';
        const hasCover = style.includes('object-fit:cover') || style.includes('object-fit: cover');
        const posMatch = style.match(/object-position:\s*([^;]+)/);
        const position = posMatch ? posMatch[1].trim() : 'center center';

        const widthMatch = (beforeSrc + afterSrc).match(/width="(\d+)"/);
        const heightMatch = (beforeSrc + afterSrc).match(/height="(\d+)"/);
        const containerW = widthMatch ? parseInt(widthMatch[1]) : 0;
        const containerH = heightMatch ? parseInt(heightMatch[1]) : 0;

        const isGif = ext === 'gif';
        let finalDataUrl = fullDataUrl;

        // Physically crop cover images (skip GIFs — canvas breaks animation)
        if (hasCover && containerW && containerH && !isGif) {
          try {
            finalDataUrl = await cropImageToFrame(fullDataUrl, containerW, containerH, position);
          } catch {
            // Fallback to original on error
          }
        }

        const filename = `img_${count}.${isGif ? 'gif' : ext}`;
        const rawBase64 = finalDataUrl.split(',')[1] || base64Data;
        const binaryStr = atob(rawBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        replacements.push({ full: fullDataUrl, newSrc: `images/${filename}`, filename, bytes });
      }

      for (const r of replacements) {
        result = result.replace(r.full, r.newSrc);
      }

      return { html: result, images: replacements.map(r => ({ filename: r.filename, data: r.bytes })) };
    };

    const { html: processedHtml, images } = await processImages(rawHtml);
    zip.file('newsletter.html', processedHtml);
    for (const img of images) {
      imgFolder.file(img.filename, img.data, { binary: true });
    }

    const imageCount = images.length;
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'newsletter.zip';
    a.click();
    URL.revokeObjectURL(a.href);

    const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
    if (blob.size > 7 * 1024 * 1024) {
      toast.error(`Warning: ZIP is ${sizeMB}MB — exceeds Zoho's 7MB limit. Reduce image sizes or use fewer images.`);
    } else {
      toast.success(`Downloaded newsletter.zip (${sizeMB}MB) with ${imageCount} image${imageCount !== 1 ? 's' : ''}`);
    }
  }, [exportHtml]);

  const getContentStore = useCallback((): ContentStore => contentStoreRef.current, []);

  const setContentStoreData = useCallback((cs: ContentStore) => {
    contentStoreRef.current = cs;
  }, []);

  const injectSavedContent = useCallback((savedStore: ContentStore) => {
    contentStoreRef.current = savedStore;
    setCanvas(prev => {
      const visSlots = savedStore[FEATURE_VIS_KEY]?.slots;
      const next = prev.map(s => {
        const catKey = categoryKey(s.category);
        const slots = savedStore[catKey]?.slots;
        let els = s.elements;
        if (slots) {
          const injected = injectSlots(els, slots);
          if (injected !== els) els = injected;
        }
        if (['C1', 'C2', 'C3'].includes(s.libraryCode) && visSlots && Object.keys(visSlots).length > 0) {
          els = applyFeatureVisibility(els, visSlots, s.libraryCode);
        }
        if (els === s.elements) return s;
        return { ...s, elements: els };
      });
      pushHist(next);
      return next;
    });
  }, [pushHist]);

  const clearContentStore = useCallback(() => {
    contentStoreRef.current = makeEmptyContentStore();
    clearContentStoreStorage();
  }, []);

  const selected = canvas.find(s => s.id === selectedId) || null;

  const validate = useCallback(() => {
    const warnings: string[] = [];
    canvas.forEach(s => {
      function checkEl(el: SectionElement) {
        if (el.type === 'image') {
          if (!el.attrs?.alt) warnings.push(`${s.name}: Image missing alt text`);
          const src = el.attrs?.src || '';
          if (!src || src === '#') warnings.push(`${s.name}: Image has no src`);
        }
        el.children?.forEach(checkEl);
      }
      s.elements.forEach(checkEl);
    });
    // Check for unsubscribe merge tag
    const allHtml = canvas.map(s => exportElementsToHtml(s.elements)).join('');
    if (!allHtml.includes('$[UNSUBSCRIBE]$') && !allHtml.includes('$[SUBSCRIBERPREFERENCE]$')) {
      warnings.push('No $[UNSUBSCRIBE]$ merge tag found. Add a Footer section with an unsubscribe link — Zoho Campaigns requires this.');
    }
    return warnings;
  }, [canvas]);

  return {
    library, canvas, selectedId, selected, selectedElementId, previewMode,
    searchQuery, categoryFilter, themeColors, customPresets, savedTemplates,
    canUndo, canRedo, flashedElementIds,
    setSelectedId, setSelectedElementId, setPreviewMode, setSearchQuery, setCategoryFilter,
    addSection, removeSection, replaceSection, duplicateSection, moveSection,
    updateHtml, updateHtmlLive, commitHtml, updateStyles, updateStylesLive, updateName,
    getElementInfo, updateElement, updateElementAndCommit, patchElement,
    toggleFeatureGroup, addFeatureGroupAfter, reorderFeatureGroup,
    replaceElement, getSelectedElement,
    deleteSelectedElement, duplicateSelectedElement,
    applyStylesGlobally, applyElementGlobally,
    clearAll, loadLibrarySections, loadCanvasSections,
    getContentStore, setContentStoreData,
    injectSavedContent, clearContentStore,
    saveToLibrary, importHtml,
    applyTheme, setThemeColors, saveThemePreset, deleteCustomPreset,
    saveTemplate, deleteCustomTemplate, loadTemplate,
    undo, redo, exportHtml, exportZip, validate,
  };
}
