# Research: User Authentication & Management

**Feature**: `001-user-auth-management`
**Date**: 2026-05-14
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## R01 — SQLite Driver and ORM

**Decision**: Drizzle ORM with `better-sqlite3` driver

**Rationale**: Drizzle provides a TypeScript-first schema DSL, auto-migrations via `drizzle-kit`, and a SQL-like query builder with zero magic. `better-sqlite3` is synchronous, fast, and ideal for single-file SQLite databases. The combination is minimal, fully type-safe, and appropriate for bootcamp scope with no external database server required.

**Alternatives considered**:
- *Prisma*: Generates a large runtime client, requires a binary query engine, and its migration workflow is heavier — overkill for SQLite. Schema changes are slower to iterate.
- *Raw better-sqlite3*: No type safety on queries; manual schema management and migrations required.
- *Knex*: Query builder only, no schema-as-code, less TypeScript-first. No Drizzle-style inferred types.

**Packages**: `drizzle-orm`, `better-sqlite3`, `drizzle-kit` (dev), `@types/better-sqlite3` (dev)

---

## R02 — Session Management

**Decision**: `iron-session` v8+ with encrypted, signed HTTP-only cookies

**Rationale**: iron-session stores session data entirely in the cookie (AES-256 encrypted, HMAC signed). No server-side session store is needed. Fully compatible with Next.js App Router and Server Actions. Zero external dependencies, tiny bundle footprint. The 8-hour sliding expiry maps directly to the `ttl` option; the window is renewed by calling `session.save()` on every authenticated Server Action.

**Sliding expiry implementation**: Middleware calls `session.save()` on every authenticated request to reset the TTL, implementing the sliding window required by FR-008.

**Alternatives considered**:
- *NextAuth.js v5 (Auth.js)*: Excellent for OAuth flows, but adds significant complexity for a pure email/password flow with no OAuth providers. SQLite adapter configuration adds friction.
- *Lucia*: More powerful but requires its own `sessions` table (additional schema complexity) and more boilerplate than the feature warrants.
- *JWT in localStorage*: Stateless but requires a token blacklist for logout and is XSS-vulnerable. Not appropriate for a security-sensitive auth system.

**Package**: `iron-session`

---

## R03 — Tailwind CSS v4 with `@theme`

**Decision**: Tailwind CSS v4 with the `@theme` directive in `app/globals.css` (required by user)

**Rationale**: Tailwind v4 moves from a JavaScript config file to a CSS-first `@theme` block, emitting CSS custom properties that are accessible both as Tailwind utility classes and as `var(--color-*)` tokens in arbitrary CSS. This is the correct approach for Tailwind v4 projects. shadcn/ui's latest component registry supports Tailwind v4 via its updated `init` command.

**Setup requirements**:
- Remove `tailwind.config.js` (not used in v4)
- Add `@import "tailwindcss"` and `@theme { ... }` block to `app/globals.css`
- Install `@tailwindcss/postcss` and configure `postcss.config.mjs`
- Run `npx shadcn@latest init` (select Tailwind v4 when prompted)

**Packages**: `tailwindcss@4`, `@tailwindcss/postcss`

---

## R04 — Password Hashing

**Decision**: `bcryptjs` with work factor 12

**Rationale**: Pure JavaScript — no native bindings, no C++ compilation. Works in all Next.js deployment targets including serverless. Work factor 12 provides ~250 ms hash time on modern hardware (meaningful brute-force cost at registration; acceptable UX latency). Well-audited, widely deployed package.

**Alternatives considered**:
- *argon2*: Stronger algorithm but requires native bindings (`node-argon2`). Build failures occur in some CI and serverless environments; not worth the risk for a bootcamp project.
- *Node.js `crypto.scrypt`*: Built-in (no dependency). More verbose API and less community familiarity; bcryptjs is the established pattern in the Next.js ecosystem.
- *bcrypt (native)*: Same algorithm as bcryptjs but with native bindings — carries the same deployment risk as argon2.

**Packages**: `bcryptjs`, `@types/bcryptjs` (dev)

---

## R05 — Form Validation

**Decision**: Zod for schema validation + `react-hook-form` + `@hookform/resolvers`

**Rationale**: Zod is already the standard in the shadcn/ui + Next.js ecosystem. Schemas defined once in `lib/auth/validation.ts` are reused on both the client (react-hook-form resolver) and the server (Server Action input validation). Fully TypeScript strict compatible — inferred types eliminate duplication between schema and type definitions.

**Packages**: `zod`, `react-hook-form`, `@hookform/resolvers`

---

## R06 — Brute-Force Lockout Storage

**Decision**: `failed_attempts` (integer) + `locked_until` (integer, Unix ms timestamp) columns on the `users` table

**Rationale**: Persistent across server restarts; no additional infrastructure; trivially queryable with Drizzle. Lockout check is a single column read per login attempt. Counter resets to `0` on successful login; `locked_until` is set to `NULL`.

**Implementation flow**: On failed login → increment `failed_attempts`; if `>= 5` → set `locked_until = Date.now() + 15 * 60 * 1000`. On any login attempt → first check `locked_until > Date.now()` before verifying credentials.

**Alternatives considered**:
- *In-memory Map*: Lost on server restart; won't work in multi-process or serverless deployments.
- *Redis*: Correct solution for distributed systems, but overkill for a single-instance bootcamp project with SQLite.

---

## R07 — Concurrent Sessions

**Decision**: Concurrent sessions from multiple devices are **permitted** (no single-session enforcement)

**Rationale**: The spec lists concurrent sessions as an open edge case with no requirement to block them. iron-session cookies are device-specific by nature (each device has its own cookie). Enforcing single-session would require a `sessions` table and invalidation logic — additional schema complexity not justified by the spec. For bootcamp scope, permitting concurrent sessions is correct and simple.

---

## R08 — Admin Account Provisioning

**Decision**: `npm run db:seed` script (`lib/db/seed.ts`, executed via `tsx`)

**Rationale**: Simple, explicit, and auditable. The seed script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables, hashes the password with bcryptjs, and upserts via Drizzle (safe to run multiple times). No web UI for admin creation per FR-015. Documented in `quickstart.md`.

**Package**: `tsx` (dev, for running TypeScript scripts directly)

---

## R09 — date-fns Usage

**Decision**: `date-fns@3` for date formatting (required by user)

**Rationale**: date-fns v3 is fully tree-shakeable (only imported functions are bundled), has first-class TypeScript support, and has no side effects. Used for formatting `created_at` timestamps and `locked_until` values in the UI.

**Package**: `date-fns`
