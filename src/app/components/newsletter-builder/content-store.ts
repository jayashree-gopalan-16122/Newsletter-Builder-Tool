import { SectionElement } from './types';

export type SlotValue = string | { text: string; href: string };
export type SlotRecord = Record<string, SlotValue>;
export type ContentStore = Record<string, { slots: SlotRecord }>;

const STORAGE_KEY = 'newsletter_content_store';

export function categoryKey(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

export function makeEmptyContentStore(): ContentStore {
  return {};
}

function getElementContent(el: SectionElement): string {
  if (el.children?.length) return el.children.map(getElementContent).join('');
  return el.content ?? '';
}

export function extractSlots(elements: SectionElement[]): SlotRecord {
  const slots: SlotRecord = {};

  function walk(el: SectionElement): void {
    const slot = el.attrs?.['data-slot'];
    if (slot) {
      if (el.tag === 'img') {
        const src = el.attrs?.src || '';
        const isHidden =
          (el.styles && el.styles.display === 'none') ||
          (el.attrs?.style || '').includes('display:none');
        // Only preserve user-uploaded images (base64 data URLs).
        // Template placeholder URLs (http/https, "#", etc.) are not user content
        // and must not be injected over real images saved in custom templates.
        if (!isHidden && src && src.startsWith('data:')) slots[slot] = src;
      } else if (el.tag === 'a') {
        const text = getElementContent(el);
        const href = el.attrs?.href || '';
        if (text.trim() || href) slots[slot] = { text: text.trim(), href };
      } else {
        const text = getElementContent(el);
        if (text !== undefined && text !== null && text !== '') {
          slots[slot] = text;
        }
      }
    }
    el.children?.forEach(walk);
  }

  elements.forEach(walk);
  return slots;
}

export function injectSlots(elements: SectionElement[], slots: SlotRecord): SectionElement[] {
  if (!slots || Object.keys(slots).length === 0) return elements;

  function walkInject(el: SectionElement): SectionElement {
    const slot = el.attrs?.['data-slot'];
    let updated = el;

    if (slot && slot in slots) {
      const value = slots[slot];
      if (el.tag === 'img') {
        if (typeof value === 'string' && value.startsWith('data:')) {
          updated = { ...el, attrs: { ...(el.attrs || {}), src: value } };
        }
      } else if (el.tag === 'a') {
        if (value && typeof value === 'object' && 'text' in value) {
          const v = value as { text: string; href: string };
          const newAttrs = { ...(el.attrs || {}) };
          if (v.href) newAttrs.href = v.href;
          const newEl: SectionElement = { ...el, attrs: newAttrs };
          if (v.text) {
            newEl.content = v.text;
            newEl.children = undefined;
          }
          updated = newEl;
        }
      } else {
        if (typeof value === 'string' && value !== '') {
          updated = { ...el, content: value, children: undefined };
        }
      }
    }

    if (updated.children) {
      const newChildren = updated.children.map(walkInject);
      const changed = newChildren.some((c, i) => c !== updated.children![i]);
      if (changed) return { ...updated, children: newChildren };
    }

    return updated;
  }

  return elements.map(walkInject);
}

export function saveContentStore(store: ContentStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function loadContentStore(): ContentStore | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function clearContentStoreStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function hasContentToRestore(store: ContentStore): boolean {
  return Object.values(store).some(entry =>
    Object.values(entry.slots).some(v => {
      if (!v) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      return !!((v as { text: string; href: string }).text?.trim() || (v as { text: string; href: string }).href);
    })
  );
}
