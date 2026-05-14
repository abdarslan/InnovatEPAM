# Quickstart: Idea Draft Management

**Feature**: `005-idea-draft-management`
**Branch**: `005-start-specify-run`
**Date**: 2026-05-15
**Status**: Implementation complete (T001–T044)

## Prerequisites

- Node.js 18+
- Dependencies installed via `npm install`
- SQLite migration/seed scripts available in this repository

## Planned File Changes

### Database

| File | Change | Purpose |
|---|---|---|
| `lib/db/schema.ts` | Modify | Add draft tables/types (`idea_drafts`, `idea_draft_attachments`, `idea_draft_field_values`) |
| `lib/db/migrations/0004_idea_drafts.sql` | New | Create draft storage tables + indexes/constraints |
| `lib/db/seed.ts` | Optional modify | Keep seed compatible with new schema (no required draft seed data) |

### Domain Logic and Validation

| File | Change | Purpose |
|---|---|---|
| `lib/ideas/validation.ts` | Modify | Add draft save schema (relaxed) and final-submit conversion guards |
| `lib/ideas/category-fields.ts` | Modify | Reuse/extend dynamic field checks for draft persistence |

### Server Actions

| File | Change | Purpose |
|---|---|---|
| `actions/idea-drafts.ts` | New | Owner-only CRUD/list/resume actions for drafts |
| `actions/ideas.ts` | Modify | Accept draft-origin submission path and transactional draft cleanup |

### UI

| File | Change | Purpose |
|---|---|---|
| `components/ideas/IdeaForm.tsx` | Modify | Add Save Draft action and hidden `draftId` submit support |
| `components/ideas/DraftList.tsx` | New | Dashboard list with Continue buttons |
| `app/(protected)/dashboard/page.tsx` | Modify | Show current user drafts + empty/error states |
| `app/(protected)/ideas/new/page.tsx` | Modify | Load selected draft into form for resume flow |

### Tests

| File | Change | Purpose |
|---|---|---|
| `components/ideas/IdeaForm.test.tsx` | Modify | Draft-save UX and validation behavior coverage |
| `tests/integration/ideas/draft-actions.test.ts` | New | Save/list/get/update owner-only access tests |
| `tests/integration/ideas/submit-draft.test.ts` | New | Submit from draft creates idea and deletes draft atomically |
| `tests/e2e/idea-draft-flow.spec.ts` | New | End-to-end draft save -> dashboard -> resume -> submit |

## Local Run

1. Apply database migrations.

```bash
npm run db:migrate
```

2. Start application.

```bash
npm run dev
```

3. Validate draft flow manually.

- Open `/ideas/new`, enter partial values, click Save Draft.
- Open `/dashboard` and confirm only current user drafts are visible.
- Click Continue on a draft and confirm prefilled values.
- Submit successfully and confirm draft disappears from dashboard.

## Verification Commands

```bash
npm run type-check
npm run lint
npm run test
npx playwright test tests/e2e/idea-draft-flow.spec.ts
```

## T043 Validation Results (2026-05-15)

| Command | Result |
|---------|--------|
| `npx vitest run` | 27 files, 171 tests — **all pass** |
| `npx tsc --noEmit` (feature 005 files) | **0 errors** (4 pre-existing feature 004 errors out of scope) |
| `npx next lint` | **✔ No ESLint warnings or errors** |

## Expected Behavior Checklist

- Draft save works with empty or partial values.
- Drafts remain across sessions and do not auto-expire.
- Non-owners and admins cannot access draft payloads.
- Final submit from draft removes draft record in same transaction.
- Drafts never appear in admin idea-management workflows.
