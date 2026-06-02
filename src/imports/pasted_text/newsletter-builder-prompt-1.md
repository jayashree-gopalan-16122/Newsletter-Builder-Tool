# NEWSLETTER AUTOMATION BUILDER — DEFINITIVE MASTER PROMPT (v2)

---

## PROJECT OVERVIEW

Build a **modular, drag-and-drop newsletter builder** for Zoho Assist & Zoho Lens newsletters.

The builder must:
1. Contain **every single section** extracted from the 5 uploaded HTML newsletters (listed exhaustively below) as reusable, draggable, editable components.
2. Provide **4+ additional unique design variants** for each section type (created from scratch, beyond what exists in the newsletters).
3. Allow **every element** within every section to be fully editable — text, images, colors, spacing, links, strokes, backgrounds — with no exceptions.
4. Apply a **global theme** that changes the entire newsletter's color scheme in one click while maintaining WCAG AA contrast compliance.
5. Export **email-client-compatible, responsive HTML** that works across Gmail, Outlook (desktop + web + mobile), Apple Mail, Yahoo Mail, Samsung Mail, Thunderbird, and all device sizes (desktop, laptop, tablet, mobile).

**ABSOLUTE RULE: Every section from every newsletter below must exist in the builder. Zero sections may be skipped or omitted.**

---

## PART 1: COMPLETE SECTION INVENTORY (EXTRACTED FROM ALL 5 NEWSLETTERS)

Every section listed below must be built as a separate, independent, draggable component in the section library. Each is labeled with its source newsletter.

---

### SECTION TYPE A: HEADERS

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| A1 | **Logo + Date Header** | Sep 2025, Nov 2025, Dec 2025 | Two-column row: clickable company logo (left-aligned) + newsletter date text (right-aligned). White background. |
| A2 | **Full-Width Banner Header** | Jan 2023 | Full-width clickable banner image spanning 600px. No text overlay — the image IS the header. |
| A3 | **Date Bar** | Jan 2023 | Single row with "Newsletter / Month Year" text, right-aligned. Month name in accent color, rest in gray. |
| A4 | **Hero + Header Combined** | Apr 2026 | Two-column: left side has eyebrow text (small caps, "NEWSLETTER · MONTH YEAR"), large heading, description paragraph. Right side has a rounded image. White background. |

**Additional Variants to Create (not from newsletters — design from scratch):**
- A5: **Centered Logo Header** — Logo centered above a full-width colored divider line.
- A6: **Logo + Nav Links Header** — Logo left + horizontal text navigation links right (e.g., "Blog | Support | Community").
- A7: **Preheader + Logo Header** — Small preheader text bar on top (e.g., "View in browser") + logo + date below.
- A8: **Logo + CTA Button Header** — Logo left + small CTA button right (e.g., "Try Free").

---

