# ADR-006: Zero-Mock E2E Testing Strategy

## Status
Accepted

## Context
We needed a testing strategy that gives us confidence the system works end-to-end: a customer can browse products, place an order, and track it; staff can log in, view orders, and update statuses; admin can manage products. Unit tests with mocked dependencies verify business logic in isolation but can't catch integration failures — a mocked repository that returns the right data doesn't prove the actual SQL query works against a real MySQL schema.

## Decision
We adopted a **two-tier testing strategy**: unit tests with in-memory mocks for service-layer business logic, plus **zero-mock E2E tests** via Playwright that exercise the entire stack against real running services.

### Tier 1: Service-Layer Unit Tests (Go)
Located in `internal/service/*_test.go`, these test business logic with in-memory mock repositories:

- **`auth_test.go`**: Tests user creation (happy path, duplicate username, invalid role), login flow (valid credentials, wrong password, inactive user), and JWT token generation/validation
- **`product_test.go`**: Tests product CRUD (create, update, soft delete), validation (invalid category, invalid price), and category management
- **`errors_test.go`**: Tests custom error type definitions

Mock pattern — hand-written structs implementing repository interfaces with Go maps:
```go
type mockUserRepo struct {
    users    map[string]*model.User
    usersMap map[int64]*model.User
    nextID   int64
}
```
These mocks are intentionally simple: they validate that service logic (password hashing, JWT claims, validation rules, status transitions) works correctly without database concerns.

### Tier 2: Zero-Mock E2E Tests (Playwright)
Located in `web/e2e/`, these run against the full Docker Compose stack (React frontend + Go backend + MySQL) with **no mocks, no stubs, no intercepted API calls**.

**Test suites**:
- `customer-happy-path.spec.ts` — Browse products, filter by category, add to cart, fill order form, place order, receive confirmation
- `staff-operations.spec.ts` — Login as staff, view orders, update order status through the full lifecycle (pending → confirmed → dispatched → delivered)
- `admin-operations.spec.ts` — Login as admin, manage products (create, edit, soft delete), manage categories
- `edge-cases.spec.ts` — Invalid phone numbers, form validation errors, empty cart behavior

**Configuration** (`web/playwright.config.ts`):
- Runs against `http://localhost:3000` (frontend) and `http://localhost:8090` (backend API)
- Serial execution (`fullyParallel: false`) — tests depend on state from previous tests (e.g., order placed in one test is verified in the next)
- Chromium only — single browser target
- 60-second test timeout, 10-second assertion timeout
- Screenshots on failure, HTML report generation

**Test helpers** (`web/e2e/helpers.ts`):
- `loginAsAdmin()`, `loginAsStaff()` — Real authentication against the running backend
- `addProductToCart()`, `fillOrderForm()` — Interact with actual UI components
- `screenshot()` — Captures visual evidence at each test step (40+ screenshots across suites)
- Hardcoded test data (`testCustomer`, `testAddress`, `adminCredentials`) — no fixtures, no factories, just real data that flows through the real system

**What "zero-mock" means**: The E2E tests click buttons in a real browser, which makes real HTTP requests to the real Go backend, which executes real SQL against a real MySQL database. No `page.route()` interception, no API mocking, no fake data. The order that appears in the staff dashboard is the same order the customer test placed.

## Consequences
- **Positive**: E2E tests catch integration bugs that unit tests miss — broken SQL queries, incorrect JSON serialization, missing CORS headers, broken UI flows after refactoring.
- **Positive**: E2E tests serve as living documentation. The screenshot captures (e.g., `07-01-step3-confirmed.png`, `07-01-step5-delivered.png`) show the exact UI state at each step of the order lifecycle.
- **Positive**: Service-layer unit tests are fast (run with `make test`, no database needed) and catch logic regressions immediately.
- **Negative**: E2E tests require the full Docker Compose stack running. This makes them slower to run and impossible in environments without Docker.
- **Negative**: Serial execution means E2E tests are slow and a single failure can cascade, blocking subsequent tests that depend on the state created by earlier tests.
- **Negative**: No repository-level integration tests. There's a gap between "service logic is correct with mocks" and "full system works end-to-end." A bug in a SQL query won't be caught until E2E tests run.
- **Negative**: No order service tests exist yet — the most complex business logic (order placement with transactions, status transitions with validation) is only tested at the E2E level.
- **Trade-off**: The mock repositories in unit tests are hand-written, not generated (no mockgen/gomock). This is more code to maintain but makes test behavior explicit and readable.

## Alternatives Considered

### Integration tests with testcontainers
Spin up a real MySQL container in Go tests for repository-level testing. Not rejected — this is a planned addition to fill the gap between unit and E2E tests. Would let us verify SQL queries against a real schema without needing the full stack. Currently deferred due to development velocity priorities.

### API-level tests (httptest)
Use Go's `httptest.NewServer()` to test handlers with a real database. Rejected as the primary E2E strategy because:
- Doesn't test the frontend, which is where many integration bugs surface (incorrect API calls, broken UI state management)
- Playwright E2E tests cover this layer implicitly by driving the real frontend

### Mock-based E2E (Playwright route interception)
Use `page.route()` to intercept API calls and return canned responses. Rejected because:
- Defeats the purpose of E2E testing — if we mock the API, we're just testing the frontend in isolation
- We've seen cases where the frontend and backend disagree on response shapes; only real API calls catch this
- Maintaining mock responses in sync with the actual API is a maintenance burden that provides false confidence

### Property-based testing / fuzzing
Generate random inputs to find edge cases. Not adopted because:
- Our domain (order management) has well-defined valid states; edge cases are better expressed as explicit test cases
- Go's built-in fuzzing could be useful for input validation but isn't a substitute for integration testing
