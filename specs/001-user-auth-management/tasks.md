# Tasks: User Authentication & Management

**Input**: Design documents from `/specs/001-user-auth-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are required by specification and constitution constraints (Vitest + RTL, integration tests, Playwright E2E).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and toolchain setup

- [ ] T001 Initialize Next.js 15 TypeScript project structure in app/layout.tsx and app/page.tsx
- [ ] T002 Add runtime dependencies in package.json (drizzle-orm, better-sqlite3, iron-session, bcryptjs, zod, react-hook-form, @hookform/resolvers, date-fns)
- [ ] T003 Add development dependencies and scripts in package.json (drizzle-kit, vitest, @testing-library/react, @testing-library/user-event, playwright, tsx)
- [ ] T004 Configure TypeScript strict mode and path aliases in tsconfig.json
- [ ] T005 Configure Tailwind CSS v4 with @theme tokens and base imports in app/globals.css
- [ ] T006 Configure PostCSS for Tailwind v4 in postcss.config.mjs
- [ ] T007 Initialize shadcn/ui and base component config in components.json
- [ ] T008 [P] Create test directory scaffolding in tests/integration/auth/.gitkeep and tests/e2e/.gitkeep
- [ ] T009 [P] Create data directory placeholder in data/.gitkeep

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core platform pieces required by all user stories

**CRITICAL**: Complete this phase before user story implementation.

- [ ] T010 Define users table schema with role/status/lockout fields in lib/db/schema.ts
- [ ] T011 Generate and commit initial migration for users table in lib/db/migrations/0001_init_auth.sql
- [ ] T012 Create Drizzle SQLite client and DATABASE_URL wiring in lib/db/index.ts
- [ ] T013 Implement admin seed script (upsert) in lib/db/seed.ts
- [ ] T014 Create shared auth validation schemas in lib/auth/validation.ts
- [ ] T015 Create password hashing and verification helpers in lib/auth/password.ts
- [ ] T016 Implement iron-session config and helpers in lib/auth/session.ts
- [ ] T017 Implement baseline route protection and returnUrl handling in middleware.ts
- [ ] T018 Create global error and not-found boundaries in app/error.tsx and app/not-found.tsx
- [ ] T019 Create shared authenticated shell and nav placeholders in app/(protected)/layout.tsx
- [ ] T020 Configure Vitest (jsdom, setup file, aliases) in vitest.config.ts and tests/setup.ts
- [ ] T021 Configure Playwright base setup in playwright.config.ts
- [ ] T022 Add environment template and script docs in .env.example

**Checkpoint**: Foundation ready. User stories can proceed.

---

## Phase 3: User Story 1 - Employee Registration (Priority: P1)

**Goal**: Allow unauthenticated users to register with valid @epam.com credentials and land on submitter dashboard.

**Independent Test**: Register with a valid @epam.com email, verify account creation with submitter role, and confirm redirect to submitter dashboard.

### Tests for User Story 1

- [ ] T023 [P] [US1] Add component test for registration form validation in components/auth/RegisterForm.test.tsx
- [ ] T024 [P] [US1] Add integration test for registerAction success/duplicate/domain validation in tests/integration/auth/register.test.ts
- [ ] T025 [P] [US1] Add E2E registration journey test in tests/e2e/registration-flow.spec.ts

### Implementation for User Story 1

- [ ] T026 [US1] Implement registerAction contract paths and session creation in actions/auth.ts
- [ ] T027 [US1] Build registration client form with react-hook-form + zod in components/auth/RegisterForm.tsx
- [ ] T028 [US1] Create registration route page and form wiring in app/(auth)/register/page.tsx
- [ ] T029 [US1] Build submitter dashboard page and display name/role in app/(protected)/dashboard/page.tsx
- [ ] T030 [US1] Add registration navigation link in app/(auth)/layout.tsx

**Checkpoint**: US1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Employee Login (Priority: P1)

**Goal**: Allow registered users to log in/out with session persistence, generic errors, and lockout policy.

**Independent Test**: Log in with valid credentials and reach role-appropriate dashboard; invalid credentials show generic errors; lockout occurs after 5 failures for 15 minutes.

### Tests for User Story 2

- [ ] T031 [P] [US2] Add component test for login form behavior in components/auth/LoginForm.test.tsx
- [ ] T032 [P] [US2] Add integration tests for loginAction success/failure/lockout/session reset in tests/integration/auth/login.test.ts
- [ ] T033 [P] [US2] Add E2E login and logout flow in tests/e2e/login-flow.spec.ts

### Implementation for User Story 2

- [ ] T034 [US2] Implement loginAction credential checks, lockout with human-readable date-fns remaining-time message, inactive-user messaging, and role return in actions/auth.ts
- [ ] T035 [US2] Implement logoutAction session destroy behavior in actions/auth.ts
- [ ] T036 [US2] Build login form UI with react-hook-form + zod, server action wiring, and pending-state submit-button disable in components/auth/LoginForm.tsx
- [ ] T037 [US2] Create login route page with session-expired message when ?reason=session_expired is present in app/(auth)/login/page.tsx
- [ ] T038 [US2] Add reusable logout button tied to logoutAction in components/auth/LogoutButton.tsx
- [ ] T039 [US2] Render logout and session-aware navigation in app/(protected)/layout.tsx

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Admin Access & Role Enforcement (Priority: P2)

**Goal**: Enforce RBAC for admin-only routes and show role-appropriate navigation.

**Independent Test**: Admin can access admin routes; submitter is redirected to access-denied; unauthenticated access redirects to login with returnUrl.

### Tests for User Story 3

- [ ] T040 [P] [US3] Add integration tests for middleware RBAC redirects in tests/integration/auth/rbac.test.ts
- [ ] T041 [P] [US3] Add E2E admin-role enforcement journey in tests/e2e/admin-role-enforcement.spec.ts

### Implementation for User Story 3

- [ ] T042 [US3] Extend middleware role guards, returnUrl validation for /admin routes, and append ?reason=session_expired on session-expiry redirects in middleware.ts
- [ ] T043 [US3] Create admin dashboard route in app/(protected)/admin/dashboard/page.tsx
- [ ] T044 [US3] Create access-denied route with title `Access denied`, message `You do not have permission to access this page.`, and a back-to-dashboard button in app/(protected)/access-denied/page.tsx
- [ ] T045 [US3] Implement role-based nav: submitter sees Dashboard + Logout; admin sees Dashboard + Users + Logout in app/(protected)/layout.tsx

**Checkpoint**: US3 is independently testable with seeded admin and submitter accounts.

---

## Phase 6: User Story 4 - Admin Account Deactivation (Priority: P3)

**Goal**: Allow admins to deactivate users and block inactive users from future logins.

**Independent Test**: Admin deactivates a submitter account and that account is blocked at next login with the required deactivation message.

### Tests for User Story 4

- [ ] T046 [P] [US4] Add integration tests for deactivateUserAction authorization and status transition in tests/integration/auth/deactivate.test.ts
- [ ] T047 [P] [US4] Extend login integration test for inactive-user rejection in tests/integration/auth/login.test.ts
- [ ] T048 [P] [US4] Add E2E deactivation flow in tests/e2e/admin-deactivation-flow.spec.ts

### Implementation for User Story 4

- [ ] T049 [US4] Implement deactivateUserAction admin-only behavior in actions/auth.ts
- [ ] T050 [US4] Create admin user management page with deactivate controls in app/(protected)/admin/users/page.tsx
- [ ] T051 [US4] Add deactivation status feedback and formatted timestamps with date-fns in app/(protected)/admin/users/page.tsx
- [ ] T052 [US4] Enforce inactive-user login block messaging in actions/auth.ts

**Checkpoint**: All user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality, security, and delivery checks

- [ ] T053 [P] Add accessibility assertions for auth forms (labels, aria-describedby, keyboard focus) in components/auth/RegisterForm.test.tsx and components/auth/LoginForm.test.tsx
- [ ] T054 Configure test coverage threshold for core auth modules (>=80% line) in vitest.config.ts
- [ ] T055 [P] Add npm scripts for type-check/lint/test/e2e/db:migrate/db:seed in package.json
- [ ] T056 [P] Validate quickstart steps and environment documentation in specs/001-user-auth-management/quickstart.md
- [ ] T057 Run full quality gate and capture results in specs/001-user-auth-management/quickstart.md (npm run type-check, npm run lint, npm run test, npx playwright test)

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies
- Phase 2 (Foundational): depends on Phase 1 and blocks all user stories
- Phase 3 (US1): depends on Phase 2
- Phase 4 (US2): depends on Phase 2 (can run in parallel with Phase 3, but both modify actions/auth.ts so sequence is recommended)
- Phase 5 (US3): depends on Phase 2 and completed US1 + US2 auth flows
- Phase 6 (US4): depends on Phase 5 (admin UI and RBAC)
- Phase 7 (Polish): depends on completion of all target user stories

### User Story Dependencies

- US1: independent after Foundational
- US2: independent after Foundational
- US3: depends functionally on US1 + US2 (existing auth/session)
- US4: depends on US3 (admin surfaces + role enforcement)

### Within Each User Story

- Write tests first and confirm they fail
- Implement schema/helpers before action logic
- Implement action logic before page/form wiring
- Verify independent test criteria before moving forward

### Parallel Opportunities

- Setup: T008 and T009 are parallelizable
- Foundational: T018, T020, T021, T022 can run in parallel after T010-T017 baseline exists
- US1: T023-T025 can run in parallel
- US2: T031-T033 can run in parallel
- US3: T040 and T041 can run in parallel
- US4: T046-T048 can run in parallel
- Polish: T053, T055, T056 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring
T023 components/auth/RegisterForm.test.tsx
T024 tests/integration/auth/register.test.ts
T025 tests/e2e/registration-flow.spec.ts

# Then sequential implementation
T026 actions/auth.ts
T027 components/auth/RegisterForm.tsx
T028 app/(auth)/register/page.tsx
T029 app/(protected)/dashboard/page.tsx
```

