# DECISION_AUTHORITY.md — Who Decides What

> Every decision has an owner, reviewers, and approvers. No decision happens in a vacuum.

---

## Decision Levels

| Level | Scope | Examples | Who Decides |
|-------|-------|---------|-------------|
| **L1 — Strategic** | Product direction, new features, stack changes | "Add payment integration", "Switch to PostgreSQL", "New product line" | **Hitech** (human owner) |
| **L2 — Architecture** | System design, API contracts, schema design, infrastructure | "WebSocket vs polling", "Session model", "DB schema changes" | **cto** proposes → **critic** reviews → **Hitech** approves |
| **L3 — Technical** | Implementation approach, library choices, patterns | "Chi vs Gin router", "Zustand vs Redux", "Repository pattern" | **cto** approves, **critic** reviews, **cr** reviews code |
| **L4 — Tactical** | Code-level decisions, test strategy, naming | "Helper function vs inline", "Table-driven tests", "Variable naming" | **Owner agent** decides, **cr** reviews in PR |

### Escalation Rules
- Any agent can escalate a decision up one level
- critic can escalate any decision to Hitech
- If two agents disagree, cto arbitrates (L3/L4) or Hitech arbitrates (L1/L2)
- When in doubt, escalate — it's cheaper than fixing bad decisions

---

## Phase Gate Authority

Each gate has defined roles using **RACI**: Responsible (does the work), Accountable (owns the outcome), Consulted (provides input), Informed (notified of decisions).

### Gate 1: Spec Review
| Role | Agent | Authority |
|------|-------|-----------|
| **Responsible** | pm | Writes spec + acceptance criteria |
| **Reviewer** | critic | Challenges completeness, ambiguity, missing edge cases |
| **Reviewer** | cto | Technical feasibility check |
| **Reviewer** | de | UX feasibility, wireframe alignment |
| **Approver** | cto | Signs off that spec is buildable |
| **Can Block** | critic | Missing field names, vague acceptance criteria, scope creep |

### Gate 2: Architecture Review
| Role | Agent | Authority |
|------|-------|-----------|
| **Responsible** | cto | Writes architecture + API contract |
| **Responsible** | dbe | Writes schema design |
| **Reviewer** | critic | Cross-checks contract consistency, challenges assumptions |
| **Reviewer** | be, fe | Confirm they've read and understood the API contract |
| **Approver** | cto + critic | **Both must approve** (two-person rule for contracts) |
| **Can Block** | critic | Field name mismatches, missing endpoints, ambiguous types |
| **Escalate to** | Hitech | If critic and cto disagree on L2 decision |

### Gate 3: Build Spot-Check
| Role | Agent | Authority |
|------|-------|-----------|
| **Responsible** | be, fe, dbe | Build the system |
| **Reviewer** | cr | Code review — field names, security, quality |
| **Reviewer** | critic | Spot-check contract compliance |
| **Approver** | cto | Signs off that build matches architecture |
| **Can Block** | cr | Code doesn't match API contract, security issues |
| **Can Block** | critic | Implementation diverged from approved architecture |

### Gate 4: Test Plan Review
| Role | Agent | Authority |
|------|-------|-----------|
| **Responsible** | pm | Defines acceptance test cases |
| **Responsible** | api-te | Defines API test specs |
| **Responsible** | e2e-ui | Defines E2E test specs |
| **Reviewer** | critic | Coverage gaps, mock pollution, missing scenarios |
| **Approver** | pm | Acceptance coverage is complete |
| **Can Block** | critic | Tests use mocks where E2E is required, missing coverage |

### Gate 5: Evidence Review
| Role | Agent | Authority |
|------|-------|-----------|
| **Responsible** | api-te | Runs API tests |
| **Responsible** | e2e-ui | Runs E2E browser tests |
| **Responsible** | ec | Captures screenshots + evidence |
| **Reviewer** | critic | Verifies evidence is real, not fabricated or misleading |
| **Reviewer** | cr | Reviews test code quality |
| **Approver** | rc | Evidence package is complete and trustworthy |
| **Can Block** | critic | "All pass" without output, mock data in E2E, missing screenshots |
| **Can Block** | rc | Insufficient evidence for production readiness |

### Gate 6: Release Review
| Role | Agent | Authority |
|------|-------|-----------|
| **Responsible** | rc | Production readiness checklist |
| **Reviewer** | critic | Final challenge — looks for anything everyone else missed |
| **Reviewer** | cto | Architecture sign-off |
| **Approver** | **Hitech** | **Final go/no-go — nothing ships without human approval** |
| **Can Block** | critic | Any unresolved concern |
| **Can Block** | rc | Missing evidence, unresolved P0 bugs |

---

## Standing Rules

### Two-Person Rule
These decisions require approval from **two independent agents**:
- API contract changes → cto + critic
- Database schema changes → cto + dbe (critic reviews)
- Release to production → rc + Hitech

### Veto Power
| Agent | Can Veto | Scope |
|-------|----------|-------|
| **Hitech** | Any decision | Unlimited — human owner |
| **critic** | Any phase gate | Can block but cannot approve |
| **rc** | Release (Gate 6) | Can block release on missing evidence |
| **cr** | Code merge (Gate 3, 5) | Can block merge on code quality |
| **cto** | Technical decisions (L2, L3) | Highest technical authority |

### What Critic CANNOT Do
- Cannot approve — only block or pass
- Cannot override Hitech
- Cannot make implementation decisions (that's cto/agents' job)
- Cannot write code or specs (review only)

### What cr (Code Reviewer) CANNOT Do
- Cannot approve architecture or specs (that's critic's job)
- Cannot override cto on technical direction
- CAN block code merges independently

---

## Decision Log

Every L1 and L2 decision should be logged in `docs/DECISIONS.md` with:
```
### DECISION-001: [Title]
- **Date:** YYYY-MM-DD
- **Level:** L1/L2
- **Proposed by:** [agent]
- **Reviewed by:** [agents]
- **Approved by:** [agent]
- **Decision:** [what was decided]
- **Rationale:** [why]
- **Alternatives considered:** [what else was considered]
```

---

## Quick Reference

```
L1 (Strategic)  → Hitech decides
L2 (Architecture) → cto proposes, critic reviews, Hitech approves
L3 (Technical)  → cto approves, critic reviews
L4 (Tactical)   → owner decides, cr reviews code

Gate blockers: critic (all gates), rc (Gate 6), cr (Gate 3, 5)
Final release: Hitech only
Two-person rule: API contract, schema changes, release
```
