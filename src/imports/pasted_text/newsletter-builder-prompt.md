# Newsletter Automation Builder — Master Figma Make Prompt

---

## Project Overview

Build a **modular, drag-and-drop newsletter builder** that ingests existing Figma-exported HTML newsletter files, extracts every distinct section into a reusable component library, and lets the user assemble, edit, and export fully responsive, email-client-compatible newsletters.

---

## 1. Section Extraction & Component Library

### 1.1 HTML Parsing
- Accept uploaded HTML newsletter files (exported from Figma Make).
- Automatically parse and identify every distinct section in each newsletter. Common section types include but are not limited to:
  - Hero / Banner
  - Header / Navigation bar
  - Text-only block (heading + body)
  - Image + Text (side-by-side or stacked)
  - Call-to-Action (CTA) button block
  - Image collage / gallery
  - Testimonial / quote block
  - Divider / spacer
  - Social media links bar
  - Footer (address, unsubscribe, legal)
- Each extracted section becomes a **reusable, draggable, editable component** in a section library panel.

### 1.2 Section Library Panel
- Display all extracted sections as thumbnail previews in a left-side panel.
- Group/tag sections by category (e.g., "Header," "CTA," "Image Collage," "Footer," "Testimonial") for easy filtering and search.
- Allow the user to search and filter sections by tag/category.
- Sections should be draggable from the library onto the newsletter canvas.

---

## 2. Newsletter Canvas & Layout Engine

### 2.1 Fixed Width, Auto-Height
- Newsletter canvas width is fixed at **600px** (the email standard).
- Height is **auto** — the canvas grows vertically as sections are added.
- Each section auto-sizes its height based on content (auto-layout behavior).

### 2.2 Section Stacking & Auto-Layout
- All sections stack vertically in a single-column auto-layout.
- No manual vertical positioning — sections flow top-to-bottom in the order placed.
- Sections snap into position when dragged onto the canvas.

### 2.3 Section Management
- **Drag to reorder** — Drag a section up or down to change its position in the stack.
- **Duplicate** — Clone any section on the canvas.
- **Delete** — Remove any section from the canvas.
- **Undo / Redo** — Full undo/redo history for all actions (add, remove, reorder, edit).

---

## 3. Image Handling

### 3.1 Image Replacement
- Every image in every section is replaceable. Clicking on an image opens an upload dialog to replace it with a new image.
- Support common formats: JPG, PNG, GIF, SVG, WebP.

### 3.2 Image Dimensions & Resizing
- Image dimensions (width and height) are user-editable via input fields or drag handles.
- Images scale proportionally by default (maintain aspect ratio) with an option to unlock aspect ratio for free-form sizing.
- Images must resize and fit accurately using CSS `object-fit` (cover, contain, fill, none, scale-down) — **no stretching, no unwanted cropping, no quality loss.**

### 3.3 Image Placement & Alignment
- Provide controls to choose the placement and alignment of the image within its container:
  - **Horizontal alignment:** Left, Center, Right.
  - **Vertical alignment:** Top, Center, Bottom.
  - **Object position:** Fine-grained control using `object-position` for precise focal-point cropping.
- The user selects alignment from a visual alignment grid or dropdown.

### 3.4 Image Fit Modes
- Provide a dropdown or toggle for image fit behavior:
  - **Cover** — Fill container, crop excess (default for hero/banner images).
  - **Contain** — Fit entire image inside container, may show background.
  - **Fill** — Stretch to fill (with warning that this may distort).
  - **Scale Down** — Only shrink if larger than container, never enlarge.

---

## 4. Image Collage Sections

### 4.1 Collage Block Type
- A dedicated "Image Collage" section type available in the section library.
- Also, any existing collage sections found in uploaded newsletters should be extracted as-is and editable.

### 4.2 Collage Layout Presets
Provide multiple collage layout options the user can choose from. At minimum:
- **2-up horizontal** — Two images side by side (50/50 split).
- **2-up vertical** — Two images stacked.
- **2-up asymmetric** — One large + one small (e.g., 66/33 or 70/30 split).
- **3-up equal** — Three images in a row (33/33/33).
- **3-up feature** — One large image on top, two smaller below (or vice versa).
- **4-up grid** — 2×2 grid of equal images.
- **4-up asymmetric** — One large image + three smaller in an L-shape.
- **Mosaic / masonry** — Mixed sizes in an organic grid layout.
- **Full-width single** — One image spanning the full 600px width.

