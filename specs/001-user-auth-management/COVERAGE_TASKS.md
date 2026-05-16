# Coverage Improvement Tasks: User Authentication & Management

**Date**: 2026-05-16  
**Current Coverage**: 74.82% (threshold: 80%)  
**Target**: Increase to 80%+ by improving:
- `actions/auth.ts` (1.36% → 100%)
- `lib/auth/session.ts` (9.09% → 100%)

---

## Critical Coverage Gaps

### 1. `actions/auth.ts` — Server Actions (1.36% coverage)

**Functions with 0% coverage:**
- `registerAction` - No direct integration test
- `loginAction` - Integration tests mock the logic instead of calling the actual action
- `logoutAction` - Not tested
- `deactivateUserAction` - Only basic admin check tested, error paths missing

**Issue**: Tests in `tests/integration/auth/register.test.ts` and `tests/integration/auth/login.test.ts` reimplement the logic inline instead of calling the actual Server Actions. This means the Server Actions themselves have no coverage.

**Solution**: Add direct Server Action tests that call the actual exported functions from `actions/auth.ts`.

---

### 2. `lib/auth/session.ts` — Session Helpers (9.09% coverage)

**Functions with 0% or low coverage:**
- `getSession()` - Not tested
- `requireAuth()` - Redirect/error paths not tested
- `requireRole()` - Role mismatch paths not tested

**Issue**: These helpers are critical middleware and protected route guards but have minimal test coverage.

**Solution**: Add unit tests for session helpers with various session states (no session, valid session, expired session, role mismatch).

---

## Phase: Coverage Improvement Tasks

### Session Helper Tests

- [ ] T101 [P] Add unit tests for `lib/auth/session.ts` in `tests/unit/auth/session.test.ts`:
  - `getSession()` returns session when valid
  - `getSession()` returns null when no session exists
  - `requireAuth()` throws when no session
  - `requireAuth()` throws when session expired
  - `requireRole('admin')` throws when user is submitter
  - `requireRole('submitter')` throws when user is admin
  - Session `ttl` is properly configured (8 hours)

- [ ] T102 [P] Add unit tests for password helpers in `tests/unit/auth/password.test.ts`:
  - `hashPassword()` produces different hashes for same password (salt randomness)
  - `verifyPassword()` returns true for correct password
  - `verifyPassword()` returns false for incorrect password
  - `hashPassword()` uses bcryptjs work factor 12

- [ ] T103 [P] Add unit tests for validation schemas in `tests/unit/auth/validation.test.ts`:
  - `registerSchema` accepts valid EPAM email + compliant password
  - `registerSchema` rejects non-EPAM emails
  - `registerSchema` rejects passwords < 8 chars
  - `registerSchema` rejects passwords without uppercase
  - `registerSchema` rejects passwords without number
  - `loginSchema` accepts valid email + password
  - `loginSchema` rejects empty fields

### Server Action Integration Tests

- [ ] T104 Add comprehensive integration test for `registerAction` in `tests/integration/auth/register.test.ts`:
  - Success: calls actual `registerAction`, verifies user created with correct role
  - Success: session cookie is set after registration
  - Error: duplicate email returns appropriate error
  - Error: non-EPAM email returns domain validation error
  - Error: password policy violation returns specific error messages
  - Error: missing required fields returns validation errors

- [ ] T105 Add comprehensive integration test for `loginAction` in `tests/integration/auth/login.test.ts`:
  - Success: calls actual `loginAction` with correct credentials
  - Success: session cookie is set after login
  - Success: failedAttempts is reset to 0 on successful login
  - Success: lockedUntil is set to null on successful login
  - Error: wrong password increments failedAttempts
  - Error: after 5 failures, account is locked (lockedUntil set)
  - Error: locked account returns lockout message with formatted time
  - Error: inactive account returns deactivation message
  - Error: non-existent email returns generic error (no user enumeration)
  - Lockout expiry: account unlocked after 15 minutes has passed

- [ ] T106 Add comprehensive integration test for `logoutAction` in `tests/integration/auth/logout.test.ts`:
  - Success: calls `logoutAction` and destroys session
  - Success: subsequent requests have no session
  - Success: returns `{ ok: true }`

- [ ] T107 Add comprehensive integration test for `deactivateUserAction` in `tests/integration/auth/deactivate.test.ts`:
  - Success: admin calls action, user status changes to inactive
  - Success: returns deactivatedEmail in response
  - Error: submitter cannot call action (requireRole check)
  - Error: deactivating self is allowed (admin can deactivate self)
  - Error: deactivating non-existent user returns error
  - Error: deactivating already-inactive user still succeeds (idempotent)

### Edge Cases & Branch Coverage

- [ ] T108 Add edge case tests for session expiry scenarios in `tests/integration/auth/session-expiry.test.ts`:
  - User can call authenticated endpoint with valid session
  - User cannot call authenticated endpoint after session expires
  - Expired session triggers redirect to `/login?reason=session_expired`
  - Session sliding window: activity resets expiry timer

