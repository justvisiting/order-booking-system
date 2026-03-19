# ADR-004: Monolith Architecture

## Status
Accepted

## Context
We needed to decide how to structure the order management system: as a single deployable unit or as separate services (e.g., order service, product catalog service, auth service, notification service). The system handles product browsing, order placement, order lifecycle management, user authentication, and real-time dashboard updates.

## Decision
We chose a **monolithic architecture** with a clean internal layered structure.

The entire backend is a single Go binary (`cmd/server/main.go`) that handles all concerns:
- REST API for products, orders, customers, and admin operations
- WebSocket server for real-time dashboard updates
- JWT authentication and role-based authorization
- All database access through a shared MySQL connection pool

**Internal structure** follows a layered pattern under `internal/`:
```
internal/
├── config/      — YAML + env var configuration
├── handler/     — HTTP handlers (transport layer)
├── middleware/  — Auth, CORS, logging
├── model/       — Data structures (User, Order, Product, Customer)
├── repository/  — SQL queries via sqlx (data access layer)
├── service/     — Business logic (domain layer)
└── ws/          — WebSocket hub
```

**Key architectural patterns**:
1. **Dependency injection via constructors**: `main.go` (lines 45-64) wires all dependencies — repos are created with the DB connection, services are created with repos, handlers are created with services. No global state, no service locator.
2. **Interface-based boundaries**: Services depend on repository interfaces, not concrete implementations. `AuthService` takes a `UserRepository` interface, `OrderService` takes `OrderRepository`, etc. This is what enables unit testing with mock repos.
3. **Unidirectional data flow**: Handlers → Services → Repositories. Handlers never call repositories directly. Services contain all business logic (validation, status transition rules, transaction management).
4. **In-process event dispatch**: The WebSocket hub runs as a goroutine in the same process. `OrderService` calls `hub.Broadcast()` directly after order creation/status updates — no network hop, no serialization overhead.

## Consequences
- **Positive**: Single binary deployment via Docker. Our `docker-compose.yml` runs exactly 3 containers: MySQL, the Go app, and the React frontend. No service mesh, no inter-service auth, no distributed tracing needed.
- **Positive**: Transactions are simple. `PlaceOrder` uses a single database transaction to atomically create the order, line items, and status log. With microservices, this would require a saga pattern or two-phase commit.
- **Positive**: Refactoring is safe. Renaming a model field or changing a service interface is a compile-time check across the entire codebase. No risk of breaking a downstream service you forgot about.
- **Positive**: The WebSocket hub broadcasts via Go channels in-process. Zero latency, no serialization. With microservices, we'd need Redis pub/sub or similar to coordinate across instances.
- **Negative**: The entire system scales as one unit. If product browsing gets 10x more traffic than the dashboard, we can't scale them independently.
- **Negative**: A bug in one area (e.g., a panic in WebSocket handling) can crash the entire server, affecting all functionality.
- **Negative**: All developers work in the same codebase. At larger team sizes, this creates merge conflicts and requires careful code ownership boundaries.
- **Trade-off**: The layered internal structure gives us the option to extract services later. Repository interfaces and service boundaries are already defined — splitting into microservices would mean promoting `internal/service/order.go` to its own service with a gRPC/HTTP API, keeping the same interface.

## Alternatives Considered

### Microservices
Separate services for auth, products, orders, and notifications. Rejected because:
- Team size doesn't justify the operational overhead — we'd spend more time on inter-service communication, distributed tracing, and deployment orchestration than on feature development
- Order placement requires atomicity across orders, items, and status log. A saga pattern for this simple case is over-engineering
- The WebSocket notification system benefits from being co-located with the order service — direct in-process broadcast vs. needing a message broker
- We can extract services later if scale demands it; starting with a monolith lets us move fast and discover the right service boundaries empirically

### Modular monolith with Go modules
Separate Go modules within one repo, enforcing boundaries via module imports. Rejected because:
- Adds tooling complexity (multi-module workspaces, import cycle management) without clear benefit at our current size
- Go's `internal/` package convention already provides reasonable encapsulation
- The overhead of managing module versions for internal packages isn't worth it until we have a much larger codebase
