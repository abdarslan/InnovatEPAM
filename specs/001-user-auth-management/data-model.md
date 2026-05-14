# Data Model: User Authentication & Management

**Feature**: `001-user-auth-management`
**Date**: 2026-05-14
**Storage**: SQLite via Drizzle ORM (`better-sqlite3`) — file at `data/innovatepam.db`

---

## Entities

### User

Primary persistent entity. Stored in the `users` table.

| Column | SQLite Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INTEGER` | PRIMARY KEY AUTOINCREMENT | — | Internal surrogate key |
| `email` | `TEXT` | NOT NULL, UNIQUE | — | Lowercase-normalised on insert; must end `@epam.com` |
| `display_name` | `TEXT` | NOT NULL | — | Full name; shown in navigation |
| `password_hash` | `TEXT` | NOT NULL | — | bcryptjs hash, work factor 12 |
| `role` | `TEXT` | NOT NULL, CHECK IN ('submitter','admin') | `'submitter'` | Assigned at registration; admin via seed only |
| `status` | `TEXT` | NOT NULL, CHECK IN ('active','inactive') | `'active'` | Transitions: active → inactive (admin action only) |
| `failed_attempts` | `INTEGER` | NOT NULL | `0` | Brute-force counter; reset to 0 on successful login |
| `locked_until` | `INTEGER` | NULLABLE | `NULL` | Unix timestamp (ms); NULL if not locked |
| `created_at` | `INTEGER` | NOT NULL | — | Unix timestamp (ms); set on insert |

**Indexes**: Unique index on `email` (implicit from UNIQUE constraint).

#### Drizzle Schema (TypeScript)

```typescript
// lib/db/schema.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  email:          text('email').notNull().unique(),
  displayName:    text('display_name').notNull(),
  passwordHash:   text('password_hash').notNull(),
  role:           text('role', { enum: ['submitter', 'admin'] }).notNull().default('submitter'),
  status:         text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil:    integer('locked_until'),
  createdAt:      integer('created_at').notNull(),
})

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

---

### Session (Cookie — not persisted to DB)

Managed entirely by iron-session in an HTTP-only, AES-256-encrypted cookie. No `sessions` table exists.

| Field | Type | Notes |
|---|---|---|
| `userId` | `number` | References `users.id` |
| `email` | `string` | Cached for display; re-validated on sensitive operations |
| `role` | `'submitter' \| 'admin'` | Cached for middleware RBAC; DB is authoritative source |
| `displayName` | `string` | Shown in nav bar |

```typescript
// lib/auth/session.ts
export interface SessionData {
  userId:      number
  email:       string
  role:        'submitter' | 'admin'
  displayName: string
}
```

**TTL**: 8-hour sliding window (`ttl: 8 * 60 * 60` seconds in iron-session config). Renewed on every authenticated Server Action via `session.save()`.

---

### Role (Enumeration)

| Value | Description | Provisioned by | Access scope |
|---|---|---|---|
| `'submitter'` | Default for all self-registered users | Public registration | Submitter dashboard; own profile |
| `'admin'` | Elevated access | Seed script only (`npm run db:seed`) | Admin dashboard; user management |

---

## State Transitions

### `users.status`

```
                  [admin: deactivateUserAction]
  active  ──────────────────────────────────────►  inactive
                                                     │
                                              (cannot re-activate
                                               in v1 — out of scope)
```

- `active → inactive`: Triggered by `deactivateUserAction`; admin role required.
- `inactive` accounts are rejected at login with: *"Your account has been deactivated. Please contact your administrator."*
- No `inactive → active` transition in v1.

---

### `users.failed_attempts` / `users.locked_until`

```
Login attempt received
  │
  ├─ CHECK: locked_until > Date.now()
  │         └─ YES ──► Reject — "Your account is locked. Try again after [time]."
  │
  └─ NO: verify password hash
          ├─ SUCCESS ──► set failed_attempts = 0, locked_until = NULL
          │              create session cookie → redirect to dashboard
          └─ FAILURE ──► increment failed_attempts
                         └─ if failed_attempts >= 5
                              └─ set locked_until = Date.now() + 15 * 60 * 1000
                                 Reject — "Your account is locked. Try again in 15 minutes."
```

---

## Validation Rules

| Field | Rule | Error message |
|---|---|---|
| `email` | Valid RFC email format; domain must be `@epam.com` (case-insensitive) | `"Only @epam.com email addresses are permitted."` |
| `password` (registration) | Min 8 chars; ≥ 1 uppercase letter; ≥ 1 digit | `"Password must be at least 8 characters and include one uppercase letter and one number."` |
| `displayName` | 2–100 characters; non-empty after trim | `"Display name must be between 2 and 100 characters."` |
| `email` (login) | Must match a registered user | `"Invalid email or password."` (generic) |
| `password` (login) | Must match stored hash | `"Invalid email or password."` (generic) |

All validation rules are encoded as Zod schemas in `lib/auth/validation.ts` and shared between client (react-hook-form resolver) and server (Server Action input validation).
