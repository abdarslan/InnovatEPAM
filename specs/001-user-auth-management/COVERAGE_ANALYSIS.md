# Test Coverage Analysis: Spec 001 — User Authentication & Management

**Date**: May 16, 2026  
**Feature**: User Authentication & Management (Spec 001)  
**Current Coverage**: 74.82% (threshold: 80%) ❌  
**Gap**: 5.18 percentage points

---

## Coverage Summary

### Overall Statistics

```
All files: 74.91% statements | 74.65% branches | 88.09% functions | 74.82% lines
ERROR: Coverage for lines (74.82%) does not meet global threshold (80%)
```

### Auth-Specific Files Status

| File | Statements | Branches | Functions | Lines | Issue |
|---|---|---|---|---|---|
| **actions/auth.ts** | 1.36% ❌ | 0% ❌ | 0% ❌ | 1.36% ❌ | Server Actions not tested |
| **lib/auth/session.ts** | 9.09% ❌ | 33.33% | 0% ❌ | 9.09% ❌ | Session helpers untested |
| lib/auth/password.ts | 100% ✅ | 100% ✅ | 100% ✅ | 100% ✅ | Good |
| lib/auth/validation.ts | 100% ✅ | 100% ✅ | 100% ✅ | 100% ✅ | Good |
| lib/auth/permissions.ts | 100% ✅ | 100% ✅ | 100% ✅ | 100% ✅ | Good |

---

## Root Cause Analysis

### Problem 1: `actions/auth.ts` — 1.36% Coverage

**Uncovered functions:**
- `registerAction()` → 0% coverage
- `loginAction()` → 0% coverage
- `logoutAction()` → 0% coverage
- `deactivateUserAction()` → 0% coverage

**Why it's uncovered:**

Current test files (`tests/integration/auth/register.test.ts`, `tests/integration/auth/login.test.ts`) **reimplement the business logic inline** instead of calling the actual exported Server Actions:

```typescript
// CURRENT APPROACH (tests inline logic, not actual Server Action)
async function login(email: string, password: string) {
  const user = testDb.select().from(users).where(eq(users.email, normalizedEmail)).get()
  if (!user) return { ok: false, error: '...' }
  // ... more logic ...
}

// Test calls inline function, NOT the actual loginAction
const result = await login(email, password)
```

**Impact:** The `loginAction` in `actions/auth.ts` is never executed by tests, so it has 0% coverage.

**Solution:** Refactor tests to call actual Server Action imports:

```typescript
import { registerAction, loginAction } from '@/actions/auth'

// Test CALLS the actual exported Server Action
const result = await registerAction({ email, password, displayName })
```

---

### Problem 2: `lib/auth/session.ts` — 9.09% Coverage

**Uncovered functions:**
- `getSession()` → minimal coverage
- `requireAuth()` → not tested
- `requireRole()` → not tested

**Why it's uncovered:**

Session helpers are used in **middleware** and **protected layout** but not directly tested. They're only indirectly exercised through E2E tests.

**Solution:** Create dedicated unit tests for each session helper:

```typescript
// tests/unit/auth/session.test.ts
describe('getSession', () => {
  it('returns session when valid cookie exists', async () => {
    // Mock iron-session with valid session
    const session = await getSession()
    expect(session).toBeDefined()
  })
  
  it('returns null when no session cookie', async () => {
    // No session
    const session = await getSession()
    expect(session).toBeNull()
  })
})
```

---

## What's Working

These files already have good coverage and should be maintained:

- ✅ `lib/auth/password.ts` — 100%
- ✅ `lib/auth/validation.ts` — 100%
- ✅ `lib/auth/permissions.ts` — 100%

**No changes needed** — focus on auth.ts and session.ts only.

---

## Test Gap Matrix

### `actions/auth.ts` — What's Missing

| Function | Current Tests | Issue | Solution |
|---|---|---|---|
| `registerAction()` | None call actual export | Inline logic tested | Call `registerAction()` directly |
| `loginAction()` | None call actual export | Inline logic tested | Call `loginAction()` directly |
| `logoutAction()` | Not tested at all | No test file | Create `logout.test.ts` |
| `deactivateUserAction()` | Admin gate only | Error paths missing | Add edge cases & error paths |

### `lib/auth/session.ts` — What's Missing

| Function | Current Tests | Issue | Solution |
|---|---|---|---|
| `getSession()` | None | Not unit tested | Create unit test with mock sessions |
| `requireAuth()` | None | Not unit tested | Test throw on no/expired session |
| `requireRole()` | None | Not unit tested | Test throw on role mismatch |

### `components/auth/*` — Gaps

| Component | Current Tests | Gap | Solution |
|---|---|---|---|
| `LoginForm` | Exists | Pending state, error display | Extend tests |
| `RegisterForm` | Exists | Password errors, a11y | Extend tests |
| `LogoutButton` | None | Missing entirely | Create new test file |

