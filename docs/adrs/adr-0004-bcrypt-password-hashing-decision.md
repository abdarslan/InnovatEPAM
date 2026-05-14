# ADR-0004: bcryptjs for Password Hashing

**Status**: Accepted
**Date**: 2026-05-14
**Feature**: `001-user-auth-management`

---

## Context

User passwords must be stored securely (FR-003 requires enforcement at registration; FR-006/FR-007 require verification at login). Passwords must never be stored in plaintext — a one-way, slow hash function with a per-password salt is required.

The choice of hashing library has deployment implications: some algorithms require native bindings (C++ compilation), which can fail in serverless or CI environments.

## Decision

Use **`bcryptjs`** with a work factor of **12**.

`bcryptjs` is a pure JavaScript implementation of bcrypt — no native bindings, no C++ compilation, no platform-specific build steps.

Work factor 12 produces approximately 200–300 ms of hashing time on modern hardware, providing meaningful resistance to offline brute-force attacks while remaining acceptable as a UX latency for registration and login Server Actions.

## Rationale

- **No native bindings**: Pure JavaScript — works in all Next.js deployment targets including Vercel serverless, edge-adjacent lambdas, and standard CI environments without `node-gyp`.
- **Well-audited**: bcryptjs is a widely-deployed, security-reviewed package with a long track record.
- **Appropriate work factor**: Factor 12 is the current community recommendation for bcrypt in web applications (2024–2026). It can be increased for future deployments by re-hashing on login.
- **Ecosystem fit**: bcrypt is the standard in the Node.js + Next.js auth ecosystem; well-understood by reviewers.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Argon2** (`argon2` / `node-argon2`) | Stronger algorithm (winner of Password Hashing Competition). However, requires native bindings — build failures occur in some CI and serverless environments. The security advantage over bcrypt-12 is not material for a bootcamp prototype. |
| **bcrypt (native)** | Same algorithm as bcryptjs but with native bindings — carries the same deployment risk as argon2 without the security advantage of Argon2. |
| **Node.js `crypto.scrypt`** | Built-in (zero dependency). More verbose API; less community familiarity in the Next.js ecosystem; error-prone async usage in Server Actions. No clear advantage over bcryptjs for this use case. |
| **PBKDF2 (`crypto.pbkdf2`)** | Built-in. Weaker than bcrypt at the same iteration count on GPU hardware. Not recommended for new password storage implementations. |

## Consequences

- **Positive**: Zero native build dependencies — `npm install` succeeds on all platforms without `node-gyp`.
- **Positive**: Work factor is configurable — if the bootcamp project graduates to production, the factor can be increased and passwords re-hashed transparently on next login.
- **Negative**: Pure JavaScript bcryptjs is slower than native bcrypt by ~30% in CPU benchmarks. This is irrelevant at < 100 users and work factor 12 (~250 ms).
- **Security note**: The `ADMIN_PASSWORD` environment variable is only used in `lib/db/seed.ts` — it is hashed immediately on seed execution and never stored in plaintext in the database or logs.
