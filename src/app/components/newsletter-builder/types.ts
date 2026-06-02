// ─── Core Types ───────────────────────────────────────────────

export type SectionCategory =
  | 'Headers' | 'Heroes' | 'Features' | 'Testimonials'
  | 'Articles' | 'Events' | 'Registration' | 'CTAs'
  | 'Footers' | 'Collages' | 'Dividers';

/**
 * Structured representation of a single HTML element.
 * styles: camelCase CSS property names (matches React style props).
 * attrs:  HTML attribute names as-is (width, align, valign, href, src, etc.)
 *         stored in lowercase HTML format; converted to React camelCase at render time.
 */
export interface SectionElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'link' | 'divider' | 'container' | 'icon';
  tag: string;                         // lowercase: 'table', 'td', 'p', 'a', 'img', 'hr'
  content?: string;                    // text content for leaf nodes
  children?: SectionElement[];
  styles: Record<string, string>;      // camelCase CSS props
  attrs?: Record<string, string>;      // other HTML attrs (align, width, valign, href, src…)
}

export interface LibrarySection {
  id: string;
  code: string;        // e.g. "A1", "B5"
  name: string;
  category: SectionCategory;
  source: string;      // e.g. "Sep 2025" or "Custom Variant"
  html: string;
  isCustom?: boolean;
}

export interface CanvasSection {
  id: string;
  libraryCode: string;
  name: string;
  category: SectionCategory;
  elements: SectionElement[];   // structured element tree (replaces html string)
  styles: SectionStyles;
}

export interface SectionStyles {
  // Outer wrapper (full-width section background)
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage: string;
  backgroundFit: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  backgroundOverlayOpacity: number;
  // Inner content card background
  innerBackgroundColor: string;
  innerBackgroundGradient: string;
  // Spacing
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginBottom: number;
  // Border
  borderEnabled: boolean;
  borderWidth: number;
  borderColor: string;
  borderStyle: string;
  borderRadius: number;
  borderTop: boolean;
  borderRight: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
  borderGradientEnabled: boolean;
  borderGradient: string;
  // Drop shadow
  boxShadow: string;
}

export const defaultSectionStyles: SectionStyles = {
  backgroundColor: '',
  backgroundGradient: '',
  backgroundImage: '',
  backgroundFit: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundOverlayOpacity: 0,
  innerBackgroundColor: '',
  innerBackgroundGradient: '',
  paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
  marginTop: 0, marginBottom: 0,
  borderEnabled: false, borderWidth: 0, borderColor: '#e2e8f0',
  borderStyle: 'solid', borderRadius: 0,
  borderTop: true, borderRight: true, borderBottom: true, borderLeft: true,
  borderGradientEnabled: false, borderGradient: 'linear-gradient(90deg, #004BE2, #E42527)',
  boxShadow: '',
};

// ─── Theme ────────────────────────────────────────────────────

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  textOnDark: string;
  accent: string;
  button: string;
  buttonText: string;
  divider: string;
  strokeBorder: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
}

export type PreviewMode = 'desktop' | 'tablet' | 'mobile';

// ─── Apply-to-all-similar ────────────────────────────────────
// Scope for propagating a property change across the canvas.
// - 'sameCode'     : all canvas sections sharing libraryCode (section) OR
//                    all elements inside such sections (element)
// - 'sameCategory' : all canvas sections of the same category
// - 'allCanvas'    : every canvas section / every matching element anywhere

export type ApplyScope = 'sameCode' | 'sameCategory' | 'allCanvas';

// ─── Element editing ──────────────────────────────────────────

export interface SelectedElement {
  sectionId: string;
  elementIndex: number;
  tagName: string;
  type: 'text' | 'image' | 'link' | 'button' | 'other';
}

// ─── Fonts ────────────────────────────────────────────────────

export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Helvetica Neue',
  'Lato',
  'Roboto',
  'sans-serif',
];

export const FONT_WEIGHTS = [
  { label: 'Thin', value: '100' },
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extrabold', value: '800' },
  { label: 'Black', value: '900' },
];

export const IMAGE_FIT_MODES = ['cover', 'contain', 'fill', 'scale-down', 'none'];

export const BRAND_COLORS = [
  '#004BE2', '#E42527', '#0E0E0E', '#FFDD53', '#29c7b2',
  '#E5EDFC', '#FFF7F7', '#F7F7F7', '#FAFFEB', '#DEEDF1',
  '#F8F8F9', '#ffffff', '#1a1a2e', '#2d3748', '#4a5568',
  '#718096', '#a0aec0', '#e2e8f0',
];
