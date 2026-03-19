# UX Audit — Order System Web

**Auditor:** de (Product Designer)
**Date:** 2026-03-17
**Scope:** All files in `src/pages/` and `src/components/`

---

## Executive Summary

The app is functionally solid with a clear information hierarchy and consistent component usage. The biggest gaps are **accessibility** (missing ARIA, keyboard traps, no skip links, no focus management), **mobile nav** (dashboard nav hidden on small screens with no hamburger), and **inconsistent state handling** (no skeleton loaders, abrupt redirects on empty cart). The design language is clean but under-specified — colors, spacing, and radii are applied ad-hoc via Tailwind defaults rather than from a defined token system, creating drift risk as the product scales.

**Overall Score: :yellow_circle: Needs Work** — Solid foundation, accessibility and mobile gaps block production readiness.

---

## Component Audit

### Button — `src/components/Button.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Visual hierarchy | :green_circle: | Four clear variants (primary/secondary/danger/ghost) with distinct affordance |
| Focus states | :yellow_circle: | Uses `focus:ring-2 focus:ring-offset-2` — good, but shows on mouse click too. Should use `focus-visible` |
| Loading state | :green_circle: | Spinner + disabled — solid pattern |
| Accessibility | :yellow_circle: | No `aria-busy` on loading state |
| Touch targets | :yellow_circle: | `sm` size (`py-1.5`) produces ~30px height — below 44px WCAG 2.5.8 minimum |
| Size variants | :yellow_circle: | `sm` and `md` both use `text-sm` (lines 18-19) — insufficient differentiation |

### Input — `src/components/Input.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Label association | :green_circle: | `htmlFor`/`id` linked correctly (line 10) |
| Error state | :green_circle: | Red border + error message below |
| Accessibility | :red_circle: | **No `aria-invalid` or `aria-describedby`** on error. Screen readers won't associate the error message with the input |
| ID generation | :yellow_circle: | Auto-generated from label (line 10) could collide if two inputs share the same label |
| Required indicator | :yellow_circle: | No asterisk or "required" text for mandatory fields |

### Select — `src/components/Select.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Consistency | :green_circle: | Same label/error pattern as Input |
| Accessibility | :red_circle: | Same `aria-invalid`/`aria-describedby` gap as Input |
| Placeholder option | :yellow_circle: | Line 34: placeholder `<option>` lacks `disabled` attribute — user can re-select empty value |
| Styling | :yellow_circle: | Native `<select>` — visually inconsistent with rounded-lg design of other inputs |

### Textarea — `src/components/Textarea.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Consistency | :green_circle: | Matches Input pattern exactly |
| Accessibility | :red_circle: | Same `aria-invalid`/`aria-describedby` gap |
| Resize | :yellow_circle: | No resize constraint — user can drag to absurd sizes. Recommend `resize-y` or `resize-none` |

### Modal — `src/components/Modal.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Backdrop | :green_circle: | Click-to-close overlay works |
| Scroll lock | :green_circle: | `document.body.style.overflow = 'hidden'` — functional |
| Accessibility | :red_circle: | **Critical: No `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby`**. No focus trap — tabbing escapes modal into background. No `Escape` key handler. Close button has no `aria-label` |
| Animation | :yellow_circle: | No enter/exit animation — modal pops in abruptly |

### Toast — `src/components/Toast.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Visual design | :green_circle: | Clean, color-coded, slide-in animation |
| Accessibility | :red_circle: | **No `role="alert"` or `aria-live="polite"`** — screen readers won't announce toasts. No dismiss button |
| Timing | :yellow_circle: | 4-second auto-dismiss may be too fast for error messages |
| Stacking | :yellow_circle: | No max-count limit — could overflow viewport |
| Animation | :yellow_circle: | `animate-[slideIn_0.2s_ease-out]` references a keyframe not defined in `index.css` |

