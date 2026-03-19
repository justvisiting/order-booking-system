# E2E Test Report

**Date:** 2026-03-17
**Browser:** Chromium (Playwright)
**Environment:** Frontend http://localhost:3000 | Backend API http://localhost:8090 | DB MySQL orderdb
**Total Tests:** 16 | **Passed:** 16 | **Failed:** 0
**Duration:** ~27s

---

## Phase 1 - Customer Happy Path

### E2E-001: Browse products, see categories, filter by category
- **Status:** PASS
- **Input:** Navigate to /order, click category filter buttons
- **Expected:** Products displayed, category buttons visible, filtering works
- **Actual:** Products loaded, categories shown as filter buttons. Clicking a category filters products (active button highlighted blue). Clicking "All" resets the filter.
- **Screenshots:**
  - `test-results/screenshots/E2E-001-step-1-catalog-loaded.png`
  - `test-results/screenshots/E2E-001-step-2-categories-visible.png`
  - `test-results/screenshots/E2E-001-step-3-filtered-by-category.png`
  - `test-results/screenshots/E2E-001-step-4-filter-reset.png`

### E2E-002: Search products by name
- **Status:** PASS
- **Input:** Type partial product name in search, then type non-existent term, then clear
- **Expected:** Search filters products, no results message for invalid search, clearing restores all
- **Actual:** Typing partial name filters to matching products. Typing "xyznonexistent999" shows "No products found". Clearing search restores all products.
- **Screenshots:**
  - `test-results/screenshots/E2E-002-step-1-search-entered.png`
  - `test-results/screenshots/E2E-002-step-2-no-results.png`
  - `test-results/screenshots/E2E-002-step-3-search-cleared.png`

### E2E-003: Add to cart, adjust quantities
- **Status:** PASS
- **Input:** Add first product to cart, open cart sidebar, click +/- buttons
- **Expected:** Product added to cart, quantity adjustable
- **Actual:** Product added with success toast. Cart sidebar shows item. Plus button increases quantity, minus button decreases it.
- **Screenshots:**
  - `test-results/screenshots/E2E-003-step-1-product-added.png`
  - `test-results/screenshots/E2E-003-step-2-cart-opened.png`
  - `test-results/screenshots/E2E-003-step-3-quantity-increased.png`
  - `test-results/screenshots/E2E-003-step-4-quantity-decreased.png`

### E2E-004: Fill order form with valid delivery info
- **Status:** PASS
- **Input:** Name: "Test Customer", Phone: "9876543210", Address: "42 MG Road, Koramangala", City: "Bangalore", State: "Karnataka", Pincode: "560034"
- **Expected:** All fields accept input, values retained
- **Actual:** All fields filled successfully. Values verified via assertions on input values.
- **Screenshots:**
  - `test-results/screenshots/E2E-004-step-1-checkout-form.png`
  - `test-results/screenshots/E2E-004-step-2-form-filled.png`

### E2E-005: Review and submit order
- **Status:** PASS
- **Input:** Complete flow: add product, checkout, fill form, review, place order
- **Expected:** Review page shows customer info, items, total. Order submission succeeds.
- **Actual:** Review page displays customer name, phone, address, product name, and total. Clicking "Place Order" submits and shows confirmation.
- **Screenshots:**
  - `test-results/screenshots/E2E-005-step-1-review-page.png`
  - `test-results/screenshots/E2E-005-step-2-review-verified.png`
  - `test-results/screenshots/E2E-005-step-3-order-placed.png`

### E2E-006: See confirmation with order number
- **Status:** PASS
- **Input:** Complete order flow end-to-end
- **Expected:** Confirmation page with order number, track and continue shopping links
- **Actual:** "Order Placed Successfully!" displayed. Order number shown (non-empty string). "Track Order" and "Continue Shopping" buttons visible.
- **Screenshots:**
  - `test-results/screenshots/E2E-006-step-1-confirmation-page.png`
  - `test-results/screenshots/E2E-006-step-2-order-number-visible.png`
  - `test-results/screenshots/E2E-006-step-3-confirmation-complete.png`

---

## Phase 2 - Staff/Admin Happy Paths

### E2E-008: Staff login
- **Status:** PASS
- **Input:** Username: "staff", Password: "admin123"
- **Expected:** Staff logs in and sees dashboard with Orders link
- **Actual:** Login successful. Dashboard loads with Orders navigation link visible.
- **Screenshots:**
  - `test-results/screenshots/E2E-008-step-1-login-page.png`
  - `test-results/screenshots/E2E-008-step-2-credentials-entered.png`
  - `test-results/screenshots/E2E-008-step-3-staff-dashboard.png`
  - `test-results/screenshots/E2E-008-step-4-staff-dashboard-verified.png`

### E2E-010: Staff views order details
- **Status:** PASS
- **Input:** Create order as customer, then login as staff and view order detail
- **Expected:** Order detail page shows order number, customer info, items, total
- **Actual:** Staff sees order list with clickable order numbers. Order detail shows customer details, order items, and total amount.
- **Screenshots:**
  - `test-results/screenshots/E2E-010-step-1-staff-order-list.png`
  - `test-results/screenshots/E2E-010-step-2-order-detail.png`
  - `test-results/screenshots/E2E-010-step-3-order-detail-verified.png`

### E2E-011: Staff updates order lifecycle (pending -> confirmed -> dispatched -> delivered)
- **Status:** PASS
- **Input:** Create fresh order, login as staff, update status through all transitions
- **Expected:** Each status transition succeeds, final state is "delivered" with no further transitions
- **Actual:** Successfully transitioned: pending -> confirmed -> dispatched -> delivered. After delivery, no "Mark as" buttons are shown (no further transitions available).
- **Screenshots:**
  - `test-results/screenshots/E2E-011-step-1-order-pending.png`
  - `test-results/screenshots/E2E-011-step-2-order-confirmed.png`
  - `test-results/screenshots/E2E-011-step-3-order-dispatched.png`
  - `test-results/screenshots/E2E-011-step-4-order-delivered.png`
  - `test-results/screenshots/E2E-011-step-5-lifecycle-complete.png`

