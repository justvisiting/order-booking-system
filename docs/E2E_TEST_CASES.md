# E2E Test Cases — Order Booking System

All tests use **Playwright** with **real Chromium browser**, hitting **live backend (Go) + MySQL**. Zero mocks.

**Code location:** `ai-1/order-system/web/e2e/`
**Screenshots:** `ai-1/order-system/web/e2e/screenshots/`

---

## TC-01: Product Catalog (`01-product-catalog.spec.ts`)

| ID | Test Case | Steps | Expected Result | Screenshot |
|----|-----------|-------|----------------|------------|
| TC-01.1 | Display catalog with categories | Navigate to /order | Products grid loads, category filter buttons (All, Fruits, Vegetables, etc.) visible | `01-01-product-catalog-loaded` |
| TC-01.2 | Filter by category | Click "Fruits" button | Only fruit products shown, each card shows "Fruits" badge | `01-02-filtered-by-fruits` |
| TC-01.3 | Search by product name | Type "Milk" in search | Only milk product displayed, exactly 1 card | `01-03-search-milk` |
| TC-01.4 | Add product to cart | Click "Add to Cart" on first product | Cart badge shows "1" in header | `01-04-product-added-to-cart` |

---

## TC-02: Cart Management (`02-cart-management.spec.ts`)

| ID | Test Case | Steps | Expected Result | Screenshot |
|----|-----------|-------|----------------|------------|
| TC-02.1 | Open cart with items | Add product → click cart icon | Cart sidebar opens showing "Cart (1 items)" | `02-01-cart-sidebar-open` |
| TC-02.2 | Increase quantity | Open cart → click "+" button | Quantity shows "2" | `02-02-quantity-increased` |
| TC-02.3 | Decrease quantity | Add 2 items → open cart → click "-" | Quantity shows "1" | `02-03-quantity-decreased` |
| TC-02.4 | Remove item | Open cart → click "Remove" | "Your cart is empty" message shown | `02-04-cart-empty-after-remove` |
| TC-02.5 | Proceed to checkout | Open cart → click "Proceed to Checkout" | Navigates to delivery details form | `02-05-checkout-page` |

---

## TC-03: Order Placement (`03-order-placement.spec.ts`)

| ID | Test Case | Steps | Expected Result | Screenshot |
|----|-----------|-------|----------------|------------|
| TC-03.1 | Complete happy path | Catalog → add 2 items → cart → checkout → fill form → review → place | Order confirmation with order number | `03-01-step1` through `03-01-step7` (7 screenshots) |
| TC-03.2 | Empty form validation | Go to checkout → submit empty | "Name is required", "Phone is required", "Address is required" shown | `03-02-validation-errors` |
| TC-03.3 | Invalid phone & pincode | Fill with 3-digit phone and pincode | "Enter a valid 10-digit phone number", "Enter a valid 6-digit pincode" | `03-03-invalid-phone-pincode` |

**TC-03.1 step-by-step screenshots:**
1. `03-01-step1-catalog` — Product catalog loaded
2. `03-01-step2-products-added` — 2 products added (badge = 2)
3. `03-01-step3-cart-open` — Cart sidebar with 2 items
4. `03-01-step4-checkout-form` — Delivery details form
5. `03-01-step5-form-filled` — All fields filled
6. `03-01-step6-order-review` — Review page showing customer info, address, items, total
7. `03-01-step7-order-confirmation` — "Order Placed Successfully!" with order number

---

## TC-04: Order Tracking (`04-order-tracking.spec.ts`)

| ID | Test Case | Steps | Expected Result | Screenshot |
|----|-----------|-------|----------------|------------|
| TC-04.1 | Track after placing order | Place order → go to /order/track → enter phone → search | Order card with order number and status badge | `04-01-step1` through `04-01-step3` |
| TC-04.2 | Invalid phone | Enter "123" → search | "Enter a valid 10-digit phone number" error | `04-02-invalid-phone` |
| TC-04.3 | Unknown phone | Enter "1111111111" → search | "No orders found" message | `04-03-no-orders-found` |

---

## TC-05: Staff Dashboard (`05-staff-dashboard.spec.ts`)

| ID | Test Case | Steps | Expected Result | Screenshot |
|----|-----------|-------|----------------|------------|
| TC-05.1 | Staff login | Go to /login → enter staff creds → login | Dashboard with "Orders" heading | `05-01-step1`, `05-01-step2` |
| TC-05.2 | Admin login | Login as admin | Dashboard loaded | `05-02-admin-dashboard` |
| TC-05.3 | View detail & update status | Place order → login → click order → confirm → dispatch → deliver | Status transitions: pending → confirmed → dispatched → delivered | `05-03-step1` through `05-03-step5` |
| TC-05.4 | Filter by status | Login → select "Pending" from dropdown | Only pending orders shown | `05-04-filter-pending` |
| TC-05.5 | Search by customer | Login → type customer name in search | Filtered results | `05-05-search-customer` |
| TC-05.6 | Invalid login | Enter wrong credentials → login | Error message shown | `05-06-invalid-login` |

---

## TC-06: Admin Product Management (`06-admin-product-management.spec.ts`)

| ID | Test Case | Steps | Expected Result | Screenshot |
|----|-----------|-------|----------------|------------|
| TC-06.1 | View product list | Login as admin → go to /admin/products | Products table with names, prices, categories | `06-01-admin-product-list` |
| TC-06.2 | Create product | Click "Add Product" → fill form → create | New product "E2E Test Product" appears in table | `06-02-step1` through `06-02-step3` |
| TC-06.3 | Edit product | Click "Edit" on first product → change name → update | Product name updated | `06-03-edit-product-modal`, `06-03-product-updated` |

---

## TC-07: Full Order Lifecycle (`07-order-lifecycle.spec.ts`)

| ID | Test Case | Steps | Expected Result | Screenshot |
|----|-----------|-------|----------------|------------|
| TC-07.1 | Complete lifecycle: order → deliver → track | Customer places order → Staff confirms → dispatches → delivers → Customer tracks | All status transitions work, delivered order visible in tracking | `07-01-step1` through `07-01-step6` |
| TC-07.2 | Cancel order | Customer places order → Staff cancels | No more status buttons (cancelled is terminal) | `07-02-step1`, `07-02-step2` |

---

## Summary

| Suite | Tests | Category |
|-------|-------|----------|
| TC-01 | 4 | Product browsing |
| TC-02 | 5 | Cart operations |
| TC-03 | 3 | Order placement & validation |
| TC-04 | 3 | Order tracking |
| TC-05 | 6 | Staff dashboard & auth |
| TC-06 | 3 | Admin product CRUD |
| TC-07 | 2 | Full lifecycle integration |
| **Total** | **26** | |

**All tests produce screenshots** at key transitions for visual review.
**Zero mocks** — every test hits the live Go backend API and MySQL database.