---

## 16 New/Refactored Test Tasks

To reach **80%+ coverage**, we need:

### Priority 1 — Critical (5 tasks)

1. **T104**: Refactor `register.test.ts` to call actual `registerAction()`
2. **T105**: Refactor `login.test.ts` to call actual `loginAction()`
3. **T106**: Create new `logout.test.ts` for `logoutAction()`
4. **T107**: Refactor `deactivate.test.ts` to call actual `deactivateUserAction()`
5. **T101**: Create unit tests for `session.ts` helpers

### Priority 2 — High (5 tasks)

6. **T102**: Unit tests for `password.ts` helpers
7. **T103**: Unit tests for `validation.ts` schemas
8. **T108**: Session expiry edge case tests
9. **T109**: Error path coverage tests
10. **T110–T112**: Component test extensions (3 tasks)

### Priority 3 — Medium (3 tasks)

11. **T113**: E2E lockout timeout test
12. **T114**: E2E session expiry test
13. **T115–T116**: Verification & threshold (2 tasks)

---

## Coverage Projection

### After Priority 1 Tasks (Phases T101–T109)

```
Expected Coverage:
├── actions/auth.ts:        1.36% → 85%+ (Server Actions called)
├── lib/auth/session.ts:    9.09% → 90%+ (Unit tests added)
├── lib/auth/password.ts:   100% (maintained)
├── lib/auth/validation.ts: 100% (maintained)
└── Overall:                74.82% → 78–79% (close to threshold)
```

### After All Tasks Complete (Phases T110–T116)

```
Expected Coverage:
├── actions/auth.ts:        85%+ → 100% (all paths tested)
├── lib/auth/session.ts:    90%+ → 100% (all paths tested)
├── lib/auth/password.ts:   100% (maintained)
├── lib/auth/validation.ts: 100% (maintained)
├── components/auth/*:      80% → 90%+ (extended tests)
└── Overall:                78–79% → 80%+ ✅
```

---

## Recommended Implementation Path

### Week 1: Critical Coverage (Priority 1)

**Objective**: Reach ~78-79% coverage

- **Day 1**: T104 + T105 (2–3 hours)
  - Refactor existing tests to call actual Server Actions
  - Add missing assertions (session creation, state changes)

- **Day 2**: T106 + T107 (1–2 hours)
  - Create new logout test
  - Add edge cases to deactivate test

- **Day 3**: T101 (1–2 hours)
  - Create session helper unit tests
  - Mock iron-session cookie states

### Week 2: High Coverage (Priority 2)

**Objective**: Reach ~80%+ threshold

- **Day 1**: T102 + T103 (1 hour)
  - Password and validation helper tests (fast)

- **Day 2**: T108 + T109 (2 hours)
  - Edge case and error path tests

- **Day 3**: T110–T112 (1–2 hours)
  - Component test extensions

### Week 3: Polish & Verification (Priority 3)

**Objective**: Maintain 80%+ and document

- **Day 1**: T113 + T114 (1–2 hours)
  - E2E enhancements

- **Day 2**: T115 + T116 (30 min)
  - Verify threshold, document results

---

## Files to Create/Modify

### New Test Files to Create

```
tests/unit/auth/
├── session.test.ts          (NEW)
├── password.test.ts         (NEW)
└── validation.test.ts       (NEW)

tests/integration/auth/
├── logout.test.ts           (NEW)
├── session-expiry.test.ts   (NEW)
├── error-handling.test.ts   (NEW)
├── register.test.ts         (REFACTOR)
├── login.test.ts            (REFACTOR)
└── deactivate.test.ts       (REFACTOR)

tests/e2e/
├── lockout-timeout.spec.ts  (NEW)
└── session-expiry.spec.ts   (NEW)

components/auth/
└── LogoutButton.test.tsx    (NEW)
```

### Existing Test Files to Extend

```
components/auth/
├── LoginForm.test.tsx       (EXTEND)
└── RegisterForm.test.tsx    (EXTEND)
```

---

## Acceptance Criteria

✅ **All of these must be true:**

1. `actions/auth.ts` coverage ≥ 100%
2. `lib/auth/session.ts` coverage ≥ 100%
3. Overall coverage ≥ 80%
4. All 222+ tests pass consistently
5. `npm run test:coverage` exits with code 0
6. No flaky tests (pass 3 consecutive runs)
7. Type checking: `npm run type-check` ✅
8. Linting: `npm run lint` ✅
9. E2E: `npx playwright test` ✅

---

## Related Documentation

- Detailed tasks: [tasks.md](./tasks.md) — Phase 8: Coverage Improvement
- Implementation guide: [COVERAGE_TASKS.md](./COVERAGE_TASKS.md)
- Current test files: `tests/integration/auth/`, `tests/e2e/`, `components/auth/`