### SECTION TYPE B: HERO / SPOTLIGHT BANNERS

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| B1 | **Centered Hero (Solid BG)** | Sep 2025 | Solid color background (#004BE2 blue). Centered image above, large white heading below, white description text. |
| B2 | **Centered Hero (Textured BG)** | Nov 2025 | Solid color background + noise/texture overlay image. Centered badge/award image, white heading, white text with inline link in accent color. |
| B3 | **Left-Aligned Hero (BG Image)** | Dec 2025 | Background image covering entire section. Left-aligned large white heading (with line break), left-aligned white description, inline "Read more" link. |
| B4 | **Two-Column Hero (Text + Image)** | Apr 2026 | White background. Left: eyebrow label, large heading, description. Right: rounded-corner image. Clean, editorial feel. |

**Additional Variants to Create:**
- B5: **Right-Aligned Hero** — Image on left, text on right. Colored background.
- B6: **Full-Width Image Hero** — Single full-bleed image with text overlay (heading + subheading + CTA button) centered on a dark overlay.
- B7: **Split Hero (50/50)** — Left half solid color with text, right half image. No overlap.
- B8: **Minimal Text Hero** — No image. Centered large heading + short subheading on a bold colored background.
- B9: **Video Hero** — Centered play button icon over a background image + heading + "Watch Now" CTA.

---

### SECTION TYPE C: PRODUCT UPDATE / FEATURE LIST

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| C1 | **What's New (Dark BG, Diamond Bullets)** | Sep 2025 | Black/dark background (#0E0E0E). Section heading "What's New?" in white. Each item: diamond icon (left column, 40px wide) + item title (h3, white) + item description (p, white). Items stacked vertically with 40px gap. |
| C2 | **What's New (Light/Tinted BG, Diamond Bullets)** | Dec 2025 | Light pink/tinted background (#FFF7F7). Same diamond icon + title + description structure but with black text instead of white. |
| C3 | **What's New (Dark BG, 4 Items)** | Nov 2025 | Same as C1 but with 4 feature items. |
| C4 | **SDK / Technical Updates (White BG, Red Diamonds)** | Dec 2025 | White background. Section heading. Red diamond bullet icons instead of default. 5 technical update items with title + description. |
| C5 | **Feature Update with Product Logo** | Nov 2025, Dec 2025 | Dark/black background. Top row: section heading left + product logo (Zoho Lens) right. Diamond bullet items below. |
| C6 | **Product Feature Block (Colored BG + Social Pill)** | Apr 2026 | Colored background (green #FAFFEB). Top row: product logo left + pill-shaped social media icons bar right (LinkedIn, X, YouTube, Instagram in a rounded border). Feature items below as title + paragraph (no diamond icons). |
| C7 | **Lens Product Section (Multi-Feature with Sub-sections)** | Apr 2026 | Blue-gray background (#DEEDF1). Product logo + social pill top. Multiple feature blocks. Some features have sub-headings (e.g., "Android" / "iOS") creating a nested structure. Includes inline images (screenshots). |

**Additional Variants to Create:**
- C8: **Numbered Feature List** — Numbered circles (1, 2, 3) instead of diamond icons. Clean white background.
- C9: **Icon Grid Features** — 2×2 grid of feature cards, each with an icon, title, and short description.
- C10: **Timeline Feature List** — Vertical timeline line connecting feature items, with dots at each node.
- C11: **Alternating Feature Blocks** — Alternating left-image/right-text and right-image/left-text for each feature.
- C12: **Accordion-Style Features** — Collapsible feature blocks with title visible and description expandable.

---

### SECTION TYPE D: TESTIMONIAL / CUSTOMER STORY

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| D1 | **Testimonial Card (Logo + Video + Avatar)** | Sep 2025 | Light blue background (#E5EDFC). White rounded card. Top row: company logo left + "Watch video" link with play icon right. Quote text below. Horizontal divider. Bottom: circular avatar image + author name (blue) + title. |
| D2 | **Testimonial Card (Logo + Author, No Avatar)** | Nov 2025 | Light blue background. Section heading "Our customer's story" above card. White card: company logo, quote text, divider, author name (blue) + company name. No avatar image, no video link. |
| D3 | **Testimonial (Bordered Card with Quote Icon)** | Jan 2023 | White background. Card with colored border (teal #29c7b2). Background quote icon image (absolute positioned). Quote text. Bottom row: author name + title (left) + company logo (right). |
| D4 | **Customer Spotlight (Glass Card + CTA)** | Apr 2026 | Colored background (green). Glass-morphism card (semi-transparent white, blur, box-shadow). "Customer Spotlight" heading inside card. Italic quote with "Read full story" link. Author name + title centered. CTA button ("Read all the customer stories") below. |

**Additional Variants to Create:**
- D5: **Star Rating Testimonial** — Star icons (★★★★★) above quote. Author with avatar, name, title.
- D6: **Side-by-Side Testimonials** — Two small testimonial cards in a row (two-column layout).
- D7: **Large Avatar Testimonial** — Large centered circular avatar above quote text. Name and title below.
- D8: **Testimonial with Background Image** — Author's photo as blurred background with text overlay.
- D9: **Video Testimonial Card** — Thumbnail image with play button + quote text beside it.

---

### SECTION TYPE E: ARTICLE / BLOG / CONTENT

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| E1 | **Article (Background Image Section)** | Sep 2025 | Full-width background image. Yellow accent heading (#FFDD53). White description text with max-width constraint. "Know more" underlined link inline. |
| E2 | **Intro Text Block** | Jan 2023 | White background. H3 heading + body paragraph. Simple text-only section. Padding: 0 40px. |
| E3 | **Product Block with Social Links + Bullet List** | Jan 2023 | Two-column top: product logo image left + social media icons (Twitter, LinkedIn) right. Below: unordered list with square bullets, each item being a paragraph with inline links. Repeated 4 times for different products. |

**Additional Variants to Create:**
- E4: **Blog Card (Image Top + Text Below)** — Rounded image on top, heading, short excerpt, "Read More" link below.
- E5: **Two-Column Blog Cards** — Two blog card previews side by side.
- E6: **Featured Article (Large)** — Large image left, heading + excerpt + CTA button right.
- E7: **Quote / Pullquote Block** — Large styled quote text with decorative quotation marks, no author (for article excerpts).
- E8: **Stat/Number Highlight Block** — Large number (e.g., "70%") + supporting text. Good for data callouts.

---

### SECTION TYPE F: EVENT

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| F1 | **Event Section (Dark BG)** | Sep 2025 | Black background (#0E0E0E). Event logo image (e.g., "Zoholics"). Event title/location as heading. Description paragraph. Full-width event photo image with border-radius. |

**Additional Variants to Create:**
- F2: **Event Card (Light BG)** — White/light card on colored background. Event image, title, date, location, "RSVP" button.
- F3: **Event Banner (Full-Width Image)** — Full-width event image with text overlay: event name, date, location, CTA.
- F4: **Multi-Event Grid** — Two event cards side by side for listing multiple events.
- F5: **Event Countdown** — Event name + date + "Days Left" callout + register button.

---

### SECTION TYPE G: REGISTRATION / WEBINAR / CARD CTA

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| G1 | **Register Card (Image + Text + Outlined Button)** | Sep 2025, Nov 2025 | Light blue background (#E5EDFC). Card-style image (468×239px). Description text below. Outlined button with arrow icon ("Register now"). Left-aligned layout with left margin offset. |
| G2 | **Webinar Card (Gradient BG + Date/Time Details)** | Dec 2025 | Light blue background. Card with gradient background image (blue). Large title text. Date with calendar icon. Time with clock icon (multiple timezones). Below card: description text + outlined button with arrow. |

**Additional Variants to Create:**
- G3: **Centered Registration CTA** — Centered heading, subtext, and prominent button on colored background.
- G4: **Webinar Card (Horizontal)** — Image left, title + date + time + button right.
- G5: **Registration with Form Fields** — Name + email input fields + submit button (for newsletter signup).
- G6: **Countdown Webinar Card** — Title + countdown display + register button.

---

### SECTION TYPE H: CALL-TO-ACTION (CTA)

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| H1 | **CTA (Centered, Gray BG, Red Button)** | Sep 2025, Nov 2025, Dec 2025 | Gray background (#F7F7F7). Centered heading, centered subtext, centered solid red button (#E42527) with white text and border-radius. |
| H2 | **Before You Go CTA (Two-Column)** | Apr 2026 | White background. Left column: heading, description, colored button. Right column: image (e.g., gift illustration). |

**Additional Variants to Create:**
- H3: **Full-Width Colored CTA** — Bold colored background. Large white heading. White button with colored text (inverted).
- H4: **CTA with Icon** — Icon/illustration above centered heading and button.
- H5: **Two-Button CTA** — Primary button + secondary outlined button side by side.
- H6: **Minimal CTA** — Simple text link with arrow, no button. Understated.

---

### SECTION TYPE I: FOOTER

| # | Section Name | Source | Description |
|---|-------------|--------|-------------|
| I1 | **Social Media Footer (Multi-Product)** | Nov 2025 | White background. Multiple product names (Zoho Assist, Zoho Lens) as columns. Under each: social media icon links (X, LinkedIn, YouTube). |
| I2 | **Community Bar Footer** | Jan 2023 | Gray background (#F8F8F9). Left: CTA text ("Be a part of the community"). Right: product icon images as links. |
| I3 | **Copyright Footer** | Jan 2023 | White background. Centered copyright text. Single line. Minimal. |
| I4 | **Message + Team Footer (Two-Column)** | Apr 2026 | Gray background. Left: image/illustration. Right: friendly message text ("Have a question? Hit reply.") + team name. |

**Additional Variants to Create:**
- I5: **Full Footer (Logo + Links + Social + Copyright)** — Logo top, navigation links row, social icons row, copyright bottom. All stacked and centered.
- I6: **Dark Footer** — Dark/black background. White text. Social icons + copyright + unsubscribe link.
- I7: **Footer with Address** — Company logo, physical address, phone, unsubscribe link, copyright.
- I8: **Minimal Footer** — Unsubscribe link + "View in browser" link + copyright. Nothing else.

---

### SECTION TYPE J: IMAGE COLLAGE

*(Not found as standalone sections in the uploaded newsletters but required by specification.)*

| # | Section Name | Description |
|---|-------------|-------------|
| J1 | **2-Up Horizontal (50/50)** | Two images side by side, equal width. |
| J2 | **2-Up Vertical** | Two images stacked vertically, full width each. |
| J3 | **2-Up Asymmetric (70/30)** | One large image + one small image side by side. |
| J4 | **3-Up Equal** | Three images in a row, equal width (33/33/33). |
| J5 | **3-Up Feature (1 Large + 2 Small)** | One large image on top, two smaller images below side by side. |
| J6 | **4-Up Grid (2×2)** | Four equal images in a 2×2 grid. |
| J7 | **4-Up Asymmetric (1 Large + 3 Small)** | One large image left, three small images stacked right. |
| J8 | **Mosaic / Masonry** | Mixed sizes: one tall image left, two shorter images stacked right (or similar organic grid). |
| J9 | **Full-Width Single Image** | One image spanning the full 600px width. |
| J10 | **3-Up with Captions** | Three images in a row, each with a caption below. |

---

### SECTION TYPE K: DIVIDERS / SPACERS

| # | Section Name | Description |
|---|-------------|-------------|
| K1 | **Horizontal Line Divider** | Full-width horizontal rule (1px solid, customizable color). |
| K2 | **Spacer Block** | Empty block with adjustable height (20px, 40px, 60px, 80px). |
| K3 | **Dotted Divider** | Dotted horizontal line. |
| K4 | **Gradient Divider** | Thin gradient line (fades from color to transparent on both ends). |

---

## PART 2: EVERY ELEMENT WITHIN EVERY SECTION MUST BE EDITABLE

When a user clicks/selects any section on the canvas, an **edit panel** must appear with controls for EVERY element in that section. Nothing may be non-editable. All input fields must accept **manual numeric entry** (typing a number directly) — not just increment/decrement arrows.

### 2.1 Text Editing (Per Text Element)
Every individual text element (heading, subheading, body, caption, label, link text) must have:
- **Content** — Direct inline text editing (click to type).
- **Font family** — Dropdown listing ALL fonts found across all newsletters: `Arial`, `Helvetica`, `Helvetica Neue`, `Lato`, `Roboto`, `sans-serif`. Plus any web-safe fallbacks.
- **Font size** — Numeric input field (type any number manually, e.g., "17") + increment/decrement arrows. Unit: px.
- **Font weight** — Dropdown: Thin (100), Light (300), Regular (400), Medium (500), Semibold (600), Bold (700), Extrabold (800), Black (900).
- **Font style** — Toggles: Italic, Underline, Strikethrough, Normal.
- **Font color** — Color picker with hex input + brand palette swatches.
- **Text alignment** — Left, Center, Right, Justify.
- **Line height** — Numeric input field (manual entry). Unit: px or multiplier.
- **Letter spacing** — Numeric input field (manual entry). Unit: px.
- **Text transform** — Dropdown: None, Uppercase, Lowercase, Capitalize.

### 2.2 Per-Text-Element Spacing (INDIVIDUAL GAP CONTROL)
**CRITICAL:** The gap/spacing between each text element must be controllable INDIVIDUALLY — not a global "apply to all" setting. Between some texts the user may need a small gap (e.g., 4px between heading and subheading) but a large gap elsewhere (e.g., 40px between a paragraph and next item). Provide:
- **Margin top** — Numeric input (manual entry) per text element.
- **Margin bottom** — Numeric input (manual entry) per text element.
- **Gap from previous element** — Numeric input (manual entry).

### 2.3 Link Editing (Per Link Element)
Every link (inline text links, CTA links, "Read more", "Learn more", "Watch video", etc.) must have:
- **Link URL** — Text input field to enter/change the URL.
- **Link text** — Editable text content.
- **Link color** — Color picker with hex input.
- **Link underline** — Toggle: underline on/off.
- **Link font weight** — Same dropdown as text (Regular, Semibold, Bold, etc.).
- **Open in new tab** — Toggle (target="_blank" on/off).

### 2.4 Image Editing (Per Image Element)
Every image (logos, hero images, avatars, event photos, card images, icons, screenshots, etc.) must have:
- **Replace image** — Click to upload a new image file (JPG, PNG, GIF, SVG, WebP).
- **Delete image** — Remove the image entirely from the section.
- **Width** — Numeric input field (manual entry, px).
- **Height** — Numeric input field (manual entry, px).
- **Aspect ratio lock** — Toggle to maintain proportional scaling (on by default) or unlock for free-form.
- **Image fit mode** — Dropdown: Cover, Contain, Fill, Scale-down, None.
- **Horizontal alignment** — Left, Center, Right.
- **Vertical alignment** — Top, Center, Bottom.
- **Object position** — Fine-grained control (e.g., "center top", "left center") for focal-point cropping.
- **Border radius** — Numeric input (manual entry, px). For rounded corners or circular images.
- **Alt text** — Text input field for accessibility.
- **Image spacing** — Margin top, bottom, left, right (individual numeric inputs).

### 2.5 Button Editing (Per Button Element)
Every button (CTAs, "Try Now", "Register now", "Review and Earn", etc.) must have:
- **Button text** — Editable text content.
- **Button URL** — Text input field.
- **Background color** — Color picker with hex (solid) + gradient option (see 2.7).
- **Text color** — Color picker with hex.
- **Font size** — Numeric input (manual entry).
- **Font weight** — Dropdown.
- **Padding** — Top, Right, Bottom, Left (individual numeric inputs, manual entry).
- **Border radius** — Numeric input (manual entry).
- **Border/Outline** — Toggle on/off. If on: border width (numeric), border color (color picker), border style (solid, dashed, dotted).
- **Button width** — Auto (fit content) or Full-width toggle.
- **Button alignment** — Left, Center, Right.
- **Arrow/Icon** — Option to add or remove an inline icon/arrow next to button text.

### 2.6 Section-Level Controls
Every section on the canvas must have:
- **Background color** — Color picker with hex input for solid color.
- **Background gradient** — Option to set a linear or radial gradient (two color stops minimum, angle control, manual hex entry for each stop).
- **Background image** — Upload a background image. Controls for: fit mode, position, repeat, overlay opacity.
- **Section padding** — Top, Right, Bottom, Left (individual numeric inputs, manual entry).
- **Section margin / gap from adjacent sections** — Top and bottom gap (numeric input, manual entry).
- **Section stroke/border** — Toggle on/off. If on: border width (numeric), border color (color picker), border style (solid, dashed, dotted), border radius (numeric), apply to all sides or individual sides.
- **Section border radius** — Numeric input for rounded section corners.
- **Section width** — Fixed at 600px (locked, not editable).
- **Section height** — Auto (based on content). No manual height override.

### 2.7 Gradient Color Control (EVERYWHERE colors appear)
Anywhere a color can be set (background, text, button, border), provide:
- **Solid color** — Color picker + hex input.
- **Gradient** — Toggle to switch from solid to gradient. Controls:
  - Type: Linear or Radial.
  - Angle (for linear): Numeric input (0–360°).
  - Color stops: Minimum 2, add more as needed. Each stop: color picker + hex + position (0%–100%).
  - Preview of the gradient in the panel.

### 2.8 Stroke/Border Control (SECTIONS AND IMAGES)
For both sections and individual images:
- **Stroke toggle** — On/Off.
- **Stroke width** — Numeric input (manual entry, px).
- **Stroke color** — Color picker + hex input (solid or gradient).
- **Stroke style** — Solid, Dashed, Dotted.
- **Stroke sides** — All, Top only, Bottom only, Left only, Right only, or any combination.

### 2.9 Element Actions
For every element within a section (text blocks, images, buttons, icons, dividers, links):
- **Delete** — Remove the element from the section.
- **Duplicate** — Clone the element within the section.
- **Reorder** — Drag to move up/down within the section.
- **Hide/Show** — Toggle visibility without deleting.

---

## PART 3: IMAGE COLLAGE FUNCTIONALITY

### 3.1 Collage Section
- A dedicated "Image Collage" block type available in the section library with all layouts from Section Type J (J1–J10).
- When adding a collage section, the user picks from a visual layout picker showing all 10+ layout options.

### 3.2 Collage Image Editing
- Each slot in the collage is independently clickable.
- Replace, delete, resize, align, and set fit mode per individual image (using all controls from 2.4).
- **Gap between collage images** — Numeric input (manual entry, px) for horizontal and vertical gaps independently.

### 3.3 Collage Layout Switching
- The user can switch the collage layout at any time.
- Images carry over to the new layout arrangement (first image → first slot, second → second, etc.).
- If the new layout has fewer slots, extra images are queued. If more slots, empty slots show placeholder.

---

## PART 4: GLOBAL THEME SYSTEM

### 4.1 Theme Controls
A **Global Theme** panel that, when changed, updates the ENTIRE newsletter at once:
- **Primary color** — Applied to: hero backgrounds, buttons, link colors, accent elements.
- **Secondary color** — Applied to: secondary buttons, secondary backgrounds, borders.
- **Background color** — Applied to: section backgrounds (with smart tinting — darker sections get dark variant, lighter sections get light variant).
- **Text color (primary)** — Applied to: headings, body text on light backgrounds.
- **Text color (secondary)** — Applied to: subtext, captions, dates.
- **Text color (on dark)** — Applied to: all text on dark backgrounds (auto-switches).
- **Accent color** — Applied to: links, highlights, decorative elements.
- **Button color** — Applied to: primary CTA button backgrounds.
- **Button text color** — Applied to: text inside buttons.
- **Divider color** — Applied to: horizontal rules, separators.
- **Stroke/Border color** — Applied to: section borders, card borders.

### 4.2 WCAG AA Compliance (MANDATORY)
When the theme changes:
- **Automatically check** contrast ratio between every text element and its background.
- If contrast ratio falls below WCAG AA standards (4.5:1 for normal text, 3:1 for large text):
  - Auto-adjust text color to meet compliance (darken or lighten as needed).
  - Show a warning indicator on any element that doesn't meet contrast.
- **Text must always remain visible and readable against its background.** This is non-negotiable.

### 4.3 Theme Presets
- Provide 5+ pre-built theme presets (e.g., "Zoho Blue", "Dark Mode", "Earthy Green", "Warm Red", "Corporate Gray").
- Save custom themes as named presets for reuse.
- Switch between themes with a single click — entire newsletter updates instantly.

---

## PART 5: CANVAS & SECTION MANAGEMENT

### 5.1 Fixed-Width Canvas
- Canvas width: **600px** (locked, standard email width).
- Canvas centered on screen with a visible boundary.

### 5.2 Auto-Height, Auto-Layout
- Sections stack vertically in the order placed.
- Each section auto-sizes height based on content.
- No manual vertical positioning — pure auto-layout flow.

### 5.3 Section Actions
- **Drag to reorder** — Drag any section up or down on the canvas.
- **Duplicate section** — Clone any section (with all its content and settings).
- **Delete section** — Remove any section from the canvas.
- **Add section** — Drag from the library panel or click "Add Section" button to browse.

### 5.4 Undo / Redo
- Full undo/redo history for ALL actions: add, delete, reorder, edit text, change colors, replace images, change spacing, theme changes — everything.
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo).

---

## PART 6: SECTION LIBRARY PANEL

### 6.1 Organization
- Left-side panel showing all sections as visual thumbnails.
- Grouped by section type (Headers, Heroes, Features, Testimonials, Articles, Events, Registration, CTAs, Footers, Collages, Dividers).
- Search bar to find sections by name or keyword.
- Filter by category/tag.

### 6.2 Extracted vs. Custom
- **Extracted sections** (from newsletters) are labeled with their source (e.g., "Sep 2025").
- **Custom variants** (newly created) are labeled as "Custom" or "Variant."
- User-saved custom sections are labeled as "My Sections."

### 6.3 Save Custom Sections
- After editing a section on the canvas, the user can save it back to the library as a custom reusable section.

---

## PART 7: PREVIEW & EXPORT

### 7.1 Preview Mode
- Toggle between **Desktop** (600px centered), **Tablet** (~480px), and **Mobile** (~320px) preview.
- Preview renders the actual responsive behavior of the output HTML.

### 7.2 Responsive HTML Output
The exported HTML must be fully responsive:
- **Desktop (>600px):** Render at 600px, centered with `margin: 0 auto`.
- **Tablet (480–600px):** Scale fluidly, maintain layout.
- **Mobile (<480px):** Single-column stacking. Multi-column layouts (2-up collages, side-by-side text+image) collapse to single column. Images: `max-width: 100%; height: auto;`. Minimum body text: 14px. Buttons: minimum 44px tap target height.
- Use `@media` queries inside a `<style>` block as progressive enhancement.

### 7.3 Email Client Compatibility
The output HTML must use:
- **Table-based layout** (no CSS flexbox or grid — breaks in Outlook desktop).
- **Inline CSS** on every element for critical styles.
- **MSO conditional comments** `<!--[if mso]>` for Outlook-specific fixes.
- **Web-safe fallback fonts** in font stack (e.g., `'Lato', Arial, Helvetica, sans-serif`).
- **Explicit width and height attributes** on `<img>` tags.
- **`align` and `valign` attributes** on table cells.
- **Border-based buttons** for Outlook click-target compatibility.
- **No CSS shorthand** (use `padding-top`, `padding-right`, etc. separately).
- **`max-width: 100%`** on images for fluid mobile scaling.
- **`<style>` block** only for progressive enhancement (responsive `@media` queries), not for critical styling.

### 7.4 Export Options
- **Copy HTML** — Copy email-ready HTML to clipboard.
- **Download HTML** — Download as `.html` file.
- **Preview in browser** — Open the output in a new tab to see how it renders.

### 7.5 Code Quality
- Clean, well-structured, commented HTML.
- Option to minify for production.
- All images referenced with placeholder paths (user replaces with hosted URLs before sending).

---

## PART 8: FONTS REFERENCE

All fonts used across all uploaded newsletters (must appear in the font family dropdown):

| Font Name | Used In |
|-----------|---------|
| Arial | Sep 2025, Nov 2025, Dec 2025, Apr 2026 |
| Helvetica | Sep 2025, Nov 2025, Dec 2025 |
| Helvetica Neue | Sep 2025, Dec 2025 |
| Lato | Jan 2023 |
| Roboto | Jan 2023 |
| sans-serif (generic) | All newsletters |

---

## PART 9: COMPLETE FEATURES CHECKLIST

Every feature below must be fully functional. No feature may be skipped, stubbed, or placeholder.

| # | Feature | Status |
|---|---------|--------|
| 1 | All sections from all 5 newsletters extracted (A1–A4, B1–B4, C1–C7, D1–D4, E1–E3, F1, G1–G2, H1–H2, I1–I4, J1–J10, K1–K4) | REQUIRED |
| 2 | 4+ additional unique variants per section type (A5–A8, B5–B9, C8–C12, D5–D9, E4–E8, F2–F5, G3–G6, H3–H6, I5–I8) | REQUIRED |
| 3 | Drag-and-drop sections from library to canvas | REQUIRED |
| 4 | Drag to reorder sections on canvas | REQUIRED |
| 5 | Duplicate & delete sections | REQUIRED |
| 6 | Undo / Redo (all actions, Ctrl+Z / Ctrl+Shift+Z) | REQUIRED |
| 7 | Fixed 600px canvas width, auto-height | REQUIRED |
| 8 | Auto-layout vertical stacking | REQUIRED |
| 9 | Inline text editing (click to type) | REQUIRED |
| 10 | Font family dropdown (Arial, Helvetica, Helvetica Neue, Lato, Roboto, sans-serif) | REQUIRED |
| 11 | Font size — numeric input (manual entry) | REQUIRED |
| 12 | Font weight dropdown (Thin to Black, 100–900) | REQUIRED |
| 13 | Font style toggles (Italic, Underline, Strikethrough) | REQUIRED |
| 14 | Font color — color picker + hex input + brand swatches | REQUIRED |
| 15 | Text alignment (Left, Center, Right, Justify) | REQUIRED |
| 16 | Line height — numeric input (manual entry) | REQUIRED |
| 17 | Letter spacing — numeric input (manual entry) | REQUIRED |
| 18 | Text transform (None, Uppercase, Lowercase, Capitalize) | REQUIRED |
| 19 | Individual gap/spacing between each text element (manual entry) | REQUIRED |
| 20 | Link URL editing | REQUIRED |
| 21 | Link text editing | REQUIRED |
| 22 | Link color picker | REQUIRED |
| 23 | Link underline toggle | REQUIRED |
| 24 | Link font weight | REQUIRED |
| 25 | Open in new tab toggle | REQUIRED |
| 26 | Image replace (upload new file) | REQUIRED |
| 27 | Image delete | REQUIRED |
| 28 | Image width & height (numeric input, manual entry) | REQUIRED |
| 29 | Aspect ratio lock/unlock | REQUIRED |
| 30 | Image fit mode (Cover, Contain, Fill, Scale-down, None) | REQUIRED |
| 31 | Image horizontal alignment (Left, Center, Right) | REQUIRED |
| 32 | Image vertical alignment (Top, Center, Bottom) | REQUIRED |
| 33 | Image object position (fine-grained) | REQUIRED |
| 34 | Image border radius | REQUIRED |
| 35 | Image alt text | REQUIRED |
| 36 | Image spacing (individual margins) | REQUIRED |
| 37 | Spacing between images in collages (manual entry) | REQUIRED |
| 38 | Button text, URL, bg color, text color, font size, weight | REQUIRED |
| 39 | Button padding (individual sides, manual entry) | REQUIRED |
| 40 | Button border radius | REQUIRED |
| 41 | Button border/outline (width, color, style) | REQUIRED |
| 42 | Button width (auto / full-width) | REQUIRED |
| 43 | Button alignment | REQUIRED |
| 44 | Button arrow/icon toggle | REQUIRED |
| 45 | Section background color (solid) | REQUIRED |
| 46 | Section background gradient (linear/radial, angle, color stops) | REQUIRED |
| 47 | Section background image (upload, fit, position, repeat, overlay) | REQUIRED |
| 48 | Section padding (all 4 sides, manual entry) | REQUIRED |
| 49 | Section margin/gap from adjacent sections (manual entry) | REQUIRED |
| 50 | Section stroke/border (toggle, width, color, style, radius, per-side) | REQUIRED |
| 51 | Image stroke/border (toggle, width, color, style) | REQUIRED |
| 52 | Gradient color option everywhere colors appear (text, bg, button, border) | REQUIRED |
| 53 | Delete any element within a section | REQUIRED |
| 54 | Duplicate any element within a section | REQUIRED |
| 55 | Reorder elements within a section | REQUIRED |
| 56 | Hide/show elements within a section | REQUIRED |
| 57 | Image collage section type (10 layout presets) | REQUIRED |
| 58 | Collage layout switching (images carry over) | REQUIRED |
| 59 | Per-image controls within collage | REQUIRED |
| 60 | Collage gap control (horizontal + vertical, manual entry) | REQUIRED |
| 61 | Global theme panel (primary, secondary, bg, text, accent, button, divider colors) | REQUIRED |
| 62 | WCAG AA auto-compliance on theme change | REQUIRED |
| 63 | 5+ pre-built theme presets | REQUIRED |
| 64 | Save custom theme presets | REQUIRED |
| 65 | One-click theme switch updates entire newsletter | REQUIRED |
| 66 | Section library panel with categories, search, filter | REQUIRED |
| 67 | Save custom sections to library | REQUIRED |
| 68 | Save entire newsletter as template | REQUIRED |
| 69 | Desktop / Tablet / Mobile preview toggle | REQUIRED |
| 70 | Table-based, inline-CSS email-safe HTML output | REQUIRED |
| 71 | MSO conditional comments for Outlook | REQUIRED |
| 72 | Responsive @media queries for mobile | REQUIRED |
| 73 | Cross-client compatibility (Gmail, Outlook, Apple Mail, Yahoo, Samsung, Thunderbird) | REQUIRED |
| 74 | Copy HTML to clipboard | REQUIRED |
| 75 | Download HTML file | REQUIRED |
| 76 | Clean, commented, optionally minified output | REQUIRED |
| 77 | All numeric inputs accept manual typed values (not just arrows) | REQUIRED |
| 78 | Brand color palette auto-extracted from newsletters | REQUIRED |

---

*This prompt is the single, complete, definitive source of truth for the Newsletter Automation Builder. All 78 features are required. No section may be omitted. No edit control may be stubbed or non-functional.*