## Parallel Example: User Story 2

```bash
# Parallel test authoring
T031 components/auth/LoginForm.test.tsx
T032 tests/integration/auth/login.test.ts
T033 tests/e2e/login-flow.spec.ts

# Then sequential implementation on shared action file
T034 actions/auth.ts
T035 actions/auth.ts
T036 components/auth/LoginForm.tsx
```

## Parallel Example: User Story 4

```bash
# Parallel tests
T046 tests/integration/auth/deactivate.test.ts
T047 tests/integration/auth/login.test.ts
T048 tests/e2e/admin-deactivation-flow.spec.ts

# Then implementation
T049 actions/auth.ts
T050 app/(protected)/admin/users/page.tsx
T051 app/(protected)/admin/users/page.tsx
T052 actions/auth.ts
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1 and Phase 2
2. Deliver US1 (registration)
3. Deliver US2 (login/logout + lockout)
4. Validate core auth flows with tests and demo

### Incremental Delivery

1. MVP: US1 + US2
2. Add US3 role enforcement and admin access
3. Add US4 account deactivation
4. Polish with coverage/accessibility/quality gates

### Parallel Team Strategy

1. One engineer handles shared auth action file (actions/auth.ts)
2. One engineer handles UI/forms and route pages
3. One engineer handles integration/E2E tests
4. Merge only after story-level independent test criteria pass
