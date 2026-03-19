# E2E Test Plan — Order Booking System

**Author:** Alex (PM)
**Date:** 2026-03-16
**Stack:** React (localhost:3000) + Go API (localhost:8090) + MySQL
**Tool:** Playwright (real browser, real API, real database — zero mocks)

---

## Guiding Principles

1. Every test exercises the full production path: browser -> API -> database -> browser.
2. Screenshots are captured at decision points and final outcomes — not on every click.
3. Database verification happens after every write operation, because the UI lying is exactly the class of bug we need to catch (see: `is_active` vs `active` incident).
4. Test data is seeded per-suite and torn down after. Tests must not depend on each other's state.

---

## Test Data & Environment

| Item | Value |
|---|---|
| Customer URL | `http://localhost:3000` |
| Staff Dashboard URL | `http://localhost:3000/staff` |
| Admin Panel URL | `http://localhost:3000/admin` |
| API Base | `http://localhost:8090` |
| Test Admin Credentials | `admin@test.com` / `Admin123!` |
| Test Staff Credentials | `staff@test.com` / `Staff123!` |
| Seed Products | At least 3 active products across 2 categories |
| Seed Categories | "Vegetables", "Fruits" |

---

## 1. Happy Paths — Customer

---

### E2E-001: Browse Products and See Categories

| Field | Detail |
|---|---|
| **Test ID** | E2E-001 |
| **Test Name** | Customer browses product catalog and sees categories |
| **User Role** | Customer |
| **Category** | Happy Path |
| **Preconditions** | At least 3 active products exist across 2+ categories. Database has `products` rows with `is_active = 1` (or equivalent active flag — verify the actual column name). |
| **Steps** | 1. Navigate to `http://localhost:3000`. 2. Wait for product list to load. 3. Verify product cards are visible. 4. Click on category filter "Vegetables". 5. Verify only vegetable products are shown. 6. Click on category filter "Fruits". 7. Verify only fruit products are shown. 8. Click "All" or clear filter. 9. Verify all products are shown again. |
| **Expected Input** | None (browsing only). |
| **Expected Output** | Step 2-3: Product cards rendered with name, price, and image. Step 5: Only products belonging to "Vegetables" category visible. Step 7: Only "Fruits" products visible. Step 9: Full catalog restored. No "No products found" message at any point. |
| **Screenshots Required** | Step 3 (full catalog loaded), Step 5 (filtered to Vegetables), Step 7 (filtered to Fruits). |
| **Database Verification** | `SELECT COUNT(*) FROM products WHERE is_active = 1` matches the number of cards shown in Step 3. `SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id WHERE c.name = 'Vegetables' AND p.is_active = 1` matches Step 5 count. |

> **Why this test matters:** The `is_active` vs `active` field mismatch bug caused zero products to render. This test catches that class of bug immediately.

---

### E2E-002: Search and Filter Products

| Field | Detail |
|---|---|
| **Test ID** | E2E-002 |
| **Test Name** | Customer searches for a product by name |
| **User Role** | Customer |
| **Category** | Happy Path |
| **Preconditions** | A product named "Tomato" exists and is active. |
| **Steps** | 1. Navigate to homepage. 2. Locate search input field. 3. Type "Tomato". 4. Wait for results to update. 5. Verify "Tomato" product card is visible. 6. Clear search field. 7. Verify full catalog is restored. |
| **Expected Input** | Search query: `Tomato`. |
| **Expected Output** | Step 5: At least one product card containing "Tomato" in its name. No unrelated products shown (or clearly filtered). Step 7: Full product list restored. |
| **Screenshots Required** | Step 5 (search results). |
| **Database Verification** | `SELECT name FROM products WHERE name LIKE '%Tomato%' AND is_active = 1` returns at least one row. |

---

### E2E-003: Add Products to Cart and Adjust Quantities

| Field | Detail |
|---|---|
| **Test ID** | E2E-003 |
| **Test Name** | Customer adds products to cart and changes quantities |
| **User Role** | Customer |
| **Category** | Happy Path |
| **Preconditions** | At least 2 active products exist. Cart is empty (fresh session or cleared). |
| **Steps** | 1. Navigate to homepage. 2. Click "Add to Cart" on Product A. 3. Verify cart badge shows 1 item. 4. Click "Add to Cart" on Product B. 5. Verify cart badge shows 2 items. 6. Open cart. 7. Increase quantity of Product A to 3. 8. Verify subtotal updates correctly (Product A price x 3 + Product B price x 1). 9. Decrease quantity of Product B to 0 (or click remove). 10. Verify Product B is removed from cart. 11. Verify cart total = Product A price x 3. |
| **Expected Input** | Product A: quantity 3. Product B: quantity 0 (removed). |
| **Expected Output** | Step 3: Cart badge = "1". Step 5: Cart badge = "2". Step 8: Subtotal = (A.price * 3) + (B.price * 1), displayed correctly. Step 10: Product B no longer in cart. Step 11: Total = A.price * 3. |
| **Screenshots Required** | Step 6 (cart open with 2 items), Step 8 (after quantity adjustment), Step 11 (final cart state). |
| **Database Verification** | None (cart is client-side state until order submission). |

---

### E2E-004: Fill Order Form with Valid Delivery Info

