# ADR-0002: iron-session for Cookie-Based Authentication Sessions

**Status**: Accepted
**Date**: 2026-05-14
**Feature**: `001-user-auth-management`

---

## Context

The auth system requires a persistent authenticated session after login, with an 8-hour sliding expiry window (FR-008). The session must be terminated on logout (FR-009) and must be inaccessible to client-side JavaScript to prevent session-hijacking via XSS.

The project spec constrains auth to email/password only — no OAuth, no SSO, no external identity provider. The constitution mandates minimal dependencies (Principle III).

## Decision

Use **`iron-session`** (v8+) for session management. Session data is stored in an encrypted, signed HTTP-only cookie using AES-256-GCM with a 32+ character secret key configured via the `SESSION_SECRET` environment variable.

**TTL configuration**: `ttl: 8 * 60 * 60` seconds (8 hours). The sliding window is implemented by calling `session.save()` in the Next.js middleware on every authenticated request, which resets the cookie's max-age.

**Session payload** (`SessionData`): `userId`, `email`, `role`, `displayName` — sufficient for RBAC middleware and navigation rendering without a DB lookup on every request.

## Rationale

- **Zero server-side store**: Session data lives entirely in the cookie. No `sessions` table, no Redis, no cache layer.
- **Security**: HTTP-only cookie (inaccessible to JS), AES-256-GCM encrypted, HMAC-signed. Iron-session's seal format prevents tampering.
- **Next.js App Router compatible**: Works natively with Server Actions and RSC — session is read via `getIronSession()` in any server context.
- **Minimal footprint**: Single package, zero transitive dependencies, < 5 KB.
- **Sliding expiry**: `session.save()` in middleware resets the TTL on every request — exactly matching FR-008's sliding window requirement.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **NextAuth.js v5 (Auth.js)** | Built for OAuth flows; the email/password adapter requires additional setup; brings significant additional surface area (callbacks, providers, adapters) not needed for a pure password flow. Overkill for this feature. |
| **Lucia** | More powerful session management with a `sessions` DB table. Requires schema additions and invalidation logic. More complex than the feature warrants. |
| **JWT in `Authorization` header / localStorage** | Stateless JWTs require a token blacklist for logout (FR-009) to work correctly. localStorage is XSS-vulnerable. Not appropriate for a security-sensitive auth system. |
| **`next-auth` database sessions** | Requires a `sessions` table and a `users` adapter; adds schema complexity and a synchronisation requirement between cookie and DB state. |

## Consequences

- **Positive**: No sessions table; no session-store infrastructure; simple API (`getIronSession`, `session.save`, `session.destroy`).
- **Positive**: Logout (FR-009) is correctly implemented by `session.destroy()` — the cookie is cleared server-side; no blacklist needed.
- **Negative**: Session payload is limited by cookie size (~4 KB). The current payload is well within this limit.
- **Negative**: If session data needs to be invalidated server-side (e.g., on role change), there is no centralised revocation mechanism. For v1, this is acceptable — a role change requires re-login.
- **Security note**: `SESSION_SECRET` must be at least 32 characters, randomly generated, stored only in `.env.local` (never committed to git), and rotated if compromised.
