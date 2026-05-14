# Contracts: Server Actions

**Feature**: `001-user-auth-management`
**Date**: 2026-05-14
**File**: `actions/auth.ts`

All Server Actions return a discriminated `ActionResult` union. They **MUST NOT throw** — all errors are caught and returned as `{ ok: false, error: string }`.

---

## Shared Result Type

```typescript
// actions/auth.ts
type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }
```

---

## `registerAction`

Registers a new user with the `submitter` role. Hashes password with bcryptjs (work factor 12). On success, creates a session cookie and the caller redirects to `/dashboard`.

```typescript
export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<{ userId: number }>>
```

**Input** — `RegisterInput` (validated via `registerSchema` from `lib/auth/validation.ts`):

| Field | Type | Validation |
|---|---|---|
| `email` | `string` | Valid email format; `@epam.com` domain (case-insensitive) |
| `password` | `string` | Min 8 chars; ≥ 1 uppercase letter; ≥ 1 digit |
| `displayName` | `string` | 2–100 chars after trim |

**Success response**: `{ ok: true, data: { userId: number } }`

**Failure cases**:

| Condition | `error` value |
|---|---|
| Email not `@epam.com` | `"Only @epam.com email addresses are permitted."` |
| Email already registered | `"An account with this email address already exists."` |
| Password policy violation | `"Password must be at least 8 characters and include one uppercase letter and one number."` |
| Unexpected DB error | `"Registration failed. Please try again."` |

---

## `loginAction`

Authenticates a user against the DB. On success, writes an iron-session cookie. Caller redirects to role-appropriate dashboard.

```typescript
export async function loginAction(
  input: LoginInput
): Promise<ActionResult<{ role: 'submitter' | 'admin' }>>
```

**Input** — `LoginInput` (validated via `loginSchema`):

| Field | Type |
|---|---|
| `email` | `string` |
| `password` | `string` |

**Success response**: `{ ok: true, data: { role: 'submitter' | 'admin' } }`

**Failure cases** (evaluated in this order):

| Condition | `error` value |
|---|---|
| Account locked (`locked_until > Date.now()`) | `"Your account is locked. Please try again after [formatted time]."` |
| Account inactive | `"Your account has been deactivated. Please contact your administrator."` |
| Invalid credentials (email not found or wrong password) | `"Invalid email or password."` |
| Unexpected DB error | `"Login failed. Please try again."` |

> **Security note**: Invalid email and wrong password return the same generic message — never reveal which credential is incorrect.

---

## `logoutAction`

Destroys the session cookie. Always succeeds (cookie destruction is idempotent). Caller redirects to `/login`.

```typescript
export async function logoutAction(): Promise<ActionResult>
```

**Input**: None (reads session from cookie internally)

**Success response**: `{ ok: true, data: undefined }`

**Failure cases**: None — always returns `ok: true`.

---

## `deactivateUserAction`

Sets a target user's `status` to `'inactive'`. Admin-only — verified server-side via `requireRole('admin')`.

```typescript
export async function deactivateUserAction(
  targetUserId: number
): Promise<ActionResult<{ deactivatedEmail: string }>>
```

**Input**: `targetUserId: number` — the `users.id` of the account to deactivate.

**Authorization**: Caller session MUST have `role === 'admin'`. Verified with `requireRole('admin')` from `lib/auth/session.ts` before any DB access.

**Success response**: `{ ok: true, data: { deactivatedEmail: string } }`

**Failure cases**:

| Condition | `error` value |
|---|---|
| Caller is not `admin` | `"Forbidden."` |
| Target user not found | `"User not found."` |
| Target already inactive | `"User is already deactivated."` |
| Unexpected DB error | `"Deactivation failed. Please try again."` |

---

## Middleware Route Contract

**File**: `middleware.ts`

| Route pattern | Authenticated? | Role required | On violation |
|---|---|---|---|
| `/login`, `/register` | No | — | Redirect authenticated users → role dashboard |
| `/dashboard/*` | Yes | Any (`submitter` or `admin`) | Redirect unauthenticated → `/login?returnUrl=[encoded]` |
| `/admin/*` | Yes | `admin` only | Redirect unauthenticated → `/login?returnUrl=[encoded]`; redirect wrong role → `/access-denied` |
| All protected routes | Yes | — | Inactive session / expired cookie → `/login` |

**Return URL**: The `returnUrl` query parameter is URL-encoded. After login, the Server Action reads it and redirects to the preserved destination if it is a relative path (validated to prevent open-redirect).
