# E2E Test Report — Order Booking System

**Date:** 2026-03-17
**Tool:** Playwright (Chromium, real browser)
**Environment:** Frontend localhost:3000 | Backend localhost:8090 | MySQL orderdb
**Mocks:** ZERO — all tests hit real API and real database
**Total:** 26 tests | **26 PASS** | **0 FAIL**
**Duration:** ~31 seconds

---

## TC-01: Product Catalog (4 tests)

### TC-01.1: Display product catalog with all categories
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Navigate to /order |
| **Expected** | Product cards rendered with name, price. Category filter buttons visible. |
| **Actual** | 15 products displayed across 5 categories. All cards show name + price. |
| **Screenshot** | `e2e/screenshots/01-01-product-catalog-loaded.png` |

### TC-01.2: Filter products by category
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Click "Fruits" category filter |
| **Expected** | Only fruit products shown |
| **Actual** | Catalog filtered to fruits only. Other categories hidden. |
| **Screenshot** | `e2e/screenshots/01-02-filtered-by-fruits.png` |

### TC-01.3: Search products by name
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Type "Milk" in search box |
| **Expected** | Only products matching "Milk" shown |
| **Actual** | Search filters correctly. Milk product visible. |
| **Screenshot** | `e2e/screenshots/01-03-search-milk.png` |

### TC-01.4: Add product to cart
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Click "Add to Cart" on first product |
| **Expected** | Cart badge increments, product added |
| **Actual** | Cart badge shows item count. Product added successfully. |
| **Screenshot** | `e2e/screenshots/01-04-product-added-to-cart.png` |

---

## TC-02: Cart Management (5 tests)

### TC-02.1: Open cart sidebar with items
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Add product, click cart icon |
| **Expected** | Cart sidebar opens showing added items |
| **Actual** | Sidebar opens with correct item, quantity, and subtotal |
| **Screenshot** | `e2e/screenshots/02-01-cart-sidebar-open.png` |

### TC-02.2: Increase product quantity in cart
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Click "+" button on cart item |
| **Expected** | Quantity increments, total updates |
| **Actual** | Quantity increased. Total recalculated correctly. |
| **Screenshot** | `e2e/screenshots/02-02-quantity-increased.png` |

### TC-02.3: Decrease product quantity in cart
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Click "−" button on cart item |
| **Expected** | Quantity decrements, total updates |
| **Actual** | Quantity decreased. Total recalculated correctly. |
| **Screenshot** | `e2e/screenshots/02-03-quantity-decreased.png` |

### TC-02.4: Remove item from cart
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Remove all items from cart |
| **Expected** | Cart shows empty state |
| **Actual** | "Your cart is empty" message displayed |
| **Screenshot** | `e2e/screenshots/02-04-cart-empty-after-remove.png` |

### TC-02.5: Proceed to checkout from cart
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Add item, open cart, click checkout |
| **Expected** | Navigates to checkout/order form page |
| **Actual** | Checkout form rendered with delivery fields |
| **Screenshot** | `e2e/screenshots/02-05-checkout-page.png` |

---

## TC-03: Order Placement (3 tests)

### TC-03.1: Complete order — catalog to confirmation
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Name: "E2E Test Customer", Phone: "9876543210", Address: "42 MG Road, Sector 15, Bangalore", Pincode: "560001" |
| **Expected** | Full flow: browse → add to cart → fill form → review → confirm → order number shown |
| **Actual** | Order placed successfully. Confirmation page shows order number. Cart cleared. |
| **Screenshots** | `03-01-step1-catalog.png`, `03-01-step2-products-added.png`, `03-01-step3-cart-open.png`, `03-01-step4-checkout-form.png`, `03-01-step5-form-filled.png`, `03-01-step6-order-review.png`, `03-01-step7-order-confirmation.png` |

### TC-03.2: Order form validation — empty fields
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | All fields empty, click submit |
| **Expected** | Validation errors for Name, Phone, Address, Pincode |
| **Actual** | All 4 required-field errors shown |
| **Screenshot** | `e2e/screenshots/03-02-validation-errors.png` |

### TC-03.3: Order form validation — invalid phone/pincode
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Phone: "123", Pincode: "12" |
| **Expected** | Validation errors for invalid format |
| **Actual** | Phone and pincode format errors displayed |
| **Screenshot** | `e2e/screenshots/03-03-invalid-phone-pincode.png` |

---

## TC-04: Order Tracking (3 tests)

### TC-04.1: Place order then track by phone number
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Place order with phone "9876500001", then track using same phone |
| **Expected** | Order appears in tracking results with correct status |
| **Actual** | Order found. Status and details match. |
| **Screenshots** | `04-01-step1-order-placed.png`, `04-01-step2-track-page.png`, `04-01-step3-orders-found.png` |

### TC-04.2: Track with invalid phone shows error
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Phone: "123" (invalid) |
| **Expected** | Validation error |
| **Actual** | Phone validation error shown |
| **Screenshot** | `e2e/screenshots/04-02-invalid-phone.png` |