### 4.3 Collage Editing
- Each slot in the collage is independently replaceable (click to upload a new image).
- Each image within the collage has its own alignment and fit controls (per section 3.3 and 3.4).
- The user can **switch collage layout** at any time — images carry over to the new layout arrangement.
- Gap/spacing between collage images is adjustable.

---

## 5. Typography Controls

### 5.1 Font Family
- **Retain all font families** used in the uploaded newsletters.
- Present them in a **dropdown selector** so the user can choose the exact font from their existing newsletters.
- If a section uses a specific font, that font is preserved by default. The user can override it per element.

### 5.2 Font Properties
Provide controls for:
- **Font size** — Numeric input (px or pt) with increment/decrement buttons.
- **Font weight** — Dropdown: Thin, Light, Regular, Medium, Semibold, Bold, Extrabold, Black.
- **Font style** — Toggles: Italic, Underline, Strikethrough.
- **Font color** — Color picker with hex input, plus a palette of brand colors extracted from newsletters.
- **Text alignment** — Left, Center, Right, Justify.
- **Line height** — Adjustable spacing between lines.
- **Letter spacing** — Adjustable spacing between characters.

### 5.3 Text Block Types
- Support distinct text block presets: Heading, Subheading, Body Text, Caption, Blockquote.
- Each preset has default styling derived from the uploaded newsletters but is fully overridable.

---

## 6. Spacing & Padding Controls

### 6.1 Per-Section Controls
- **Padding** — Top, Right, Bottom, Left padding for each section, editable individually or linked.
- **Margin / Gap** — Vertical gap between sections, adjustable per section or globally.

### 6.2 Per-Element Controls
- Internal padding around text blocks, images, and buttons within a section.
- Consistent spacing tokens derived from the uploaded newsletters.

---

## 7. Link & Button Editing

### 7.1 Hyperlinks
- Inline text link editing: select text → add/edit URL, set link color, underline style.
- All links open in a new tab by default.

### 7.2 CTA Buttons
- Button text, URL, background color, text color, border radius, padding — all editable.
- Button width: auto (fit content) or full-width toggle.

---

## 8. Background & Color Controls

### 8.1 Per-Section Background
- Solid color background per section (color picker).
- Gradient background option (linear, radial).
- Background image with overlay opacity control.

### 8.2 Brand Color Palette
- Auto-extract a brand color palette from the uploaded newsletters.
- Display as quick-pick swatches wherever a color picker appears (text color, background, button, etc.).

---

## 9. Accessibility

### 9.1 Image Alt Text
- Every image (standalone or in a collage) must have an **alt text** field.
- Prompt the user to enter alt text when uploading/replacing an image.
- Default alt text can be empty but should show a warning indicator.

### 9.2 Semantic HTML
- Output uses semantic elements and proper heading hierarchy.
- Sufficient color contrast between text and backgrounds (visual indicator/warning).

---

## 10. Global Styles & Theme Presets

### 10.1 Brand Defaults
- A "Global Styles" panel where the user sets:
  - Default font family, size, color for body text.
  - Default heading font, size, color.
  - Default CTA button style.
  - Default section background color.
  - Default link color.
- These apply to all new sections added to the canvas and can be overridden per section.

### 10.2 Theme Presets
- Save the current global style configuration as a named theme/preset.
- Switch between saved themes to restyle the entire newsletter instantly.

---

## 11. Save & Reuse

### 11.1 Save as Template
- Save the entire assembled newsletter (layout + sections + styles) as a reusable template.
- Templates appear in the library for future use.

### 11.2 Save Custom Sections
- Save any edited or newly created section back to the section library as a custom component for reuse across newsletters.

---

## 12. Output & Export

### 12.1 Email-Safe HTML Output
- The exported HTML must be **fully compatible** with all major email clients:
  - **Gmail** (web, Android, iOS)
  - **Outlook** (desktop 2016/2019/365, Outlook.com, Outlook mobile)
  - **Apple Mail** (macOS, iOS)
  - **Yahoo Mail**
  - **Samsung Mail**
  - **Thunderbird**
