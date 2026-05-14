# ADR-0001: SQLite with Drizzle ORM for Data Persistence

**Status**: Accepted
**Date**: 2026-05-14
**Feature**: `001-user-auth-management`

---

## Context

The InnovatEPAM portal is a bootcamp prototype requiring a data persistence layer for user accounts, roles, and session-adjacent data (brute-force lockout state). The project constitution mandates minimal dependencies and avoids over-engineering for the prototype scope. No external database server should be required to run the project locally.

Key constraints:
- Bootcamp timeline — setup friction must be near zero
- Single developer or small team — no DBA or infrastructure provisioning
- TypeScript strict mode — schema definitions must produce inferred types
- Migrations must be version-controlled and reproducible

## Decision

Use **SQLite** as the database engine with **Drizzle ORM** (`drizzle-orm` + `better-sqlite3` driver) for schema definition, type-safe queries, and migrations via `drizzle-kit`.

The database file is stored at `data/innovatepam.db` (gitignored at runtime; the `data/` directory is committed with a `.gitkeep`).

## Rationale

- **Zero infrastructure**: SQLite is a single file — no server process, no Docker dependency, no connection strings beyond a file path.
- **Type safety**: Drizzle's schema-as-code approach (`sqliteTable`) produces fully-inferred TypeScript types (`$inferSelect`, `$inferInsert`) compatible with `"strict": true`.
- **Lightweight migrations**: `drizzle-kit migrate` generates and applies SQL migration files that are version-controlled alongside the source code.
- **Synchronous driver**: `better-sqlite3` uses a synchronous API — ideal for SQLite (which has no connection pool to manage) and removes the async overhead of pooled drivers.
- **Bootcamp-appropriate scope**: The feature has one table (`users`) and < 100 projected users. SQLite is the correct choice at this scale.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Prisma + SQLite** | Generates a large runtime binary; heavier migration workflow; schema changes require `prisma generate`; overkill for a single-table prototype. |
| **Raw `better-sqlite3`** | No type safety on queries; manual schema management and migration tracking required; high maintenance cost as schema evolves. |
| **PostgreSQL** | Requires a running server process; no zero-setup local development without Docker; incompatible with the "minimal infrastructure" constraint. |
| **Knex** | Query builder only — no schema-as-code, no inferred TypeScript types; less ergonomic for TypeScript strict mode. |

## Consequences

- **Positive**: Zero-configuration local development; fully typed DB access; reproducible migrations.
- **Positive**: `better-sqlite3` synchronous API simplifies Server Action code (no extra `await` chains for DB calls).
- **Negative**: SQLite is not suitable for multi-process or distributed deployments. If the project graduates to production scale, migration to PostgreSQL will be required (Drizzle supports both — schema changes would be minimal).
- **Neutral**: The `data/innovatepam.db` file must be excluded from git and backed up separately in any production scenario.
