# Product Spec — Order Booking System

## Problem

Orders currently come in via WhatsApp — unstructured, easy to lose, impossible to track. No visibility into order status, no delivery tracking, no analytics. Office staff manually transcribes messages into spreadsheets.

## Solution

A web-based order booking system that lets customers place orders directly. Orders land in the office dashboard in real-time. No WhatsApp. No middleman.

---

## User Roles

| Role | Description |
|------|-------------|
| **Customer** | Places orders via web form. Can view order history. |
| **Office Staff** | Receives orders, updates status, manages delivery. |
| **Admin** | Manages products, pricing, users, and system config. |

---

## Core Features

### 1. Order Placement (Customer-facing)

- **Product selection** — Browse catalog, search, filter by category
- **Quantity** — Numeric input with min/max constraints per product
- **Price display** — Unit price, line total, order total (auto-calculated)
- **Customer info** — Name, phone number (required), email (optional)
- **Delivery location** — Address input with pincode, city, state. Optional: GPS pin drop
- **Order notes** — Free-text field for special instructions
- **Order confirmation** — Summary screen before submission, confirmation with order ID after

### 2. Office Dashboard (Staff-facing)

- **Live order feed** — New orders appear in real-time (WebSocket or polling)
- **Order list** — Filterable by date, status, customer, delivery area
- **Order detail** — Full order info, customer details, delivery address, notes
- **Status management** — Update order status: `pending → confirmed → dispatched → delivered → cancelled`
- **Print order** — One-click print-friendly view for dispatch

### 3. Product Management (Admin)

- **Product CRUD** — Name, description, unit price, category, image (optional), active/inactive toggle
- **Category management** — Group products for catalog browsing
- **Bulk price update** — Update prices for multiple products at once

### 4. Customer Management

- **Customer directory** — Auto-created from orders, searchable
- **Order history per customer** — All past orders, total spend
- **Repeat order** — Customer can re-order from their history

---

## Non-functional Requirements

- **Mobile-first** — Customer order form must work well on phones (most users will be on mobile)
- **Fast** — Order form loads in <2s, submission in <1s
- **Offline-resilient** — If network drops mid-order, form state is preserved locally
- **No login required for customers** — Phone number is the identifier. OTP optional (Phase 2)
- **Responsive dashboard** — Office staff may use tablet or desktop

---

## Out of Scope (Phase 1)

- Payment integration (orders are pay-on-delivery or offline payment)
- Inventory management (track stock levels)
- Delivery routing / driver tracking
- Multi-tenant / multi-office
- Customer login / authentication (phone number lookup only)
- SMS/WhatsApp notifications (ironic, but Phase 2)

---

## Success Metrics

- Zero orders via WhatsApp within 30 days of launch
- Average order placement time < 2 minutes
- Office staff processes orders 50% faster vs manual transcription
- Zero lost orders

---

## User Flows

### Customer Places Order

```
Landing Page → Browse/Search Products → Add to Cart → Enter Details (name, phone, address) → Review Order → Submit → Confirmation (Order #)
```

### Office Receives Order

```
Dashboard → New Order Alert → View Order → Confirm → Dispatch → Mark Delivered
```

### Admin Manages Products

```
Admin Panel → Products → Add/Edit/Deactivate Product → Set Price → Save
```
