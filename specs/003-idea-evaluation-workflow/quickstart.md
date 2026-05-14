# Quickstart: Idea Evaluation Workflow

**Feature**: `003-idea-evaluation-workflow`
**Branch**: `003-idea-evaluation-workflow`
**Date**: 2026-05-14

---

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Database migrated (`npm run db:migrate`)
- Database seeded (`npm run db:seed`)
- Running dev server (`npm run dev`)

---

## New & Modified Source Files

### Database

| File | Change | Purpose |
|------|--------|---------|
| `lib/db/schema.ts` | Modify | Add `IDEA_STATUSES`, `IdeaStatus`, `status`/`reviewer_id`/`review_started_at` to `ideas` table; add `idea_evaluations` table + types |
| `lib/db/migrations/0002_add_evaluation_workflow.sql` | New | ALTER TABLE ideas (status + audit cols); CREATE TABLE idea_evaluations |

### Business Logic

| File | Change | Purpose |
|------|--------|---------|
| `lib/ideas/transitions.ts` | New | `validateTransition(from, to)` state machine guard |
| `lib/ideas/validation.ts` | Modify | Add `startReviewSchema`, `evaluateIdeaSchema` (discriminated union) |

### Server Actions

| File | Change | Purpose |
|------|--------|---------|
| `actions/ideas.ts` | Modify | Add `startReviewAction`, `evaluateIdeaAction`, `getAdminIdeasAction`; extend `getIdeasAction` + `getIdeaDetailAction` with status; guard `deleteIdeaAction` against Under Review |

### shadcn/ui Components (copy-into-repo)

| File | Change | Purpose |
|------|--------|---------|
| `components/ui/badge.tsx` | New | shadcn/ui Badge primitive |
| `components/ui/toast.tsx` | New | shadcn/ui Toast primitive |
| `components/ui/toaster.tsx` | New | Toaster wrapper (add to root layout) |
| `components/ui/use-toast.ts` | New | useToast hook |

### Feature Components

| File | Change | Purpose |
|------|--------|---------|
| `components/ideas/StatusBadge.tsx` | New | Accessible colored pill with status text (FR-021) |
| `components/ideas/StatusBadge.test.tsx` | New | Unit tests for all 4 status variants + accessibility |
| `components/ideas/EvaluationPanel.tsx` | New | Start Review / Accept / Reject form with conditional comment field |
| `components/ideas/EvaluationPanel.test.tsx` | New | Unit tests for action buttons, validation, submission |
| `components/ideas/AdminIdeaRow.tsx` | New | Admin-view idea row with inline EvaluationPanel + in-place update |
| `components/ideas/AdminIdeaRow.test.tsx` | New | Unit tests for row actions, in-place update, toast trigger |
| `components/ideas/AdminIdeaList.tsx` | New | Admin listing with status filter dropdown + empty state |
| `components/ideas/IdeaRow.tsx` | Modify | Add `StatusBadge` display to employee-facing listing (FR-011) |
| `components/ideas/IdeaListClient.tsx` | Modify | Pass `status` field through to `IdeaRow` |

### App Routes

| File | Change | Purpose |
|------|--------|---------|
| `app/(protected)/admin/ideas/page.tsx` | New | Admin ideas management page (FR-013, FR-015, FR-018) |
| `app/layout.tsx` | Modify | Add `<Toaster />` to root layout |

### ADRs

| File | Change | Purpose |
|------|--------|---------|
| `docs/adrs/adr-0006-idea-evaluation-table-decision.md` | New | Record: separate `idea_evaluations` table decision |

### Tests

| File | Change | Purpose |
|------|--------|---------|
| `tests/integration/ideas/start-review.test.ts` | New | Integration tests for `startReviewAction` |
| `tests/integration/ideas/evaluate.test.ts` | New | Integration tests for `evaluateIdeaAction` |
| `tests/integration/ideas/admin-list.test.ts` | New | Integration tests for `getAdminIdeasAction` |
| `tests/integration/ideas/delete-under-review.test.ts` | New | Integration test: delete blocked when under_review |
| `tests/e2e/idea-evaluation-flow.spec.ts` | New | E2E: admin full review journey (Submitted → Under Review → Rejected) |

---

## Running the Feature

### 1. Apply the migration

```bash
npm run db:migrate
```

### 2. (Optional) Re-seed the database

```bash
npm run db:seed
```

The seed creates test users with both `submitter` and `admin` roles.

### 3. Start the dev server

```bash
npm run dev
```

### 4. Navigate to the admin ideas page

```
http://localhost:3000/admin/ideas
```

Log in as an admin user (see seed data). You should see all submitted ideas with status badges and evaluation action buttons.

---

## Smoke Test: Admin Evaluation Journey

1. Log in as an admin user.
2. Go to `/admin/ideas`. Confirm the listing shows all ideas with "Submitted" status badges.
3. Click **Start Review** on any idea. Confirm the row updates in-place to "Under Review" and a success toast appears.
4. Click **Reject** on the "Under Review" idea. Enter a rejection reason. Confirm the row updates to "Rejected" and a toast appears.
5. Log out and log in as the idea's submitter. Go to `/ideas`. Confirm the idea shows "Rejected" status badge and the rejection comment is visible.
6. Log in as a different submitter (not the original). Confirm the rejection comment is **not** visible for that user's view.
7. Try to delete an idea in "Under Review" status. Confirm a validation error is shown and the idea remains unchanged.

---

## Key Commands

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Unit + component tests
npm run test

# E2E tests (requires built or running app)
npx playwright test

# Run only evaluation-related integration tests
npx vitest run tests/integration/ideas/
```