- [ ] T109 Add branch coverage for error paths in `tests/integration/auth/error-handling.test.ts`:
  - Invalid input data (null, undefined, objects instead of strings)
  - Database constraint violations (unique, not-null)
  - Concurrent login attempts (race conditions)
  - Database connection errors (graceful failure)

### Component Test Coverage

- [ ] T110 [P] Extend `components/auth/LoginForm.test.tsx`:
  - Test disabled submit button during pending state
  - Test error message display from server
  - Test form reset after successful submission
  - Test keyboard submission (Enter key)

- [ ] T111 [P] Extend `components/auth/RegisterForm.test.tsx`:
  - Test all password policy error messages (length, uppercase, number)
  - Test email domain validation error message
  - Test form clears on successful submit
  - Test accessibility: aria-describedby links errors to fields

- [ ] T112 [P] Add test for `components/auth/LogoutButton.tsx`:
  - Button calls logoutAction on click
  - User is redirected to /login after logout
  - Button shows loading state during logout

### E2E Coverage Improvements

- [ ] T113 Add E2E test for lockout timeout in `tests/e2e/lockout-timeout.spec.ts`:
  - Trigger 5 failed login attempts
  - Verify account is locked with formatted timeout message
  - Wait and verify account is unlocked after 15 minutes (test with artificially fast time?)
  - Verify successful login after timeout passes

- [ ] T114 Add E2E test for session expiry in `tests/e2e/session-expiry.spec.ts`:
  - User logs in successfully
  - User is redirected and session is valid
  - Simulate session expiry (mock iron-session or manipulate time)
  - Next action redirects to `/login?reason=session_expired`
  - Session-expired message is visible on login page

- [ ] T115 Add E2E test for concurrent sessions in `tests/e2e/concurrent-sessions.spec.ts`:
  - User logs in on browser 1
  - Same user logs in on browser 2 (separate context)
  - Both sessions remain valid independently
  - Logout on browser 1 does not affect browser 2 session

---

## Execution Priority

### Priority 1 — Critical Coverage Gaps (Required for 80%+)

1. T104 — `registerAction` comprehensive test
2. T105 — `loginAction` comprehensive test
3. T106 — `logoutAction` test (currently missing)
4. T107 — `deactivateUserAction` comprehensive test
5. T101 — Session helper unit tests

### Priority 2 — Branch & Edge Case Coverage

6. T102 — Password helper unit tests
7. T103 — Validation schema unit tests
8. T108 — Session expiry scenarios
9. T109 — Error path coverage

### Priority 3 — Component & E2E Enhancements

10. T110–T112 — Component test extensions
11. T113–T115 — E2E enhancements

---

## Coverage Target Breakdown

| File | Current | Target | Tasks |
|---|---|---|---|
| `actions/auth.ts` | 1.36% | 100% | T104, T105, T106, T107, T109 |
| `lib/auth/session.ts` | 9.09% | 100% | T101, T108 |
| `lib/auth/password.ts` | 100% | 100% | T102 (maintain) |
| `lib/auth/validation.ts` | 100% | 100% | T103 (maintain) |
| `components/auth/*` | ~80% | 90%+ | T110, T111, T112 |
| **Overall** | **74.82%** | **80%+** | All tasks |

---

## Testing Strategy

### Unit Tests (tests/unit/auth/)

- Direct function testing without Server Context
- Mock database where needed
- Fast execution (< 500ms per file)
- Test utilities, helpers, and schemas

### Integration Tests (tests/integration/auth/)

- Full action testing with real SQLite in-memory DB
- Test actual Server Action exports
- Cover success + error paths for each action
- ~10–20 tests per file

### E2E Tests (tests/e2e/)

- Full browser automation with Playwright
- Test user workflows end-to-end
- Session persistence, redirects, UI validation
- ~3–5 tests per flow

---

## Execution Steps

1. **Create test file structure**:
   ```bash
   mkdir -p tests/unit/auth
   touch tests/unit/auth/session.test.ts
   touch tests/unit/auth/password.test.ts
   touch tests/unit/auth/validation.test.ts
   touch tests/integration/auth/logout.test.ts
   touch tests/integration/auth/session-expiry.test.ts
   touch tests/integration/auth/error-handling.test.ts
   ```

2. **Write unit tests** (T101–T103): Fast feedback, isolate helper logic

3. **Update integration tests** (T104–T109): Rewrite to call actual Server Actions

4. **Enhance component tests** (T110–T112): Extend existing test files

5. **Add E2E tests** (T113–T115): Full user journey validation

6. **Verify coverage**:
   ```bash
   npm run test:coverage
   ```

7. **Update threshold if needed**:
   - Ensure `lib/auth/` and `actions/auth.ts` reach 100%
   - Maintain overall 80%+ coverage

---

## Success Criteria

- ✅ `actions/auth.ts` coverage: 100%
- ✅ `lib/auth/session.ts` coverage: 100%
- ✅ `lib/auth/password.ts` coverage: 100% (maintain)
- ✅ `lib/auth/validation.ts` coverage: 100% (maintain)
- ✅ Overall coverage: 80%+ (from 74.82%)
- ✅ All 222 tests pass
- ✅ No flaky tests (runs 3 times consistently)
- ✅ CI gates pass: type-check, lint, test, test:coverage

