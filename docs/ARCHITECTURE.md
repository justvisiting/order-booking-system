# Architecture — Order Booking System

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS |
| Backend | Go 1.22+, Chi router, sqlx |
| Database | MySQL 8.0 |
| Deployment | Docker Compose (single server) |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                   Clients                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Customer  │  │  Office  │  │  Admin   │  │
│  │  (Mobile) │  │ (Desktop)│  │ (Desktop)│  │
│  └─────┬─────┘  └─────┬────┘  └─────┬────┘  │
└────────┼───────────────┼─────────────┼───────┘
         │               │             │
         ▼               ▼             ▼
┌─────────────────────────────────────────────┐
│              React SPA (Vite)               │
│  /order    /dashboard    /admin             │
│  Static assets served via Nginx / Go embed  │
└────────────────────┬────────────────────────┘
                     │ HTTP/JSON + WebSocket
                     ▼
┌─────────────────────────────────────────────┐
│              Go API Server                  │
│                                             │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Orders  │ │ Products │ │   Auth     │  │
│  │ Handler │ │ Handler  │ │ Middleware │  │
│  └────┬────┘ └────┬─────┘ └────┬───────┘  │
│       │           │            │           │
│  ┌────▼───────────▼────────────▼────────┐  │
│  │           Service Layer              │  │
│  │  OrderService  ProductService  etc.  │  │
│  └────────────────┬─────────────────────┘  │
│                   │                        │
│  ┌────────────────▼─────────────────────┐  │
│  │         Repository Layer (sqlx)      │  │
│  └────────────────┬─────────────────────┘  │
└───────────────────┼────────────────────────┘
                    │
                    ▼
           ┌───────────────┐
           │   MySQL 8.0   │
           └───────────────┘
```

---

## Project Structure

```
order-system/
├── cmd/
│   └── server/
│       └── main.go              # Entry point
├── internal/
│   ├── config/
│   │   └── config.go            # Env/YAML config loader
│   ├── handler/
│   │   ├── order.go             # Order endpoints
│   │   ├── product.go           # Product endpoints
│   │   ├── customer.go          # Customer endpoints
│   │   └── admin.go             # Admin endpoints
│   ├── service/
│   │   ├── order.go             # Order business logic
│   │   ├── product.go           # Product business logic
│   │   └── customer.go          # Customer business logic
│   ├── repository/
│   │   ├── order.go             # Order DB queries
│   │   ├── product.go           # Product DB queries
│   │   └── customer.go          # Customer DB queries
│   ├── model/
│   │   ├── order.go             # Order structs
│   │   ├── product.go           # Product structs
│   │   └── customer.go          # Customer structs
│   ├── middleware/
│   │   ├── auth.go              # JWT/session auth
│   │   ├── cors.go              # CORS
│   │   └── logging.go           # Request logging
│   └── ws/
│       └── hub.go               # WebSocket hub for live order feed
├── migrations/
│   ├── 001_create_tables.up.sql
│   └── 001_create_tables.down.sql
├── web/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── OrderForm.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Admin.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── config.yaml
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## API Design

### Public (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/products` | List active products (with categories) |
| GET | `/api/v1/products/:id` | Product detail |
| POST | `/api/v1/orders` | Place new order |
| GET | `/api/v1/orders/:id` | Order status (by order ID + phone) |
| GET | `/api/v1/customers/:phone/orders` | Order history by phone number |

### Office (Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/dashboard/orders` | List orders (filterable) |
| GET | `/api/v1/dashboard/orders/:id` | Order detail |
| PATCH | `/api/v1/dashboard/orders/:id/status` | Update order status |
| WS | `/api/v1/dashboard/ws` | Live order feed |

### Admin (Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/products` | Create product |
| PUT | `/api/v1/admin/products/:id` | Update product |
| DELETE | `/api/v1/admin/products/:id` | Deactivate product |
| POST | `/api/v1/admin/categories` | Create category |
| PUT | `/api/v1/admin/categories/:id` | Update category |
| GET | `/api/v1/admin/customers` | List customers |
| POST | `/api/v1/admin/users` | Create staff/admin user |

---

## Authentication

- **Customers**: No auth. Phone number is identifier.
- **Office Staff / Admin**: JWT-based. Login with username + password.
- JWT stored in httpOnly cookie. 24h expiry. Refresh token for long sessions.
- Role-based access: `staff` (dashboard only), `admin` (full access).

---

## Real-time Updates

- WebSocket connection from dashboard to `/api/v1/dashboard/ws`
- Go server maintains a hub of connected clients
- When new order is created → broadcast to all connected dashboard clients
- Fallback: polling every 10s if WebSocket fails

---

## Deployment

Single-server Docker Compose:

```yaml
services:
  app:
    build: .
    ports: ["8080:8080"]
    depends_on: [db]
    environment:
      - DB_DSN=user:pass@tcp(db:3306)/orders?parseTime=true
  db:
    image: mysql:8.0
    volumes: ["mysql_data:/var/lib/mysql"]
    environment:
      - MYSQL_ROOT_PASSWORD=...
      - MYSQL_DATABASE=orders
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx.conf:/etc/nginx/conf.d/default.conf"]
```

Alternative: Go embeds the React build (`embed.FS`), single binary serves everything. No Nginx needed for small deployments.
