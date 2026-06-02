FIX 1: Theme/preset colors are mismatched and not WCAG compliant
When a theme is applied, ALL sections must update cohesively. Every theme must be visually harmonious — no clashing or random colors. After applying any theme, auto-check every text/background pair for WCAG AA contrast (4.5:1 normal text, 3:1 large text). Auto-adjust text color if contrast fails. Test all 5+ presets — each must look polished as a complete newsletter, not random colors thrown at individual sections.
FIX 2: Cannot select/edit individual elements — icons, sub-components
Every single element inside every section must be independently selectable and editable: text blocks, bulletins, images, icons, buttons, dividers, boxes, rectangles, badges, avatars, logos, social icons, bullet icons, arrow icons. Each element must be a separate selectable node. When selected, the Element panel must show all relevant controls (color, size, spacing, opacity, replace, delete). If an element is an icon or small image, it must still be replaceable, deletable, and resizable independently.
FIX 3: Section background color applying to outer padding area, not the section content area
BUG: When changing section bg color, it changes the outer padding/wrapper area  but NOT the white inner card/content area. Fix: Provide TWO separate bg color controls in Section tab:
* Outer Background — the full-width section wrapper color
* Inner Background — the content card/container color Both must have solid color picker + gradient editor. Both must update canvas instantly.
FIX 4: Responsive preview not working properly
When Desktop/Tablet/Mobile buttons are clicked:
* Desktop: canvas = 600px wide
* Tablet: canvas = 480px wide, content reflows
* Mobile: canvas = 320px wide, multi-column layouts stack to single column, images scale to 100% width Remove any visible border/stroke/outline around the preview in tablet and mobile views — just show the content cleanly. All sections must be fully responsive at every breakpoint — no text overflow, no horizontal scroll, no content clipping and truncation.
FIX 5: Individual gap control between specific components
I need DIFFERENT gaps between different component pairs within a section. Example: 10px gap between component 1 and 2, but 30px gap between component 2 and 3. Each element must have its own Margin-Top and Margin-Bottom numeric input (manual entry). These per-element margins define the gap to the element above/below it independently. Do not use a single "gap" value that applies uniformly.
FIX 6: Button editing controls incomplete
Buttons are missing several edit controls. Every button must have:
* Button text (editable)
* Button URL
* Button bg color (solid + gradient) — MUST work and reflect on canvas
* Button text color
* Button stroke/border (toggle, width, color solid+gradient, style, radius) — CURRENTLY MISSING
* Button height (numeric input, manual entry)
* Button icon (replace, delete, change icon image)
* Button padding (top, right, bottom, left)
* Button alignment Gradient changes on buttons must reflect on canvas immediately — currently they do not.
FIX 7: Duplicated components — gap control (horizontal + vertical)
When a component is duplicated, it may appear below OR next to the original. Provide:
* Vertical gap (numeric input) — space above/below between stacked duplicates
* Horizontal gap (numeric input) — space left/right between side-by-side duplicates Both must accept manual typed values and reflect on canvas.
FIX 8: Boxes, rectangles, sub-containers missing color/stroke controls
Colored boxes within sections (e.g., countdown timer boxes for days/hrs/mins, card containers, badge backgrounds) must each be individually selectable with:
* Background color (solid + gradient)
* Stroke/border (width, color solid+gradient, style, radius)
* Padding, margin Currently these inner boxes/containers are not editable. Fix by making them selectable elements.
FIX 9: Gradient not applying/reflecting on canvas
Gradient changes (on buttons, boxes, containers, borders) are not updating the canvas. Fix the two-way binding for gradient values. When gradient stops, angle, or type change in the editor, the canvas must re-render the element with the new gradient CSS immediately. Test: change a button from solid blue to a blue-to-purple gradient — the button on canvas must show the gradient live.
FIX 10: Drag handle for reordering missing on canvas
 no drag handle icon on sections. Add a visible drag handle (⠿ grip icon) on the left edge of each section, visible on hover. Drag to reorder with a blue drop-indicator line between sections. Keep the arrow buttons in the toolbar as an alternative.

RULES
* Every input: manual typed values, instant canvas update
* Every element (text, image, icon, button, box, divider, badge): independently selectable and fully editable
* Stroke/border controls on EVERYTHING — sections, images, buttons, boxes, icons
* Gradients must render on canvas in real-time
* Panel tab and scroll must never reset after interactions
* Mobile/tablet preview: no border artifacts, full responsive reflow, no content clipping
