# Design System Specification: The Precision Canvas

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Precision Canvas."** 

This system moves beyond the generic "SaaS dashboard" look to create an environment that feels like a high-end professional instrument. It mimics the utility of a world-class creative tool (inspired by Figma) but elevates it with editorial sophistication. We achieve this through "High-Density Elegance"—where a large amount of information is presented with such intentionality, whitespace, and tonal depth that it never feels cluttered. 

Unlike standard systems that rely on heavy boxes and borders, this system uses **intentional asymmetry** and **tonal layering** to guide the eye. We are not just building an interface; we are building a workspace where the UI recedes to let the user's content breathe.

---

## 2. Colors & Surface Logic
The palette is rooted in a pristine, "tool-like" foundation, utilizing a sophisticated range of grays to define function without visual noise.

### The Palette
- **Primary (`#00629e`):** A deep, authoritative blue for core actions and focus states.
- **Secondary (`#7a2ad6`):** A vibrant purple used sparingly for creative highlights and secondary logic paths.
- **Surface Strategy:** We utilize the `surface-container` tokens to build a hierarchy of focus.
    - `surface-container-lowest` (#ffffff): The active workspace or primary card.
    - `surface-container-low` (#f3f3f3): Sidebars and navigation.
    - `surface` (#f9f9f9): The base background of the application.

### The "No-Line" Rule
To achieve a premium feel, **1px solid borders are prohibited for sectioning.** Structural boundaries must be defined solely through:
1.  **Background Shifts:** Placing a `surface-container-lowest` card on a `surface-container-low` background.
2.  **Tonal Transitions:** Using subtle shifts in the gray scale to denote where a sidebar ends and a canvas begins.

### The "Glass & Gradient" Rule
Floating elements (modals, popovers, context menus) should use **Glassmorphism**. Apply `surface-container-lowest` with an 80-90% opacity and a `20px` backdrop blur. For primary CTAs, use a subtle linear gradient from `primary` to `primary_container` to add "soul" and depth to an otherwise flat interface.

---

## 3. Typography: High-Density Inter
We use **Inter** exclusively. It is chosen for its mathematical precision and exceptional legibility at small sizes.

- **Display & Headlines:** Use `display-md` or `headline-lg` for editorial moments. These should feature tight letter-spacing (-0.02em) and high contrast against the background to feel like a premium magazine.
- **The "Pro-Tool" Scale:** For functional UI (sidebars, property panels), lean heavily on `body-sm` (0.75rem) and `label-md` (0.75rem). This high-density approach allows for more control without overwhelming the user, provided the whitespace between groups is generous.
- **Visual Weight:** Use `Medium` (500) for labels and `SemiBold` (600) for titles to ensure hierarchy is clear even when the color remains `on_surface_variant`.

---

## 4. Elevation & Depth
In this system, depth is a product of light and layering, not artificial structure.

### The Layering Principle
Think of the UI as stacked sheets of fine paper. 
- **The Base:** `surface` (#f9f9f9).
- **The Sub-Level:** `surface-container-low` (#f3f3f3) for recessed areas like search bars or inactive panels.
- **The Highlight:** `surface-container-lowest` (#ffffff) for the highest level of interaction (e.g., the active document or selected card).

### Ambient Shadows
Shadows must be "Ambient." For floating elements, use a multi-layered shadow:
- **Color:** Use a tinted `on_surface` (10% opacity).
- **Blur:** Large and diffused (e.g., `32px` to `64px`).
- **Purpose:** To signify a "lift" off the canvas, never to "outline" a shape.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use a **Ghost Border**. Apply the `outline_variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
- **Primary:** `primary` background with `on_primary` text. No border. `0.25rem` radius.
- **Secondary:** `surface-container-high` background. This creates a "soft" button that feels integrated into the UI.
- **Tertiary/Ghost:** No background. Use `primary` text for actions or `on_surface_variant` for utility.

### Input Fields
Inputs should feel like a "slot" in the interface. Use `surface-container-low` with a 1px "Ghost Border" of `outline_variant`. On focus, transition the border to `primary` and add a subtle `primary_fixed` outer glow (4px spread, 20% opacity).

### Cards & Lists
**Forbid divider lines.** Separate list items using vertical spacing or a subtle hover state shift to `surface-container-high`. Cards should not have shadows unless they are "Draggable." Instead, use a background color shift to `surface-container-lowest` to define the card area.

### Precision Chips
Used for tags or filters. Use `secondary_fixed` for a light purple background and `on_secondary_fixed_variant` for the text. This provides a clear visual distinction from the primary blue actions.

---

## 6. Do's and Don'ts

### Do:
- **Embrace Asymmetry:** Align text-heavy content to the left while keeping utility icons to the right to create a professional, "un-templated" look.
- **Prioritize Whitespace:** If a layout feels "off," add 8px of padding before you consider adding a border.
- **Use Tonal Nesting:** Place a `surface-container-highest` element inside a `surface-container-low` area to create immediate, line-free focus.

### Don't:
- **Don't use 100% Opaque Borders:** Never use a solid `#E5E5E5` border to separate sections. It breaks the "Precision Canvas" immersion.
- **Don't use Pure Black:** Always use `on_surface` (#1a1c1c) for text to maintain a sophisticated, soft-contrast look.
- **Don't Over-Round:** Keep corner radii at `md` (0.375rem) or `DEFAULT` (0.25rem). Avoid "bubbly" UI; stay sharp and professional.