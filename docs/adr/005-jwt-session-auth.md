# ADR-005: Session-Based Auth with JWT Tokens

## Status
Accepted

## Context
The order system has two distinct user types with different auth needs:
- **Customers**: Browse products and place orders without logging in (identified by phone number)
- **Staff/Admin**: Log in to the dashboard to manage orders, update statuses, and administer products

We needed an authentication mechanism for the staff/admin dashboard that integrates with our role-based access control (admin vs. staff roles) and protects both REST endpoints and WebSocket connections.

## Decision
We chose **stateless JWT tokens** with **bcrypt password hashing** for dashboard authentication.

**Implementation details** (`internal/service/auth.go`):
- **Library**: `github.com/golang-jwt/jwt/v5`
- **Algorithm**: HS256 (HMAC-SHA256) with a shared secret from config
- **Token expiry**: Configurable, defaulting to 24 hours (set in `config.yaml`)
- **Password hashing**: bcrypt with `DefaultCost` via `golang.org/x/crypto/bcrypt`

**JWT Claims structure**:
```go
type JWTClaims struct {
    UserID   int64          `json:"user_id"`
    Username string         `json:"username"`
    Role     model.UserRole `json:"role"`    // "admin" or "staff"
    jwt.RegisteredClaims                     // exp, iat, sub
}
```

**Login flow** (`AuthService.Login()`):
1. Look up user by username via `UserRepository.GetByUsername()`
2. Verify `is_active` flag (inactive accounts are rejected)
3. Compare password with bcrypt hash via `bcrypt.CompareHashAndPassword()`
4. Generate JWT with user ID, username, and role in claims
5. Return token + user info to client

**Auth middleware** (`internal/middleware/auth.go`):
1. Extract `Bearer` token from `Authorization` header
2. Validate token signature and expiration via `AuthService.ValidateToken()`
3. Inject claims into request context using typed keys (`UserIDKey`, `UsernameKey`, `UserRoleKey`)
4. Downstream handlers access claims via helpers: `GetUserID(r)`, `GetUserRole(r)`

**Role enforcement** (`RequireRole()` middleware factory):
- Accepts a list of allowed roles
- Checks the role from context against allowed roles
- Returns 403 Forbidden if unauthorized
- Applied per route group: dashboard routes allow `["admin", "staff"]`, admin routes allow `["admin"]` only

**Seeded admin user**: Migration `001_create_tables.up.sql` inserts a default admin user with a bcrypt-hashed password for initial system access.

## Consequences
- **Positive**: Stateless — no server-side session store needed. The JWT contains everything needed for authorization (user ID, role). This simplifies our architecture: no Redis, no session table, no sticky sessions.
- **Positive**: Works for both REST and WebSocket. The same `Authorization: Bearer <token>` header is used for REST calls and the WebSocket upgrade request, with the same middleware validating both.
- **Positive**: Role information embedded in the token means `RequireRole()` middleware can make authorization decisions without a database query on every request.
- **Positive**: bcrypt handles password hashing with built-in salting and configurable cost factor. No manual salt management.
- **Negative**: No token revocation. If a staff account is compromised, we can't invalidate their token before it expires (up to 24 hours). We'd need a token blacklist (adding statefulness) to support immediate revocation.
- **Negative**: HS256 uses a shared secret. All services that need to validate tokens must know the secret. This is fine for our monolith but would be a concern with microservices (asymmetric RS256 would be more appropriate).
- **Negative**: No refresh token mechanism. When the 24h token expires, the user must re-enter credentials. For a dashboard that's open all day, this creates friction.
- **Trade-off**: Embedding the role in the JWT means role changes don't take effect until the next login. If an admin demotes a user from admin to staff, their current token still grants admin access until expiry.

## Alternatives Considered

### Server-side sessions with cookies
Traditional session-based auth with a session ID cookie and server-side session store. Rejected because:
- Requires a session store (database table or Redis), adding infrastructure complexity
- Session affinity ("sticky sessions") needed if we ever run multiple instances
- Our frontend is a React SPA that naturally works with `Authorization` headers; cookie-based auth adds CSRF concerns

### OAuth 2.0 / OpenID Connect
Delegated authentication via an identity provider. Rejected because:
- We have a small, known set of internal users (staff + admins) — no need for third-party identity federation
- Adds significant complexity (token exchange flows, PKCE, callback URLs) for a use case that simple username/password handles well
- Could be added later if we need SSO integration

### API keys
Static tokens for service authentication. Rejected because:
- No expiration without manual rotation
- No user identity embedded — we need to know who changed an order's status for the audit trail (`order_status_log.changed_by`)
- Appropriate for service-to-service auth, not human user authentication