### TC-04.3: Track with unknown phone shows no orders
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Phone: "9999999999" (no orders exist) |
| **Expected** | "No orders found" message |
| **Actual** | Empty state message displayed |
| **Screenshot** | `e2e/screenshots/04-03-no-orders-found.png` |

---

## TC-05: Staff Dashboard (6 tests)

### TC-05.1: Staff login and view order list
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Username: "staff", Password: "admin123" |
| **Expected** | Dashboard loads with order list |
| **Actual** | Login successful. Order list rendered with orders. |
| **Screenshots** | `05-01-step1-login-page.png`, `05-01-step2-dashboard-loaded.png` |

### TC-05.2: Admin login and view order list
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Username: "admin", Password: "admin123" |
| **Expected** | Dashboard loads with admin access |
| **Actual** | Admin dashboard rendered with management options |
| **Screenshot** | `e2e/screenshots/05-02-admin-dashboard.png` |

### TC-05.3: View order detail and update status lifecycle
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Click order → Confirm → Dispatch → Deliver |
| **Expected** | Status transitions: pending → confirmed → dispatched → delivered |
| **Actual** | All status transitions successful. UI updates after each change. |
| **Screenshots** | `05-03-step1-order-list.png`, `05-03-step2-order-detail.png`, `05-03-step3-status-confirmed.png`, `05-03-step4-status-dispatched.png`, `05-03-step5-status-delivered.png` |

### TC-05.4: Filter orders by status
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Select "Pending" filter |
| **Expected** | Only pending orders shown |
| **Actual** | Filter applied correctly |
| **Screenshot** | `e2e/screenshots/05-04-filter-pending.png` |

### TC-05.5: Search orders by customer name
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Search for customer name |
| **Expected** | Matching orders shown |
| **Actual** | Search filters orders correctly |
| **Screenshot** | `e2e/screenshots/05-05-search-customer.png` |

### TC-05.6: Invalid login shows error
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Username: "staff", Password: "wrongpass" |
| **Expected** | Error message, no redirect |
| **Actual** | "Invalid credentials" error shown. Stays on login page. |
| **Screenshot** | `e2e/screenshots/05-06-invalid-login.png` |

---

## TC-06: Admin Product Management (3 tests)

### TC-06.1: View product list in admin
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Login as admin, navigate to /admin/products |
| **Expected** | Product list with management controls |
| **Actual** | All products listed with edit/delete options |
| **Screenshot** | `e2e/screenshots/06-01-admin-product-list.png` |

### TC-06.2: Create a new product
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Name: "E2E Test Product", Price: 99.99, Category: first available |
| **Expected** | Product created, appears in list |
| **Actual** | Product created successfully. Visible in admin list. |
| **Screenshots** | `06-02-step1-add-product-modal.png`, `06-02-step2-form-filled.png`, `06-02-step3-product-created.png` |

### TC-06.3: Edit a product
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Change product name/price |
| **Expected** | Product updated in list |
| **Actual** | Edit saved. Updated values reflected. |
| **Screenshots** | `06-03-edit-product-modal.png`, `06-03-product-updated.png` |

---

## TC-07: Full Order Lifecycle — Customer + Staff (2 tests)

### TC-07.1: Complete lifecycle — order → confirm → dispatch → deliver → track
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Customer places order → Staff confirms → dispatches → delivers → Customer tracks and sees "Delivered" |
| **Expected** | Full lifecycle from customer order to delivered, verified from both customer and staff perspectives |
| **Actual** | All transitions successful. Customer tracking shows final "Delivered" status. |
| **Screenshots** | `07-01-step1-order-placed.png`, `07-01-step2-staff-views-order.png`, `07-01-step3-confirmed.png`, `07-01-step4-dispatched.png`, `07-01-step5-delivered.png`, `07-01-step6-customer-tracks-delivered.png` |

### TC-07.2: Cancel order flow
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Input** | Place order → Staff cancels it |
| **Expected** | Order status changes to cancelled |
| **Actual** | Cancellation successful. Status reflected in dashboard. |
| **Screenshots** | `07-02-step1-order-placed.png`, `07-02-step2-order-cancelled.png` |

---

## Summary

| Suite | Tests | Pass | Fail | Duration |
|-------|-------|------|------|----------|
| TC-01: Product Catalog | 4 | 4 | 0 | ~3s |
| TC-02: Cart Management | 5 | 5 | 0 | ~5s |
| TC-03: Order Placement | 3 | 3 | 0 | ~7s |
| TC-04: Order Tracking | 3 | 3 | 0 | ~7s |
| TC-05: Staff Dashboard | 6 | 6 | 0 | ~12s |
| TC-06: Admin Product Mgmt | 3 | 3 | 0 | ~4s |
| TC-07: Full Lifecycle | 2 | 2 | 0 | ~16s |
| **Total** | **26** | **26** | **0** | **~31s** |

## Screenshot Index

