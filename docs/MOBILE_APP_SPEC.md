# Mobile App Spec — Order System (React Native / Expo)

**Version:** 1.0 (V1 — Customer-Facing)
**Platform:** iOS first (Expo + React Native)
**Backend:** Existing Go API on port 8090 — no backend changes required
**Test Environment:** Xcode 26.3, iPhone 16 Pro Simulator, iPad Pro Simulator
**Date:** 2026-03-18

---

## Table of Contents

1. [Scope](#1-scope)
2. [User Roles on Mobile](#2-user-roles-on-mobile)
3. [Screens & Flows](#3-screens--flows)
4. [API Contract](#4-api-contract)
5. [Mobile-Specific Features](#5-mobile-specific-features)
6. [Design Requirements](#6-design-requirements)
7. [Acceptance Criteria](#7-acceptance-criteria)
8. [E2E Test Scenarios](#8-e2e-test-scenarios)
9. [Out of Scope](#9-out-of-scope)

---

## 1. Scope

### V1 Scope: Customer-Facing Order Flow

The mobile app is a **new client** for the existing Go backend. It consumes the same REST API as the web frontend. No backend changes are required.

**V1 delivers the full customer shopping journey:**
- Browse products (with search and category filter)
- Build a cart (persisted locally)
- Checkout (enter customer info + delivery address)
- Place order (via existing API)
- Track orders by phone number

**V1 does NOT include:**
- Staff dashboard (remains web-only)
- Admin panel (remains web-only)
- Authentication / login (all V1 screens use public API endpoints)
- Payment processing

### Why Customer-Facing Only?

Staff and admin workflows involve complex table views, bulk operations, and WebSocket connections that are better served by the existing web dashboard on tablets/desktops. The mobile app targets the customer who orders on their phone.

---

## 2. User Roles on Mobile

| Role | V1 Status | Rationale |
|------|-----------|-----------|
| **Customer** | **Primary — ships in V1** | Core business value. Customers order from their phones. No auth required — identified by phone number. |
| **Staff** | Stretch — Phase 2 candidate | Staff dashboard could be useful on tablets for warehouse workers. Requires auth (JWT), WebSocket for live orders. |
| **Admin** | No — web only | Product management, user management, and category management are infrequent admin tasks. Desktop-optimized web UI is sufficient. |

### Customer Identity Model (V1)

Customers are **not authenticated**. They are identified by phone number:
- Place order: provide name + phone + address
- Track orders: look up by phone number
- No registration, no password, no login screen

This matches the existing web storefront behavior.

---

## 3. Screens & Flows

### Navigation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Tab Navigator                           │
│                                                             │
│   [Shop Tab]                          [Track Order Tab]     │
│       │                                      │              │
│       ▼                                      ▼              │
│   ProductCatalog ──────────────►  OrderTracking             │
│       │                           (enter phone → see orders)│
│       │ (cart icon / "View Cart")                           │
│       ▼                                                     │
│     Cart                                                    │
│       │ ("Proceed to Checkout")                             │
│       ▼                                                     │
│   Checkout                                                  │
│       │ ("Review Order")                                    │
│       ▼                                                     │
│   OrderReview                                               │
│       │ ("Place Order" → POST /api/v1/orders)               │
│       ▼                                                     │
│   OrderConfirmation                                         │
│       │ ("Track My Order" → navigates to Track tab)         │
│       │ ("Continue Shopping" → back to ProductCatalog)      │
└─────────────────────────────────────────────────────────────┘
```

**Navigator structure:**
- Root: **Bottom Tab Navigator** with 2 tabs
  - **Shop** tab: Stack Navigator → `ProductCatalog → Cart → Checkout → OrderReview → OrderConfirmation`
  - **Track Order** tab: Stack Navigator → `OrderTracking`

### V1 Screen Inventory

| # | Screen | Route Name | Tab | Purpose |
|---|--------|-----------|-----|---------|
| 1 | Product Catalog | `ProductCatalog` | Shop | Browse, search, filter, add to cart |
| 2 | Cart | `Cart` | Shop | Review cart, edit quantities |
| 3 | Checkout | `Checkout` | Shop | Enter customer info + delivery address |
| 4 | Order Review | `OrderReview` | Shop | Confirm order before submission |
| 5 | Order Confirmation | `OrderConfirmation` | Shop | Success screen with order number |
| 6 | Order Tracking | `OrderTracking` | Track Order | Look up orders by phone number |

---

### Screen 1: Product Catalog

**User Stories:**
- As a customer, I want to see all available products so I can decide what to order.
- As a customer, I want to search products by name so I can find items quickly.
- As a customer, I want to filter products by category so I can browse a specific type.
- As a customer, I want to add products to my cart so I can build my order.

**API Endpoint:**
```
GET /api/v1/products
Response: { "products": Product[] }
```

**Response fields used:**

| Field | Type | Display |
|-------|------|---------|
| `id` | int64 | Key for cart operations |
| `name` | string | Product title |
| `description` | string | Product subtitle (truncated to 2 lines) |
| `price` | float64 | Formatted as `₹{price}/{unit}` (INR) |
| `unit` | string | Shown next to price (e.g., "per kg") |
| `category_name` | string | Category chip/filter label |
| `is_active` | bool | **Only show products where `is_active` is `true`** |

> **IMPORTANT:** The field name is `is_active`, NOT `active`. This caused a bug in the web frontend — do not repeat it.

**UI Elements:**
- **Search bar** (top): text input, filters `name` and `description` (case-insensitive, client-side)
- **Category chips** (horizontal scroll below search): one chip per unique `category_name` extracted from products response, plus "All" chip (default selected)
- **Product list** (FlatList, vertical scroll):
  - Each card shows: `name`, `description` (truncated 2 lines), `₹{price}/{unit}`, `category_name` badge
  - "Add to Cart" button per card — changes to `+`/`-` quantity stepper if item is already in cart
- **Cart badge** on header right: shows total item count from cart store
- **Floating cart button** (bottom-right, 56px FAB): navigates to Cart, shows item count badge

**Behavior:**
- On mount: fetch products via `GET /api/v1/products`
- Client-side filter: exclude products where `is_active` is `false`
- Search filters in real-time as user types (no debounce needed for V1)
- Category filter + search combine with AND logic
- Pull-to-refresh re-fetches product list
- Loading spinner on initial load
- "No products found" empty state when filters yield zero results
- Error state with "Retry" button on network failure

---

### Screen 2: Cart

**User Stories:**
- As a customer, I want to see all items in my cart so I can review before checkout.
- As a customer, I want to change item quantities so I can adjust my order.
- As a customer, I want to remove items from my cart.
- As a customer, I want to see the total price so I know what I'll pay.

**API Endpoint:** None — cart is local state only (Zustand + AsyncStorage)

**UI Elements:**
- **Cart item list** (FlatList):
  - Each row: product `name`, `unit`, `₹{price}` per unit, quantity stepper (`-` / count / `+`), line subtotal `₹{price * quantity}`
  - Swipe-to-delete or trash icon button per row
- **Order summary** (sticky bottom section):
  - Item count: "{N} items"
  - Total: `₹{total}` (sum of all `price × quantity`)
- **"Proceed to Checkout" button** (full-width, primary): navigates to Checkout
- **Empty cart state**: illustration + "Your cart is empty" + "Browse Products" button (pops back to ProductCatalog)

**Behavior:**
- Quantity stepper: min 1, no max. Decrementing from 1 removes the item (with confirmation alert).
- Total recalculates on every quantity change
- Cart persists across app restarts via AsyncStorage (Zustand persist middleware, key: `cart-storage`)

---

### Screen 3: Checkout

**User Stories:**
- As a customer, I want to enter my name and phone so the store can contact me.
- As a customer, I want to enter my delivery address so my order arrives.
- As a customer, I want to add notes to my order (e.g., "leave at door").

**API Endpoint:** None — form data passed to OrderReview via navigation params

**UI Elements (form fields):**

| Section | Field | Input Type | Required | Placeholder |
|---------|-------|-----------|----------|-------------|
| Customer Info | Full Name | text | Yes | "Your full name" |
| Customer Info | Phone Number | numeric keyboard | Yes | "10-digit phone number" |
| Delivery Address | Street Address | text | Yes | "House/flat number, street" |
| Delivery Address | City | text | Yes | "City" |
| Delivery Address | State | text | Yes | "State" |
| Delivery Address | Pincode | numeric keyboard | Yes | "6-digit pincode" |
| Notes | Order Notes | multiline text | No | "Any special instructions?" |

- **"Review Order" button** (full-width, primary): validates form, navigates to OrderReview

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Non-empty after trim | "Name is required" |
| `phone` | Exactly 10 digits: `/^\d{10}$/` | "Enter a valid 10-digit phone number" |
| `address` | Non-empty after trim | "Street address is required" |
| `city` | Non-empty after trim | "City is required" |
| `state` | Non-empty after trim | "State is required" |
| `pincode` | Exactly 6 digits: `/^\d{6}$/` | "Enter a valid 6-digit pincode" |

**Behavior:**
- Validate on "Review Order" tap. Show inline errors below each invalid field (red text).
- Do not navigate until all validations pass.
- Keyboard dismisses on scroll and on "Review Order" tap.
- If cart is empty when this screen mounts, redirect to ProductCatalog.

**Output (navigation params to OrderReview):**
```typescript
{
  customer_name: string
  customer_phone: string
  delivery_address: {
    address: string
    city: string
    state: string
    pincode: string
  }
  notes: string
}
```

---

### Screen 4: Order Review

**User Stories:**
- As a customer, I want to review my complete order before placing it so I can catch mistakes.
- As a customer, I want to place my order with one tap.

**API Endpoint:**
```
POST /api/v1/orders
Content-Type: application/json
```

**Request body (exact shape sent to backend):**
```json
{
  "customer": {
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main St, Mumbai, Maharashtra - 400001"
  },
  "delivery_address": {
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "items": [
    { "product_id": 1, "quantity": 5 },
    { "product_id": 2, "quantity": 3 }
  ],
  "notes": "Please deliver in morning"
}
```

**Critical transformations (bugs we've hit before):**
- `product_id` MUST be sent as `number` (int), NOT string — use `Number()` or `parseInt()`
- `customer.address` is a **concatenation**: `"{address}, {city}, {state} - {pincode}"`
- `notes` defaults to `""` (empty string) if not provided — do NOT send `null` or `undefined`

**Response (HTTP 201 Created):**
```json
{
  "id": 42,
  "order_number": "ORD-20240115-00042",
  "status": "pending",
  "total_amount": 450.00,
  "items": [
    {
      "product_id": 1,
      "product_name": "Tomato",
      "quantity": 5,
      "unit_price": 45.50,
      "subtotal": 227.50
    }
  ],
  "created_at": "2024-01-15T14:20:00Z"
}
```

**Error responses:**

| HTTP Status | `error` field | User-facing message |
|-------------|---------------|---------------------|
| 400 | `"invalid request body"` | "Something went wrong. Please try again." |
| 400 | `"items cannot be empty"` | "Your cart is empty." |
| 400 | `"quantity must be greater than 0"` | "Invalid item quantity." |
| 400 | `"phone is required"` | "Phone number is required." |
| 422 | `"product unavailable or inactive"` | "Some items are no longer available. Please update your cart." |
| 500 | `"failed to place order"` | "Failed to place order. Please try again." |

**UI Elements:**
- **Customer info summary** (read-only card): Name, Phone (formatted as XXXXX-XXXXX)
- **Delivery address summary** (read-only card): `{address}, {city}, {state} - {pincode}`
- **Order items list**: each row shows `product_name`, `quantity × ₹{price}`, line subtotal
- **Notes** (if present): muted text block
- **Total amount**: bold, large: `₹{total}`
- **"Place Order" button** (full-width, primary): submits to API
- **"Edit" links**: next to each section, navigate back to relevant screen

**Behavior:**
- On "Place Order" tap: show loading spinner on button, disable button
- On success (201): clear cart store, navigate to OrderConfirmation with `{ order_number, order_id, customer_phone }`
- On 422 (product inactive): show alert, navigate back to Cart
- On other errors: show alert with user-facing message, keep user on screen
- If cart is empty, redirect to ProductCatalog
- Back button goes to Checkout (preserving form data)

---

### Screen 5: Order Confirmation

**User Stories:**
- As a customer, I want to see confirmation that my order was placed.
- As a customer, I want to easily track my new order.
- As a customer, I want to continue shopping after placing an order.

**API Endpoint:** None — receives data via navigation params

**Navigation params received:**
```typescript
{
  order_number: string   // e.g., "ORD-20240115-00042"
  order_id: number
  customer_phone: string // to pre-fill tracking
}
```

**UI Elements:**
- **Success icon** (green checkmark, 64×64)
- **"Order Placed!" heading** (heading-xl)
- **Order number** (price-xl, prominent): e.g., "ORD-20240115-00042"
- **Status badge**: "Pending" (yellow)
- **"Track My Order" button** (primary): navigates to Track Order tab with phone pre-filled
- **"Continue Shopping" button** (secondary/outline): resets Shop stack to ProductCatalog

**Behavior:**
- This screen is NOT accessible via back navigation after leaving (stack reset)
- Hardware back button goes to ProductCatalog, not back through checkout flow

---

### Screen 6: Order Tracking

**User Stories:**
- As a customer, I want to look up my orders by phone number.
- As a customer, I want to see the current status of each order.
- As a customer, I want to see order details (items, total, date).

**API Endpoint:**
```
GET /api/v1/customers/{phone}/orders
Response: { "orders": Order[], "total": number, "page": number, "per_page": number }
```

**Response fields used per order:**

| Field | Type | Display |
|-------|------|---------|
| `order_number` | string | Order identifier |
| `status` | string | Color-coded badge |
| `total_amount` | float64 | Formatted as `₹{amount}` |
| `created_at` | string (RFC3339) | Formatted as "DD MMM YYYY, HH:MM" |
| `items[]` | array | Shown in expandable section |
| `items[].product_name` | string | Item name |
| `items[].quantity` | int | Quantity ordered |
| `items[].unit_price` | float64 | Price per unit |
| `items[].subtotal` | float64 | Line total |
| `delivery_address` | object | Address display in expanded view |
| `notes` | string | Notes display in expanded view |

**Status badge colors (from design system):**

| `status` value | Background | Text | Border |
|----------------|-----------|------|--------|
| `pending` | `#FEF3C7` (warning-100) | `#92400E` (warning-800) | `#FDE68A` (warning-200) |
| `confirmed` | `#DBEAFE` (brand-100) | `#1E40AF` (brand-800) | `#BFDBFE` (brand-200) |
| `dispatched` | `#F3E8FF` (purple-100) | `#6B21A8` (purple-800) | `#E9D5FF` (purple-200) |
| `delivered` | `#DCFCE7` (success-100) | `#166534` (success-800) | `#BBF7D0` (success-200) |
| `cancelled` | `#FEE2E2` (error-100) | `#991B1B` (error-800) | `#FECACA` (error-200) |

**UI Elements:**
- **Phone input** (top): numeric keyboard, placeholder "Enter your 10-digit phone number"
- **"Search" button**: triggers API call
- **Orders list** (FlatList): each card shows `order_number`, status badge, `created_at`, `total_amount`
  - Tap card to expand: shows items list, delivery address, notes
- **Empty state**: "No orders found for this phone number"
- **Loading state**: spinner
- **Error state**: "Failed to load orders. Please try again." + Retry button

**Behavior:**
- Validate phone is 10 digits before API call; show inline error if invalid
- Phone may be pre-filled from OrderConfirmation (via navigation params)
- Pull-to-refresh re-fetches with current phone
- Orders sorted by `created_at` descending (server returns this order)

---

## 4. API Contract

### Base URL

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8090'
```

All endpoints prefixed with `/api/v1/`.

### Endpoints Used by Mobile V1

| Screen | Method | Path | Auth | Request Body | Response |
|--------|--------|------|------|-------------|----------|
| ProductCatalog | `GET` | `/api/v1/products` | No | — | `{ products: Product[] }` |
| OrderReview | `POST` | `/api/v1/orders` | No | `PlaceOrderRequest` | `Order` (HTTP 201) |
| OrderTracking | `GET` | `/api/v1/customers/{phone}/orders` | No | — | `{ orders: Order[], total, page, per_page }` |

### Endpoints NOT Used by Mobile V1

These exist in the backend but are web-only:

| Method | Path | Why not mobile |
|--------|------|----------------|
| `GET` | `/api/v1/products/{id}` | No product detail screen in V1 |
| `GET` | `/api/v1/orders/{id}` | Tracking uses phone-based lookup instead |
| `POST` | `/api/v1/auth/login` | No auth in V1 |
| `GET` | `/api/v1/dashboard/orders` | Staff-only, requires JWT |
| `GET` | `/api/v1/dashboard/orders/{id}` | Staff-only, requires JWT |
| `PATCH` | `/api/v1/dashboard/orders/{id}/status` | Staff-only, requires JWT |
| `GET` | `/api/v1/dashboard/ws` | Staff-only WebSocket |
| `POST` | `/api/v1/admin/products` | Admin-only |
| `PUT` | `/api/v1/admin/products/{id}` | Admin-only |
| `DELETE` | `/api/v1/admin/products/{id}` | Admin-only |
| `POST` | `/api/v1/admin/categories` | Admin-only |
| `PUT` | `/api/v1/admin/categories/{id}` | Admin-only |
| `GET` | `/api/v1/admin/customers` | Admin-only |
| `POST` | `/api/v1/admin/users` | Admin-only |
| `GET` | `/health` | DevOps, not user-facing |

### TypeScript Type Definitions

```typescript
// === Product (from GET /api/v1/products) ===
interface Product {
  id: number              // int64 — Go field: ID
  name: string            // Go field: Name
  description: string     // Go field: Description
  price: number           // float64 — Go field: Price
  unit: string            // e.g., "kg", "pieces" — Go field: Unit
  category_id: number     // int64 — Go field: CategoryID
  category_name: string   // joined field, may be "" — Go field: CategoryName
  is_active: boolean      // CRITICAL: "is_active" NOT "active" — Go field: IsActive
  created_at: string      // RFC3339 — Go field: CreatedAt
  updated_at: string      // RFC3339 — Go field: UpdatedAt
}

// === Place Order Request (POST /api/v1/orders) ===
interface PlaceOrderRequest {
  customer: {
    name: string           // required
    phone: string          // 10 digits, no formatting — Go field: Phone
    address: string        // concatenated: "{address}, {city}, {state} - {pincode}"
  }
  delivery_address: {
    address: string        // Go field: Address
    city: string           // Go field: City
    state: string          // Go field: State
    pincode: string        // 6 digits — Go field: Pincode
  }
  items: {
    product_id: number     // MUST be number, NOT string — Go field: ProductID (int64)
    quantity: number        // positive integer — Go field: Quantity (int)
  }[]
  notes: string            // "" if empty, NEVER null/undefined — Go field: Notes
}

// === Order (response from POST and GET endpoints) ===
interface Order {
  id: number               // int64
  order_number: string     // format: "ORD-YYYYMMDD-NNNNN"
  customer_id: number      // int64
  customer_name: string    // omitempty
  customer_phone: string   // omitempty
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled'
  total_amount: number     // float64
  notes: string            // omitempty — may be "" or missing from JSON
  delivery_address: {
    address: string
    city: string
    state: string
    pincode: string
  } | null                 // nullable (omitempty in Go)
  items: OrderItem[]       // omitempty — may be [] or absent from JSON
  created_at: string       // RFC3339
  updated_at: string       // RFC3339
}

interface OrderItem {
  id: number               // int64
  order_id: number         // int64
  product_id: number       // int64
  product_name: string
  quantity: number          // int
  unit_price: number        // float64
  subtotal: number          // float64 (server-computed: quantity * unit_price)
}
```

### Known API Gotchas

1. **`is_active` not `active`** — The product model uses `is_active` (Go: `IsActive`, JSON: `is_active`). Do not check `product.active`.
2. **`product_id` must be number** — The Go backend parses `product_id` as `int64`. Sending `"1"` (string) will fail with 400.
3. **`notes` must be string** — Sending `null` will cause JSON unmarshal error. Use `""`.
4. **`delivery_address` is nullable** — When reading orders, `delivery_address` may be `null` in the JSON response. Handle gracefully.
5. **`items` may be empty array or missing** — The Go model uses `omitempty`, so if an order has no items loaded, the field may be absent.
6. **`category_name` may be empty string** — If a product has no category, `category_name` is `""`. Handle in UI (hide badge or show "Uncategorized").

---

## 5. Mobile-Specific Features

### 5a. Offline Cart Persistence (V1)

Cart data persists across app restarts using Zustand + AsyncStorage:

```typescript
interface CartItem {
  product: Product    // full product object for display
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem(product: Product, quantity?: number): void      // default qty 1; if exists, increment
  removeItem(productId: number): void
  updateQuantity(productId: number, quantity: number): void // qty <= 0 removes item
  clearCart(): void
  getTotal(): number       // sum of (product.price * quantity)
  getItemCount(): number   // sum of all quantities
}
```

- **Persistence key:** `cart-storage` (AsyncStorage)
- **Hydration:** Cart loads from AsyncStorage on app start; show splash/loading until hydrated
- **No sync:** Cart is local-only in V1. No server-side cart.

### 5b. Push Notifications (Phase 2 — NOT in V1)

Future: send push notifications when order status changes (pending → confirmed → dispatched → delivered). Requires:
- Expo Push Notifications service
- Backend changes: add push token storage, trigger notifications on status update
- New endpoint: `POST /api/v1/push-tokens` (to register device token)

### 5c. Camera for Product Images (Phase 2 — NOT in V1)

The backend `Product` model has no `image_url` field currently. Product images are out of scope. When added:
- Admin uploads via web
- Mobile displays images in ProductCard (with fallback placeholder)
- No camera capture needed for customers

### 5d. GPS / Location for Delivery Address (Phase 2 — NOT in V1)

Future: auto-fill delivery address fields using device GPS + reverse geocoding. Requires:
- `expo-location` permission
- Geocoding service integration
- Map picker component

### 5e. Haptic Feedback (V1)

Light haptic feedback on:
- "Add to Cart" tap (success)
- "Place Order" success (notification)
- Quantity stepper taps (light)

Use `expo-haptics` — graceful fallback if unavailable.

---

## 6. Design Requirements

The mobile app adapts the web design system defined in `web/docs/DESIGN_SYSTEM.md`. Native components replace CSS classes, but colors, spacing, and typography scale remain consistent.

### 6a. Color Tokens (Native Adaptation)

Map CSS custom properties to a shared constants file:

```typescript
// constants/colors.ts
export const colors = {
  // Brand
  brand50: '#EFF6FF',
  brand100: '#DBEAFE',
  brand200: '#BFDBFE',
  brand500: '#3B82F6',
  brand600: '#2563EB',   // primary button bg, active chips, cart badge
  brand700: '#1D4ED8',   // primary button pressed

  // Neutral
  neutral50: '#F9FAFB',  // screen background
  neutral100: '#F3F4F6', // category chip bg, cart item bg
  neutral200: '#E5E7EB', // card borders
  neutral300: '#D1D5DB', // input borders
  neutral400: '#9CA3AF', // placeholder text
  neutral500: '#6B7280', // secondary text
  neutral600: '#4B5563', // label text
  neutral700: '#374151', // strong secondary text
  neutral800: '#1F2937', // button text
  neutral900: '#111827', // headings, primary text, prices

  // Success
  success100: '#DCFCE7',
  success600: '#16A34A',
  success800: '#166534',

  // Error
  error100: '#FEE2E2',
  error500: '#EF4444',
  error600: '#DC2626',   // error text, danger
  error800: '#991B1B',

  // Warning
  warning100: '#FEF3C7',
  warning200: '#FDE68A',
  warning800: '#92400E',

  // Purple (dispatched status)
  purple100: '#F3E8FF',
  purple200: '#E9D5FF',
  purple800: '#6B21A8',

  // Surfaces
  white: '#FFFFFF',
  screenBg: '#F9FAFB',   // matches neutral50
} as const
```

### 6b. Typography (Native Adaptation)

The web uses Inter font. For native, use system fonts (San Francisco on iOS) for better performance and platform feel:

```typescript
// constants/typography.ts
export const typography = {
  headingXl:  { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },  // page titles
  headingLg:  { fontSize: 18, fontWeight: '600' as const, lineHeight: 28 },  // section headings
  headingSm:  { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },  // card subtitles
  body:       { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },  // body text
  bodyMedium: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },  // labels
  bodyBold:   { fontSize: 14, fontWeight: '700' as const, lineHeight: 20 },  // prices inline
  caption:    { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },  // badges, meta
  captionMed: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },  // badge text
  priceLg:    { fontSize: 18, fontWeight: '700' as const, lineHeight: 28 },  // cart/order total
  priceXl:    { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },  // confirmation order#
} as const
```

### 6c. Spacing (8px Grid — Same as Web)

```typescript
// constants/spacing.ts
export const spacing = {
  xs: 4,    // icon padding
  sm: 8,    // tight gaps, icon buttons
  md: 12,   // card padding compact, form gaps
  lg: 16,   // card padding, standard gaps
  xl: 20,   // section spacing
  xxl: 24,  // section padding
  xxxl: 32, // major section gaps
} as const
```

### 6d. Border Radius

```typescript
export const radius = {
  sm: 4,
  md: 6,     // quantity buttons
  lg: 8,     // buttons, inputs
  xl: 12,    // cards
  full: 9999, // badges, pills, FAB
} as const
```

### 6e. Shadows (Native)

```typescript
// iOS shadow properties (no CSS box-shadow on native)
export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 25, elevation: 8 },
} as const
```

### 6f. Component Mapping (Web → Native)

| Web Component | Native Equivalent | Notes |
|--------------|-------------------|-------|
| Button (primary) | `TouchableOpacity` + brand600 bg | Pressed state: brand700. Disabled: 50% opacity. |
| Button (secondary) | `TouchableOpacity` + neutral200 bg | Pressed: neutral300. |
| Input | `TextInput` + neutral300 border | Focus: brand500 border. Error: error500 border. |
| Card | `View` + white bg + shadow-sm + xl radius | border: 1px neutral200 |
| Badge (status) | `View` + `Text` with status colors | Pill shape: radius-full |
| FlatList | React Native `FlatList` | With `RefreshControl` for pull-to-refresh |
| Modal/Alert | React Native `Alert.alert()` | For error messages. Custom modal for complex cases. |
| Loading | `ActivityIndicator` color={brand600} | Full-screen: centered in flex container |

### 6g. Safe Areas & Platform Spacing

- Use `SafeAreaView` (from `react-native-safe-area-context`) for all screens
- Bottom tab bar respects home indicator on iPhone X+ / iPhone 16 Pro
- Keyboard avoiding: `KeyboardAvoidingView` with `behavior="padding"` on iOS

---

## 7. Acceptance Criteria

### AC-1: Product Browsing

- [ ] AC-1.1: App loads and displays all products where `is_active` is `true` from `GET /api/v1/products`
- [ ] AC-1.2: Products show `name`, `description`, `price`, `unit`, and `category_name`
- [ ] AC-1.3: Prices displayed in INR format (e.g., "₹45.50/kg")
- [ ] AC-1.4: Search input filters products by `name` and `description` (case-insensitive)
- [ ] AC-1.5: Category chips filter products by `category_name`; "All" chip shows all products
- [ ] AC-1.6: Search and category filter work together (AND logic)
- [ ] AC-1.7: Pull-to-refresh re-fetches products from API
- [ ] AC-1.8: Loading spinner shown during initial fetch
- [ ] AC-1.9: Error state with retry button shown on network failure
- [ ] AC-1.10: "No products found" shown when filters yield zero results

### AC-2: Cart Management

- [ ] AC-2.1: Tapping "Add to Cart" adds product with quantity 1
- [ ] AC-2.2: Adding a product already in cart increments its quantity
- [ ] AC-2.3: Cart badge on header and FAB shows total item count
- [ ] AC-2.4: Cart screen lists all items with name, unit price, quantity stepper, and line subtotal
- [ ] AC-2.5: Quantity stepper allows increment and decrement (min 1)
- [ ] AC-2.6: Removing an item (swipe or trash icon) removes it from the list
- [ ] AC-2.7: Total amount updates in real-time on quantity changes
- [ ] AC-2.8: Cart persists across app restarts (kill app, reopen — items still there)
- [ ] AC-2.9: Empty cart shows empty state with "Browse Products" CTA
- [ ] AC-2.10: "Proceed to Checkout" button navigates to Checkout screen

### AC-3: Checkout Form

- [ ] AC-3.1: Form contains all fields: name, phone, address, city, state, pincode, notes
- [ ] AC-3.2: All fields except notes are required
- [ ] AC-3.3: Phone validates as exactly 10 digits (`/^\d{10}$/`)
- [ ] AC-3.4: Pincode validates as exactly 6 digits (`/^\d{6}$/`)
- [ ] AC-3.5: Inline error messages shown below invalid fields on submit attempt
- [ ] AC-3.6: Form does not proceed until all validations pass
- [ ] AC-3.7: Phone input opens numeric keyboard
- [ ] AC-3.8: Pincode input opens numeric keyboard
- [ ] AC-3.9: Notes field is multiline
- [ ] AC-3.10: Redirects to ProductCatalog if cart is empty

### AC-4: Order Review & Placement

- [ ] AC-4.1: Shows customer name, phone, delivery address, items, notes, and total
- [ ] AC-4.2: "Place Order" sends correct `PlaceOrderRequest` to `POST /api/v1/orders`
- [ ] AC-4.3: `product_id` is sent as number (not string) in request body
- [ ] AC-4.4: `customer.address` is concatenated as `"{address}, {city}, {state} - {pincode}"`
- [ ] AC-4.5: `notes` is sent as `""` (not null/undefined) when empty
- [ ] AC-4.6: Button shows loading state and is disabled during API call
- [ ] AC-4.7: On HTTP 201: cart is cleared, app navigates to OrderConfirmation
- [ ] AC-4.8: On HTTP 422 (product inactive): alert shown, app navigates to Cart
- [ ] AC-4.9: On other errors: alert shown, user stays on review screen
- [ ] AC-4.10: Back button returns to Checkout with form data preserved

### AC-5: Order Confirmation

- [ ] AC-5.1: Shows success checkmark icon and "Order Placed!" heading
- [ ] AC-5.2: Displays `order_number` from API response (format: "ORD-YYYYMMDD-NNNNN")
- [ ] AC-5.3: "Track My Order" navigates to OrderTracking tab with phone pre-filled
- [ ] AC-5.4: "Continue Shopping" resets shop stack to ProductCatalog
- [ ] AC-5.5: Hardware back does not go back through checkout flow

### AC-6: Order Tracking

- [ ] AC-6.1: Phone input validates as 10 digits before API call
- [ ] AC-6.2: Search calls `GET /api/v1/customers/{phone}/orders`
- [ ] AC-6.3: Each order card shows `order_number`, status badge, `total_amount`, `created_at`
- [ ] AC-6.4: Status badges use correct colors: pending=warning, confirmed=brand, dispatched=purple, delivered=success, cancelled=error
- [ ] AC-6.5: Tapping a card expands it to show items, delivery address, and notes
- [ ] AC-6.6: "No orders found" shown for phone numbers with no orders
- [ ] AC-6.7: Loading spinner shown during fetch
- [ ] AC-6.8: Error state with retry button on network failure
- [ ] AC-6.9: Pull-to-refresh re-fetches with current phone number
- [ ] AC-6.10: Phone number pre-filled when navigating from OrderConfirmation

---

## 8. E2E Test Scenarios

All tests run on **iOS Simulator (iPhone 16 Pro)** via Maestro (preferred) or Detox. Backend runs on `localhost:8090` with seeded test data.

### Test Data Prerequisites

The backend must be seeded with:
- At least 3 active products across 2+ categories (known `id`, `name`, `price`, `unit`, `category_name`)
- At least 1 inactive product (`is_active: false`) to verify filtering
- Seed data must be deterministic (same data every test run)

### E2E-1: Product Catalog

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| E2E-1.1 | Products load on launch | Open app | Product list shows names, prices, category badges |
| E2E-1.2 | Inactive products hidden | Open app | Product with `is_active: false` NOT in list |
| E2E-1.3 | Search by name | Type known product name in search | Only matching products shown |
| E2E-1.4 | Search by description | Type word from description | Matching products shown |
| E2E-1.5 | Case-insensitive search | Type name in wrong case | Still matches |
| E2E-1.6 | Category filter | Tap category chip | Only products with that `category_name` |
| E2E-1.7 | Search + category combined | Select category, type search | Both filters applied (AND) |
| E2E-1.8 | "All" resets filter | Select category → tap "All" | All products shown |
| E2E-1.9 | Empty search results | Type gibberish | "No products found" message |
| E2E-1.10 | Pull to refresh | Pull down on list | Loading indicator, list refreshes |

### E2E-2: Cart Management

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| E2E-2.1 | Add to cart | Tap "Add to Cart" on product | Cart badge shows 1 |
| E2E-2.2 | Add same product twice | Tap "Add to Cart" on same product × 2 | Badge shows 2; cart has 1 item qty 2 |
| E2E-2.3 | Cart shows items | Add 2 products → open Cart | Both listed with names and prices |
| E2E-2.4 | Increment quantity | Tap "+" in cart | Qty +1, subtotal updates |
| E2E-2.5 | Decrement quantity | Set qty 3 → tap "-" | Qty becomes 2 |
| E2E-2.6 | Remove item | Tap trash/swipe on item | Item removed, total updates |
| E2E-2.7 | Total calculation | Add items with known prices | Total = Σ(price × qty) |
| E2E-2.8 | Empty cart state | Remove all items | "Your cart is empty" + "Browse Products" |
| E2E-2.9 | Cart persists restart | Add items → kill app → reopen | Same items in cart |

### E2E-3: Checkout Validation

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| E2E-3.1 | All fields empty | Tap "Review Order" with empty form | Error on name, phone, address, city, state, pincode |
| E2E-3.2 | Phone too short | Enter "12345" → submit | "Enter a valid 10-digit phone number" |
| E2E-3.3 | Phone with letters | Enter "abcdefghij" → submit | "Enter a valid 10-digit phone number" |
| E2E-3.4 | Valid phone | Enter "9876543210" → submit | No phone error |
| E2E-3.5 | Pincode too short | Enter "123" → submit | "Enter a valid 6-digit pincode" |
| E2E-3.6 | Valid pincode | Enter "400001" → submit | No pincode error |
| E2E-3.7 | All valid | Fill all fields correctly | Navigates to OrderReview |
| E2E-3.8 | Notes optional | Fill required only, notes blank | Submits OK |
| E2E-3.9 | Empty cart redirect | Empty cart → navigate to Checkout | Redirected to ProductCatalog |

### E2E-4: Full Order Flow (Happy Path)

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| E2E-4.1 | Complete order | Add products → Checkout → fill form → Review → Place Order | Confirmation shows order number |
| E2E-4.2 | Review data correct | Fill form → review screen | Name, phone, address, items, total all match input |
| E2E-4.3 | API request shape | Place order (intercept network) | Request body matches `PlaceOrderRequest` exactly |
| E2E-4.4 | Cart cleared | Place order → go to Shop tab | Cart badge 0, cart screen empty |
| E2E-4.5 | Order number format | Place order | `order_number` matches "ORD-YYYYMMDD-NNNNN" |
| E2E-4.6 | Continue Shopping | Place order → "Continue Shopping" | Back at ProductCatalog |
| E2E-4.7 | Track My Order | Place order → "Track My Order" | OrderTracking with phone pre-filled |
| E2E-4.8 | No back to checkout | Place order → hardware back | Goes to ProductCatalog, NOT review |

### E2E-5: Order Tracking

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| E2E-5.1 | Search recent order | Enter phone from E2E-4.1 → Search | Order appears in list |
| E2E-5.2 | Order details match | View order card | `order_number`, `status: pending`, `total_amount`, date correct |
| E2E-5.3 | Expand order | Tap order card | Items list, quantities, prices visible |
| E2E-5.4 | Status badge color | View pending order | Yellow/amber badge |
| E2E-5.5 | No orders found | Search unused phone | "No orders found" message |
| E2E-5.6 | Invalid phone rejected | Enter "123" → Search | Validation error shown |
| E2E-5.7 | Multiple orders | Place 2 orders same phone → search | Both listed, most recent first |
| E2E-5.8 | Pre-filled phone | Complete order → "Track My Order" | Phone field already filled |
| E2E-5.9 | Pull to refresh | Search → pull down | Re-fetches orders |

### E2E-6: Error Handling

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| E2E-6.1 | Product fetch fail | Stop backend → open app | Error screen with "Retry" |
| E2E-6.2 | Retry works | From E2E-6.1 → start backend → Retry | Products load |
| E2E-6.3 | Order placement fail | Place order with backend down | Alert, stays on review |
| E2E-6.4 | Tracking fetch fail | Search with backend down | Error with retry |

---

## 9. Out of Scope

### V1 Exclusions

| Feature | Reason |
|---------|--------|
| Staff dashboard | Complex table UI, WebSocket — stays web-only |
| Admin panel (products, categories, users) | Infrequent admin tasks — web-only |
| Authentication / login | No staff/admin flows; customers identified by phone |
| Push notifications | Requires backend changes (push token storage, notification triggers) |
| Offline order sync | Cart persists offline, but order placement requires connectivity |
| WebSocket live updates on tracking | Phase 2 — polling or manual refresh for now |
| Payment integration | Backend has no payment model |
| User accounts / registration | Customers are phone-based, no accounts |
| Order history (beyond phone lookup) | No account = no persistent history |
| Product images | Backend `Product` model has no `image_url` field |
| Deep linking / universal links | Phase 2 |
| Android build | iOS first; Android in Phase 2 |
| GPS auto-fill for address | Phase 2 |
| Camera / barcode scanning | Not applicable for customer app |
| Biometric auth | No auth in V1 |
| Dark mode | Phase 2 |
| Internationalization (i18n) | English + INR only in V1 |
| iPad-optimized layout | Works on iPad but no split-view or multi-column optimization |

### Phase 2 Candidates (Prioritized)

1. **Push notifications** for order status changes (highest customer value)
2. **Android support** (largest reach expansion)
3. **WebSocket live tracking** (real-time status on tracking screen)
4. **Product images** (requires backend schema change)
5. **GPS address auto-fill** (convenience)
6. **Dark mode** (platform expectation)
7. **Saved addresses** (repeat customer convenience)
8. **"Order Again"** from tracking screen (repeat purchase)
9. **Staff mobile dashboard** (tablet-optimized, requires auth flow)

---

## Appendix: Shared Components

| Component | Props | Usage |
|-----------|-------|-------|
| `ProductCard` | `product: Product`, `cartQty: number`, `onAdd`, `onUpdateQty` | ProductCatalog list item |
| `CartItemRow` | `item: CartItem`, `onUpdateQty`, `onRemove` | Cart list item |
| `StatusBadge` | `status: OrderStatus` | Color-coded status pill |
| `PriceText` | `amount: number` | Formats as `₹{amount}` (INR, en-IN locale) |
| `CategoryChip` | `label: string`, `selected: boolean`, `onPress` | Category filter chip |
| `FormInput` | `label`, `value`, `onChangeText`, `error`, `keyboardType` | Reusable form field |
| `QuantityStepper` | `quantity: number`, `onIncrement`, `onDecrement` | +/- stepper control |
| `LoadingScreen` | — | Full-screen ActivityIndicator |
| `ErrorScreen` | `message: string`, `onRetry` | Full-screen error with retry |
| `EmptyState` | `message: string`, `actionLabel?`, `onAction?` | Empty state with optional CTA |

## Appendix: State Management

### Cart Store (Zustand + AsyncStorage)

```typescript
// store/cart.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useCartStore = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => { /* ... */ },
      removeItem: (productId) => { /* ... */ },
      updateQuantity: (productId, quantity) => { /* ... */ },
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

### Server State (TanStack React Query)

| Query Key | Endpoint | Stale Time | Refetch |
|-----------|----------|-----------|---------|
| `['products']` | `GET /api/v1/products` | 30 seconds | On focus, on pull-to-refresh |
| `['orders', phone]` | `GET /api/v1/customers/{phone}/orders` | 0 (always) | On search, on pull-to-refresh |

| Mutation Key | Endpoint | On Success |
|-------------|----------|------------|
| `['createOrder']` | `POST /api/v1/orders` | Clear cart, navigate to confirmation |
