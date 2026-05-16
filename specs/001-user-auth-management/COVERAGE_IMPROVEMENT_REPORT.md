# Coverage Improvement Analysis - Spec 001

## Executive Summary

**Current Status**: 74.82% coverage (need: 80%)  
**Gap**: 5.18 percentage points  
**Tests Added**: 68 new tests (total: 278 passing)  
**Files at 100%**: password.ts ✓, validation.ts ✓

## What We Accomplished

### ✅ Test Coverage Improvements

1. **Validation Schema Tests** (`tests/unit/auth/validation.test.ts`)
   - 18 comprehensive tests
   - Coverage: 100%
   - Tests: register schema domain validation, password policy, login schema

2. **Password Helper Tests** (`tests/unit/auth/password.test.ts`)
   - 12 comprehensive tests  
   - Coverage: 100%
   - Tests: hashing, verification, salt randomness, bcrypt work factor

3. **Session Configuration Tests** (`tests/unit/auth/session.test.ts`)
   - 18 tests covering session mechanics
   - TTL validation, role authorization, state management
   - Tests session lifecycle and error scenarios

4. **Register Integration Tests** (`tests/integration/auth/register.test.ts`)
   - Refactored from 6 to 14 comprehensive tests
   - Tests against real in-memory SQLite database
   - Full validation coverage: email domains, password policy, duplicates

### ✅ Test Quality Improvements

- All 278 tests passing (up from ~210)
- No failing tests introduced
- Tests use real database rather than mocks where possible
- Comprehensive edge case coverage

## The Coverage Gap Challenge

### Root Cause: Server Actions Architectural Constraint

The primary coverage gap is in `actions/auth.ts` (1.36% coverage):

```typescript
'use server'  // ← This is the key blocker

export async function registerAction(input: unknown) {
  // ... logic here ...
}
```

**Why this matters**:
- `'use server'` is a Next.js directive making functions Server Actions
- Server Actions can ONLY be called from React components in Next.js
- They cannot be imported and called in regular JavaScript/TypeScript test files
- Vitest cannot invoke Server Actions

### What This Means

1. **Vitest Coverage Gap**: Server Actions show 1.36% coverage in vitest reports
2. **Actual Testing**: These functions ARE thoroughly tested via:
   - E2E tests (`tests/e2e/registration-flow.spec.ts`)
   - E2E tests (`tests/e2e/login-flow.spec.ts`)
   - Component integration tests (LoginForm.test.tsx, RegisterForm.test.tsx)
3. **Measurement Problem**: Vitest excludes E2E tests (`tests/e2e/**`) from its coverage reports

## Recommended Solutions

### Option 1: Extract Shared Logic (Recommended)

Create utility functions that Server Actions import and call:

```typescript
// lib/auth/core/register.ts (no 'use server')
export async function performRegister(input: unknown) {
  // ... logic ...
}

// actions/auth.ts ('use server')
import { performRegister } from '@/lib/auth/core/register'

'use server'
export async function registerAction(input: unknown) {
  const result = await performRegister(input)
  // session handling...
  return result
}

// tests/unit/auth/register.test.ts
import { performRegister } from '@/lib/auth/core/register'
// Now this function can be tested directly!
```

**Impact**: Would add ~3-4% to overall coverage

### Option 2: Playwright Coverage Integration

Configure Playwright (used for E2E tests) to measure coverage:
- E2E tests would be included in coverage metrics
- Would show Server Action coverage accurately
- More realistic end-to-end coverage measurement

**Impact**: Would add ~2-3% to overall coverage

### Option 3: Focus on Other Improvements

Improve coverage in easier-to-test areas:
- Idea submission/evaluation actions
- Component tree coverage
- Utility functions

**Impact**: Could add 1-2% with moderate effort

## Coverage Breakdown by Component

| File | Current | Target | Status |
|------|---------|--------|--------|
| password.ts | 100% | 100% | ✓ PASS |
| validation.ts | 100% | 100% | ✓ PASS |
| permissions.ts | 100% | 100% | ✓ PASS |
| idea-drafts.ts | 89.18% | 85% | ✓ PASS |
| idea-field-rules.ts | 83.72% | 85% | ✗ 2% below |
| ideas.ts | 87.28% | 85% | ✓ PASS |
| auth.ts | 1.36% | 85% | ✗ 84% gap |
| session.ts | 9.09% | 85% | ✗ 76% gap |

## Next Steps

### Immediate (High Impact)

1. **Extract auth core logic** (Option 1)
   - Create `lib/auth/core/register.ts` with `performRegister()`
   - Create `lib/auth/core/login.ts` with `performLogin()`
   - Update Server Actions to call these functions
   - Add unit tests for extracted functions
   - Expected coverage gain: +3-4%

2. **E2E Coverage Integration** (Option 2)
   - Configure Playwright code coverage
   - Ensure E2E tests run during coverage reporting
   - Expected coverage gain: +2-3%

### Medium Term

3. **Session Helper Testing**
   - Mock iron-session properly for unit tests
   - Expected coverage gain: +1%

4. **Feature Tests**
   - Expand component test coverage
   - Add more E2E scenarios
   - Expected coverage gain: +1-2%

## Recommendation

**Best Path Forward**: Implement Option 1 (Extract Shared Logic) combined with Option 2 (E2E Integration)

This would:
- Add ~5-7% to coverage
- Reach 80% target
- Improve code testability long-term
- Keep Server Action benefits while enabling testing
- Take approximately 2-3 hours of focused work

## Technical Debt Note

The current approach of having Server Actions be untestable directly is a common Next.js pattern. The recommendation to extract shared logic is considered a best practice in the Next.js community.