### Badge — `src/components/Badge.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Color coding | :green_circle: | Clear semantic mapping (yellow=pending, blue=confirmed, purple=dispatched, green=delivered, red=cancelled) |
| Contrast | :yellow_circle: | `yellow-100` bg + `yellow-800` text = ~4.08:1 — borderline AA pass for small text |
| Accessibility | :yellow_circle: | Color alone conveys status — needs icon redundancy for color-blind users |

### Loading — `src/components/Loading.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Visual | :green_circle: | Clean spinner with optional message |
| Accessibility | :red_circle: | No `role="status"` or `aria-live`. No `aria-hidden="true"` on SVG |

### EmptyState — `src/components/EmptyState.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Visual | :green_circle: | Clear icon + title + description + optional action |
| Title size | :yellow_circle: | Title is `text-sm` (line 25) — too small for an empty state heading. Should be `text-base` or `text-lg` |
| Icon variety | :yellow_circle: | Same inbox icon for all empty states — contextual icons would improve clarity |

### CustomerLayout — `src/components/CustomerLayout.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Sticky header | :green_circle: | Good UX for mobile scrolling |
| Cart icon | :green_circle: | Badge count visible, clear affordance |
| Accessibility | :yellow_circle: | No `<nav>` landmark. Cart button (line 25-37) has no `aria-label`. No skip-to-content link |
| Mobile | :green_circle: | Minimal nav — works at all sizes |

### DashboardLayout — `src/components/DashboardLayout.tsx`