| Field | Detail |
|---|---|
| **Test ID** | E2E-004 |
| **Test Name** | Customer fills delivery information form |
| **User Role** | Customer |
| **Category** | Happy Path |
| **Preconditions** | Cart has at least 1 item. |
| **Steps** | 1. Open cart and click "Proceed to Order" (or equivalent). 2. Fill in Name: "Ravi Kumar". 3. Fill in Phone: "9876543210". 4. Fill in Address: "42 MG Road, Sector 15". 5. Fill in Pincode: "560001". 6. Verify all fields are populated and no validation errors shown. 7. Verify "Submit Order" button is enabled. |
| **Expected Input** | Name: `Ravi Kumar`, Phone: `9876543210`, Address: `42 MG Road, Sector 15`, Pincode: `560001`. |
| **Expected Output** | Step 6: No red borders, no error messages. Step 7: Submit button is clickable/enabled. |
| **Screenshots Required** | Step 6 (completed form). |
| **Database Verification** | None yet (order not submitted). |

---

### E2E-005: Review and Submit Order

| Field | Detail |
|---|---|
| **Test ID** | E2E-005 |
| **Test Name** | Customer reviews order summary and submits |
| **User Role** | Customer |
| **Category** | Happy Path |
| **Preconditions** | Cart has items. Delivery form is filled with valid data. |
| **Steps** | 1. Complete delivery form (or continue from E2E-004). 2. If there is a review/summary step, verify items listed match cart contents. 3. Verify delivery details shown match what was entered. 4. Verify order total is correct. 5. Click "Submit Order" / "Place Order". 6. Wait for confirmation page/message. |
| **Expected Input** | Same as E2E-004. |
| **Expected Output** | Step 2: Item names, quantities, and prices match cart. Step 3: Name, phone, address, pincode displayed correctly. Step 4: Total matches cart total. Step 6: Order confirmation page loads. |
| **Screenshots Required** | Step 2 (order summary), Step 6 (confirmation). |
| **Database Verification** | `SELECT * FROM orders ORDER BY id DESC LIMIT 1` — verify: `customer_name = 'Ravi Kumar'`, `phone = '9876543210'`, `address = '42 MG Road, Sector 15'`, `pincode = '560001'`, `status = 'pending'`. `SELECT * FROM order_items WHERE order_id = <new_order_id>` — verify item count, product IDs, quantities, and prices match what was in the cart. |

---

### E2E-006: See Order Confirmation with Order Number

| Field | Detail |
|---|---|
| **Test ID** | E2E-006 |
| **Test Name** | Customer sees confirmation with order number after placing order |
| **User Role** | Customer |
| **Category** | Happy Path |
| **Preconditions** | Order was just submitted (continuation of E2E-005). |
| **Steps** | 1. On the confirmation page, locate the order number/ID. 2. Verify a success message is displayed (e.g. "Order placed successfully"). 3. Note the order number displayed. 4. Verify the cart is now empty (badge shows 0 or no badge). |
| **Expected Input** | None. |
| **Expected Output** | Step 1: An order number/ID is visible (e.g. "#1042" or "ORD-1042"). Step 2: Success message present. Step 4: Cart is empty. |
| **Screenshots Required** | Step 1 (confirmation page with order number). |
| **Database Verification** | `SELECT id FROM orders WHERE customer_name = 'Ravi Kumar' ORDER BY created_at DESC LIMIT 1` — returned ID matches the one displayed on screen. |

---

### E2E-007: Track Order Status

| Field | Detail |
|---|---|
| **Test ID** | E2E-007 |
| **Test Name** | Customer tracks their order status |
| **User Role** | Customer |
| **Category** | Happy Path |
| **Preconditions** | An order exists with a known order number. If tracking requires a lookup, the order number is available. |
| **Steps** | 1. Navigate to order tracking page (if available) or use the link from confirmation. 2. Enter order number or phone number if required. 3. Verify the order status is displayed as "Pending" (or the initial status). 4. Verify order details (items, total) are visible. |
| **Expected Input** | Order number from E2E-006 or phone number `9876543210`. |
| **Expected Output** | Step 3: Status shows "Pending". Step 4: Items and total match the placed order. |
| **Screenshots Required** | Step 3 (order tracking page with status). |
| **Database Verification** | `SELECT status FROM orders WHERE id = <order_id>` matches what is displayed. |

---

## 2. Happy Paths — Staff Dashboard

---

### E2E-008: Staff Login

| Field | Detail |
|---|---|
| **Test ID** | E2E-008 |
| **Test Name** | Staff member logs into dashboard |
| **User Role** | Staff |
| **Category** | Happy Path |
| **Preconditions** | Staff user `staff@test.com` exists in the database with correct role. |
| **Steps** | 1. Navigate to `http://localhost:3000/staff` (or `/login`). 2. Enter email: `staff@test.com`. 3. Enter password: `Staff123!`. 4. Click "Login". 5. Verify dashboard loads with order list. |
| **Expected Input** | Email: `staff@test.com`, Password: `Staff123!`. |
| **Expected Output** | Step 5: Dashboard page with order table/list visible. Staff name or role indicator shown. No error messages. |
| **Screenshots Required** | Step 5 (dashboard after login). |
| **Database Verification** | `SELECT role FROM users WHERE email = 'staff@test.com'` returns `staff`. |

---

### E2E-009: Staff Sees New Order in Live Feed

| Field | Detail |
|---|---|
| **Test ID** | E2E-009 |
| **Test Name** | New customer order appears in staff dashboard in real-time |
| **User Role** | Staff + Customer (two browser contexts) |
| **Category** | Happy Path |
| **Preconditions** | Staff is logged in on Browser Context A. Customer catalog is open on Browser Context B. |
| **Steps** | 1. (Context A) Staff dashboard is open, note the current order count. 2. (Context B) Customer places a new order (full flow: add to cart, fill form, submit). 3. (Context A) Wait up to 10 seconds for new order to appear. 4. (Context A) Verify the new order appears without page refresh. 5. (Context A) Verify the order shows customer name and "Pending" status. |
| **Expected Input** | Customer order with name "Live Test User", phone "9988776655". |
| **Expected Output** | Step 4: Order list count increases by 1 without manual refresh. Step 5: New row/card shows "Live Test User" and status "Pending". |
| **Screenshots Required** | Step 1 (dashboard before order), Step 4 (dashboard after order appears). |
| **Database Verification** | `SELECT * FROM orders WHERE customer_name = 'Live Test User'` exists with `status = 'pending'`. |