All 47 screenshots saved at: `e2e/screenshots/`

| Screenshot | Test | What It Shows |
|---|---|---|
| `01-01-product-catalog-loaded.png` | TC-01.1 | Full product catalog with 15 products |
| `01-02-filtered-by-fruits.png` | TC-01.2 | Catalog filtered to Fruits category |
| `01-03-search-milk.png` | TC-01.3 | Search results for "Milk" |
| `01-04-product-added-to-cart.png` | TC-01.4 | Cart badge after adding product |
| `02-01-cart-sidebar-open.png` | TC-02.1 | Cart sidebar with items |
| `02-02-quantity-increased.png` | TC-02.2 | Cart after quantity increase |
| `02-03-quantity-decreased.png` | TC-02.3 | Cart after quantity decrease |
| `02-04-cart-empty-after-remove.png` | TC-02.4 | Empty cart state |
| `02-05-checkout-page.png` | TC-02.5 | Checkout form page |
| `03-01-step1-catalog.png` | TC-03.1 | Browse catalog (step 1) |
| `03-01-step2-products-added.png` | TC-03.1 | Products added to cart (step 2) |
| `03-01-step3-cart-open.png` | TC-03.1 | Cart open with items (step 3) |
| `03-01-step4-checkout-form.png` | TC-03.1 | Checkout form empty (step 4) |
| `03-01-step5-form-filled.png` | TC-03.1 | Form filled with customer data (step 5) |
| `03-01-step6-order-review.png` | TC-03.1 | Order review page (step 6) |
| `03-01-step7-order-confirmation.png` | TC-03.1 | Order confirmation with number (step 7) |
| `03-02-validation-errors.png` | TC-03.2 | All required field errors |
| `03-03-invalid-phone-pincode.png` | TC-03.3 | Phone/pincode format errors |
| `04-01-step1-order-placed.png` | TC-04.1 | Order placed for tracking |
| `04-01-step2-track-page.png` | TC-04.1 | Track page with phone input |
| `04-01-step3-orders-found.png` | TC-04.1 | Orders found by phone |
| `04-02-invalid-phone.png` | TC-04.2 | Invalid phone error on track |
| `04-03-no-orders-found.png` | TC-04.3 | No orders found state |
| `05-01-step1-login-page.png` | TC-05.1 | Staff login page |
| `05-01-step2-dashboard-loaded.png` | TC-05.1 | Staff dashboard after login |
| `05-02-admin-dashboard.png` | TC-05.2 | Admin dashboard view |
| `05-03-step1-order-list.png` | TC-05.3 | Order list in dashboard |
| `05-03-step2-order-detail.png` | TC-05.3 | Order detail view |
| `05-03-step3-status-confirmed.png` | TC-05.3 | Status: Confirmed |
| `05-03-step4-status-dispatched.png` | TC-05.3 | Status: Dispatched |
| `05-03-step5-status-delivered.png` | TC-05.3 | Status: Delivered |
| `05-04-filter-pending.png` | TC-05.4 | Orders filtered by Pending |
| `05-05-search-customer.png` | TC-05.5 | Search by customer name |
| `05-06-invalid-login.png` | TC-05.6 | Invalid credentials error |
| `06-01-admin-product-list.png` | TC-06.1 | Admin product management |
| `06-02-step1-add-product-modal.png` | TC-06.2 | Add product modal |
| `06-02-step2-form-filled.png` | TC-06.2 | Product form filled |
| `06-02-step3-product-created.png` | TC-06.2 | Product created in list |
| `06-03-edit-product-modal.png` | TC-06.3 | Edit product modal |
| `06-03-product-updated.png` | TC-06.3 | Product updated |
| `07-01-step1-order-placed.png` | TC-07.1 | Customer order placed |
| `07-01-step2-staff-views-order.png` | TC-07.1 | Staff views new order |
| `07-01-step3-confirmed.png` | TC-07.1 | Staff confirms order |
| `07-01-step4-dispatched.png` | TC-07.1 | Staff dispatches order |
| `07-01-step5-delivered.png` | TC-07.1 | Staff delivers order |
| `07-01-step6-customer-tracks-delivered.png` | TC-07.1 | Customer sees Delivered |
| `07-02-step1-order-placed.png` | TC-07.2 | Order placed for cancellation |
| `07-02-step2-order-cancelled.png` | TC-07.2 | Order cancelled |

## Bugs Found

None — all 26 tests pass on first run (after fixing the `is_active` field mismatch from the earlier session).

## Notes

- TC-07.1 is the highest-value test: it exercises the **complete lifecycle** across two user roles (customer places order → staff confirms → dispatches → delivers → customer tracks and sees "Delivered"). This is the test that would have caught the `is_active` bug.
- All screenshots are captured at key state transitions, not on every click — keeping the evidence focused and meaningful.
- Cart is client-side (localStorage/React state) — no DB verification needed for cart tests.
- Order placement tests verify the order exists in MySQL after submission.
