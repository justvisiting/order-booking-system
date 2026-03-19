# BUILD_PROCESS.md — Structured Build Process

> Every project follows this process. No exceptions. No shortcuts.
> The critic reviews and gates every phase transition.

---

## Overview

```
PHASE 1: SPEC ──→ ⛔ CRITIC GATE 1 ──→
PHASE 2: ARCHITECTURE ──→ ⛔ CRITIC GATE 2 ──→
PHASE 3: BUILD ──→ ⛔ CRITIC GATE 3 ──→
PHASE 4: TEST PLAN ──→ ⛔ CRITIC GATE 4 ──→
PHASE 5: TEST & VERIFY ──→ ⛔ CRITIC GATE 5 ──→
PHASE 6: READINESS ──→ ⛔ CRITIC GATE 6 ──→ RELEASE
```

---

## Phase 1: SPEC

**Owner:** pm
**Participants:** de, cto
**Deliverables:**
- `PRODUCT_SPEC.md` — user stories, acceptance criteria, scope
- `USER_FLOWS.md` — wireframes / user journey diagrams (from de)
- Acceptance criteria must include **exact field names, validation rules, error states**

**What pm produces:**
- Who are the users?
- What can each user do?
- What does success look like? (measurable)
- What are the exact data fields for every entity? (name, type, constraints)
- What are the edge cases and error states?

**What de produces:**
- Wireframes for every screen
- User flow diagrams (page → page transitions)
- Design system tokens (if not already defined)

### ⛔ Critic Gate 1: Spec Review

**Critic checks:**
- [ ] Every entity has exact field names and types listed
- [ ] Acceptance criteria are testable (not vague like "fast" or "user-friendly")
- [ ] Edge cases documented (empty state, error state, max items, concurrent users)
- [ ] Scope is realistic (not "build everything")
- [ ] Wireframes cover all user roles and flows

**Gate result:** APPROVED / BLOCKED / NEEDS REVISION

---

## Phase 2: ARCHITECTURE

**Owner:** cto
**Participants:** dbe, be, fe
**Deliverables:**
- `ARCHITECTURE.md` — tech stack, component diagram, data flow
- `SYSTEM_DESIGN.md` — schema, deployment, infrastructure
- `API_CONTRACT.md` — **THE critical deliverable**

### API_CONTRACT.md Requirements

This is the single source of truth. It must contain:

```
For EVERY endpoint:
  - Method + URL
  - Request body (exact JSON with field names and types)
  - Response body (exact JSON with field names and types)
  - Error responses
  - Authentication requirements

For EVERY entity:
  - Database column names
  - Go struct field names + JSON tags
  - TypeScript interface field names
  - Explicit mapping: DB column → Go JSON tag → TS field
```

**Example contract entry:**
```
### GET /api/v1/products

Response:
{
  "id": number,          // DB: id, Go: ID `json:"id"`
  "name": string,        // DB: name, Go: Name `json:"name"`
  "price": number,       // DB: price (DECIMAL), Go: Price `json:"price"` (float64)
  "is_active": boolean,  // DB: is_active, Go: IsActive `json:"is_active"`
  "category_id": number  // DB: category_id, Go: CategoryID `json:"category_id"`
}
```

**Why this level of detail:** The `is_active` vs `active` bug happened because the contract didn't exist. BE used `is_active`, FE used `active`. 52 tests passed, app was broken. Never again.

### ⛔ Critic Gate 2: Architecture Review

**Critic checks:**
- [ ] API_CONTRACT.md exists and covers every endpoint
- [ ] Every field has explicit DB → Go → TS mapping
- [ ] No ambiguous types (float vs decimal for money, string vs enum for status)
- [ ] Schema matches the API contract (column names, types, constraints)
- [ ] FE and BE leads have confirmed they've read the contract
- [ ] Authentication/authorization model is clear

**Gate result:** APPROVED / BLOCKED / NEEDS REVISION

**🔴 HARD RULE:** Phase 3 does NOT start until Gate 2 is APPROVED.

---

## Phase 3: BUILD