> **Why this test matters:** Proves WebSocket/polling is working. Staff missing orders in production means delayed deliveries.

---

### E2E-010: Staff Views Order Details

| Field | Detail |
|---|---|
| **Test ID** | E2E-010 |
| **Test Name** | Staff views full details of an order |
| **User Role** | Staff |
| **Category** | Happy Path |
| **Preconditions** | At least one order exists. Staff is logged in. |
| **Steps** | 1. On the dashboard, click on an order row/card. 2. Verify order detail view opens. 3. Verify customer name, phone, address, and pincode are displayed. 4. Verify order items are listed with product names, quantities, and prices. 5. Verify order total is correct. 6. Verify current status is shown. |
| **Expected Input** | None (viewing existing data). |
| **Expected Output** | Steps 3-6: All fields match the database record for that order. |
| **Screenshots Required** | Step 2 (order detail view). |
| **Database Verification** | Cross-reference every displayed field against `orders` and `order_items` tables for the selected order ID. |

---

### E2E-011: Staff Updates Order Through Full Lifecycle

| Field | Detail |
|---|---|
| **Test ID** | E2E-011 |
| **Test Name** | Staff moves order through pending -> confirmed -> dispatched -> delivered |
| **User Role** | Staff |
| **Category** | Happy Path |
| **Preconditions** | An order exists with status "pending". Staff is logged in. |
| **Steps** | 1. Open the pending order. 2. Click "Confirm" (or select status "Confirmed"). 3. Verify status updates to "Confirmed" in the UI. 4. Click "Dispatch" (or select status "Dispatched"). 5. Verify status updates to "Dispatched" in the UI. 6. Click "Deliver" (or select status "Delivered"). 7. Verify status updates to "Delivered" in the UI. 8. Verify no further status transitions are available (or only "Delivered" is shown). |
| **Expected Input** | Status transitions: pending -> confirmed -> dispatched -> delivered. |
| **Expected Output** | Step 3: UI shows "Confirmed". Step 5: UI shows "Dispatched". Step 7: UI shows "Delivered". Step 8: No forward status button or it is disabled. |
| **Screenshots Required** | Step 3 (Confirmed), Step 5 (Dispatched), Step 7 (Delivered). |
| **Database Verification** | After each status change: `SELECT status, updated_at FROM orders WHERE id = <order_id>`. Verify: Step 3: `status = 'confirmed'`. Step 5: `status = 'dispatched'`. Step 7: `status = 'delivered'`. Also verify `updated_at` advances with each change. |

---

### E2E-012: Staff Filters Orders by Status

| Field | Detail |
|---|---|
| **Test ID** | E2E-012 |
| **Test Name** | Staff filters order list by status |
| **User Role** | Staff |
| **Category** | Happy Path |
| **Preconditions** | Orders exist in multiple statuses (pending, confirmed, delivered). Staff is logged in. |
| **Steps** | 1. On the dashboard, select filter "Pending". 2. Verify only pending orders are shown. 3. Select filter "Delivered". 4. Verify only delivered orders are shown. 5. Clear filter / select "All". 6. Verify all orders are shown. |
| **Expected Input** | Filter selections: "Pending", "Delivered", "All". |
| **Expected Output** | Step 2: Every visible order has status "Pending". Step 4: Every visible order has status "Delivered". Step 6: Orders of all statuses visible. |
| **Screenshots Required** | Step 2 (filtered to Pending). |
| **Database Verification** | `SELECT COUNT(*) FROM orders WHERE status = 'pending'` matches count shown in Step 2. `SELECT COUNT(*) FROM orders WHERE status = 'delivered'` matches count shown in Step 4. |

---

### E2E-013: Staff Filters Orders by Date

| Field | Detail |
|---|---|
| **Test ID** | E2E-013 |
| **Test Name** | Staff filters orders by date range |
| **User Role** | Staff |
| **Category** | Happy Path |
| **Preconditions** | Orders exist across different dates. Staff is logged in. |
| **Steps** | 1. On the dashboard, set date filter to "Today". 2. Verify only today's orders are shown. 3. Set date range to a past date with known orders. 4. Verify the correct orders appear. |
| **Expected Input** | Date filter: today's date. |
| **Expected Output** | Step 2: All orders shown have today's date. Step 4: Orders match the selected date range. |
| **Screenshots Required** | Step 2 (filtered by today). |
| **Database Verification** | `SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()` matches Step 2 count. |

---

### E2E-014: Staff Prints Order

| Field | Detail |
|---|---|
| **Test ID** | E2E-014 |
| **Test Name** | Staff triggers print for an order |
| **User Role** | Staff |
| **Category** | Happy Path |
| **Preconditions** | An order exists. Staff is logged in. |
| **Steps** | 1. Open an order's detail view. 2. Click "Print" button. 3. Verify print dialog opens or a print-friendly view is rendered. 4. Verify the print view contains: customer name, address, items, total, order number. |
| **Expected Input** | None. |
| **Expected Output** | Step 3: Print dialog or print-formatted page appears. Step 4: All essential order details are present and legible. |
| **Screenshots Required** | Step 3 (print preview/dialog). |
| **Database Verification** | None (read-only operation). |