### E2E-015: Admin login
- **Status:** PASS
- **Input:** Username: "admin", Password: "admin123"
- **Expected:** Admin logs in and sees dashboard with admin-only nav links (Products, Categories, Users)
- **Actual:** Login successful. Dashboard loads with Products link visible in navigation (admin-only feature).
- **Screenshots:**
  - `test-results/screenshots/E2E-015-step-1-login-page.png`
  - `test-results/screenshots/E2E-015-step-2-credentials-entered.png`
  - `test-results/screenshots/E2E-015-step-3-admin-dashboard.png`
  - `test-results/screenshots/E2E-015-step-4-admin-nav-verified.png`

### E2E-016: Admin creates new product
- **Status:** PASS
- **Input:** Product name: unique timestamp-based name, Description: "A test product created by E2E tests", Price: 99.50, Unit: "piece"
- **Expected:** Product created and appears in admin product list
- **Actual:** Add Product modal opens. Form filled and submitted. Product appears in the product table after creation.
- **Screenshots:**
  - `test-results/screenshots/E2E-016-step-1-product-list.png`
  - `test-results/screenshots/E2E-016-step-2-add-product-modal.png`
  - `test-results/screenshots/E2E-016-step-3-product-form-filled.png`
  - `test-results/screenshots/E2E-016-step-4-product-created.png`

### E2E-034: Admin deactivates product -> customer can't see it (is_active regression test)
- **Status:** PASS
- **Input:** Create active product, verify visible to customer, deactivate via admin edit, verify hidden from customer
- **Expected:** Active product visible on customer catalog; deactivated product hidden
- **Actual:** Created product appears in customer catalog. After unchecking "Active" and updating, customer catalog no longer shows the product (page reload confirmed).
- **Screenshots:**
  - `test-results/screenshots/E2E-034-step-1-product-created-active.png`
  - `test-results/screenshots/E2E-034-step-2-product-visible-customer.png`
  - `test-results/screenshots/E2E-034-step-3-product-deactivated-form.png`
  - `test-results/screenshots/E2E-034-step-4-product-deactivated-admin.png`
  - `test-results/screenshots/E2E-034-step-5-product-hidden-customer.png`

---

## Phase 3 - Edge Cases & Error Handling

### E2E-021: Empty cart submission blocked
- **Status:** PASS
- **Input:** Navigate directly to /order/checkout with empty cart
- **Expected:** User cannot access checkout form with empty cart
- **Actual:** App redirects away from checkout. "Delivery Details" form and "Review Order" button are not visible. User is blocked from submitting an empty cart.
- **Screenshots:**
  - `test-results/screenshots/E2E-021-step-1-catalog-loaded-first.png`
  - `test-results/screenshots/E2E-021-step-2-after-checkout-redirect.png`
  - `test-results/screenshots/E2E-021-step-3-checkout-blocked.png`

### E2E-022: Invalid phone rejected
- **Status:** PASS
- **Input:** Phone: "12345" (5 digits instead of required 10)
- **Expected:** Validation error "Enter a valid 10-digit phone number"
- **Actual:** Form submission blocked. Error message "Enter a valid 10-digit phone number" displayed. User remains on checkout page.
- **Screenshots:**
  - `test-results/screenshots/E2E-022-step-1-invalid-phone-entered.png`
  - `test-results/screenshots/E2E-022-step-2-phone-error-shown.png`

### E2E-028: Missing required fields show errors
- **Status:** PASS
- **Input:** Submit checkout form with all fields empty
- **Expected:** Validation errors for all 6 required fields
- **Actual:** All 6 error messages displayed: "Name is required", "Phone is required", "Address is required", "City is required", "State is required", "Pincode is required". User remains on checkout page.
- **Screenshots:**
  - `test-results/screenshots/E2E-028-step-1-empty-form.png`
  - `test-results/screenshots/E2E-028-step-2-validation-errors.png`
  - `test-results/screenshots/E2E-028-step-3-all-errors-visible.png`

### E2E-029: Wrong credentials rejected
- **Status:** PASS
- **Input:** Username: "wronguser", Password: "wrongpass"; then empty fields
- **Expected:** Error message displayed, user remains on login page
- **Actual:** Error message matching "invalid/credentials/failed/error" displayed for wrong credentials. "Username and password are required" shown for empty fields. User remains on login page.
- **Screenshots:**
  - `test-results/screenshots/E2E-029-step-1-login-page.png`
  - `test-results/screenshots/E2E-029-step-2-wrong-credentials-submitted.png`
  - `test-results/screenshots/E2E-029-step-3-error-message-shown.png`
  - `test-results/screenshots/E2E-029-step-4-empty-fields-error.png`

---

## Bugs Found

No bugs found. All 16 test cases pass against the live application.

---

## Summary

| Phase | Tests | Passed | Failed |
|-------|-------|--------|--------|
| Phase 1 - Customer Happy Path | 6 | 6 | 0 |
| Phase 2 - Staff/Admin Paths | 6 | 6 | 0 |
| Phase 3 - Edge Cases | 4 | 4 | 0 |
| **Total** | **16** | **16** | **0** |

All tests run against real browser (Chromium), real API (localhost:8090), and real database (MySQL orderdb). Zero mocks, zero stubs. 55 screenshots captured at key state transitions.
