# Tasks: Idea Submission System

**Feature**: `002-idea-submission` | **Branch**: `002-idea-submission` | **Date**: 2026-05-14

**Input**: Design documents from `specs/002-idea-submission/`

**References**: [spec.md](spec.md) · [plan.md](plan.md) · [data-model.md](data-model.md) · [contracts/server-actions.md](contracts/server-actions.md) · [research.md](research.md) · [quickstart.md](quickstart.md)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelisable — different files, no unresolved dependencies
- **[US1–US4]**: User story this task belongs to
- File paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new shadcn/ui components and update auth middleware to cover `/ideas` routes before any feature code is written.

- [ ] T001 Install shadcn/ui `collapsible` and `alert-dialog` components: run `npx shadcn@latest add collapsible` then `npx shadcn@latest add alert-dialog`; confirm `components/ui/collapsible.tsx` and `components/ui/alert-dialog.tsx` are generated
- [ ] T002 [P] Update `middleware.ts` — add `/ideas/:path*` to the protected route block (alongside `/dashboard`) and add `'/ideas/:path*'` to `config.matcher`; the API route `/api/ideas/[id]/attachment` is protected inline via `requireAuth()` so does not need a matcher entry

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, Drizzle migration, Zod validation schemas, and shared action types. ALL must be complete before any user story implementation begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Extend `lib/db/schema.ts` — add `IDEA_CATEGORIES` const array, `IdeaCategory` union type, `ideas` sqliteTable definition (all columns per data-model.md), and `Idea` / `NewIdea` inferred types; do NOT run the migration in this task
- [ ] T004 Generate Drizzle migration: run `npx drizzle-kit generate` to produce `lib/db/migrations/0001_add_ideas_table.sql`; then run `npm run db:migrate` to apply; verify the `ideas` table exists in the local SQLite DB
- [ ] T005 [P] Create `lib/ideas/validation.ts` — `submitIdeaSchema` with `title` (`z.string().min(3).max(255).trim()`), `description` (`z.string().min(10).max(5000).trim()`), `category` (`z.enum(IDEA_CATEGORIES)`), `attachment` (optional `z.custom<File>().refine()` checking `file.size <= 5_242_880` and MIME in `['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg']`); `updateIdeaSchema` mirrors `submitIdeaSchema`; export both
- [ ] T006 [P] Create `actions/ideas.ts` file scaffold — add `'use server'` directive; define and export `ActionResult<T>`, `IdeaListItem`, and `IdeaDetail` TypeScript types per `contracts/server-actions.md`; no action implementations yet

**Checkpoint**: Schema migrated, validation schemas defined, shared types in place — user story implementation can now begin.

---

## Phase 3: User Story 1 — Submit a New Idea (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can submit an idea (with optional file attachment) and receive confirmation. Unauthenticated users are redirected to login.

**Independent Test**: Log in as an authenticated user → navigate to `/ideas/new` → fill all required fields → submit → verify row appears in `ideas` table and success message is shown.

### Implementation

- [ ] T007 [US1] Implement `submitIdeaAction` in `actions/ideas.ts` — `'use server'`; call `requireAuth()`; extract FormData fields (`title`, `description`, `category`, `attachment`); run `submitIdeaSchema.safeParse()`; if file present convert to Buffer via `Buffer.from(await file.arrayBuffer())`; insert idea + optional attachment columns atomically in a single Drizzle `db.transaction()`; return `{ ok: true, data: { id } }` or `{ ok: false, error: string }` — MUST NOT throw
- [ ] T008 [P] [US1] Create `components/ideas/IdeaForm.tsx` — Client Component (`'use client'`); `useForm` with `zodResolver(submitIdeaSchema)`; labeled `<input>` for title, `<textarea>` for description, `<select>` for category (map `IDEA_CATEGORIES` to `<option>`), `<input type="file" accept=".pdf,.docx,.png,.jpg,.jpeg">` for attachment; accessible error messages via `aria-describedby`; `onSubmit` calls `action` prop (Server Action bound function); shows loading/disabled state during submission; accepts `defaultValues` prop for edit mode reuse
- [ ] T009 [P] [US1] Create `components/ideas/IdeaForm.test.tsx` — render IdeaForm in submit mode; test: required field validation errors appear on empty submit; valid values call action prop with FormData; oversized file error shown; success clears form
- [ ] T010 [US1] Create `app/(protected)/ideas/new/page.tsx` — Server Component; render `<IdeaForm action={submitIdeaAction} />`; on successful submission display success toast/message and link to `/ideas`
- [ ] T011 [US1] Write integration tests `tests/integration/ideas/submit.test.ts` — against real SQLite test DB: valid submission inserts row and returns `{ ok: true, data: { id } }`; missing `title` returns Zod error string; `description` below 10 chars returns error; attachment > 5 MB returns error; verify transaction rollback leaves no partial row on DB error