---

## 3. Happy Paths — Admin Panel

---

### E2E-015: Admin Login

| Field | Detail |
|---|---|
| **Test ID** | E2E-015 |
| **Test Name** | Admin logs into admin panel |
| **User Role** | Admin |
| **Category** | Happy Path |
| **Preconditions** | Admin user `admin@test.com` exists with admin role. |
| **Steps** | 1. Navigate to `http://localhost:3000/admin` (or `/login`). 2. Enter email: `admin@test.com`. 3. Enter password: `Admin123!`. 4. Click "Login". 5. Verify admin dashboard loads with management options. |
| **Expected Input** | Email: `admin@test.com`, Password: `Admin123!`. |
| **Expected Output** | Step 5: Admin panel visible with links/tabs for Products, Categories, Users. |
| **Screenshots Required** | Step 5 (admin dashboard). |
| **Database Verification** | `SELECT role FROM users WHERE email = 'admin@test.com'` returns `admin`. |

---

### E2E-016: Admin Creates New Product

| Field | Detail |
|---|---|
| **Test ID** | E2E-016 |
| **Test Name** | Admin creates a new product and it appears in customer catalog |
| **User Role** | Admin |
| **Category** | Happy Path |
| **Preconditions** | Admin is logged in. A category "Vegetables" exists. |
| **Steps** | 1. Navigate to Products management section. 2. Click "Add Product" / "New Product". 3. Fill in Name: "Organic Spinach". 4. Fill in Price: "45.00". 5. Select Category: "Vegetables". 6. Upload or select a product image (if required). 7. Ensure "Active" toggle is ON. 8. Click "Save" / "Create". 9. Verify success message appears. 10. Verify "Organic Spinach" appears in the product list. 11. Open customer catalog in a new tab and verify "Organic Spinach" is visible. |
| **Expected Input** | Name: `Organic Spinach`, Price: `45.00`, Category: `Vegetables`, Active: `true`. |
| **Expected Output** | Step 9: Success toast/message. Step 10: Product in admin list with correct name and price. Step 11: Product card visible in customer catalog with price "45.00". |
| **Screenshots Required** | Step 8 (filled form before save), Step 10 (product in admin list), Step 11 (product in customer catalog). |
| **Database Verification** | `SELECT name, price, is_active, category_id FROM products WHERE name = 'Organic Spinach'` — verify: `price = 45.00`, `is_active = 1`, `category_id` matches "Vegetables" category. |

> **Why this test matters:** Directly validates the active flag field name and value are consistent between backend write and frontend read.

---

### E2E-017: Admin Edits Product Price

| Field | Detail |
|---|---|
| **Test ID** | E2E-017 |
| **Test Name** | Admin edits a product's price |
| **User Role** | Admin |
| **Category** | Happy Path |
| **Preconditions** | Product "Organic Spinach" exists (from E2E-016 or seed data). Admin is logged in. |
| **Steps** | 1. Navigate to Products management. 2. Click edit on "Organic Spinach". 3. Change price from "45.00" to "55.00". 4. Click "Save" / "Update". 5. Verify success message. 6. Verify updated price shown in admin list. 7. Open customer catalog and verify price shows "55.00". |
| **Expected Input** | New price: `55.00`. |
| **Expected Output** | Step 5: Success message. Step 6: Price column shows "55.00". Step 7: Customer sees "55.00" on the product card. |
| **Screenshots Required** | Step 6 (admin list with updated price), Step 7 (customer catalog with updated price). |
| **Database Verification** | `SELECT price FROM products WHERE name = 'Organic Spinach'` returns `55.00`. |

---

### E2E-018: Admin Deactivates Product

| Field | Detail |
|---|---|
| **Test ID** | E2E-018 |
| **Test Name** | Admin deactivates a product and it disappears from customer catalog |
| **User Role** | Admin |
| **Category** | Happy Path |
| **Preconditions** | Product "Organic Spinach" exists and is active. Admin is logged in. |
| **Steps** | 1. Navigate to Products management. 2. Click edit on "Organic Spinach". 3. Toggle "Active" to OFF / set status to inactive. 4. Click "Save". 5. Verify success message. 6. Open customer catalog in new tab. 7. Verify "Organic Spinach" is NOT visible in the catalog. 8. Search for "Organic Spinach" in customer catalog. 9. Verify no results or "Organic Spinach" does not appear. |
| **Expected Input** | Active: `false`. |
| **Expected Output** | Step 7: Product card for "Organic Spinach" absent. Step 9: Search returns no match for this product. |
| **Screenshots Required** | Step 5 (admin showing deactivated), Step 7 (customer catalog without the product). |
| **Database Verification** | `SELECT is_active FROM products WHERE name = 'Organic Spinach'` returns `0` (or `false`). Verify the API endpoint `GET /api/products` (or equivalent) does NOT include "Organic Spinach" in the response. |

> **Critical test.** This is the exact scenario where the `is_active` vs `active` bug lived. The database write works, but the read query uses the wrong column name, so deactivated products still show up (or all products disappear). Both the DB check and the UI check are mandatory.

---

### E2E-019: Admin Creates and Edits Category

