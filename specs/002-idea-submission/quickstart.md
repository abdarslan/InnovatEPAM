# Quickstart: Idea Submission System

**Feature**: `002-idea-submission`
**Branch**: `002-idea-submission`
**Date**: 2026-05-14

---

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Database seeded (`npm run db:seed`)
- Running dev server (`npm run dev`)

---

## New Source Files

### Database

| File | Purpose |
|------|---------|
| `lib/db/schema.ts` | Add `ideas` table + `IDEA_CATEGORIES` enum |
| `lib/db/migrations/0001_add_ideas_table.sql` | Drizzle migration for `ideas` table |

### Validation

| File | Purpose |
|------|---------|
| `lib/ideas/validation.ts` | Zod schemas: `submitIdeaSchema`, `updateIdeaSchema` |

### Server Actions

| File | Purpose |
|------|---------|
| `actions/ideas.ts` | `getIdeasAction`, `getIdeaDetailAction`, `submitIdeaAction`, `updateIdeaAction`, `deleteIdeaAction` |

### API Routes

| File | Purpose |
|------|---------|
| `app/api/ideas/[id]/attachment/route.ts` | Authenticated file download endpoint |

### App Routes

| File | Purpose |
|------|---------|
| `app/(protected)/ideas/page.tsx` | Idea listing page with expandable rows |
| `app/(protected)/ideas/new/page.tsx` | Idea submission form page |
| `app/(protected)/ideas/[id]/edit/page.tsx` | Edit idea form page (submitter only) |

### Components

| File | Purpose |
|------|---------|
| `components/ideas/IdeaForm.tsx` | Shared form for submit and edit flows |
| `components/ideas/IdeaList.tsx` | List container with empty state |
| `components/ideas/IdeaRow.tsx` | Single collapsible row in the listing |
| `components/ideas/DeleteIdeaButton.tsx` | AlertDialog confirmation + delete action (FR-020) |
| `components/ideas/IdeaForm.test.tsx` | Unit tests for `IdeaForm` |
| `components/ideas/IdeaRow.test.tsx` | Unit tests for `IdeaRow` |
| `components/ideas/DeleteIdeaButton.test.tsx` | Unit tests for `DeleteIdeaButton` (confirm + cancel paths) |

### Integration Tests

| File | Purpose |
|------|---------|
| `tests/integration/ideas/submit.test.ts` | Server action integration tests: submit |
| `tests/integration/ideas/update.test.ts` | Server action integration tests: update |
| `tests/integration/ideas/delete.test.ts` | Server action integration tests: delete |
| `tests/integration/ideas/list.test.ts` | Server action integration tests: list |

### E2E Tests

| File | Purpose |
|------|---------|
| `tests/e2e/idea-submission-flow.spec.ts` | Full submission journey |
| `tests/e2e/idea-listing-flow.spec.ts` | Listing + expand + download |
| `tests/e2e/idea-edit-delete-flow.spec.ts` | Edit and delete journeys |

### ADRs

| File | Decision |
|------|----------|
| `docs/adrs/adr-0005-idea-attachment-storage.md` | SQLite BLOB storage for file attachments |

---

## Key Development Commands

```bash
# Install required shadcn/ui components
npx shadcn@latest add collapsible
npx shadcn@latest add alert-dialog
npm run db:migrate

# Re-seed the database
npm run db:seed

# Type check
npm run type-check

# Lint
npm run lint

# Unit + component tests
npm run test

# E2E tests
npx playwright test

# Full validation pass
npm run type-check && npm run lint && npm run test
```

---

## Route Map

| URL | Page | Auth |
|-----|------|------|
| `/ideas` | Idea listing | Authenticated |
| `/ideas/new` | Submit idea form | Authenticated |
| `/ideas/[id]/edit` | Edit idea form | Authenticated + own idea |
| `/api/ideas/[id]/attachment` | File download | Authenticated |

---

## User Flow Summary

```
Login
  └─> /dashboard
        └─> /ideas                  (listing — expandable rows)
              ├─> [expand row]      (reveal description + download link)
              ├─> [New Idea]        → /ideas/new
              │     └─> submit      → redirect to /ideas
              ├─> [Edit]            → /ideas/[id]/edit   (own ideas only)
              │     └─> save        → redirect to /ideas
              └─> [Delete]          (confirm dialog → remove → reload listing)
```

---

## Attachment Download Flow

1. User expands an idea row that has an attachment.
2. A "Download [filename]" link renders pointing to `/api/ideas/[id]/attachment`.
3. The GET route verifies the session cookie, fetches the BLOB from SQLite, and returns a binary `Response` with `Content-Disposition: attachment`.
4. Browser triggers the native file download.
