# Order Booking System

A web-based order booking system replacing WhatsApp-based ordering. Customers browse products, place orders, and track delivery — all through a web interface that routes orders directly to the office.

## Quick Start

```bash
# Backend (Go)
cd backend && make build && make run

# Frontend (React)
cd frontend && npm install && npm run dev
```

## Architecture

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Go + Chi router + sqlx
- **Database:** MySQL 8.0

## Features

### Customer
- Product catalog with category filtering and search
- Cart management (client-side, no server state)
- Order placement with delivery address
- Order tracking by phone number

### Staff Dashboard
- Real-time order feed (WebSocket)
- Order status management (pending -> confirmed -> preparing -> out_for_delivery -> delivered)
- Print-friendly order view

### Admin
- Product CRUD (categories, pricing, availability)
- User management (staff accounts)
- Full order visibility

## API

- `GET /api/v1/products` — list active products
- `POST /api/v1/orders` — place order (no auth required)
- `GET /api/v1/orders/track/:phone` — track by phone
- `POST /api/v1/auth/login` — staff/admin login
- `GET /api/v1/dashboard/orders` — staff order list
- `PATCH /api/v1/dashboard/orders/:id/status` — update order status
- `WS /api/v1/ws` — real-time order notifications

## Tests

- **Go unit tests:** 17 tests (auth + product services)
- **React unit tests:** 35 tests (components, stores, API client)
- **E2E tests:** Playwright (in progress)

```bash
# Run Go tests
cd backend && go test -v ./...

# Run React tests
cd frontend && npx vitest run
```