| Field | Detail |
|---|---|
| **Test ID** | E2E-019 |
| **Test Name** | Admin creates a new category and edits it |
| **User Role** | Admin |
| **Category** | Happy Path |
| **Preconditions** | Admin is logged in. |
| **Steps** | 1. Navigate to Categories management. 2. Click "Add Category". 3. Enter name: "Dairy". 4. Click "Save". 5. Verify "Dairy" appears in category list. 6. Click edit on "Dairy". 7. Change name to "Dairy & Eggs". 8. Click "Save". 9. Verify category name updated in the list. 10. Open customer catalog and verify "Dairy & Eggs" appears as a filter option. |
| **Expected Input** | Create: `Dairy`. Edit: `Dairy & Eggs`. |
| **Expected Output** | Step 5: "Dairy" in list. Step 9: "Dairy & Eggs" in list. Step 10: Filter option "Dairy & Eggs" available. |
| **Screenshots Required** | Step 5 (new category), Step 10 (category in customer filter). |
| **Database Verification** | `SELECT name FROM categories WHERE name = 'Dairy & Eggs'` returns one row. No row with `name = 'Dairy'` exists (it was renamed, not duplicated). |

---

### E2E-020: Admin Creates Staff User

| Field | Detail |
|---|---|
| **Test ID** | E2E-020 |
| **Test Name** | Admin creates a new staff user who can log in |
| **User Role** | Admin |
| **Category** | Happy Path |
| **Preconditions** | Admin is logged in. |
| **Steps** | 1. Navigate to Users management. 2. Click "Add User". 3. Enter name: "New Staff". 4. Enter email: "newstaff@test.com". 5. Enter password: "NewStaff123!". 6. Select role: "Staff". 7. Click "Save" / "Create". 8. Verify success message. 9. Log out of admin. 10. Navigate to staff login. 11. Login with `newstaff@test.com` / `NewStaff123!`. 12. Verify staff dashboard loads. |
| **Expected Input** | Name: `New Staff`, Email: `newstaff@test.com`, Password: `NewStaff123!`, Role: `Staff`. |
| **Expected Output** | Step 8: Success message. Step 12: Staff dashboard renders with order list. |
| **Screenshots Required** | Step 8 (user created), Step 12 (new staff logged in). |
| **Database Verification** | `SELECT email, role FROM users WHERE email = 'newstaff@test.com'` returns `role = 'staff'`. |

---

## 4. Edge Cases

---

### E2E-021: Empty Cart Submission Blocked

| Field | Detail |
|---|---|
| **Test ID** | E2E-021 |
| **Test Name** | Customer cannot submit an order with an empty cart |
| **User Role** | Customer |
| **Category** | Edge Case |
| **Preconditions** | Cart is empty. |
| **Steps** | 1. Navigate to homepage. 2. Without adding any products, try to navigate to checkout/order form. 3. If checkout is reachable, fill in valid delivery info and attempt to submit. |
| **Expected Input** | None (empty cart). |
| **Expected Output** | Step 2: Either the "Proceed to Order" button is disabled/hidden, OR Step 3: Submission is rejected with an error message like "Your cart is empty". No order is created. |
| **Screenshots Required** | Step 2 or 3 (error state or disabled button). |
| **Database Verification** | `SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL 1 MINUTE` — no new order was created during this test. |

---

### E2E-022: Invalid Phone Number Rejected

| Field | Detail |
|---|---|
| **Test ID** | E2E-022 |
| **Test Name** | Order form rejects invalid phone numbers |
| **User Role** | Customer |
| **Category** | Edge Case |
| **Preconditions** | Cart has at least 1 item. |
| **Steps** | 1. Proceed to order form. 2. Fill Name: "Test User". 3. Fill Phone: "123" (too short). 4. Fill Address: "Some Address". 5. Fill Pincode: "560001". 6. Click Submit. 7. Verify validation error on phone field. 8. Change Phone to "abcdefghij" (non-numeric). 9. Click Submit. 10. Verify validation error on phone field. 11. Change Phone to "9876543210" (valid). 12. Verify phone field validation passes. |
| **Expected Input** | Invalid: `123`, `abcdefghij`. Valid: `9876543210`. |
| **Expected Output** | Steps 7, 10: Error message near phone field (e.g. "Enter a valid 10-digit phone number"). Step 12: No error on phone field. |
| **Screenshots Required** | Step 7 (validation error). |
| **Database Verification** | No order created with phone "123" or "abcdefghij". |

---

### E2E-023: Invalid Pincode Rejected

| Field | Detail |
|---|---|
| **Test ID** | E2E-023 |
| **Test Name** | Order form rejects invalid pincode |
| **User Role** | Customer |
| **Category** | Edge Case |
| **Preconditions** | Cart has at least 1 item. |
| **Steps** | 1. Proceed to order form. 2. Fill Name: "Test User". 3. Fill Phone: "9876543210". 4. Fill Address: "Some Address". 5. Fill Pincode: "12" (too short). 6. Click Submit. 7. Verify validation error on pincode field. 8. Change Pincode to "ABCDEF" (non-numeric). 9. Click Submit. 10. Verify validation error on pincode field. |
| **Expected Input** | Invalid: `12`, `ABCDEF`. |
| **Expected Output** | Steps 7, 10: Error message near pincode field (e.g. "Enter a valid 6-digit pincode"). |
| **Screenshots Required** | Step 7 (validation error). |
| **Database Verification** | No order created with these pincodes. |

---

### E2E-024: Very Long Address Handling