| Aspect | Rating | Notes |
|---|---|---|
| Active state | :green_circle: | Clear highlighting (`bg-blue-50 text-blue-700`) |
| Active match | :yellow_circle: | `location.pathname === item.path` (line 35) — exact match fails for nested routes (e.g., `/dashboard/orders/123` won't highlight "Orders") |
| Mobile | :red_circle: | **Nav is `hidden md:flex`** (line 28) — on mobile there is NO way to navigate between Orders/Products/Categories/Users. No hamburger, no bottom nav, no drawer |
| WS indicator | :green_circle: | Live/Offline dot with text — good operational awareness |
| Accessibility | :yellow_circle: | No `<nav>` landmark, no `aria-current="page"`. Logout button is raw text link, not using Button component |

---

## Page Audit

### ProductCatalog — `src/pages/customer/ProductCatalog.tsx`

**Rating: :yellow_circle: Needs Work**

| Aspect | Rating | Notes |
|---|---|---|
| Layout | :green_circle: | Responsive grid (1/2/3 cols). Good card design |
| Search + filter | :green_circle: | Combined text search + category chips — intuitive |
| Loading/error/empty | :green_circle: | All three states handled cleanly |
| Category chips | :yellow_circle: | Lines 67-89: Inline `<button>` elements, not using Button component. No `aria-pressed` state |
| Search input | :yellow_circle: | No label — only placeholder. Needs `aria-label="Search products"` |
| Product cards | :yellow_circle: | No image — text-only. `Product` type has `image_url` but it's unused |
| Visual weight | :yellow_circle: | Every card has a full-width primary "Add to Cart" button — heavy when 20+ products visible |
| Pagination | :yellow_circle: | All products load at once — won't scale |

### Cart — `src/pages/customer/Cart.tsx`

**Rating: :yellow_circle: Needs Work**

| Aspect | Rating | Notes |
|---|---|---|
| Slide-out panel | :green_circle: | Smooth translate animation, backdrop overlay |
| Empty state | :green_circle: | EmptyState component used correctly |
| Accessibility | :red_circle: | **No focus trap, no `role="dialog"`, no Escape key handler**. Close button has no `aria-label` |
| Quantity buttons | :yellow_circle: | 28px touch targets (w-7 h-7) — below 44px WCAG minimum. No `aria-label` on +/- buttons |
| Quantity bounds | :yellow_circle: | `-` button should be disabled at quantity 1 |

### OrderForm — `src/pages/customer/OrderForm.tsx`

**Rating: :yellow_circle: Needs Work**

| Aspect | Rating | Notes |
|---|---|---|
| Form sections | :green_circle: | Clear card grouping (Contact / Address / Notes / Summary) |
| Validation | :green_circle: | Phone (10-digit) and pincode (6-digit) with clear error messages |
| Empty redirect | :yellow_circle: | Line 37-39: Uses `navigate()` during render — should use `<Navigate>` component |
| Step indicator | :yellow_circle: | No checkout progress indicator — user doesn't know where they are in the flow |
| Summary | :yellow_circle: | Shows item count + total but not individual items — can't verify without going back |
| Back nav | :yellow_circle: | No "Back to Cart" button |
| Error scroll | :yellow_circle: | Form doesn't auto-scroll to first error on validation failure |
| Locale | :yellow_circle: | Phone/pincode validation is India-specific without locale context |

### OrderReview — `src/pages/customer/OrderReview.tsx`

**Rating: :green_circle: Acceptable**

| Aspect | Rating | Notes |
|---|---|---|
| Layout | :green_circle: | All order details shown clearly before submission |
| CTAs | :green_circle: | Back + Place Order side by side, equal sizing |
| Error handling | :green_circle: | Toast on failure, loading state on button |
| Back nav | :yellow_circle: | `navigate(-1)` (line 127) — fragile if user arrived via different path |
| State loss | :yellow_circle: | Relies on `location.state` — refresh loses all data with no recovery |
| Edit links | :yellow_circle: | No direct "Edit address" or "Edit contact" links — must go fully back |

### OrderConfirmation — `src/pages/customer/OrderConfirmation.tsx`

**Rating: :green_circle: Acceptable**

| Aspect | Rating | Notes |
|---|---|---|
| Success feedback | :green_circle: | Green checkmark, clear order number, save instruction |
| CTAs | :yellow_circle: | Track Order link goes to `/order/track` without pre-filling phone |
| HTML validity | :yellow_circle: | Lines 51-58: `<Link>` wraps `<Button>` — nested interactive elements (invalid HTML) |
| Spacing | :yellow_circle: | `mt-3` on second button inside `space-y-3` — double spacing |
| Copy action | :yellow_circle: | No copy-to-clipboard for order number |

### OrderTrack — `src/pages/customer/OrderTrack.tsx`

**Rating: :yellow_circle: Needs Work**

| Aspect | Rating | Notes |
|---|---|---|
| Search UX | :green_circle: | Simple phone search with validation |
| Results display | :green_circle: | Order cards with status badges, item breakdown, totals |
| Error/empty states | :green_circle: | Handled well |
| Security | :yellow_circle: | Phone-based lookup with no auth — anyone with a phone number sees all orders |
| Type safety | :yellow_circle: | Line 96: `(item as any).subtotal` — API shape uncertainty |
| Pagination | :yellow_circle: | No pagination for results |
| Status visualization | :yellow_circle: | Just a badge — a timeline stepper (Pending > Confirmed > Dispatched > Delivered) would greatly improve UX |
| Layout alignment | :yellow_circle: | Search button `self-start` misaligns with error message layout |

### Login — `src/pages/dashboard/Login.tsx`

**Rating: :green_circle: Acceptable**

| Aspect | Rating | Notes |
|---|---|---|
| Layout | :green_circle: | Centered card, clean, minimal |
| Autocomplete | :green_circle: | Proper `autoComplete="username"` and `autoComplete="current-password"` |
| Error state | :yellow_circle: | Centered red text with no `role="alert"`. No icon or container styling |
| Missing features | :yellow_circle: | No "Forgot password", no password visibility toggle, no branding |

### OrderList — `src/pages/dashboard/OrderList.tsx`

**Rating: :yellow_circle: Needs Work**

| Aspect | Rating | Notes |
|---|---|---|
| Table layout | :green_circle: | Responsive — hides columns at breakpoints. Good column choices |
| Filters | :green_circle: | Search + status + date range — comprehensive |
| Pagination | :green_circle: | Previous/Next with disabled states |
| Date inputs | :yellow_circle: | Lines 68-79: No labels — screen readers get no context. Need `aria-label` |
| Pagination buttons | :yellow_circle: | Raw styled buttons, not using Button component |
| Table semantics | :yellow_circle: | No `<caption>` element |
| Sorting | :yellow_circle: | No column sorting |
| Real-time | :yellow_circle: | WebSocket connected but new orders don't appear without manual refresh |

### OrderDetail — `src/pages/dashboard/OrderDetail.tsx`

**Rating: :yellow_circle: Needs Work**

| Aspect | Rating | Notes |
|---|---|---|
| Layout | :green_circle: | Well-organized sections (Status / Customer / Address / Items / Notes / Timeline) |
| Status actions | :green_circle: | Color-coded buttons with transition logic |
| NaN risk | :red_circle: | If `item.total_price` is undefined/NaN, it displays "NaN" — needs fallback |
| Status buttons | :yellow_circle: | Raw styled buttons (lines 95-103), not using Button component. No confirmation dialog |
| Timeline | :yellow_circle: | Only Created + Last Updated — not a full status transition history |
| Print link | :yellow_circle: | Opens new page with no indication it navigates away |

### PrintView — `src/pages/dashboard/PrintView.tsx`

**Rating: :green_circle: Acceptable (fit for purpose)**

| Aspect | Rating | Notes |
|---|---|---|
| Print CSS | :green_circle: | Functional visibility-based approach |
| Auto-print | :yellow_circle: | Fires after 500ms with no preview or cancel |
| Back nav | :red_circle: | **No back button** — user must use browser back |

### ProductManager — `src/pages/admin/ProductManager.tsx`

**Rating: :yellow_circle: Needs Work**

| Aspect | Rating | Notes |
|---|---|---|
| CRUD flow | :green_circle: | Table + modal for create/edit. Consistent pattern |
| Active indicator | :yellow_circle: | Green/gray dot (lines 196-198) — color-only, fails WCAG 1.4.1 |
| Delete | :yellow_circle: | `window.confirm()` (line 142) breaks the design language. Use Modal |
| Action links | :yellow_circle: | `text-xs` links (lines 203-214) — small touch targets for mobile |
| Category fetch | :yellow_circle: | Derived from products — if no products have categories, dropdown is empty |
| Validation | :yellow_circle: | Only checks name + price on submit. No inline validation |

### CategoryManager — `src/pages/admin/CategoryManager.tsx`

**Rating: :yellow_circle: Needs Work**

| Aspect | Rating | Notes |
|---|---|---|
| CRUD | :green_circle: | Consistent with ProductManager pattern |
| Delete | :yellow_circle: | No delete action at all |
| Edit bug | :yellow_circle: | `openEdit` (line 77) sets description to `''` — loses existing description |
| Data source | :yellow_circle: | Categories derived from products (lines 27-39) — fragile |

### UserManager — `src/pages/admin/UserManager.tsx`

**Rating: :red_circle: Critical**

| Aspect | Rating | Notes |
|---|---|---|
| Create flow | :green_circle: | Clean modal with role selection |
| User list | :red_circle: | **Only shows "recently created" from local state** (lines 26-28). Lost on refresh. No persisted user list from API |
| Missing CRUD | :red_circle: | No edit, no delete, no password reset, no deactivation |
| Role badge | :yellow_circle: | Inline styling (lines 87-93) instead of Badge component |
| Password UX | :yellow_circle: | No strength indicator, no confirmation field |

---

## Cross-Cutting Issues

### Accessibility (WCAG 2.1 AA) :red_circle:

| Issue | Severity | Files Affected |
|---|---|---|
| Modal/Cart: No focus trap, `role="dialog"`, `aria-modal`, Escape key | Critical | `Modal.tsx`, `Cart.tsx` |
| Form inputs: No `aria-invalid`/`aria-describedby` on error | High | `Input.tsx`, `Select.tsx`, `Textarea.tsx` |
| Toast: No `role="alert"` / `aria-live` | High | `Toast.tsx` |
| Icon buttons: No `aria-label` | High | `CustomerLayout.tsx`, `Modal.tsx`, `Cart.tsx` |
| Loading: No `role="status"` / `aria-live` | Medium | `Loading.tsx` |
| No skip-to-content link | Medium | `CustomerLayout.tsx`, `DashboardLayout.tsx` |
| No `<nav>` landmark with `aria-label` | Medium | Both layouts |
| Color-only status indicators (badges, dots) | Medium | `Badge.tsx`, `DashboardLayout.tsx`, `ProductManager.tsx` |
| Sub-44px touch targets | Medium | `Cart.tsx`, `Button.tsx` (sm), `ProductManager.tsx` |

### Mobile Responsiveness :yellow_circle:

| Issue | Severity | File |
|---|---|---|
| Dashboard nav completely hidden on mobile — no fallback | Critical | `DashboardLayout.tsx:28` |
| Cart quantity buttons too small for touch | Medium | `Cart.tsx:74-86` |
| Admin table action links too small for touch | Medium | `ProductManager.tsx:203-214` |
| Filter bar on OrderList collapses poorly | Low | `OrderList.tsx:51-80` |

### Design Consistency :yellow_circle:

| Issue | Files |
|---|---|
| Category filter chips are inline buttons, not Button component | `ProductCatalog.tsx:67-89` |
| Status change buttons are inline buttons, not Button component | `OrderDetail.tsx:95-103` |
| Pagination buttons are inline buttons, not Button component | `OrderList.tsx:153-172` |
| Role badge uses inline styling instead of Badge component | `UserManager.tsx:87-93` |
| `window.confirm()` instead of Modal for delete | `ProductManager.tsx:142` |
| `<Link>` wrapping `<Button>` — nested interactives | `OrderConfirmation.tsx:51-58` |

### Loading/Error/Empty States :green_circle:

All pages handle loading, error, and empty states consistently using `Loading` and `EmptyState` components. Button loading states work well with inline spinners.

### User Flow Friction :yellow_circle:

| Issue | Page |
|---|---|
| Empty cart redirect flash on render | `OrderForm.tsx:37-39` |
| No way to edit cart from OrderReview | `OrderReview.tsx` |
| Confirmation Track link doesn't pre-fill phone | `OrderConfirmation.tsx:51` |
| PrintView has no escape/back button | `PrintView.tsx` |
| Refresh on OrderReview loses all form data | `OrderReview.tsx:27` |
| No checkout step indicator | `OrderForm.tsx` |

---

## Priority Matrix

| Priority | Issue | Impact |
|---|---|---|
| **P0** | Modal focus trap + ARIA roles | Unusable for keyboard/screen reader users |
| **P0** | Dashboard mobile nav missing | Staff can't navigate on phones |
| **P0** | UserManager needs real user list | Admin can't manage existing users |
| **P1** | Form input ARIA attributes (`aria-invalid`, `aria-describedby`) | Forms inaccessible to screen readers |
| **P1** | Toast `role="alert"` + dismiss button | Notifications silent to screen readers |
| **P1** | Icon button `aria-label` everywhere | Icons meaningless to screen readers |
| **P1** | Nested interactive elements (`<Link>` > `<Button>`) | Invalid HTML, unpredictable behavior |
| **P1** | Replace raw buttons with Button component | Design consistency |
| **P1** | OrderDetail NaN fallback for prices | Data display broken |
| **P2** | Touch target sizing (44px minimum) | Motor-impaired users |
| **P2** | Skip-to-content links | Navigation efficiency |
| **P2** | Checkout step indicator | User orientation |
| **P2** | `window.confirm()` → Modal | Design consistency |
| **P2** | Skeleton loaders instead of spinners | Perceived performance |
| **P3** | Product images/placeholders | Visual richness |
| **P3** | Order status timeline stepper | UX improvement |
| **P3** | Copy-to-clipboard on confirmation | Convenience |
| **P3** | PrintView back button | Navigation dead-end |
| **P3** | `focus-visible` instead of `focus` | Eliminates mouse-click focus rings |
