# ADR-002: Choice of MySQL over PostgreSQL

## Status
Accepted

## Context
We needed a relational database for an order management system with transactional requirements: orders must atomically create the order record, line items, and an initial status log entry. The schema involves foreign key relationships (orders → customers, order_items → products), ENUM types for order status, and indexed queries for filtering orders by status and date.

## Decision
We chose **MySQL 8.0** with **sqlx** (`github.com/jmoiron/sqlx`) as the database driver/wrapper.

Key implementation details:
- **DSN format**: `user:password@tcp(host:port)/dbname?parseTime=true&loc=Local` in `internal/config/config.go`
- **Connection pooling**: MaxOpenConns=25, MaxIdleConns=5, ConnMaxLifetime=5min (configured in `config.yaml`)
- **Schema** (`migrations/001_create_tables.up.sql`): 6 tables — `users`, `categories`, `products`, `customers`, `orders`, `order_items`, plus `order_status_log` for audit trail
- **Transactions**: `PlaceOrder` in `internal/service/order.go` uses `sqlx.Tx` with `BeginTx` to atomically insert the order, all line items, and the initial "pending" status log
- **ENUM usage**: Order status is `ENUM('pending','confirmed','dispatched','delivered','cancelled')` — enforced at the database level
- **Parameterized queries**: All repository methods use `?` placeholder syntax with `ExecContext()`/`GetContext()`

Why MySQL over PostgreSQL:
1. **Operational familiarity** — The team has production experience running MySQL. We know how to tune InnoDB buffer pools, diagnose slow queries, and manage backups.
2. **Sufficient feature set** — Our query patterns are straightforward: indexed lookups by status/customer_id/created_at, JOIN queries for denormalized reads (orders with customer names), and transactional writes. We don't need PostgreSQL's advanced features (JSONB, array types, CTEs with materialized hints).
3. **ENUM support** — MySQL's native ENUM type maps directly to our order status workflow. The `order_status_log` table provides a full audit trail of status transitions with `changed_by` tracking.
4. **Docker ecosystem** — The official `mysql:8.0` Docker image is battle-tested. Our `docker-compose.yml` mounts migrations to `/docker-entrypoint-initdb.d/` for automatic schema initialization with health checks via `mysqladmin ping`.

## Consequences
- **Positive**: sqlx gives us the safety of parameterized queries with the convenience of struct scanning, without a full ORM. Repository methods in `internal/repository/` are readable SQL — no magic query builders.
- **Positive**: MySQL's `AUTO_INCREMENT` is simple for our ID generation needs. No need for UUID complexity.
- **Positive**: InnoDB's row-level locking handles our concurrent order creation well at current scale.
- **Negative**: MySQL's `?` placeholder syntax is less readable than PostgreSQL's `$1, $2` numbered placeholders when queries have many parameters.
- **Negative**: If we later need full-text search on product descriptions or JSONB for flexible order metadata, MySQL's support is weaker than PostgreSQL's.
- **Negative**: No native support for `RETURNING` clause — after inserts, we use `LastInsertId()` rather than getting the full row back in one query.
- **Trade-off**: We use sqlx rather than GORM. This means more SQL to write, but queries are explicit, performant, and debuggable. No N+1 surprises.

## Alternatives Considered

### PostgreSQL
Industry-leading open-source RDBMS. Rejected because:
- Feature advantages (JSONB, advanced indexing, LISTEN/NOTIFY) aren't needed for our current schema
- Team has stronger MySQL operational experience — production incidents are not the time to learn a new database's quirks
- Our use of Gorilla WebSocket for real-time updates means we don't need PostgreSQL's LISTEN/NOTIFY

### SQLite
Embedded database with zero operational overhead. Rejected because:
- Single-writer limitation doesn't work for concurrent order placement
- No network access — incompatible with our Docker Compose architecture where app and database are separate containers
- Would complicate future scaling if we need read replicas

### GORM (as ORM layer)
Full-featured Go ORM. Rejected in favor of sqlx because:
- Our queries are explicit SQL in repository methods — we want to see exactly what's hitting the database
- GORM's magic (auto-migrations, eager loading, callbacks) adds complexity we don't need
- sqlx's `StructScan` gives us struct mapping without hiding the query