**Checkpoint**: User Story 1 fully functional and independently testable — form submits, idea saved, errors shown correctly.

---

## Phase 4: User Story 2 — Browse the Idea Listing (Priority: P2)

**Goal**: Authenticated users see all submitted ideas in an expandable listing (newest first). Expanding a row reveals the full description and a download link placeholder. Empty state shown when no ideas exist.

**Independent Test**: Navigate to `/ideas` after at least one submission → all ideas shown with title, category, submitter name, date → expand a row → description revealed.

### Implementation

- [ ] T013 [US2] Implement `getIdeasAction` in `actions/ideas.ts` — `requireAuth()`; Drizzle query joining `ideas` with `users` on `submitter_id = users.id`; select `id`, `title`, `category`, `users.displayName as submitterName`, `createdAt`, `updatedAt`, `attachmentName IS NOT NULL as hasAttachment`; order by `createdAt DESC`; return `{ ok: true, data: IdeaListItem[] }` or `{ ok: false, error }`
- [ ] T014 [P] [US2] Implement `getIdeaDetailAction` in `actions/ideas.ts` — `requireAuth()`; query single idea by `id` with submitter join; return `IdeaDetail` (includes `description`, `attachmentName`, `attachmentSize`, `attachmentMimeType` — no BLOB content); return `{ ok: false, error: 'Idea not found.' }` if absent
- [ ] T015 [P] [US2] Create `components/ideas/IdeaList.tsx` — accepts `ideas: IdeaListItem[]` and `currentUserId: number` and `currentUserRole: 'submitter' | 'admin'` props; maps ideas to `<IdeaRow>` components; renders `<p>No ideas have been submitted yet.</p>` empty state when array is empty
- [ ] T016 [P] [US2] Create `components/ideas/IdeaRow.tsx` — Client Component (`'use client'`); uses shadcn/ui `Collapsible`; header shows title, category badge, submitter name, formatted `createdAt` date; on expand calls `getIdeaDetailAction(id)` and shows loading state then full `description` (plain JSX interpolation only — NO `dangerouslySetInnerHTML`); download link slot rendered if `hasAttachment` is true (placeholder for T022); `aria-expanded` on Collapsible trigger; accepts `currentUserId` and `currentUserRole` props for edit/delete UI in T029
- [ ] T017 [P] [US2] Create `components/ideas/IdeaRow.test.tsx` — test: header fields rendered; clicking trigger reveals description after mock `getIdeaDetailAction` resolves; no download link when `hasAttachment=false`; download link rendered when `hasAttachment=true`; no `dangerouslySetInnerHTML` in rendered output
- [ ] T018 [US2] Create `app/(protected)/ideas/page.tsx` — Server Component; call `getIdeasAction()`; get session via `getSession()` to extract `userId` and `role`; on success render `<IdeaList ideas={data} currentUserId={userId} currentUserRole={role} />`; on error render error message; include "Submit an idea" link to `/ideas/new`
- [ ] T019 [US2] Write integration tests `tests/integration/ideas/list.test.ts` — `getIdeasAction` returns all ideas newest-first; returns empty array when none exist; unauthenticated returns error string; `getIdeaDetailAction` returns full detail for valid id; returns not-found error for missing id

**Checkpoint**: User Story 2 fully functional — listing page loads, rows expand with description, empty state works.

---

## Phase 5: User Story 3 — Attach a Supporting File (Priority: P3)

**Goal**: File attachments stored during submission (already handled atomically in T007) are accessible via an authenticated download endpoint. Expanded rows show a clickable download link.

**Independent Test**: Submit an idea with a file → expand the row in the listing → click the download link → file downloads with correct filename and MIME type.

### Implementation

