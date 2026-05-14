# Tasks: User Authentication & Management

**Input**: Design documents from `/specs/001-user-auth-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Required by spec and constitution (Vitest + RTL for unit/component; integration tests against real SQLite test DB; Playwright for E2E).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Parallelizable (no blocking dependency on incomplete tasks in the same phase)
- **[Story]**: User story label (US1–US4); omitted in Setup, Foundational, and Polish phases

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, toolchain, and directory scaffolding

- [ ] T001 Initialize Next.js 15 App Router TypeScript project with root layout in app/layout.tsx and app/page.tsx
- [ ] T002 Add runtime dependencies in package.json: drizzle-orm, better-sqlite3, iron-session, bcryptjs, zod, react-hook-form, @hookform/resolvers, date-fns
- [ ] T003 Add development dependencies in package.json: drizzle-kit, @types/better-sqlite3, @types/bcryptjs, vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/user-event, jsdom, playwright, @playwright/test, tsx
- [ ] T004 Configure TypeScript strict mode (`"strict": true`) and `@/*` path alias in tsconfig.json
- [ ] T005 Configure Tailwind CSS v4 with `@import "tailwindcss"` and `@theme { }` design tokens in app/globals.css
- [ ] T006 Configure PostCSS plugin for Tailwind v4 in postcss.config.mjs
- [ ] T007 Initialize shadcn/ui with Tailwind v4 support in components.json
- [ ] T008 [P] Create test directory scaffolding: tests/integration/auth/.gitkeep and tests/e2e/.gitkeep
- [ ] T009 [P] Create SQLite runtime directory placeholder in data/.gitkeep

**Checkpoint**: Toolchain installed and configured. Ready for foundational work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required by every user story — schema, auth helpers, session, middleware baseline, test configs

**⚠️ CRITICAL**: Complete this phase entirely before any user story work begins.

- [ ] T010 Define `users` table schema (id, email, displayName, passwordHash, role, status, failedAttempts, lockedUntil, createdAt) with Drizzle and inferred TypeScript types in lib/db/schema.ts
- [ ] T011 Generate and commit initial Drizzle migration for the users table in lib/db/migrations/0001_init_auth.sql (run `npx drizzle-kit generate`)
- [ ] T012 Create Drizzle `better-sqlite3` client singleton with DATABASE_URL env wiring in lib/db/index.ts
- [ ] T013 Implement admin account seed script using upsert (idempotent) via `npm run db:seed` in lib/db/seed.ts
- [ ] T014 [P] Create shared Zod schemas `registerSchema` and `loginSchema` (shared client + server) in lib/auth/validation.ts
- [ ] T015 [P] Implement `hashPassword` and `verifyPassword` helpers using bcryptjs work factor 12 in lib/auth/password.ts
- [ ] T016 Implement iron-session config (`ttl: 8*60*60`), `SessionData` interface, `getSession()`, `requireAuth()`, and `requireRole()` helpers in lib/auth/session.ts
- [ ] T017 Implement baseline Next.js middleware: protect all `/(protected)` routes, redirect unauthenticated users to `/login?returnUrl=...`, pass through `/(auth)` routes in middleware.ts
- [ ] T018 [P] Create root error boundary in app/error.tsx and global 404 boundary in app/not-found.tsx
- [ ] T019 Create authenticated shell layout with nav placeholder and session guard in app/(protected)/layout.tsx
- [ ] T020 [P] Configure Vitest with jsdom environment, React Testing Library setup file, and `@/*` alias in vitest.config.ts and tests/setup.ts
- [ ] T021 [P] Configure Playwright with baseURL, test directory, and local dev server in playwright.config.ts
- [ ] T022 [P] Add environment variable template with DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME in .env.example

**Checkpoint**: Schema migrated, auth helpers ready, middleware baseline active. User story phases can begin.

---

## Phase 3: User Story 1 — Employee Registration (Priority: P1) 🎯 MVP

**Goal**: Allow unauthenticated visitors to register with a valid `@epam.com` email and land on the submitter dashboard with the `submitter` role.

**Independent Test**: Navigate to `/register`, fill in a valid EPAM email + compliant password + display name, submit — verify the account is created with `submitter` role and the browser lands on `/dashboard` showing the user's name and role label.

### Tests — User Story 1

- [ ] T023 [P] [US1] Write component tests for RegisterForm field validation, domain rejection, and password policy errors in components/auth/RegisterForm.test.tsx
- [ ] T024 [P] [US1] Write integration tests for registerAction: success path, duplicate email, non-EPAM domain, password policy violation — against real SQLite test DB in tests/integration/auth/register.test.ts
- [ ] T025 [P] [US1] Write Playwright E2E test for the full registration journey in tests/e2e/registration-flow.spec.ts

### Implementation — User Story 1

- [ ] T026 [US1] Implement `registerAction` in actions/auth.ts: validate input, hash password, insert user, create iron-session cookie, return `{ ok: true, data: { userId } }`
- [ ] T027 [US1] Build `RegisterForm` client component with react-hook-form + registerSchema, inline field errors, and loading state during submission in components/auth/RegisterForm.tsx
- [ ] T028 [US1] Create registration RSC page that renders RegisterForm and redirects authenticated users to their dashboard in app/(auth)/register/page.tsx
- [ ] T029 [US1] Create submitter dashboard page displaying `displayName` and role label in app/(protected)/dashboard/page.tsx
- [ ] T030 [US1] Create unauthenticated shell layout with login/register navigation links in app/(auth)/layout.tsx

**Checkpoint**: US1 fully functional and independently testable — registration creates an account and lands on the submitter dashboard.

---

## Phase 4: User Story 2 — Employee Login (Priority: P1)

**Goal**: Allow registered users to log in and reach their role-appropriate dashboard; enforce lockout after 5 failures; support session-expiry redirect; support logout.

**Independent Test**: Log in with valid credentials → reach dashboard. Enter wrong password 5× → see lockout message with human-readable remaining time. Click Logout → redirected to `/login`. Expire session → redirected to `/login` with session-expired message.

### Tests — User Story 2

- [ ] T031 [P] [US2] Write component tests for LoginForm: field validation, error display, submit-button disabled during pending state in components/auth/LoginForm.test.tsx
- [ ] T032 [P] [US2] Write integration tests for loginAction: success, wrong password, lockout counter, lockout expiry, inactive user, session creation and reset in tests/integration/auth/login.test.ts
- [ ] T033 [P] [US2] Write Playwright E2E test for login, logout, and lockout flows in tests/e2e/login-flow.spec.ts

### Implementation — User Story 2

- [ ] T034 [US2] Implement `loginAction` in actions/auth.ts: check lockout (`lockedUntil > Date.now()`), check inactive status, verify bcrypt, increment/reset `failedAttempts`, set `lockedUntil` on 5th failure, write iron-session, return role; lockout error message uses date-fns `formatDistanceToNow` for human-readable remaining time
- [ ] T035 [US2] Implement `logoutAction` in actions/auth.ts: destroy iron-session cookie and return `{ ok: true }`
- [ ] T036 [US2] Build `LoginForm` client component with react-hook-form + loginSchema, server action wiring, inline error display, and submit button disabled + loading spinner while request is in-flight in components/auth/LoginForm.tsx
- [ ] T037 [US2] Create login RSC page that reads `?reason=session_expired` and displays a visible info banner when present; renders LoginForm; redirects authenticated users to their dashboard in app/(auth)/login/page.tsx
- [ ] T038 [US2] Create reusable `LogoutButton` client component that calls `logoutAction` and redirects to `/login` in components/auth/LogoutButton.tsx
- [ ] T039 [US2] Wire `LogoutButton` and session-aware display name into the authenticated shell nav in app/(protected)/layout.tsx

**Checkpoint**: US1 and US2 both independently functional — login, logout, lockout, and session-expiry all work.

---

## Phase 5: User Story 3 — Admin Access & Role Enforcement (Priority: P2)

**Goal**: Enforce RBAC in middleware so admins reach admin routes and submitters are blocked with a specific access-denied page; render role-appropriate navigation.

**Independent Test**: Seed an admin account. Log in as admin → verify `/admin/dashboard` accessible. Log in as submitter → navigate to `/admin/dashboard` → verify redirect to `/access-denied` with correct title, message, and button. Unauthenticated user → any protected route → `/login?returnUrl=...`.

### Tests — User Story 3

- [ ] T040 [P] [US3] Write integration tests for middleware RBAC: submitter → `/admin/*` redirects to `/access-denied`; admin → `/dashboard` redirects to `/admin/dashboard`; unauthenticated → `/login?returnUrl=...`; admin → submitter-only routes → `/access-denied` in tests/integration/auth/rbac.test.ts
- [ ] T041 [P] [US3] Write Playwright E2E test for admin login, admin route access, submitter role-enforcement, and nav link visibility in tests/e2e/admin-role-enforcement.spec.ts

### Implementation — User Story 3

- [ ] T042 [US3] Extend middleware with full RBAC rules: block submitters from `/admin/*` and admins from `/dashboard` (submitter-only); redirect violations to `/access-denied`; append `?reason=session_expired` to `/login` redirect when session is expired in middleware.ts
- [ ] T043 [US3] Create admin dashboard RSC page with admin-specific content in app/(protected)/admin/dashboard/page.tsx
- [ ] T044 [US3] Create access-denied RSC page with hardcoded title `Access denied`, message `You do not have permission to access this page.`, and a "Back to Dashboard" button that routes to the user's role-appropriate dashboard in app/(protected)/access-denied/page.tsx
- [ ] T045 [US3] Implement role-conditioned nav in the authenticated shell: `submitter` renders Dashboard + Logout; `admin` renders Dashboard + Users + Logout in app/(protected)/layout.tsx

**Checkpoint**: US3 independently testable with seeded admin and submitter accounts — RBAC, nav labels, and access-denied page all verified.

---

## Phase 6: User Story 4 — Admin Account Deactivation (Priority: P3)

**Goal**: Allow admins to deactivate user accounts; deactivated accounts are blocked at login with a specific message; admin sees visible confirmation after deactivation.

**Independent Test**: As admin, open `/admin/users`, deactivate a submitter → see confirmation with the deactivated email. Attempt to log in as the deactivated user → blocked with `"Your account has been deactivated. Please contact your administrator."`.

### Tests — User Story 4

- [ ] T046 [P] [US4] Write integration tests for `deactivateUserAction`: admin-only authorization gate, status transition `active → inactive`, response includes `deactivatedEmail` in tests/integration/auth/deactivate.test.ts
- [ ] T047 [P] [US4] Extend login integration tests to cover inactive-user rejection path returning the deactivation message in tests/integration/auth/login.test.ts
- [ ] T048 [P] [US4] Write Playwright E2E test for full deactivation flow: admin deactivates submitter, submitter login is blocked in tests/e2e/admin-deactivation-flow.spec.ts

### Implementation — User Story 4

- [ ] T049 [US4] Implement `deactivateUserAction` in actions/auth.ts: verify `requireRole('admin')`, set `users.status = 'inactive'`, return `{ ok: true, data: { deactivatedEmail } }` — does NOT modify `failedAttempts` or `lockedUntil`
- [ ] T050 [US4] Create admin user management RSC page that fetches all users and renders a deactivate button per active user row in app/(protected)/admin/users/page.tsx
- [ ] T051 [US4] Add `createdAt` column display formatted with `date-fns` `format()` in the user table in app/(protected)/admin/users/page.tsx
- [ ] T052 [US4] Show deactivation success confirmation (inline alert with `deactivatedEmail`) after `deactivateUserAction` returns `ok: true` in app/(protected)/admin/users/page.tsx

**Checkpoint**: All four user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, coverage thresholds, CI scripts, and documentation sign-off

- [ ] T053 [P] Add accessibility assertions (aria-label, aria-describedby, keyboard focus order) to RegisterForm and LoginForm component tests in components/auth/RegisterForm.test.tsx and components/auth/LoginForm.test.tsx
- [ ] T054 Configure Vitest coverage threshold `lines: 80` for `lib/auth/` and `actions/auth.ts` in vitest.config.ts
- [ ] T055 [P] Add all npm scripts to package.json: `type-check`, `lint`, `test`, `test:coverage`, `e2e`, `db:migrate`, `db:seed`
- [ ] T056 [P] Verify quickstart steps match actual project setup and update any stale commands in specs/001-user-auth-management/quickstart.md
- [ ] T057 Run full quality gate (`npm run type-check`, `npm run lint`, `npm run test`, `npx playwright test`) and document pass/fail in specs/001-user-auth-management/quickstart.md

**Checkpoint**: All gates pass. Feature branch ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Setup): no dependencies
- **Phase 2** (Foundational): requires Phase 1 complete; blocks all user story phases
- **Phase 3** (US1): requires Phase 2
- **Phase 4** (US2): requires Phase 2 (can parallel Phase 3 but both write `actions/auth.ts` — sequence recommended)
- **Phase 5** (US3): requires Phase 2 and functional US1 + US2 auth/session layer
- **Phase 6** (US4): requires Phase 5 (admin routes and RBAC)
- **Phase 7** (Polish): requires all user story phases complete

### User Story Dependencies

| Story | Depends on | Notes |
|---|---|---|
| US1 | Foundational | Independent |
| US2 | Foundational | Independent; sequence after US1 to avoid `actions/auth.ts` conflicts |
| US3 | US1 + US2 | Needs session/role infrastructure from both |
| US4 | US3 | Needs admin routes and `requireRole('admin')` from US3 |

### Parallel Opportunities

| Phase | Parallel tasks |
|---|---|
| Setup | T008, T009 |
| Foundational | T014, T015 (helpers); T018, T020, T021, T022 after T010–T017 baseline |
| US1 | T023, T024, T025 (test authoring) |
| US2 | T031, T032, T033 (test authoring) |
| US3 | T040, T041 (test authoring) |
| US4 | T046, T047, T048 (test authoring) |
| Polish | T053, T055, T056 |

---

## Parallel Execution Examples

### User Story 1

```bash
# Write tests in parallel
T023  components/auth/RegisterForm.test.tsx
T024  tests/integration/auth/register.test.ts
T025  tests/e2e/registration-flow.spec.ts

# Implement sequentially (share actions/auth.ts)
T026  actions/auth.ts
T027  components/auth/RegisterForm.tsx
T028  app/(auth)/register/page.tsx
T029  app/(protected)/dashboard/page.tsx
T030  app/(auth)/layout.tsx
```

### User Story 2

```bash
# Write tests in parallel
T031  components/auth/LoginForm.test.tsx
T032  tests/integration/auth/login.test.ts
T033  tests/e2e/login-flow.spec.ts

# Implement sequentially (extend actions/auth.ts from US1)
T034  actions/auth.ts  (loginAction)
T035  actions/auth.ts  (logoutAction)
T036 components/auth/LoginForm.tsx
```

## Parallel Example: User Story 4

```bash
# Parallel tests
T046 tests/integration/auth/deactivate.test.ts
T047 tests/integration/auth/login.test.ts
T048 tests/e2e/admin-deactivation-flow.spec.ts

# Then implementation
T049 actions/auth.ts  (deactivateUserAction)
T050 app/(protected)/admin/users/page.tsx  (user list + deactivate button)
T051 app/(protected)/admin/users/page.tsx  (date-fns createdAt formatting)
T052 app/(protected)/admin/users/page.tsx  (deactivation confirmation alert)
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1 and Phase 2
2. Deliver US1 (registration)
3. Deliver US2 (login/logout + lockout)
4. Validate core auth flows end-to-end

### Incremental Delivery

1. MVP: US1 + US2 (core auth — register, login, logout, lockout)
2. Add US3 (role enforcement, admin access, nav labels, access-denied page)
3. Add US4 (account deactivation, admin user management)
4. Polish: coverage thresholds, accessibility assertions, quality gate

### Parallel Team Strategy

1. One engineer owns `actions/auth.ts` (Server Action logic)
2. One engineer owns UI/forms and route pages
3. One engineer owns integration and E2E tests
4. Merge after each story's independent test criteria pass
