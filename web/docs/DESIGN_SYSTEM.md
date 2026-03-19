# Design System — Order System

**Version:** 1.0
**Framework:** Tailwind CSS v4 + React 19
**Date:** 2026-03-17

---

## Table of Contents

1. [CSS Custom Properties](#css-custom-properties)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Animations](#animations)
8. [Breakpoints](#breakpoints)
9. [Layout Patterns](#layout-patterns)
10. [Component Specs](#component-specs)

---

## CSS Custom Properties

Add to `src/index.css` after `@import "tailwindcss";`:

```css
@theme {
  /* ── Brand Colors ── */
  --color-brand-50: #EFF6FF;
  --color-brand-100: #DBEAFE;
  --color-brand-200: #BFDBFE;
  --color-brand-500: #3B82F6;
  --color-brand-600: #2563EB;
  --color-brand-700: #1D4ED8;
  --color-brand-800: #1E40AF;

  /* ── Neutral ── */
  --color-neutral-50: #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-200: #E5E7EB;
  --color-neutral-300: #D1D5DB;
  --color-neutral-400: #9CA3AF;
  --color-neutral-500: #6B7280;
  --color-neutral-600: #4B5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1F2937;
  --color-neutral-900: #111827;

  /* ── Semantic: Success ── */
  --color-success-50: #F0FDF4;
  --color-success-100: #DCFCE7;
  --color-success-200: #BBF7D0;
  --color-success-500: #22C55E;
  --color-success-600: #16A34A;
  --color-success-800: #166534;

  /* ── Semantic: Error ── */
  --color-error-50: #FEF2F2;
  --color-error-100: #FEE2E2;
  --color-error-200: #FECACA;
  --color-error-500: #EF4444;
  --color-error-600: #DC2626;
  --color-error-700: #B91C1C;
  --color-error-800: #991B1B;

  /* ── Semantic: Warning ── */
  --color-warning-100: #FEF3C7;
  --color-warning-200: #FDE68A;
  --color-warning-800: #92400E;

  /* ── Semantic: Info (alias of brand) ── */
  --color-info-50: #EFF6FF;
  --color-info-100: #DBEAFE;
  --color-info-200: #BFDBFE;
  --color-info-800: #1E40AF;

  /* ── Semantic: Purple (dispatched status) ── */
  --color-purple-100: #F3E8FF;
  --color-purple-200: #E9D5FF;
  --color-purple-600: #9333EA;
  --color-purple-700: #7C3AED;
  --color-purple-800: #6B21A8;

  /* ── Spacing (8px system) ── */
  --spacing-0: 0px;
  --spacing-0-5: 2px;
  --spacing-1: 4px;
  --spacing-1-5: 6px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;

  /* ── Border Radius ── */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  /* ── Typography ── */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* ── Transitions ── */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

---

## Color Palette

### Brand (Blue)
| Token | Hex | Usage |
|---|---|---|
| `brand-50` | `#EFF6FF` | Active nav bg, info bg |
| `brand-100` | `#DBEAFE` | Confirmed badge bg |
| `brand-200` | `#BFDBFE` | Confirmed badge border, info border |
| `brand-500` | `#3B82F6` | Focus ring |
| `brand-600` | `#2563EB` | Primary button bg, links, active chips, cart badge |
| `brand-700` | `#1D4ED8` | Primary button hover, link hover |
| `brand-800` | `#1E40AF` | Confirmed badge text, info text |

### Neutral (Gray)
| Token | Hex | Usage |
|---|---|---|
| `neutral-50` | `#F9FAFB` | Page background, table header bg, hover bg |
| `neutral-100` | `#F3F4F6` | Category pill bg, ghost hover, cart item bg |
| `neutral-200` | `#E5E7EB` | Card borders, secondary button bg, table borders |
| `neutral-300` | `#D1D5DB` | Input borders, quantity button borders |
| `neutral-400` | `#9CA3AF` | Placeholder text, muted icons |
| `neutral-500` | `#6B7280` | Secondary text, timestamps, descriptions |
| `neutral-600` | `#4B5563` | Table header text, label text, nav text |
| `neutral-700` | `#374151` | Ghost button text, chip text |
| `neutral-800` | `#1F2937` | Secondary button text, strong text |
| `neutral-900` | `#111827` | Headings, primary text, prices |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| `success-100` | `#DCFCE7` | Success toast bg, delivered badge bg |
| `success-500` | `#22C55E` | Active indicator dot, WS connected |
| `success-600` | `#16A34A` | Success checkmark, delivered button |
| `success-800` | `#166534` | Success toast text, delivered badge text |
| `error-50` | `#FEF2F2` | Error toast bg |
| `error-500` | `#EF4444` | WS disconnected dot |
| `error-600` | `#DC2626` | Danger button bg, delete text, error text |
| `error-700` | `#B91C1C` | Danger hover |
| `error-800` | `#991B1B` | Error toast text, cancelled badge text |
| `warning-100` | `#FEF3C7` | Pending badge bg |
| `warning-200` | `#FDE68A` | Pending badge border |
| `warning-800` | `#92400E` | Pending badge text |
| `purple-600` | `#9333EA` | Dispatched button bg |
| `purple-700` | `#7C3AED` | Dispatched button hover |
| `purple-800` | `#6B21A8` | Dispatched badge text |

---

## Typography

All sizes use Tailwind's default `rem` scale. The system font stack is system-ui.

| Token | Class | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| `heading-xl` | `text-2xl font-bold` | 24px / 1.5rem | 700 | 32px | Page titles (h1) |
| `heading-lg` | `text-lg font-semibold` | 18px / 1.125rem | 600 | 28px | Section headings (h2), modal titles |
| `heading-sm` | `text-sm font-semibold` | 14px / 0.875rem | 600 | 20px | Card subtitles, table section headers |
| `body` | `text-sm` | 14px / 0.875rem | 400 | 20px | Body text, table cells, form inputs |
| `body-medium` | `text-sm font-medium` | 14px / 0.875rem | 500 | 20px | Nav links, labels, data values |
| `body-bold` | `text-sm font-semibold` or `font-bold` | 14px / 0.875rem | 600–700 | 20px | Prices, totals in-line |
| `caption` | `text-xs` | 12px / 0.75rem | 400 | 16px | Badges, meta text, category pills |
| `caption-medium` | `text-xs font-medium` | 12px / 0.75rem | 500 | 16px | Badge text, table action links |
| `display` | `text-xl font-bold` | 20px / 1.25rem | 700 | 28px | Dashboard brand text |
| `price-lg` | `text-lg font-bold` | 18px / 1.125rem | 700 | 28px | Cart total, order total |
| `price-xl` | `text-2xl font-bold` | 24px / 1.5rem | 700 | 32px | Confirmation order number |

---

## Spacing (8px Base Grid)

The system uses Tailwind's default 4px unit scale, anchored to an 8px grid for major layout decisions.

| Token | Value | Tailwind Class | Usage |
|---|---|---|---|
| `space-1` | 4px | `p-1`, `gap-1` | Inline icon padding |
| `space-1.5` | 6px | `py-1.5` | Small button vertical padding |
| `space-2` | 8px | `p-2`, `gap-2` | Icon buttons, tight gaps |
| `space-3` | 12px | `p-3`, `gap-3` | Card internal padding (compact), form gaps |
| `space-4` | 16px | `p-4`, `gap-4` | Card padding, standard gaps, section spacing |
| `space-5` | 20px | `p-5` | (reserved) |
| `space-6` | 24px | `p-6`, `mb-6` | Section padding, heading bottom margin |
| `space-8` | 32px | `p-8`, `mb-8` | Login card padding, print section margin |
| `space-12` | 48px | `py-12` | Empty state / loading vertical padding |
| `space-16` | 64px | `h-16` | Header height (64px) |

### Layout Max Widths
| Token | Value | Tailwind Class | Usage |
|---|---|---|---|
| `max-sm` | 384px | `max-w-sm` | Login form |
| `max-md` | 448px | `max-w-md` | Cart drawer, confirmation page |
| `max-2xl` | 672px | `max-w-2xl` | Order form, order review, print view |
| `max-3xl` | 768px | `max-w-3xl` | Order detail |
| `max-7xl` | 1280px | `max-w-7xl` | Layout container |

---

## Border Radius

| Token | Value | Tailwind Class | Usage |
|---|---|---|---|
| `radius-md` | 6px | `rounded-md` | Quantity buttons |
| `radius-lg` | 8px | `rounded-lg` | Buttons, inputs, selects, textareas, nav links, pagination, toasts, chips |
| `radius-xl` | 12px | `rounded-xl` | Cards, modals, table containers |
| `radius-full` | 9999px | `rounded-full` | Badges, category pills, active indicator dots, cart count badge |

---

## Shadows

| Token | Tailwind Class | Usage |
|---|---|---|
| `shadow-sm` | `shadow-sm` | Cards, table containers, header |
| `shadow-md` | `shadow-md` | Toast notifications |
| `shadow-xl` | `shadow-xl` | Modals, cart drawer |

---

## Animations

| Name | Value | Usage |
|---|---|---|
| `spin` | `animate-spin` (built-in) | Loading spinner, button loading spinner |
| `slideIn` | `animate-[slideIn_0.2s_ease-out]` | Toast enter (needs `@keyframes slideIn` defined) |
| `slideRight` | `transition-transform duration-300` | Cart drawer open/close |
| `color-transition` | `transition-colors` | Buttons, links, chips, nav items |
| `opacity-transition` | `transition-opacity` | Modal backdrop |

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## Breakpoints

| Token | Value | Tailwind Prefix | Usage |
|---|---|---|---|
| `mobile` | `< 640px` | (default) | Single column, stacked filters |
| `sm` | `>= 640px` | `sm:` | 2-col product grid, side-by-side form fields, inline filters |
| `md` | `>= 768px` | `md:` | Dashboard nav visible, 2-col table cells shown |
| `lg` | `>= 1024px` | `lg:` | 3-col product grid, wider container padding |

---

## Layout Patterns

### Page Shell
```
┌─────────────────────────────────────┐
│ Header (sticky, 64px, bg-white)     │
│ shadow-sm, z-40                     │
├─────────────────────────────────────┤
│ Main content area                   │
│ max-w-7xl mx-auto px-4 sm:px-6     │
│ lg:px-8 py-6                        │
│ bg-gray-50                          │
└─────────────────────────────────────┘
```

### Card Pattern
```html
<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h2 class="text-lg font-semibold text-gray-900 mb-4">Section Title</h2>
  <!-- content -->
</div>
```

### Table Pattern
```html
<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b bg-gray-50">
          <th class="text-left px-4 py-3 font-medium text-gray-600">Header</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3">Cell</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Filter Bar Pattern
```html
<div class="flex flex-col sm:flex-row gap-3 mb-6">
  <div class="flex-1"><!-- search input --></div>
  <div class="w-full sm:w-48"><!-- select filter --></div>
</div>
```

---

## Component Specs

### Button

**File:** `src/components/Button.tsx`

#### Variants
| Variant | Default | Hover | Focus | Disabled |
|---|---|---|---|---|
| `primary` | `bg-blue-600 text-white` | `bg-blue-700` | `ring-2 ring-blue-500 ring-offset-2` | `opacity-50 cursor-not-allowed` |
| `secondary` | `bg-gray-200 text-gray-800` | `bg-gray-300` | `ring-2 ring-gray-400 ring-offset-2` | `opacity-50 cursor-not-allowed` |
| `danger` | `bg-red-600 text-white` | `bg-red-700` | `ring-2 ring-red-500 ring-offset-2` | `opacity-50 cursor-not-allowed` |
| `ghost` | `bg-transparent text-gray-700` | `bg-gray-100` | `ring-2 ring-gray-400 ring-offset-2` | `opacity-50 cursor-not-allowed` |

#### Sizes
| Size | Padding | Font Size | Min Height (recommended) |
|---|---|---|---|
| `sm` | `px-3 py-1.5` | `text-sm` (14px) | 32px |
| `md` | `px-4 py-2` | `text-sm` (14px) | 36px |
| `lg` | `px-6 py-3` | `text-base` (16px) | 44px |

#### States
| State | Behavior |
|---|---|
| Default | Variant colors applied |
| Hover | Background darkens one shade |
| Active/Pressed | (not explicitly defined — recommend `active:scale-[0.98]`) |
| Focus | 2px ring with offset |
| Disabled | 50% opacity, `cursor-not-allowed`, pointer-events preserved |
| Loading | Spinner icon prepended, button disabled, text preserved |

#### Base Classes
```
inline-flex items-center justify-center rounded-lg font-medium
transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
disabled:opacity-50 disabled:cursor-not-allowed
```

---

### Input

**File:** `src/components/Input.tsx`

#### Structure
```
[Label]           ← text-sm font-medium text-gray-700 mb-1
┌─────────────┐
│ Input field  │   ← rounded-lg border px-3 py-2 text-sm shadow-sm
└─────────────┘
[Error message]   ← mt-1 text-sm text-red-600
```

#### States
| State | Border | Ring | Text |
|---|---|---|---|
| Default | `border-gray-300` | — | `text-gray-900` (inherited) |
| Focus | `border-blue-500` | `ring-2 ring-blue-500` | — |
| Error | `border-red-500` | `ring-2 ring-red-500` (on focus) | Error: `text-red-600` |
| Disabled | `opacity-50 cursor-not-allowed` | — | — |

#### Sizes
Single size: `px-3 py-2 text-sm` (height ~36px with border)

---

### Select

**File:** `src/components/Select.tsx`

Matches Input styling exactly. Native `<select>` element.

#### Structure
```
[Label]           ← text-sm font-medium text-gray-700 mb-1
┌─────────────▼┐
│ Select field  │  ← same border/ring/sizing as Input
└──────────────┘
[Error message]   ← mt-1 text-sm text-red-600
```

States: identical to Input.

---

### Textarea

**File:** `src/components/Textarea.tsx`

Matches Input styling exactly. Default `rows={3}`.

---

### Card

**Pattern** (not a standalone component — used inline):

#### Variants
| Variant | Classes |
|---|---|
| Standard | `bg-white rounded-xl shadow-sm border border-gray-200 p-6` |
| Compact | `bg-white rounded-xl shadow-sm border border-gray-200 p-4` |
| Highlight (cart item) | `bg-gray-50 rounded-lg p-3` |

#### Anatomy
```
┌─────────────────────────────────────┐
│ p-6                                 │
│ [Section Title]  text-lg semibold   │
│ mb-4                                │
│ [Content]                           │
│                                     │
└─────────────────────────────────────┘
  border: 1px solid #E5E7EB (gray-200)
  shadow: shadow-sm
  radius: 12px (rounded-xl)
```

---

### Badge

**File:** `src/components/Badge.tsx`

#### Variants (by order status)
| Status | Background | Text | Border |
|---|---|---|---|
| `pending` | `bg-yellow-100` (#FEF3C7) | `text-yellow-800` (#92400E) | `border-yellow-200` (#FDE68A) |
| `confirmed` | `bg-blue-100` (#DBEAFE) | `text-blue-800` (#1E40AF) | `border-blue-200` (#BFDBFE) |
| `dispatched` | `bg-purple-100` (#F3E8FF) | `text-purple-800` (#6B21A8) | `border-purple-200` (#E9D5FF) |
| `delivered` | `bg-green-100` (#DCFCE7) | `text-green-800` (#166534) | `border-green-200` (#BBF7D0) |
| `cancelled` | `bg-red-100` (#FEE2E2) | `text-red-800` (#991B1B) | `border-red-200` (#FECACA) |

#### Anatomy
```
inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium
```
Height: ~22px. Pill shape (`rounded-full`).

---

### Modal

**File:** `src/components/Modal.tsx`

#### Anatomy
```
┌─ Backdrop: fixed inset-0 bg-black/50 z-50 ──────────┐
│                                                       │
│   ┌─ Dialog: max-w-lg w-full rounded-xl ───────────┐ │
│   │ p-6, shadow-xl, max-h-[90vh] overflow-y-auto   │ │
│   │                                                  │ │
│   │ [Title]           [X close]                      │ │
│   │ text-lg semibold   text-gray-400→600 hover       │ │
│   │ ─── mb-4 ───────────────────────                 │ │
│   │                                                  │ │
│   │ [Children / Form content]                        │ │
│   │                                                  │ │
│   └──────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### States
| State | Behavior |
|---|---|
| Closed | Returns `null`, body overflow restored |
| Open | Body overflow hidden, backdrop rendered, dialog centered |
| Backdrop click | Calls `onClose` |

#### Recommended Additions
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Focus trap (tab cycling within modal)
- `Escape` key to close
- Enter/exit animation (`scale-95 opacity-0` → `scale-100 opacity-100`)

---

### Toast

**File:** `src/components/Toast.tsx`

#### Variants
| Type | Background | Text | Border |
|---|---|---|---|
| `success` | `bg-green-50` (#F0FDF4) | `text-green-800` (#166534) | `border-green-200` (#BBF7D0) |
| `error` | `bg-red-50` (#FEF2F2) | `text-red-800` (#991B1B) | `border-red-200` (#FECACA) |
| `info` | `bg-blue-50` (#EFF6FF) | `text-blue-800` (#1E40AF) | `border-blue-200` (#BFDBFE) |

#### Anatomy
```
Position: fixed top-4 right-4 z-[100]
Layout: flex-col gap-2 max-w-sm

┌─────────────────────────────────┐
│ rounded-lg border px-4 py-3     │
│ text-sm shadow-md               │
│ animate-[slideIn_0.2s_ease-out] │
│                                 │
│ {message text}                  │
└─────────────────────────────────┘
```

#### Behavior
- Auto-dismiss after 4 seconds
- Stack vertically (newest at bottom)
- No dismiss button (recommended addition)
- No max count (recommended: cap at 3–5)

#### Recommended Additions
- `role="alert"` on each toast
- Dismiss button (X) on each toast
- `aria-live="polite"` on container

---

### Table

**Pattern** (not a standalone component):

#### Anatomy
```
┌──────────────────────────────────────────────────┐
│ bg-white rounded-xl shadow-sm border-gray-200    │
│ overflow-hidden                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ overflow-x-auto                               │ │
│ │ ┌────────────────────────────────────────────┐│ │
│ │ │ <table> w-full text-sm                     ││ │
│ │ │                                            ││ │
│ │ │ <thead>                                    ││ │
│ │ │   border-b bg-gray-50                      ││ │
│ │ │   <th> text-left px-4 py-3                 ││ │
│ │ │         font-medium text-gray-600          ││ │
│ │ │                                            ││ │
│ │ │ <tbody> divide-y                           ││ │
│ │ │   <tr> hover:bg-gray-50                    ││ │
│ │ │   <td> px-4 py-3                           ││ │
│ │ └────────────────────────────────────────────┘│ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

#### Responsive Columns
Hide columns with `hidden sm:table-cell` or `hidden md:table-cell`.

#### Pagination
```
┌─────────────────────────────────────────────┐
│ "Showing X of Y"          [Previous] [Next] │
│ text-sm text-gray-500     px-3 py-1.5       │
│                           text-sm border     │
│                           rounded-lg         │
│                           disabled:opacity-50│
└─────────────────────────────────────────────┘
```

---

### Nav (Header / Navigation)

**Files:** `src/components/CustomerLayout.tsx`, `src/components/DashboardLayout.tsx`

#### Customer Header
```
┌─────────────────────────────────────────────┐
│ sticky top-0 z-40 bg-white shadow-sm        │
│ max-w-7xl mx-auto px-4 sm:px-6 lg:px-8     │
│ h-16 (64px)                                 │
│                                             │
│ [Brand Logo]    [Track Order] [Cart Icon]   │
│ text-xl bold    text-sm gray   relative p-2 │
│                                 ┌──┐        │
│                                 │5 │ badge  │
│                                 └──┘        │
└─────────────────────────────────────────────┘
```

Cart badge: `absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center`

#### Dashboard Header
```
┌──────────────────────────────────────────────────────┐
│ sticky top-0 z-40 bg-white shadow-sm                 │
│ h-16 (64px)                                          │
│                                                      │
│ [Dashboard]  [Orders] [Products] ...   ● Live  user  │
│ text-xl bold  nav links (hidden md:flex) ws-dot       │
│                                                       │
│ Active link: bg-blue-50 text-blue-700                │
│ Inactive:    text-gray-600 hover:gray-900 hover:bg-100│
└──────────────────────────────────────────────────────┘
```

Nav link: `px-3 py-2 rounded-lg text-sm font-medium transition-colors`

WebSocket indicator: `w-2 h-2 rounded-full` — green (`bg-green-500`) when connected, red (`bg-red-500`) when offline.

---

### Loading

**File:** `src/components/Loading.tsx`

```
        ┌──────┐
        │  ◎   │  animate-spin h-8 w-8 text-blue-600
        └──────┘
          mb-3
      "Loading..."   text-sm text-gray-500

  Container: flex flex-col items-center justify-center py-12
```

---

### EmptyState

**File:** `src/components/EmptyState.tsx`

```
        ┌──────┐
        │ 📥   │  h-12 w-12 text-gray-400
        └──────┘
          mb-4
    "No items found"    text-sm font-semibold text-gray-900
    "Try adjusting..."  mt-1 text-sm text-gray-500
                        mt-4
      [Optional CTA]    Button component

  Container: flex flex-col items-center justify-center py-12 text-center
```

---

## Z-Index Scale

| Layer | Value | Usage |
|---|---|---|
| Base | `0` | Default content |
| Sticky header | `40` | CustomerLayout, DashboardLayout headers |
| Cart/overlay backdrop | `40` | Cart backdrop overlay |
| Modal/Dialog | `50` | Modal backdrop + dialog, Cart panel |
| Toast notifications | `100` | ToastContainer |

---

## Icon System

Currently using inline SVGs throughout. No icon library.

### Icons in Use
| Icon | Size | Location |
|---|---|---|
| Cart (shopping bag) | 24x24 | `CustomerLayout.tsx:29` |
| Close (X) | 20x20 | `Modal.tsx:38`, `Cart.tsx:43` |
| Checkmark | 32x32 | `OrderConfirmation.tsx:21` |
| Inbox | 48x48 | `EmptyState.tsx:13` |
| Spinner | 16x16 / 32x32 | `Button.tsx:39`, `Loading.tsx:8` |

**Recommendation:** Consolidate to `lucide-react` or a single SVG sprite for consistency and tree-shaking.

---

## Accessibility Requirements (WCAG 2.1 AA)

### Color Contrast Audit

| Combination | Ratio | AA Pass? |
|---|---|---|
| `neutral-900` (#111827) on white | 17.6:1 | Yes |
| `neutral-700` (#374151) on white | 9.9:1 | Yes |
| `neutral-500` (#6B7280) on white | 5.2:1 | Yes |
| `neutral-400` (#9CA3AF) on white | 3.0:1 | **No** (body text needs 4.5:1) |
| `brand-600` (#2563EB) on white | 4.6:1 | Yes |
| `error-600` (#DC2626) on white | 4.6:1 | Yes |
| `warning-800` (#92400E) on `warning-100` | 5.6:1 | Yes |
| `success-800` (#166534) on `success-100` | 6.4:1 | Yes |
| Input border `neutral-300` (#D1D5DB) on white | 1.84:1 | **No** (UI needs 3:1) |

### Required Fixes

| Issue | Severity | Components |
|---|---|---|
| No focus trap in Modal/Cart | Critical | `Modal.tsx`, `Cart.tsx` |
| No `role="dialog"`, `aria-modal` | Critical | `Modal.tsx`, `Cart.tsx` |
| No `aria-label` on icon-only buttons | Major | CustomerLayout cart btn, Modal/Cart close btn, Cart +/- btns |
| No `aria-invalid`/`aria-describedby` on errors | Major | `Input.tsx`, `Select.tsx`, `Textarea.tsx` |
| No `aria-live` on dynamic content | Major | `Toast.tsx`, `Loading.tsx` |
| Color-only status indicators | Major | DashboardLayout WS dot, ProductManager active dot |
| No skip navigation link | Minor | All layouts |
| `focus:` should be `focus-visible:` | Minor | `Button.tsx` |
| Input border contrast too low | Minor | All form components |

### Component Fix Examples

**Input (add ARIA error linking):**
```tsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${inputId}-error` : undefined}
  ...
/>
{error && <p id={`${inputId}-error`} role="alert" ...>{error}</p>}
```

**Modal (add dialog semantics):**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby={title ? 'modal-title' : undefined}
>
  {title && <h3 id="modal-title" ...>{title}</h3>}
  <button onClick={onClose} aria-label="Close dialog">
```

**Toast (add live region):**
```tsx
<div role={t.type === 'error' ? 'alert' : 'status'} aria-live="polite">
```

---

## Design Tokens Quick Reference

```
Background:   neutral-50 (#F9FAFB)
Surface:      white (#FFFFFF)
Border:       neutral-200 (#E5E7EB)
Input border: neutral-300 (#D1D5DB) — upgrade to neutral-400 for 3:1 contrast
Text primary: neutral-900 (#111827)
Text secondary: neutral-500 (#6B7280)
Text muted:   neutral-400 (#9CA3AF) — use only for non-essential decorative text
Text label:   neutral-700 (#374151)

Accent:       brand-600 (#2563EB)
Accent hover: brand-700 (#1D4ED8)
Accent light: brand-50 (#EFF6FF)

Success:      success-600 (#16A34A)
Error:        error-600 (#DC2626)
Warning:      warning-800 (#92400E)

Header height: 64px
Card radius:   12px
Input radius:  8px
Badge radius:  9999px (pill)

Card shadow:   shadow-sm
Modal shadow:  shadow-xl
Toast shadow:  shadow-md

Transition:    transition-colors (150ms default)
```

---

## Implementation Checklist

### Phase 1 — Tokens & Accessibility (Critical)
- [ ] Add `@theme` block with all tokens to `src/index.css`
- [ ] Add `slideIn` keyframe animation to `src/index.css`
- [ ] Fix Modal: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape key
- [ ] Fix Cart: `role="dialog"`, `aria-label`, focus trap, Escape key
- [ ] Fix Input/Select/Textarea: `aria-invalid`, `aria-describedby` on error states
- [ ] Fix Toast: `role="alert"` / `role="status"`, `aria-live`
- [ ] Fix Loading: `role="status"`, `aria-live="polite"`
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Switch Button from `focus:` to `focus-visible:`
- [ ] Upgrade input border to `border-neutral-400` for 3:1 contrast

### Phase 2 — Component Extraction
- [ ] Extract reusable `Card` component
- [ ] Extract reusable `Table` component with column config
- [ ] Extend `Badge` for generic use (user roles, active/inactive status)
- [ ] Add mobile hamburger nav to `DashboardLayout`
- [ ] Replace all inline-styled buttons with `Button` component

### Phase 3 — Pattern Enhancements
- [ ] Add step indicator component for checkout flow
- [ ] Add order status timeline/stepper component
- [ ] Add skeleton loading component
- [ ] Add shared pagination component
- [ ] Add confirmation dialog pattern (wrapping Modal)
- [ ] Add copy-to-clipboard utility for order numbers
