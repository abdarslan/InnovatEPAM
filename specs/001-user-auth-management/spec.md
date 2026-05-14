# Feature Specification: User Authentication & Management

**Feature Branch**: `001-user-auth-management`

**Created**: 2026-05-14

**Status**: Draft

**Input**: User description: "Implement user management system, auth. Login and register should be implemented. User roles should exist as submitter and admin."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Employee Registration (Priority: P1)

A new EPAM employee visits the portal for the first time and creates an account so they can participate in the innovation process as a submitter.

**Why this priority**: Without registration, no one can use the platform. This is the entry point for all other functionality and unblocks every downstream user story.

**Independent Test**: Can be fully tested by navigating to the registration page, filling in the form, and verifying the account is created and the user lands on the submitter dashboard.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they complete the registration form with a valid EPAM email and password, **Then** an account is created with the `submitter` role and they are redirected to the submitter dashboard.
2. **Given** an unauthenticated visitor, **When** they submit a registration form with an email that is already registered, **Then** an error message is shown and no duplicate account is created.
3. **Given** an unauthenticated visitor, **When** they submit a form with a missing required field, **Then** inline validation errors appear on the relevant fields and the form is not submitted.
4. **Given** a successful registration, **When** the user is redirected to the dashboard, **Then** their name and role ("Submitter") are visible in the navigation.

---

### User Story 2 - Employee Login (Priority: P1)

A registered EPAM employee logs in to the portal to access their submitter capabilities.

**Why this priority**: Login is the gateway to all authenticated features; without it no existing user can access the platform.

**Independent Test**: Can be fully tested by logging in with valid credentials and verifying access to the submitter dashboard, independent of any other feature.

**Acceptance Scenarios**:

1. **Given** a registered user, **When** they enter correct email and password, **Then** they are authenticated and redirected to their role-appropriate dashboard.
2. **Given** a registered user, **When** they enter an incorrect password, **Then** a generic error message is shown ("Invalid email or password") without revealing which field is wrong.
3. **Given** an authenticated user, **When** they attempt to visit the login page, **Then** they are redirected to their dashboard.
3. **Given** a registered user, **When** they fail to log in 5 consecutive times, **Then** their account is locked for 15 minutes and a message shows the remaining wait time.
4. **Given** an authenticated user, **When** they click "Log out", **Then** their session is terminated and they are redirected to the login page.

---

### User Story 3 - Admin Access & Role Enforcement (Priority: P2)

An administrator logs in and can access admin-only areas of the portal; non-admins are blocked from those areas.

**Why this priority**: Role separation is critical for platform integrity — admins manage the innovation pipeline and must be isolated from regular submitters. Depends on US1/US2 being complete.

**Independent Test**: Can be tested by logging in with an admin-seeded account and verifying access to admin routes, and confirming a submitter account is redirected away from those same routes.

**Acceptance Scenarios**:

1. **Given** a user with the `admin` role, **When** they log in, **Then** they are redirected to the admin dashboard, not the submitter dashboard.
2. **Given** a user with the `submitter` role, **When** they attempt to navigate to an admin-only route, **Then** they are redirected to an access-denied page with a clear explanation.
3. **Given** an unauthenticated user, **When** they attempt to access any protected route, **Then** they are redirected to the login page with the original URL preserved as a redirect parameter.
4. **Given** an `admin` user viewing the admin dashboard, **Then** navigation links to admin-only sections are visible; those same links are absent for `submitter` users.

---

### User Story 4 - Admin Account Deactivation (Priority: P3)

An administrator deactivates a user account (e.g., when an employee leaves EPAM), immediately preventing that user from accessing the portal.

**Why this priority**: Necessary for access governance, but depends on US3 (admin dashboard) being in place. Lower priority than core auth flows.

**Independent Test**: Can be tested by deactivating a submitter account via the admin interface and confirming the submitter is blocked on their next login attempt.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** they deactivate a submitter account, **Then** the account status changes to `inactive` and a confirmation is shown.
2. **Given** an `inactive` user, **When** they attempt to log in, **Then** they are shown a clear message: "Your account has been deactivated. Please contact your administrator."
3. **Given** a currently logged-in user whose account is deactivated mid-session, **When** their session expires and they attempt to re-authenticate, **Then** the login is blocked with the deactivation message.

---

### Edge Cases

