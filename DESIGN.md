# Atlas Design System

Atlas is a local-first AI agent orchestration platform. Its visual design is minimal, clean, and focused on developer productivity — a dark-friendly interface with a purple/violet accent color, dense information hierarchy, and zero decorative chrome.

---

## Visual Theme

**Style:** Minimal, utility-first, developer-oriented
**Tone:** Professional, focused, low-distraction
**Modes:** Light and dark (class-based, user-selectable; also respects system preference)
**Font size:** User-selectable (Small / Medium / Large), applied at the `<html>` level

---

## Color Palette

Colors use the **OKLch color space** for perceptual uniformity. All values are CSS custom properties.

### Brand / Primary

| Role | Light | Dark |
|------|-------|------|
| Primary | `oklch(0.55 0.19 265)` | `oklch(0.65 0.2 265)` |
| Primary foreground | `oklch(0.99 0 0)` | `oklch(0.16 0.014 260)` |
| Focus ring | `oklch(0.55 0.19 265)` | `oklch(0.65 0.2 265)` |

The brand hue is **blue-violet (265°)**. All neutral tones are also tinted toward 260° to maintain chromatic coherence.

### Backgrounds & Surfaces

| Token | Light | Dark |
|-------|-------|------|
| Background | `oklch(0.99 0.002 260)` | `oklch(0.16 0.014 260)` |
| Card | `oklch(1 0 0)` | `oklch(0.19 0.016 260)` |
| Popover | `oklch(1 0 0)` | `oklch(0.19 0.016 260)` |
| Sidebar background | `oklch(0.98 0.005 260)` | `oklch(0.14 0.016 260)` |

### Text

| Token | Light | Dark |
|-------|-------|------|
| Foreground | `oklch(0.145 0.015 260)` | `oklch(0.93 0.008 260)` |
| Muted foreground | `oklch(0.52 0.02 260)` | `oklch(0.65 0.02 260)` |
| Sidebar foreground | `oklch(0.42 0.02 260)` | `oklch(0.62 0.02 260)` |

### UI Elements

| Token | Light | Dark |
|-------|-------|------|
| Border | `oklch(0.91 0.008 260)` | `oklch(0.28 0.02 260)` |
| Input | `oklch(0.91 0.008 260)` | `oklch(0.28 0.02 260)` |
| Secondary | `oklch(0.96 0.008 260)` | `oklch(0.24 0.02 260)` |
| Muted | `oklch(0.96 0.006 260)` | `oklch(0.24 0.018 260)` |
| Accent | `oklch(0.95 0.015 260)` | `oklch(0.26 0.025 260)` |
| Destructive | `oklch(0.577 0.245 27.325)` | `oklch(0.55 0.2 27)` |

### Active / Interactive States

| Use | Value |
|-----|-------|
| Active nav item background | `bg-primary/10` (10% primary opacity) |
| Drag overlay ring | `ring-primary/30` (30% primary opacity) |
| Dialog overlay | `bg-black/80` |

---

## Typography

**Font family:** System font stack (OS default — no custom font loaded)

### Size Scale

| Class | Size | Use |
|-------|------|-----|
| `text-[8px]` | 8px | Agent initials avatar |
| `text-[10px]` | 10px | Tag badges |
| `text-xs` | 12px | Badges, labels, metadata |
| `text-[13px]` | 13px | Navigation items, secondary body |
| `text-sm` | 14px | Primary body text, captions |
| `text-base` | 16px | Inputs, default body |
| `text-lg` | 18px | Subheadings |
| `text-2xl` | 24px | Page headings |
| `text-3xl` | 32px | Large headings |

### Font Weight

| Class | Weight | Use |
|-------|--------|-----|
| `font-medium` | 500 | Nav items, buttons |
| `font-semibold` | 600 | Card titles, section headers |

### User Font Size Modes

Applied via class on `<html>`:
- `font-size-sm` → base 13px
- `font-size-md` → base 15px (default)
- `font-size-lg` → base 17px

---

## Spacing & Sizing

### Border Radius Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 4px | Tags, small badges |
| `--radius-md` | 6px | Buttons, inputs |
| `--radius-lg` | 8px | Cards |
| `--radius-xl` | 12px | Dialogs, large cards |

### Common Gap Values (Tailwind)

| Class | Value | Use |
|-------|-------|-----|
| `gap-0.5` | 2px | Tight sidebar nav item gaps |
| `gap-1` | 4px | Small internal spacing |
| `gap-1.5` | 6px | Card content row gaps |
| `gap-2` | 8px | Standard component gaps |
| `gap-3` | 12px | Icon-to-text gap in nav items |
| `gap-4` | 16px | Section-level gaps |

### Fixed Dimensions

| Element | Value |
|---------|-------|
| Sidebar (expanded) | 220px |
| Sidebar (collapsed) | 56px |
| Header height | 56px (`h-14`) |
| Nav item height | 36px (`h-9`) |
| Icon button | 32×32px (`h-8 w-8`) |
| Standard icon | 18×18px |
| Small icon | 16×16px (`h-4 w-4`) |

---

## Components

### Button

**Variants:**

| Variant | Style |
|---------|-------|
| `default` | Filled primary (purple background, white text) |
| `destructive` | Red/orange background, white text |
| `outline` | Transparent with border; hover fills lightly |
| `secondary` | Light gray background |
| `ghost` | Transparent, hover only |
| `link` | Primary color text, underline on hover |

