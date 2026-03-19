# System Design — Order Booking System

## Database Schema

```sql
-- Categories
CREATE TABLE categories (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    unit_price  DECIMAL(10,2) NOT NULL,
    unit        VARCHAR(50) DEFAULT 'piece',  -- piece, kg, litre, etc.
    image_url   VARCHAR(500),
    is_active   BOOLEAN DEFAULT TRUE,
    min_qty     INT DEFAULT 1,
    max_qty     INT DEFAULT 9999,
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_active (is_active),
    INDEX idx_category (category_id)
);

-- Customers (auto-created from orders)
CREATE TABLE customers (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    phone       VARCHAR(20) NOT NULL UNIQUE,
    email       VARCHAR(200),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
);

-- Orders
CREATE TABLE orders (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number    VARCHAR(20) NOT NULL UNIQUE,  -- e.g. ORD-20260315-001
    customer_id     BIGINT UNSIGNED NOT NULL,
    status          ENUM('pending','confirmed','dispatched','delivered','cancelled') DEFAULT 'pending',
    total_amount    DECIMAL(12,2) NOT NULL,
    notes           TEXT,
    -- Delivery info (denormalized for simplicity)
    delivery_address    TEXT NOT NULL,
    delivery_city       VARCHAR(100),
    delivery_state      VARCHAR(100),
    delivery_pincode    VARCHAR(10),
    delivery_lat        DECIMAL(10,8),
    delivery_lng        DECIMAL(11,8),
    -- Timestamps
    confirmed_at    TIMESTAMP NULL,
    dispatched_at   TIMESTAMP NULL,
    delivered_at    TIMESTAMP NULL,
    cancelled_at    TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_customer (customer_id),
    INDEX idx_order_number (order_number)
);

-- Order Items
CREATE TABLE order_items (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT UNSIGNED NOT NULL,
    product_id  BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(200) NOT NULL,   -- snapshot at order time
    unit_price  DECIMAL(10,2) NOT NULL,   -- snapshot at order time
    quantity    INT NOT NULL,
    line_total  DECIMAL(12,2) NOT NULL,   -- unit_price * quantity
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order (order_id)
);

-- Staff users (for dashboard/admin)
CREATE TABLE users (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,  -- bcrypt hash
    role        ENUM('staff','admin') DEFAULT 'staff',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Order status history (audit trail)
CREATE TABLE order_status_log (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT UNSIGNED NOT NULL,
    old_status  VARCHAR(20),
    new_status  VARCHAR(20) NOT NULL,
    changed_by  BIGINT UNSIGNED,  -- user id, NULL if system
    note        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_order (order_id)
);
```

---

## Order Number Generation

Format: `ORD-YYYYMMDD-NNN`

```go
// Atomic counter per day, stored in DB
// SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 14) AS UNSIGNED)), 0) + 1
// FROM orders WHERE DATE(created_at) = CURDATE()
// With mutex or SELECT ... FOR UPDATE to prevent race conditions
```

Alternative: Use a sequence table for guaranteed uniqueness under load.

---

## Key Design Decisions

### 1. Price Snapshot in Order Items

`order_items` stores `product_name` and `unit_price` at time of order — not a FK to current product price. Product prices can change without affecting historical orders.

### 2. Delivery Address Denormalized

Address fields live directly on the `orders` table, not a separate `addresses` table. For Phase 1, customers don't have accounts — each order captures its own delivery info. If customers get accounts later, we add an `addresses` table and FK.

### 3. Customer Upsert on Order

When an order comes in:
1. Look up customer by phone number
2. If exists → update name (if changed), link order
3. If not → create customer record, link order

```go
// Upsert customer
INSERT INTO customers (name, phone) VALUES (?, ?)
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW()
```

### 4. No Cart Table

Cart lives entirely in the frontend (React state + localStorage). No server-side cart. The order is submitted as a single POST with all items. This keeps the backend stateless and simple.

### 5. WebSocket for Live Feed

The dashboard uses WebSocket for instant order notifications. Architecture:

```
                    ┌──────────────┐
                    │  WebSocket   │
New Order ──POST──▶ │     Hub      │──broadcast──▶ Dashboard Client 1
                    │              │──broadcast──▶ Dashboard Client 2
                    └──────────────┘
```

Hub implementation:
- Map of connected clients (goroutine-safe with mutex)
- On new order: serialize order to JSON, send to all clients
- Client reconnects automatically on disconnect (frontend handles)

---

## Data Flow: Place Order