- Registration with a non-`@epam.com` email MUST be rejected with: "Only @epam.com email addresses are permitted."
- How does the system behave when the session expires mid-navigation?
- What happens if a user submits the login form multiple times rapidly (brute-force attempt)? After 5 consecutive failed attempts the account is locked for 15 minutes; the user MUST be shown a clear message stating when they can try again.
- How does the system handle concurrent login sessions from different devices?
- What if an admin accidentally navigates to a submitter-only page?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow unauthenticated users to register with an email address and password.
- **FR-002**: System MUST validate that the email address is properly formatted and belongs to the `@epam.com` domain at registration; any other domain MUST be rejected with a clear error message.
- **FR-003**: System MUST enforce the password policy at registration: minimum 8 characters, at least 1 uppercase letter, and at least 1 number; non-compliant passwords MUST be rejected with a specific inline error describing the unmet rule(s).
- **FR-004**: System MUST prevent duplicate accounts for the same email address.
- **FR-005**: System MUST assign the `submitter` role to all self-registered users by default.
- **FR-006**: System MUST allow registered users to log in with their email and password.
- **FR-007**: System MUST display a generic error message on failed login without revealing which credential is incorrect.
- **FR-007a**: System MUST lock an account for **15 minutes** after **5 consecutive failed login attempts** and MUST display a message indicating the lockout duration; the counter resets on successful login.
- **FR-008**: System MUST maintain a persistent authenticated session across page navigations with an 8-hour sliding expiry (inactivity beyond 8 hours terminates the session).
- **FR-009**: System MUST allow users to log out, fully terminating their session.
- **FR-010**: System MUST enforce role-based access control, blocking submitters from admin routes and vice versa.
- **FR-011**: System MUST redirect unauthenticated users to the login page when they attempt to access protected routes, preserving the intended destination URL.
- **FR-012**: System MUST display role-appropriate navigation and UI elements based on the authenticated user's role.
- **FR-013**: System MUST support the two roles: `submitter` and `admin`.
- **FR-014**: System MUST allow `admin` users to deactivate any user account; deactivated accounts MUST be blocked at login with the message: "Your account has been deactivated. Please contact your administrator."
- **FR-015**: Admin accounts MUST be created through a seeding or back-office mechanism — not through the public registration form.

### Key Entities

- **User**: Represents an authenticated platform participant. Key attributes: unique identifier, email address (`@epam.com`), display name, role (`submitter` | `admin`), account creation date, account status (`active` | `inactive`). Status transitions: `active` → `inactive` (admin action only); `inactive` accounts cannot authenticate.
- **Session**: Represents an authenticated user's active context. Tied to a User; has an expiry. Destroyed on logout.
- **Role**: An enumeration defining access level — `submitter` (can submit ideas) and `admin` (can manage the innovation pipeline and users).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete registration in under 2 minutes from first visiting the page.
- **SC-002**: A registered user can log in and reach their dashboard in under 30 seconds.
- **SC-003**: 100% of admin-only routes reject submitter-role users with an appropriate response.
- **SC-004**: 100% of protected routes redirect unauthenticated users to the login page.
- **SC-005**: Login and registration forms display inline validation errors without a full page reload.
- **SC-006**: Session persists correctly across browser tab navigation without requiring re-login.
- **SC-007**: An authenticated session expires after **8 hours of inactivity**; activity within the window resets the expiry (sliding).

## Clarifications

### Session 2026-05-14

- Q: How long should an authenticated session last before requiring re-login? → A: 8-hour sliding session (resets on activity; workday-aligned)
- Q: Should email registration be restricted to a specific domain? → A: `@epam.com` corporate domain only
- Q: What password policy should be enforced at registration? → A: Minimum 8 characters, at least 1 uppercase letter and 1 number
- Q: How should repeated failed login attempts be handled? → A: Soft lockout — account locked for 15 minutes after 5 consecutive failed attempts
- Q: What is the scope of account active/inactive status for v1? → A: Admins can deactivate accounts; deactivated users are blocked at login with a clear message

## Assumptions

- All users are EPAM employees; registration is restricted to `@epam.com` email addresses only.
- Email/password authentication is sufficient for v1; SSO/OAuth2 integration is out of scope.
- Password reset ("forgot password") flow is out of scope for this feature; it will be a separate feature.
- Admin accounts are provisioned via a database seed or admin CLI tool, not the public registration UI.
- Email verification on registration is not required for v1 (assumed trusted internal network context).
- Account deactivation is an admin-only action; users cannot deactivate their own accounts in v1.
- Session lifetime is **8 hours sliding** — the expiry resets on each authenticated request; inactivity beyond 8 hours requires re-login.

## Constitution Constraints *(non-negotiable)*

The following constraints are mandated by the project constitution and MUST NOT be relaxed:

- **Stack**: Next.js App Router, React 18+, Tailwind CSS, shadcn/ui, TypeScript strict mode.
- **TypeScript Strict Mode**: All source files MUST compile with `"strict": true`; `any` is FORBIDDEN without an inline disable comment and PR justification; `===` MUST be used throughout; `null`/`undefined` MUST be handled explicitly.
- **Accessibility**: All non-text content MUST have text alternatives; text contrast ≥ 4.5:1 (WCAG AA).
- **Error Handling**: Every async operation MUST have explicit error handling; error/loading/empty states are required for all auth forms and redirects.
- **Dependencies**: No new auth dependency without documented justification aligned with Principle III.
- **Styling**: Tailwind utility classes only — no custom CSS without constitutional amendment.
- **Testing**: Unit/component tests MUST use Vitest + React Testing Library; E2E tests (covering registration, login, and admin role-enforcement flows) MUST use Playwright; integration tests for auth server actions and session logic MUST run against a real SQLite test database; core auth business-logic modules MUST achieve ≥ 80% line coverage.