- This means the output must use:
  - **Table-based layout** (not CSS flexbox or grid — these break in Outlook desktop).
  - **Inline CSS styles** on every element (no external or `<style>` block reliance for critical styles; `<style>` block can be included as progressive enhancement only).
  - **MSO conditional comments** for Outlook-specific fixes (e.g., `<!--[if mso]>` for button rendering, image sizing).
  - **Web-safe fallback fonts** in the font stack (e.g., `font-family: 'Brand Font', Arial, Helvetica, sans-serif;`).
  - **Explicit width and height attributes** on images (not just CSS) for Outlook compatibility.
  - **`align` and `valign` attributes** on table cells for consistent alignment across clients.
  - **Border-based buttons** (not padding-only) for Outlook click-target compatibility.
  - **No CSS shorthand** that Outlook strips (e.g., use `padding-top`, `padding-right`, etc. separately).
  - **Max-width on images** for fluid scaling on mobile without breaking fixed layout in desktop clients.

### 12.2 Responsive Design
- The output HTML must be **responsive across all devices and screen sizes**:
  - On desktop (>600px): render at the fixed 600px width, centered.
  - On mobile (<600px): sections, images, and text stack and scale fluidly to fit the viewport.
  - Use `@media` queries inside a `<style>` block for clients that support them (progressive enhancement).
  - Images use `max-width: 100%; height: auto;` for fluid scaling.
  - Multi-column layouts (e.g., 2-up collages, side-by-side image+text) collapse to single-column on small screens.
  - Font sizes adjust for readability on mobile (minimum 14px body text on mobile).
  - Buttons are touch-friendly (minimum 44px tap target height on mobile).

### 12.3 Export Options
- **Copy HTML** — Copy the full email-ready HTML to clipboard.
- **Download HTML** — Download as a `.html` file.
- **Preview mode** — Toggle between Desktop and Mobile preview within the builder.
- **Send test email** — (Optional/future) Send a test email to a specified address for real-client testing.

### 12.4 Code Quality
- Clean, well-commented HTML output.
- Minified option for production use.
- All images referenced with absolute URLs (user provides base URL or images are embedded as base64 for testing).

---

## 13. Summary of All Features (Checklist)

| # | Feature | Status |
|---|---------|--------|
| 1 | Upload & parse HTML newsletters from Figma Make | Required |
| 2 | Auto-extract all sections into reusable component library | Required |
| 3 | Section tagging/categorization & search/filter | Required |
| 4 | Drag-and-drop sections onto a fixed-width (600px) canvas | Required |
| 5 | Auto-height, auto-layout vertical stacking | Required |
| 6 | Drag to reorder sections | Required |
| 7 | Duplicate & delete sections | Required |
| 8 | Undo / Redo history | Required |
| 9 | Click-to-replace images in any section | Required |
| 10 | Editable image dimensions (width/height) | Required |
| 11 | Proportional scaling with aspect ratio lock/unlock | Required |
| 12 | Image fit modes (cover, contain, fill, scale-down) | Required |
| 13 | Image alignment controls (horizontal + vertical) | Required |
| 14 | Image collage section type | Required |
| 15 | Multiple collage layout presets (2-up, 3-up, 4-up, grid, mosaic, asymmetric) | Required |
| 16 | Switch collage layout with images preserved | Required |
| 17 | Adjustable collage gap/spacing | Required |
| 18 | Font family dropdown (retaining newsletter fonts) | Required |
| 19 | Font size, weight, style, color controls | Required |
| 20 | Text alignment & line height controls | Required |
| 21 | Text block type presets (heading, body, caption, etc.) | Required |
| 22 | Per-section padding & margin controls | Required |
| 23 | Per-element internal padding | Required |
| 24 | Inline link editing (URL, color, style) | Required |
| 25 | CTA button editing (text, URL, colors, radius, width) | Required |
| 26 | Per-section background (solid, gradient, image) | Required |
| 27 | Auto-extracted brand color palette | Required |
| 28 | Image alt text fields | Required |
| 29 | Global styles panel (default fonts, colors, button styles) | Required |
| 30 | Theme presets (save & switch) | Required |
| 31 | Save entire newsletter as reusable template | Required |
| 32 | Save custom sections back to library | Required |
| 33 | Table-based, inline-CSS email-safe HTML output | Required |
| 34 | Outlook conditional comments & fixes | Required |
| 35 | Responsive design (desktop centered, mobile fluid) | Required |
| 36 | Cross-client compatibility (Gmail, Outlook, Apple Mail, Yahoo, Samsung, Thunderbird) | Required |
| 37 | Desktop & mobile preview toggle | Required |
| 38 | Copy HTML / Download HTML export | Required |
| 39 | Clean, well-commented, optionally minified code output | Required |

---

*This prompt is the single source of truth for building the Newsletter Automation Tool. All features listed above are required for the complete product.*