```
Customer (Browser)
    │
    ├─1─▶ GET /api/v1/products
    │      ◀── Product list with prices
    │
    ├─2─▶ [Client-side: build cart in localStorage]
    │
    └─3─▶ POST /api/v1/orders
           Body: {
             customer: { name, phone },
             delivery: { address, city, state, pincode, lat?, lng? },
             items: [{ product_id, quantity }],
             notes?: "..."
           }
           │
           ▼
    Go API Server
           │
           ├── Validate request
           ├── Lookup product prices (DB) — use current prices, not client-sent
           ├── Calculate line totals and order total
           ├── Upsert customer by phone
           ├── BEGIN TRANSACTION
           │   ├── INSERT order
           │   ├── INSERT order_items (with price snapshots)
           │   ├── INSERT order_status_log (initial: pending)
           │   └── COMMIT
           ├── Broadcast to WebSocket hub
           └── Return { order_number, total, status: "pending" }
```

**Important**: Server recalculates prices from DB. Never trust client-sent prices.

---

## Data Flow: Update Order Status

```
Office Staff (Dashboard)
    │
    └──▶ PATCH /api/v1/dashboard/orders/:id/status
          Body: { status: "confirmed" }
          │
          ▼
    Go API Server
          │
          ├── Validate status transition (pending→confirmed OK, delivered→pending NOT OK)
          ├── BEGIN TRANSACTION
          │   ├── UPDATE orders SET status, confirmed_at/dispatched_at/etc.
          │   ├── INSERT order_status_log
          │   └── COMMIT
          ├── Broadcast status change to WebSocket hub
          └── Return updated order
```

### Valid Status Transitions

```
pending ──▶ confirmed ──▶ dispatched ──▶ delivered
   │            │              │
   └────────────┴──────────────┴──────▶ cancelled
```

---

## Security

| Concern | Mitigation |
|---------|-----------|
| SQL injection | Parameterized queries (sqlx) |
| XSS | React auto-escapes. CSP headers. |
| CSRF | SameSite cookies + CSRF token |
| Rate limiting | Per-IP rate limit on order submission (e.g. 5/min) |
| Auth bypass | JWT validation middleware on all /dashboard and /admin routes |
| Price tampering | Server-side price lookup — never trust client prices |
| Phone enumeration | Rate limit on customer lookup endpoints |

---

## Performance Estimates

Assuming small-to-medium business (~100-500 orders/day):

| Metric | Target |
|--------|--------|
| Order submission | < 200ms p99 |
| Product list load | < 100ms p99 |
| Dashboard query (paginated) | < 300ms p99 |
| Concurrent WebSocket connections | < 50 |
| DB size (1 year) | < 1 GB |

Single server with 2 vCPU / 4 GB RAM handles this comfortably. No need for caching, queues, or microservices at this scale.

---

## Frontend Architecture

```
React App (Vite + TypeScript + Tailwind)
│
├── /order                    # Customer-facing
│   ├── ProductCatalog        # Browse & search products
│   ├── Cart                  # Cart sidebar/drawer
│   ├── OrderForm             # Name, phone, delivery address
│   ├── OrderReview           # Summary before submit
│   └── OrderConfirmation     # Success page with order #
│
├── /dashboard                # Office staff
│   ├── OrderList             # Filterable order table
│   ├── OrderDetail           # Full order view
│   ├── LiveFeed              # WebSocket-powered notifications
│   └── PrintView             # Print-friendly order layout
│
├── /admin                    # Admin panel
│   ├── ProductManager        # CRUD products
│   ├── CategoryManager       # CRUD categories
│   ├── UserManager           # Create/manage staff
│   └── Reports               # Basic order stats (Phase 2)
│
├── /shared
│   ├── api/                  # API client (fetch wrapper)
│   ├── hooks/                # useProducts, useOrders, useWebSocket
│   ├── components/           # Button, Input, Modal, Toast
│   └── utils/                # Format currency, dates, etc.
│
└── State: React Query (server state) + Zustand (cart state)
```

---

## Migration Strategy (WhatsApp → Web)

1. **Week 1**: Deploy system. Staff uses dashboard alongside WhatsApp.
2. **Week 2**: Share order link with top 20 customers. Collect feedback.
3. **Week 3**: All new customers get web link only. Existing customers encouraged.
4. **Week 4**: WhatsApp ordering deprecated. Web-only.

Key: Make the web form faster and easier than sending a WhatsApp message. If it's not, fix it until it is.