- [ ] T021 [US3] Create `app/api/ideas/[id]/attachment/route.ts` — `export async function GET(request, { params })`: call `requireAuth()` and return `new Response('Unauthorized', { status: 401 })` if not authenticated; parse and validate `params.id` as integer (return `400` for non-integer); query `ideas` for `attachmentContent`, `attachmentMimeType`, `attachmentName`; return `404` if row absent or no attachment; return `new Response(buffer, { headers: { 'Content-Type': mimeType, 'Content-Disposition': \`attachment; filename="${attachmentName}"\`, 'Content-Length': String(buffer.byteLength) } })`
- [ ] T022 [P] [US3] Update `components/ideas/IdeaRow.tsx` expanded section — when `getIdeaDetailAction` resolves and `detail.attachmentName` is non-null, render `<a href={/api/ideas/${id}/attachment} download={detail.attachmentName}>` showing filename and formatted size; ensure link is keyboard-accessible with visible focus ring
- [ ] T023 [US3] Write integration tests for file download — create `tests/integration/ideas/attachment.test.ts`: authenticated GET for idea with attachment returns `Response` with binary content and correct `Content-Type`/`Content-Disposition` headers; unauthenticated request returns 401; GET for idea without attachment returns 404; invalid id returns 400

**Checkpoint**: User Story 3 complete — file upload stored atomically (T007), download endpoint protected and serving correct content, listing rows show download links.

---

## Phase 6: User Story 4 — Edit or Delete Own Idea (Priority: P3)

**Goal**: Submitters can edit their own ideas; submitters and admins can delete any/own idea via a confirmation dialog. Non-owners are refused. Delete shows `AlertDialog` before proceeding (FR-020).

**Independent Test**: Submit idea → click edit → change title → save → verify updated title in listing → click delete → confirm dialog appears → confirm → idea removed from listing.

### Implementation

- [ ] T024 [US4] Implement `updateIdeaAction` in `actions/ideas.ts` — `requireAuth()`; load idea by `id`; return `{ ok: false, error: 'Idea not found.' }` if absent; return `{ ok: false, error: 'You are not authorised to edit this idea.' }` if `session.userId !== idea.submitterId`; parse FormData; run `updateIdeaSchema.safeParse()`; update all mutable fields + optional attachment + `updatedAt = Date.now()` in single Drizzle transaction; return `{ ok: true }`
- [ ] T025 [P] [US4] Implement `deleteIdeaAction` in `actions/ideas.ts` — `requireAuth()`; load idea; return not-found if absent; return unauthorised if `session.userId !== idea.submitterId && session.role !== 'admin'`; hard delete row; return `{ ok: true }`
- [ ] T026 [P] [US4] Create `components/ideas/DeleteIdeaButton.tsx` — Client Component (`'use client'`); renders shadcn/ui `AlertDialog`; `<AlertDialogTrigger>` is a "Delete" button; `<AlertDialogContent>` asks "Are you sure you want to permanently delete this idea?"; `<AlertDialogAction>` calls `deleteIdeaAction(id)` on click; on `{ ok: false, error }` displays error message; on success calls optional `onDeleted` callback prop; `<AlertDialogCancel>` closes without action (FR-020)
- [ ] T027 [P] [US4] Create `components/ideas/DeleteIdeaButton.test.tsx` — test: dialog does not open on initial render; trigger click opens dialog; cancel click closes dialog without calling `deleteIdeaAction`; confirm click calls `deleteIdeaAction`; action error is displayed in UI; action success calls `onDeleted` callback
- [ ] T028 [US4] Create `app/(protected)/ideas/[id]/edit/page.tsx` — Server Component; call `getIdeaDetailAction(Number(params.id))`; if not found redirect to `/ideas`; get session and if `session.userId !== detail.submitterId` redirect to `/ideas` (non-submitters cannot edit); render `<IdeaForm action={updateIdeaAction.bind(null, Number(params.id))} defaultValues={{ title: detail.title, description: detail.description, category: detail.category }} />`; on success redirect to `/ideas`
- [ ] T029 [US4] Update `components/ideas/IdeaRow.tsx` — in expanded section add: edit link `<Link href={/ideas/${id}/edit}>Edit</Link>` rendered when `currentUserId === idea.submitterId`; `<DeleteIdeaButton id={id} onDeleted={...} />` rendered when `currentUserId === idea.submitterId || currentUserRole === 'admin'`; on delete success remove the row from the visible list (parent re-fetch or optimistic removal)
- [ ] T030 [US4] Write integration tests — `tests/integration/ideas/update.test.ts`: submitter can update own idea; non-submitter receives auth error; validates same rules as submit (min/max lengths); `tests/integration/ideas/delete.test.ts`: submitter can delete own idea; admin can delete any idea; non-submitter non-admin receives auth error; deleted row absent from DB
- [ ] T031 [US4] Write E2E test `tests/e2e/idea-edit-delete-flow.spec.ts` — edit flow: navigate to edit page, change title, save, verify updated title in listing; delete flow: click delete, verify `AlertDialog` shown, click cancel, idea still present; click delete again, confirm, idea removed; non-owner navigation to edit page redirects away