**Sizes:**

| Size | Height | Padding |
|------|--------|---------|
| `default` | 36px | `px-4 py-2` |
| `sm` | 32px | `px-3`, `text-xs` |
| `lg` | 40px | `px-8` |
| `icon` | 36×36px | Square, no text |

**Focus:** `focus-visible:ring-2 ring-ring ring-offset-2`
**Disabled:** `opacity-50 pointer-events-none`

---

### Card

```
<Card>
  <CardHeader>
    <CardTitle />
    <CardDescription />
  </CardHeader>
  <CardContent />
  <CardFooter />
</Card>
```

**Base style:** `rounded-lg border border-border bg-card text-card-foreground shadow-sm`
**Header padding:** `p-6`
**Content padding:** `p-6 pt-0`
**Footer:** `flex items-center p-6 pt-0`

---

### Badge

| Variant | Style |
|---------|-------|
| `default` | Filled primary (purple) |
| `secondary` | Light gray background |
| `destructive` | Red background |
| `outline` | Border only, transparent |

**Base size:** `px-2.5 py-0.5 text-xs rounded-full`

---

### Input

**Base style:** `h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base`
**Focus:** `ring-2 ring-ring` (purple ring)
**Disabled:** `opacity-50 cursor-not-allowed`
**Placeholder:** `text-muted-foreground`

---

### Dialog / Modal

**Overlay:** `fixed inset-0 z-50 bg-black/80`
**Panel:** `z-50 max-w-lg w-full rounded-lg shadow-lg p-6`
**Close button:** Positioned `absolute right-4 top-4`
**Animation:** Fade + zoom-in on open; fade + zoom-out on close

---

### Sidebar / App Shell

```
Layout: flex h-screen overflow-hidden
  ├── aside (sidebar, sticky)
  │   ├── Header: h-14, border-b, logo + collapse toggle
  │   ├── Nav: flex flex-col gap-0.5
  │   │   └── NavLink items
  │   └── Agent status panel (bottom)
  └── Main area
      ├── ProjectTabBar
      └── main.p-6
```

**Nav item — active:** `bg-primary/10 text-primary`
**Nav item — hover:** `bg-accent text-accent-foreground`
**Nav item font:** `text-[13px] font-medium`
**Sidebar transition:** `transition-[width] duration-200`

---

### Kanban Card

```
<Card draggable>
  <CardHeader>
    <title (line-clamp-2)>
    <actions menu>
  </CardHeader>
  <CardContent>
    <priority badge> <estimate badge>
    <tags (if any)>
    <definition of done (if any)>
    <meta: agent | project | time>
  </CardContent>
</Card>
```

**Default:** `cursor-grab shadow-sm`
**Hover:** `hover:shadow-md`
**Dragging:** `opacity-30`
**Drag overlay:** `cursor-grabbing shadow-lg ring-2 ring-primary/30`

---

## Shadows & Elevation

| Class | Use |
|-------|-----|
| `shadow-sm` | Card default state |
| `shadow-md` | Card hover state |
| `shadow-lg` | Dialogs, drag overlays |
| `ring-2 ring-ring` | Focus state (inputs, buttons) |

---

## Animations & Transitions

### Keyframes

```css
@keyframes bounce-dot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30% { transform: translateY(-5px); opacity: 1; }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Token:** `--animate-fade-in-up: fade-in-up 0.2s ease-out both`

### Transition Utilities

| Class | Use |
|-------|-----|
| `transition-colors` | Hover state color changes |
| `transition-[width] duration-200` | Sidebar expand/collapse |
| `transition-opacity` | Fade effects |
| `transition-shadow` | Card hover elevation |

**Theme switching:** All transitions are disabled during theme change via `.theme-switching * { transition: none; }` to prevent flash.

---

## Loading & Empty States

**Spinner:** `h-6 w-6 animate-spin text-muted-foreground`
**Loading container:** `flex h-64 items-center justify-center`
**Empty state text:** `text-sm text-muted-foreground`

---

## Accessibility

- Focus visible rings on all interactive elements (`focus-visible:ring-2`)
- Disabled states: `opacity-50 pointer-events-none`
- Draggable cursors: `cursor-grab` / `cursor-grabbing`
- SVG icons: `aria-hidden="true"`
- Dialog close buttons: `aria-label` provided
- All Radix UI primitives used for dialogs, dropdowns, tooltips (built-in keyboard and screen reader support)

---

## Logo

The Atlas logo is an SVG globe — a circle with equator and meridian arcs. It uses `currentColor` so it adapts automatically to light and dark modes. Rendered at multiple sizes via the `AtlasLogo` component.

---

## Theming Notes for AI Agents

- Use `bg-background` / `text-foreground` for page-level surfaces — never hardcode colors
- Use `bg-card` for elevated surfaces (cards, panels)
- Use `text-muted-foreground` for secondary/helper text
- Use `border-border` for all dividers and outlines
- The primary action color is purple-violet (`--color-primary`); use it sparingly for CTAs and active states
- Dark mode is class-based (`.dark` on `<html>`), not `prefers-color-scheme` media query
- All spacing uses Tailwind's default 4px-base scale
- All radius values come from `--radius-*` tokens; prefer `rounded-lg` for cards, `rounded-md` for inputs/buttons