| Field | Detail |
|---|---|
| **Test ID** | E2E-024 |
| **Test Name** | Order form handles very long address gracefully |
| **User Role** | Customer |
| **Category** | Edge Case |
| **Preconditions** | Cart has at least 1 item. |
| **Steps** | 1. Proceed to order form. 2. Fill Name: "Test User". 3. Fill Phone: "9876543210". 4. Fill Address: A 500-character string ("A" repeated 500 times, or a realistic long address). 5. Fill Pincode: "560001". 6. Click Submit. 7. If order succeeds: verify the full address is stored. If rejected: verify a clear error message is shown. |
| **Expected Input** | Address: 500-character string. |
| **Expected Output** | Step 7: Either (a) order created successfully and address is fully stored, or (b) validation error like "Address too long" — NOT a 500 error or silent truncation. |
| **Screenshots Required** | Step 7 (result — success or error). |
| **Database Verification** | If order was created: `SELECT address FROM orders ORDER BY id DESC LIMIT 1` — verify the address is complete and not truncated. If rejected: no new order row. |

---

### E2E-025: Adding Same Product Multiple Times

| Field | Detail |
|---|---|
| **Test ID** | E2E-025 |
| **Test Name** | Adding the same product to cart multiple times increments quantity |
| **User Role** | Customer |
| **Category** | Edge Case |
| **Preconditions** | Cart is empty. At least 1 active product exists. |
| **Steps** | 1. Navigate to homepage. 2. Click "Add to Cart" on Product A. 3. Click "Add to Cart" on Product A again. 4. Click "Add to Cart" on Product A a third time. 5. Open cart. 6. Verify Product A appears once with quantity 3 (not three separate entries). 7. Verify total = Product A price x 3. |
| **Expected Input** | Product A added 3 times. |
| **Expected Output** | Step 6: Single line item, quantity = 3. Step 7: Correct total. |
| **Screenshots Required** | Step 5 (cart showing quantity 3). |
| **Database Verification** | None (cart is client-side). |

---

### E2E-026: Removing All Items from Cart

| Field | Detail |
|---|---|
| **Test ID** | E2E-026 |
| **Test Name** | Customer removes all items from cart |
| **User Role** | Customer |
| **Category** | Edge Case |
| **Preconditions** | Cart has 2+ items. |
| **Steps** | 1. Open cart. 2. Remove item 1. 3. Remove item 2 (and any remaining). 4. Verify cart shows empty state (e.g. "Your cart is empty"). 5. Verify "Proceed to Order" is disabled or hidden. 6. Verify cart badge shows 0 or is hidden. |
| **Expected Input** | None. |
| **Expected Output** | Step 4: Empty cart message. Step 5: No way to proceed to checkout. Step 6: Badge gone or shows 0. |
| **Screenshots Required** | Step 4 (empty cart). |
| **Database Verification** | None (cart is client-side). |

---

### E2E-027: Product Deactivated While in Cart

| Field | Detail |
|---|---|
| **Test ID** | E2E-027 |
| **Test Name** | Product deactivated by admin while customer has it in cart |
| **User Role** | Admin + Customer (two browser contexts) |
| **Category** | Edge Case |
| **Preconditions** | Product "Fragile Item" exists and is active. Customer has "Fragile Item" in cart (Browser Context B). Admin is logged in (Browser Context A). |
| **Steps** | 1. (Context B) Customer adds "Fragile Item" to cart. 2. (Context A) Admin deactivates "Fragile Item". 3. (Context B) Customer proceeds to checkout and submits order. 4. Verify behavior: either (a) order is rejected with a message that the product is no longer available, or (b) order succeeds but with a warning. |
| **Expected Input** | Cart contains a now-deactivated product. |
| **Expected Output** | Step 4: The system handles this gracefully. Acceptable outcomes: error message explaining the product is unavailable, or automatic removal of the item from the order. NOT acceptable: 500 error, silent order with wrong items, or charging for an unavailable product. |
| **Screenshots Required** | Step 3 (attempting checkout), Step 4 (result). |
| **Database Verification** | `SELECT is_active FROM products WHERE name = 'Fragile Item'` returns `0`. If order was created: verify `order_items` does NOT contain the deactivated product. If order was rejected: no new order row. |

> **High-value edge case.** Race conditions between admin actions and customer checkout are exactly the bugs that only surface in production.

---

## 5. Error Handling

---

### E2E-028: Customer Submits Order with Missing Required Fields

| Field | Detail |
|---|---|
| **Test ID** | E2E-028 |
| **Test Name** | Order form shows errors for all missing required fields |
| **User Role** | Customer |
| **Category** | Error Handling |
| **Preconditions** | Cart has at least 1 item. |
| **Steps** | 1. Proceed to order form. 2. Leave ALL fields empty. 3. Click Submit. 4. Verify error messages appear for: Name, Phone, Address, Pincode. 5. Fill only Name, leave rest empty, click Submit. 6. Verify errors still shown for Phone, Address, Pincode but NOT for Name. |
| **Expected Input** | Step 2: All empty. Step 5: Name only. |
| **Expected Output** | Step 4: 4 validation errors visible. Step 6: 3 validation errors visible (Name error gone). |
| **Screenshots Required** | Step 4 (all errors), Step 6 (partial errors). |
| **Database Verification** | No order created. |

---

### E2E-029: Staff Login with Wrong Credentials

| Field | Detail |
|---|---|
| **Test ID** | E2E-029 |
| **Test Name** | Staff login fails with wrong password |
| **User Role** | Staff |
| **Category** | Error Handling |
| **Preconditions** | Staff user exists. |
| **Steps** | 1. Navigate to staff login. 2. Enter email: `staff@test.com`. 3. Enter password: `WrongPassword!`. 4. Click Login. 5. Verify error message (e.g. "Invalid credentials"). 6. Verify user is NOT redirected to dashboard. 7. Verify no auth token/cookie is set. |
| **Expected Input** | Email: `staff@test.com`, Password: `WrongPassword!`. |
| **Expected Output** | Step 5: Error message visible. Step 6: Still on login page. |
| **Screenshots Required** | Step 5 (login error). |
| **Database Verification** | None (no state change). |