**Owners:** be + fe (parallel)
**Participants:** dbe, de
**Deliverables:**
- Working backend with all endpoints matching API_CONTRACT.md
- Working frontend consuming the exact API shape from API_CONTRACT.md
- Database migrations matching SYSTEM_DESIGN.md schema
- Seed data (always — never ship an empty database for testing)
- Design system implementation (from de's specs)

**Rules:**
- BE and FE build from API_CONTRACT.md — not from guessing
- Go struct JSON tags MUST match the contract exactly
- TypeScript types MUST match the contract exactly
- If you need to change a field name, update the contract FIRST and notify the other team
- Health endpoint on day 1
- Seed data on day 1

### ⛔ Critic Gate 3: Build Spot-Check

**Critic checks:**
- [ ] Go struct JSON tags match API_CONTRACT.md (character-for-character)
- [ ] TypeScript types match API_CONTRACT.md (character-for-character)
- [ ] `curl` each endpoint and compare response shape to contract
- [ ] Seed data exists and is populated
- [ ] Health endpoint works
- [ ] No hardcoded values that should be configurable

**Gate result:** APPROVED / BLOCKED / NEEDS REVISION

---

## Phase 4: TEST PLAN

**Owners:** pm (acceptance tests), api-te (API tests), e2e-ui (E2E tests)
**Deliverables:**
- `E2E_TEST_PLAN.md` — complete test case list with:
  - Test ID
  - Steps (what the user does)
  - Input data (exact values)
  - Expected output (exact values)
  - Screenshots required (which transitions to capture)
  - Database verification (what to check in MySQL after the action)

**Rules:**
- Test plan is written BEFORE test code
- Every test case specifies whether it uses real API or mocks
- If mocks are used anywhere, the mock data shape MUST be verified against a real `curl` response
- E2E tests = zero mocks, zero exceptions

### ⛔ Critic Gate 4: Test Plan Review

**Critic checks:**
- [ ] E2E test cases specify zero mocks
- [ ] Unit test mock data shapes match actual API responses (verified by curl)
- [ ] Coverage includes happy paths, error paths, edge cases, and cross-flow scenarios
- [ ] Database verification steps are included (not just UI assertions)
- [ ] Test plan references the API_CONTRACT.md field names
- [ ] There's at least one test for every acceptance criterion from the spec

**Gate result:** APPROVED / BLOCKED / NEEDS REVISION

---

## Phase 5: TEST & VERIFY

**Owners:** api-te (API tests), e2e-ui (E2E browser tests), ec (evidence collection)
**Deliverables:**
- Test execution output (full logs, not just "all pass")
- Screenshots at every key transition
- Database state verification (before/after screenshots or query results)
- `TEST_REPORT.md` — structured report with pass/fail per test case

**Rules:**
- E2E tests run against the LIVE app (real browser, real API, real DB)
- Screenshots capture REAL data, not placeholder/mock data
- Evidence Collector verifies screenshots match expected behavior
- Any test failure blocks — no "we'll fix it later"

### ⛔ Critic Gate 5: Evidence Review

**Critic checks:**
- [ ] Full test output provided (not just pass count)
- [ ] Screenshots show real data, not empty/mock states
- [ ] Database state verified for at least key operations (order created, status changed)
- [ ] No tests passed by testing undefined == undefined (the is_active pattern)
- [ ] Someone has opened the app in a real browser and confirmed it works
- [ ] TEST_REPORT.md is complete with results for every test case

**Gate result:** APPROVED / BLOCKED / NEEDS REVISION

---

## Phase 6: READINESS

**Owner:** rc
**Participants:** cto, critic
**Deliverables:**
- Production readiness checklist (signed off)
- UX audit issues resolved (at least all P0s)
- Performance baseline documented
- Rollback plan documented

### ⛔ Critic Gate 6: Release Review

**Critic checks:**
- [ ] All P0 UX issues resolved (from de's audit)
- [ ] All E2E tests pass (fresh run, not cached results)
- [ ] Evidence package is complete (screenshots + test output + DB verification)
- [ ] rc has signed off on production readiness
- [ ] No known field name mismatches or data shape inconsistencies
- [ ] Deployment has been verified (not just "deployed")

**Gate result:** APPROVED TO RELEASE / BLOCKED

---

## Anti-Patterns (Things That Got Us Burned)

| Anti-Pattern | What Happened | Rule |
|-------------|---------------|------|
| Build without contract | `is_active` vs `active` | Gate 2 blocks Phase 3 |
| Mock-only testing | 52 tests pass, app broken | E2E = zero mocks |
| Declare done without proof | "All tests pass" with no output | Gate 5 requires evidence |
| Parallel build without sync | FE and BE guessed differently | Shared API_CONTRACT.md |
| Skip design | Raw Tailwind shipped to user | de involved from Phase 1 |
| No smoke test | Nobody opened a browser | Gate 5 requires browser verification |
| Session-only crons | Crons die with session | Use persistent cron config |

---

## Quick Reference: Who Does What

| Phase | Owner | Reviewer | Gate |
|-------|-------|----------|------|
| 1. Spec | pm + de | critic | Gate 1 |
| 2. Architecture | cto + dbe | critic | Gate 2 |
| 3. Build | be + fe + dbe + de | critic + **cr** | Gate 3 |
| 4. Test Plan | pm + api-te + e2e-ui | critic | Gate 4 |
| 5. Test & Verify | api-te + e2e-ui + ec | critic + **cr** | Gate 5 |
| 6. Readiness | rc + cto | critic | Gate 6 |

**K (orchestrator):** Delegates to phase owners, monitors progress, doesn't execute. Triggers critic reviews at each gate.

**Decision authority:** See `docs/DECISION_AUTHORITY.md` for who approves, who reviews, and who can block at each level.

### cr (Code Reviewer) vs critic (Decision Critic)
- **critic** reviews specs, architecture, and decisions — blocks phase gates
- **cr** reviews code implementation — blocks merges at Gate 3 and Gate 5
- Both can block independently. Neither can override the other.
