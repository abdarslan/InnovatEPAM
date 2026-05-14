# Quickstart: User Authentication & Management

**Feature**: `001-user-auth-management`
**Date**: 2026-05-14

---

## Prerequisites

- Node.js 20 LTS (`node --version` should show `v20.x.x`)
- npm 10+

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in the values:

```env
# iron-session encryption secret — must be at least 32 characters
SESSION_SECRET=replace-with-a-random-32-char-secret

# Admin seed account credentials (used by npm run db:seed)
ADMIN_EMAIL=admin@epam.com
ADMIN_PASSWORD=YourSecureAdminPassword1

# SQLite database file path (relative to project root)
DATABASE_URL=./data/innovatepam.db
```

Generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Run Database Migrations

```bash
npm run db:migrate
```

Applies the Drizzle migration files in `lib/db/migrations/` to `data/innovatepam.db`, creating the `users` table.

---

## 4. Seed the Admin Account

```bash
npm run db:seed
```

Creates an admin account from `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env.local`. Uses bcryptjs to hash the password. Safe to run multiple times (upsert behaviour).

---

## 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`.

---

## 6. Try the Key Flows

| Flow | Steps |
|---|---|
| **Register (submitter)** | Visit `/register` → fill form with an `@epam.com` email → submit → lands on submitter dashboard |
| **Login (submitter)** | Visit `/login` → enter registered credentials → lands on `/dashboard` |
| **Login (admin)** | Visit `/login` → enter `ADMIN_EMAIL` + `ADMIN_PASSWORD` → lands on `/admin/dashboard` |
| **Role protection** | Log in as submitter → navigate to `/admin/dashboard` → expect redirect to `/access-denied` |
| **Deactivate a user** | Log in as admin → `/admin/users` → click Deactivate on a submitter account |
| **Locked-out login** | Attempt login with wrong password 5 times → account locked for 15 minutes |

---

## 7. Run Tests

```bash
# TypeScript type check
npm run type-check

# Lint
npm run lint

# Unit + component + integration tests
npm run test

# E2E tests (requires dev server running in a separate terminal)
npx playwright test
```

---

## npm Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `type-check` | `tsc --noEmit` | TypeScript strict-mode check |
| `lint` | `next lint` | ESLint via Next.js config |
| `test` | `vitest run` | Run all unit + integration tests |
| `db:migrate` | `drizzle-kit migrate` | Apply pending migrations |
| `db:seed` | `tsx lib/db/seed.ts` | Seed admin account |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes | iron-session AES-256 key; min 32 chars; keep secret |
| `ADMIN_EMAIL` | Seed only | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Seed only | Plaintext password for seed (hashed before storage) |
| `DATABASE_URL` | Yes | Relative path to the SQLite DB file |

> **Security**: Never commit `.env.local` to source control. Add it to `.gitignore`. The `data/` directory (containing the SQLite file) is also gitignored at runtime.