---

### E2E-030: Admin Login with Wrong Credentials

| Field | Detail |
|---|---|
| **Test ID** | E2E-030 |
| **Test Name** | Admin login fails with wrong password |
| **User Role** | Admin |
| **Category** | Error Handling |
| **Preconditions** | Admin user exists. |
| **Steps** | 1. Navigate to admin login. 2. Enter email: `admin@test.com`. 3. Enter password: `WrongPassword!`. 4. Click Login. 5. Verify error message. 6. Verify user remains on login page. |
| **Expected Input** | Email: `admin@test.com`, Password: `WrongPassword!`. |
| **Expected Output** | Step 5: Error message (e.g. "Invalid credentials"). Step 6: Not redirected. |
| **Screenshots Required** | Step 5 (error). |
| **Database Verification** | None. |

---

### E2E-031: Unauthorized Access to Staff Dashboard

| Field | Detail |
|---|---|
| **Test ID** | E2E-031 |
| **Test Name** | Unauthenticated user cannot access staff dashboard |
| **User Role** | None (unauthenticated) |
| **Category** | Error Handling |
| **Preconditions** | No user is logged in (clear cookies/storage). |
| **Steps** | 1. Clear all cookies and local storage. 2. Navigate directly to `http://localhost:3000/staff/dashboard` (or the protected staff route). 3. Verify the user is redirected to login page or sees an "Unauthorized" message. |
| **Expected Input** | None. |
| **Expected Output** | Step 3: Redirect to login OR 401/403 message. Dashboard content is NOT visible. |
| **Screenshots Required** | Step 3 (redirect or error). |
| **Database Verification** | None. |

---

### E2E-032: Unauthorized Access to Admin Panel

| Field | Detail |
|---|---|
| **Test ID** | E2E-032 |
| **Test Name** | Unauthenticated user cannot access admin panel |
| **User Role** | None (unauthenticated) |
| **Category** | Error Handling |
| **Preconditions** | No user is logged in. |
| **Steps** | 1. Clear all cookies and local storage. 2. Navigate directly to `http://localhost:3000/admin/products` (or a protected admin route). 3. Verify redirect to login or "Unauthorized" message. |
| **Expected Input** | None. |
| **Expected Output** | Step 3: Redirect or access denied. Admin content NOT visible. |
| **Screenshots Required** | Step 3 (result). |
| **Database Verification** | None. |

---

### E2E-033: Staff User Cannot Access Admin Panel

| Field | Detail |
|---|---|
| **Test ID** | E2E-033 |
| **Test Name** | Staff role cannot access admin-only routes |
| **User Role** | Staff |
| **Category** | Error Handling |
| **Preconditions** | Staff user is logged in. |
| **Steps** | 1. Login as staff. 2. Navigate directly to `http://localhost:3000/admin/products`. 3. Verify access denied or redirect to staff dashboard. |
| **Expected Input** | None. |
| **Expected Output** | Step 3: Admin panel content NOT visible. Redirect to staff area or "Forbidden" message. |
| **Screenshots Required** | Step 3 (access denied). |
| **Database Verification** | None. |

---

## 6. Cross-Flow Tests

---

### E2E-034: Admin Deactivates Product, Customer Cannot See It

| Field | Detail |
|---|---|
| **Test ID** | E2E-034 |
| **Test Name** | Product deactivation by admin is reflected in customer catalog |
| **User Role** | Admin + Customer (two browser contexts) |
| **Category** | Cross-flow |
| **Preconditions** | Product "Test Mango" exists and is active. Admin is logged in (Context A). |
| **Steps** | 1. (Context B) Customer opens catalog, verifies "Test Mango" is visible. 2. (Context A) Admin navigates to Products, deactivates "Test Mango". 3. (Context B) Customer refreshes the catalog page. 4. (Context B) Verify "Test Mango" is no longer visible. 5. (Context B) Search for "Test Mango". 6. (Context B) Verify no results. |
| **Expected Input** | None. |
| **Expected Output** | Step 1: "Test Mango" visible. Step 4: "Test Mango" gone. Step 6: Search returns nothing. |
| **Screenshots Required** | Step 1 (product visible), Step 4 (product gone). |
| **Database Verification** | `SELECT is_active FROM products WHERE name = 'Test Mango'` returns `0`. API call `GET /api/products` does not include "Test Mango". |

> **This is the regression test for the `is_active` bug.** If this test passes, the field name is consistent across the entire stack.

---

### E2E-035: Customer Places Order, Staff Sees It Real-Time

| Field | Detail |
|---|---|
| **Test ID** | E2E-035 |
| **Test Name** | Customer order appears on staff dashboard via WebSocket |
| **User Role** | Customer + Staff (two browser contexts) |
| **Category** | Cross-flow |
| **Preconditions** | Staff logged in (Context A). Customer on catalog (Context B). |
| **Steps** | 1. (Context A) Note the top order in the staff list (or the count). 2. (Context B) Customer adds a product to cart. 3. (Context B) Customer fills order form: Name "Realtime Test", Phone "9999000099". 4. (Context B) Customer submits order. 5. (Context B) Customer sees confirmation with order number. 6. (Context A) Within 10 seconds, verify new order "Realtime Test" appears in staff list WITHOUT page refresh. 7. (Context A) Click on the new order, verify details match. |
| **Expected Input** | Name: `Realtime Test`, Phone: `9999000099`. |
| **Expected Output** | Step 5: Order number displayed. Step 6: "Realtime Test" appears in staff dashboard. Step 7: Customer name, phone, items, and total all match. |
| **Screenshots Required** | Step 5 (customer confirmation), Step 6 (staff dashboard showing new order). |
| **Database Verification** | `SELECT id, customer_name, phone, status FROM orders WHERE customer_name = 'Realtime Test'` — exists, `status = 'pending'`. |

