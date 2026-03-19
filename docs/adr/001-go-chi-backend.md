# ADR-001: Choice of Go + Chi for Backend

## Status
Accepted

## Context
We needed an HTTP framework for our order management backend that handles REST endpoints, middleware composition, WebSocket upgrades, and role-based routing. The backend serves both a customer-facing ordering flow and a staff/admin dashboard, requiring clean route grouping and middleware chaining (auth, CORS, logging, role checks).

## Decision
We chose **Go with Chi v5** (`github.com/go-chi/chi/v5`) as the HTTP router.

Our `cmd/server/main.go` uses Chi's `r.Route()` for nested route groups with per-group middleware:
- Public routes (`/api/v1/products`, `/api/v1/orders`, `/api/v1/auth/login`) with no auth
- Dashboard routes (`/api/v1/dashboard/*`) with `middleware.Auth()` + `middleware.RequireRole("admin", "staff")`
- Admin routes (`/api/v1/admin/*`) with admin-only role enforcement
- WebSocket endpoint (`/api/v1/dashboard/ws`) coexisting with REST routes

Chi was selected because:
1. **`net/http` compatible** — Chi handlers are standard `http.HandlerFunc`. Our handlers in `internal/handler/` take `http.ResponseWriter` and `*http.Request` directly. No framework-specific context objects to learn or mock.
2. **Middleware is just `func(http.Handler) http.Handler`** — Our `internal/middleware/auth.go`, `cors.go`, and `logging.go` are vanilla middleware that work with any `net/http` router. This is visible in how `RequireRole()` is a middleware factory returning a standard closure.
3. **Context-based value passing** — Auth middleware injects user claims via `context.WithValue()` using typed keys (`UserIDKey`, `UsernameKey`, `UserRoleKey`), and handlers extract them with helper functions like `GetUserID(r)`. This uses Go's standard `context.Context` rather than a framework-specific mechanism.
4. **Minimal dependency surface** — Chi has zero external dependencies itself. Our `go.mod` stays lean, with most imports being purpose-specific libraries (sqlx, gorilla/websocket, golang-jwt).

## Consequences
- **Positive**: Any Go developer familiar with `net/http` can read our handlers immediately. Middleware is reusable outside Chi. WebSocket upgrade via Gorilla integrates cleanly since Chi doesn't wrap the response writer.
- **Positive**: Chi's lightweight nature means fast compile times and a small binary (our multi-stage Docker build produces a minimal Alpine image).
- **Negative**: Chi provides no built-in request validation, binding, or error handling. We wrote our own JSON helpers in `internal/handler/helpers.go` for parsing request bodies and URL params. Gin would have given us `ShouldBindJSON()` for free.
- **Negative**: No built-in Swagger/OpenAPI generation. Gin and Fiber have ecosystem plugins for this. We'd need to add a separate tool if API documentation becomes a requirement.
- **Trade-off**: Chi's simplicity means more boilerplate for common patterns (JSON responses, error mapping), but this boilerplate is explicit and easy to understand.

## Alternatives Considered

### Gin
Most popular Go web framework. Rejected because:
- Uses `gin.Context` instead of standard `http.Request`, creating vendor lock-in in every handler signature
- Built-in validation and binding are convenient but hide behavior behind struct tags
- Our middleware stack (auth, CORS, logging) would need to be Gin-specific rather than portable

### Fiber
Built on fasthttp, not `net/http`. Rejected because:
- Incompatible with Gorilla WebSocket (which requires `net/http`), and we need WebSocket for real-time order updates
- `fasthttp` has a different request lifecycle that complicates middleware patterns
- Smaller ecosystem for Go-standard libraries

### Standard library (`net/http` only, Go 1.22+ routing)
Go 1.22 added method-based routing to `net/http.ServeMux`. Considered but rejected because:
- No built-in route grouping with per-group middleware (we have 3 distinct auth levels)
- Pattern matching is more limited — Chi's `{id}` URL params and subrouter nesting are cleaner than rolling our own
- We're on Go 1.22 (per Dockerfile), so the new mux is available but insufficient for our routing complexity