**Checkpoint**: User Story 4 complete — submitters can edit/delete own ideas; admins can delete any idea; all deletions require confirmation dialog.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Nav integration, type safety, lint, full test pass, and PR creation.

- [ ] T032 [P] Update `app/(protected)/layout.tsx` nav bar — add "Ideas" `<Link href="/ideas">` link visible to all authenticated users (both `submitter` and `admin` roles); verify existing admin and submitter nav links still render correctly
- [ ] T033 [P] Run `npm run type-check` (`tsc --noEmit`) — resolve all TypeScript strict-mode errors in new idea files; ensure Drizzle inferred types used throughout (no `any`); verify `IdeaCategory` union used correctly in all action parameters
- [ ] T034 [P] Run `npm run lint` — resolve all ESLint errors and warnings in `actions/ideas.ts`, `lib/ideas/validation.ts`, `components/ideas/`, `app/(protected)/ideas/`, and `app/api/ideas/`
- [ ] T035 Run full validation pass: `npm run test` (Vitest — all unit + component + integration suites must pass) then `npx playwright test` (all E2E specs must pass) then `npm run type-check`; all three commands must exit with code 0
- [ ] T036 Create PR from `002-idea-submission` → `main` via GitHub MCP; PR description must reference spec, list FRs implemented, and note test coverage; DO NOT merge — merge requires explicit user approval

---

## Dependencies (Story Completion Order)

```
Phase 1 (T001–T002)
  └── Phase 2 (T003–T006)
        ├── Phase 3 US1 (T007–T011)  🎯 MVP — can be delivered independently
        │     └── Phase 4 US2 (T013–T020)  — requires at least one idea to exist
        │           └── Phase 5 US3 (T021–T023)  — requires IdeaRow from US2
        │                 └── Phase 6 US4 (T024–T031)  — requires US1 submit flow + US2 listing
        │                       └── Phase 7 Polish (T032–T036)
        └── [T005 + T006 parallelisable once T003+T004 done]
```

**MVP Scope (Phase 1 + Phase 2 + Phase 3)**: 12 tasks — delivers complete idea submission with validation, file attachment, and success feedback. The listing and management features can follow.

---

## Parallel Execution Opportunities

Within each phase, tasks marked `[P]` can be worked simultaneously:

| Parallel Group | Tasks | Notes |
|---|---|---|
| Foundation setup | T001, T002 | Different files |
| Schema + Validation + Types | T005, T006 | After T003+T004 complete |
| Action + Form + Form tests | T008, T009 | After T007 interface defined |
| Detail action + List + Row + Row tests | T014, T015, T016, T017 | After T013 interface defined |
| Update + Delete actions | T024, T025 | After T013 data confirmed |
| DeleteButton + DeleteButton tests | T026, T027 | Together |
| Polish | T032, T033, T034 | All independent |

---

## Task Summary

| Phase | Story | Tasks | Count |
|---|---|---|---|
| Phase 1: Setup | — | T001–T002 | 2 |
| Phase 2: Foundational | — | T003–T006 | 4 |
| Phase 3: Submit Idea | US1 (P1) | T007–T011 | 5 |
| Phase 4: Browse Listing | US2 (P2) | T013–T020 | 7 |
| Phase 5: File Attachment | US3 (P3) | T021–T023 | 3 |
| Phase 6: Edit / Delete | US4 (P3) | T024–T031 | 8 |
| Phase 7: Polish | — | T032–T036 | 5 |
| **Total** | | | **34** |

**MVP** (Phases 1–3): 11 tasks → full submit flow end-to-end.