---

### E2E-036: Staff Marks Order Delivered, Status Reflected for Customer

| Field | Detail |
|---|---|
| **Test ID** | E2E-036 |
| **Test Name** | Delivery status update by staff is visible to customer |
| **User Role** | Staff + Customer (two browser contexts) |
| **Category** | Cross-flow |
| **Preconditions** | An order exists with status "pending". Staff is logged in (Context A). Customer has the order tracking page open (Context B). |
| **Steps** | 1. (Context B) Customer views order, status shows "Pending". 2. (Context A) Staff opens the order, changes status to "Confirmed". 3. (Context B) Customer refreshes or waits for update, verifies status is "Confirmed". 4. (Context A) Staff changes status to "Dispatched". 5. (Context B) Customer verifies status is "Dispatched". 6. (Context A) Staff changes status to "Delivered". 7. (Context B) Customer verifies status is "Delivered". |
| **Expected Input** | Status transitions by staff. |
| **Expected Output** | Steps 3, 5, 7: Customer sees the updated status matching what staff set. |
| **Screenshots Required** | Step 1 (Pending), Step 3 (Confirmed from customer view), Step 7 (Delivered from customer view). |
| **Database Verification** | After Step 7: `SELECT status FROM orders WHERE id = <order_id>` returns `delivered`. |

---

## 7. Data Integrity Tests

---

### E2E-037: Order Total Matches Sum of Line Items

| Field | Detail |
|---|---|
| **Test ID** | E2E-037 |
| **Test Name** | Database order total equals sum of (quantity x price) for all line items |
| **User Role** | Customer |
| **Category** | Happy Path |
| **Preconditions** | None. |
| **Steps** | 1. Customer adds Product A (qty 2) and Product B (qty 1) to cart. 2. Proceed to checkout. 3. Note the total displayed. 4. Submit order. |
| **Expected Input** | Product A x2, Product B x1. |
| **Expected Output** | Step 3: Total = (A.price * 2) + (B.price * 1). |
| **Screenshots Required** | Step 3 (order total). |
| **Database Verification** | `SELECT SUM(oi.quantity * oi.price) AS computed_total FROM order_items oi WHERE oi.order_id = <new_order_id>`. Compare against `orders.total` (if stored). Both must match the total shown in the UI. If they differ, the pricing pipeline has a bug. |

---

### E2E-038: Product Price at Time of Order Is Preserved

| Field | Detail |
|---|---|
| **Test ID** | E2E-038 |
| **Test Name** | Changing product price after order does not change the order's line item price |
| **User Role** | Customer + Admin |
| **Category** | Cross-flow |
| **Preconditions** | Product "Price Lock Item" exists at price 100.00. |
| **Steps** | 1. Customer places an order containing "Price Lock Item" at 100.00. 2. Note the order ID. 3. Admin changes "Price Lock Item" price to 150.00. 4. Staff/Customer views the order details. 5. Verify the order still shows 100.00 for that item. |
| **Expected Input** | Original price: 100.00. New price: 150.00. |
| **Expected Output** | Step 5: Order line item shows 100.00, not 150.00. |
| **Screenshots Required** | Step 5 (order detail showing original price). |
| **Database Verification** | `SELECT price FROM order_items WHERE order_id = <order_id> AND product_id = <price_lock_item_id>` returns `100.00`. `SELECT price FROM products WHERE name = 'Price Lock Item'` returns `150.00`. These MUST be different — proving the order captured the price at time of purchase. |

---

## Summary

| Category | Test IDs | Count |
|---|---|---|
| Customer Happy Path | E2E-001 through E2E-007 | 7 |
| Staff Happy Path | E2E-008 through E2E-014 | 7 |
| Admin Happy Path | E2E-015 through E2E-020 | 6 |
| Edge Cases | E2E-021 through E2E-027 | 7 |
| Error Handling | E2E-028 through E2E-033 | 6 |
| Cross-Flow | E2E-034 through E2E-036 | 3 |
| Data Integrity | E2E-037 through E2E-038 | 2 |
| **Total** | | **38** |

## Execution Notes

1. **Test order matters for some tests.** E2E-016 creates "Organic Spinach" used by E2E-017 and E2E-018. Run customer happy paths first, then staff, then admin, then edge cases, then cross-flow. Alternatively, seed all required data in a `beforeAll` hook and run independently.

2. **Two-context tests** (E2E-009, E2E-027, E2E-034, E2E-035, E2E-036, E2E-038) require Playwright's `browser.newContext()` to simulate two users simultaneously. These are the highest-value tests because they catch integration bugs that single-user tests miss.

3. **Database cleanup:** Each test suite should run in a transaction or clean up its created data. Use `beforeEach` / `afterEach` hooks. Never assume the database is in a specific state — seed what you need.

4. **Screenshot storage:** Save to `test-results/screenshots/{test-id}-{step}.png`. Attach to Playwright HTML report.

5. **CI timeout:** Individual tests should complete in under 30 seconds. Cross-flow tests with WebSocket waits may need up to 60 seconds. Total suite target: under 10 minutes.

6. **The `is_active` regression:** Tests E2E-001, E2E-016, E2E-018, and E2E-034 all verify active/inactive product behavior from different angles. If any of these fail, check the column name in the products table schema, the Go struct tags, and the API query's WHERE clause — that is where the last critical bug lived.
