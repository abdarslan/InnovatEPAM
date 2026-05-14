# Quickstart: Idea Submission System (Multi-attachment + Preview)

**Feature**: `002-idea-submission`
**Branch**: `002-idea-submission`
**Date**: 2026-05-14

---

## Prerequisites

- Node.js 18+
- Dependencies installed (`npm install`)
- Migrated + seeded SQLite DB (`npm run db:migrate`, `npm run db:seed`)
- Dev server running (`npm run dev`)

---

## Planned File Changes

### Database Layer

| File | Change |
|---|---|
| `lib/db/schema.ts` | Replace inline single-attachment columns with normalized `idea_attachments` table + relations |
| `lib/db/migrations/0002_ideas_multi_attachments.sql` | Add attachment table + backfill + legacy column cleanup |
| `lib/db/seed.ts` | Seed ideas that include multiple attachments and mixed preview-eligible types |

### Validation + Actions

| File | Change |
|---|---|
| `lib/ideas/validation.ts` | Add multi-file count/per-file/aggregate validation and MIME checks |
| `actions/ideas.ts` | Update submit/update/detail/list/delete flows for attachment arrays and owner add/remove behavior |

### API Routes

| File | Change |
|---|---|
| `app/api/ideas/[id]/attachments/[attachmentId]/route.ts` | New authenticated preview/download endpoint per attachment |
| `app/api/ideas/[id]/attachment/route.ts` | Optional compatibility shim during migration (legacy callers) |

### UI Components and Pages

| File | Change |
|---|---|
| `components/ideas/IdeaForm.tsx` | Support selecting multiple files, local preview, per-file remove before submit |
| `components/ideas/IdeaRow.tsx` | Render attachment gallery/list with inline preview or metadata fallback + download controls |
| `components/ideas/IdeaList.tsx` | Display attachment count and preserve empty/error states |
| `app/(protected)/ideas/page.tsx` | Ensure detail payload includes attachments |
| `app/(protected)/ideas/new/page.tsx` | Submit multi-attachment payload |
| `app/(protected)/ideas/[id]/edit/page.tsx` | Add/remove attachments for owner post-submission |

### Tests

| File | Change |
|---|---|
| `components/ideas/IdeaForm.test.tsx` | Multi-select, per-file removal, preview/fallback rendering |
| `components/ideas/IdeaRow.test.tsx` | Attachment preview/download and metadata fallback states |
| `tests/integration/ideas/submit.test.ts` | Count, size, type, aggregate validation and transaction rollback |
| `tests/integration/ideas/update.test.ts` | Owner add/remove attachment behavior after submission |
| `tests/integration/ideas/attachment.test.ts` | Auth-protected per-attachment preview/download route semantics |
| `tests/integration/ideas/delete.test.ts` | Attachment cleanup/cascade after idea deletion |
| `tests/e2e/ideas-multimedia-flow.spec.ts` | End-to-end submit, preview, edit attachment lifecycle |

---

## Development Commands

```bash
# Database lifecycle
npm run db:migrate
npm run db:seed

# Validation gates
npm run type-check
npm run lint
npm run test
npm run e2e

# Focused integration run
npm run test -- tests/integration/ideas
```

---

## Route Map

| URL | Purpose | Auth |
|---|---|---|
| `/ideas` | Listing with expandable detail and attachment preview/download controls | Required |
| `/ideas/new` | Submit idea with optional multiple attachments | Required |
| `/ideas/[id]/edit` | Edit idea and manage attachments (owner only) | Required |
| `/api/ideas/[id]/attachments/[attachmentId]` | Attachment preview/download payload | Required |

---

## User Flow Snapshot

```text
Login
      -> /ideas
            -> New Idea
                  -> Fill title/description/category
                  -> Select up to 5 attachments
                  -> Preview supported media or see file metadata fallback
                  -> Submit
                  -> Redirect to /ideas

            -> Expand row
                  -> Read full description
                  -> Preview/download each attachment

            -> Edit own idea
                  -> Add new attachments
                  -> Remove individual existing attachments
                  -> Save
```

---

## Freshness Follow-up

Context7 documentation verification for Next.js and Drizzle was attempted during planning but failed because the environment lacks a valid Context7 API key. Add a pre-implementation checklist item to re-run docs verification once credentials are available.

---

## Implementation Evidence

- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run test -- tests/integration/ideas` ✅
- `npm run test -- components/ideas/IdeaForm.test.tsx components/ideas/IdeaRow.test.tsx` ✅

### Remaining Validation

- E2E coverage for the multimedia edit/add/remove/delete flow is still pending (`tests/e2e/ideas-multimedia-flow.spec.ts`).
