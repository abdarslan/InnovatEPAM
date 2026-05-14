# Tasks: Idea Evaluation Workflow

**Feature**: `003-idea-evaluation-workflow` | **Branch**: `003-idea-evaluation-workflow` | **Date**: 2026-05-14

**Input**: Design documents from `specs/003-idea-evaluation-workflow/`

**References**: [spec.md](spec.md) · [plan.md](plan.md) · [data-model.md](data-model.md) · [contracts/server-actions.md](contracts/server-actions.md) · [research.md](research.md) · [quickstart.md](quickstart.md)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelisable — different files, no unresolved dependencies
- **[US1–US3]**: User story this task belongs to
- File paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install shadcn/ui Badge + Toast components (copy-into-repo pattern, no new npm deps) and wire the Toaster into the root layout before any feature code is written.

- [X] T001 Install shadcn/ui `badge` and `toast` components: run `npx shadcn@latest add badge` then `npx shadcn@latest add toast`; confirm `components/ui/badge.tsx`, `components/ui/toast.tsx`, `components/ui/toaster.tsx`, and `components/ui/use-toast.ts` are generated with no new entries in `package.json` dependencies
- [X] T002 [P] Add `<Toaster />` to `app/layout.tsx` — import from `@/components/ui/toaster`; place inside `<body>` alongside existing layout children; confirm the dev server renders without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema changes, Drizzle migration, state machine guard, and Zod schema extensions. ALL must be complete before any user story implementation begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Extend `lib/db/schema.ts`
- [X] T004 Generate Drizzle migration and apply
- [X] T005 [P] Create `lib/ideas/transitions.ts` — define `ALLOWED_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]>` with `submitted: ['under_review']`, `under_review: ['accepted', 'rejected']`, `accepted: []`, `rejected: []`; export `validateTransition(from: IdeaStatus, to: IdeaStatus): boolean` that returns `ALLOWED_TRANSITIONS[from].includes(to)`; no external imports
- [X] T006 [P] Extend `lib/ideas/validation.ts` — add `startReviewSchema` (`z.object({ ideaId: z.number().int().positive() })`); add `evaluateIdeaSchema` as a Zod discriminated union on `status`: `'accepted'` branch has `ideaId`, optional `comment` max 1000 chars; `'rejected'` branch has `ideaId`, required `comment` min 1 ("Rejection reason is required") max 1000; export both schemas and infer `EvaluateIdeaInput` type
- [X] T007 [P] Add shared types to `actions/ideas.ts` — export `IdeaStatus` type (re-export from schema or inline); extend `IdeaListItem` with `status: IdeaStatus` field; add `AdminIdeaListItem` type (extends `IdeaListItem` with `reviewerName: string | null`, `reviewStartedAt: number | null`, `evaluation: { adminName: string; status: 'accepted' | 'rejected'; comment: string | null; createdAt: number } | null`); add `IdeaEvaluationForSubmitter` type (`{ status: 'accepted' | 'rejected'; comment: string | null; createdAt: number }`)

**Checkpoint**: Schema migrated, transition guard in place, validation schemas defined, shared types extended — user story implementation can now begin.

---

## Phase 3: User Story 1 — Admin Reviews a Submitted Idea (Priority: P1) 🎯 MVP

**Goal**: Admin users can visit `/admin/ideas`, see all ideas, start review on a submitted idea, then accept or reject it with an optional/required comment. Status transitions are enforced server-side. In-place row updates and toast notifications on success.

**Independent Test**: Log in as admin → navigate to `/admin/ideas` → click Start Review on a Submitted idea → confirm row updates to Under Review → click Reject, enter a reason → confirm row updates to Rejected and toast appears. Attempting the same transitions as a non-admin returns an error.

### Implementation

- [X] T008 [US1] Implement `startReviewAction(ideaId: number)` in `actions/ideas.ts` — `requireAuth()`; verify `session.role === 'admin'` or return `{ ok: false, error: 'FORBIDDEN' }`; load idea by `ideaId`, return not-found if absent; call `validateTransition(idea.status, 'under_review')`, return `{ ok: false, error: 'Invalid status transition.' }` if false; `db.update(ideas).set({ status: 'under_review', reviewerId: session.userId, reviewStartedAt: Date.now() }).where(eq(ideas.id, ideaId))`; return `{ ok: true }` on success; wrap in try/catch returning `{ ok: false, error: 'Failed to start review. Please try again.' }` on DB error; MUST NOT throw
- [X] T009 [P] [US1] Implement `evaluateIdeaAction(payload)` in `actions/ideas.ts` — `requireAuth()`; verify admin role; `evaluateIdeaSchema.safeParse(payload)` → return Zod error message if invalid; load idea; call `validateTransition(idea.status, payload.status)`, return transition error if false; use `db.transaction()` to: (a) `db.update(ideas).set({ status: payload.status })`, (b) `db.insert(ideaEvaluations).values({ ideaId, adminId: session.userId, status: payload.status, comment: payload.comment ?? null, createdAt: Date.now() })`; return `{ ok: true }` on success; catch and return `{ ok: false, error: 'Failed to save evaluation. Please try again.' }`; MUST NOT throw
- [X] T010 [P] [US1] Implement `getAdminIdeasAction(statusFilter?: IdeaStatus)` in `actions/ideas.ts` — `requireAuth()`; verify admin role; Drizzle query: left join `users` (as submitter on `submitter_id`), left join `users` (as reviewer on `reviewer_id`), left join `ideaEvaluations`, left join `users` (as evaluator on `evaluation.admin_id`); when `statusFilter` is provided and is a valid `IdeaStatus` value add `.where(eq(ideas.status, statusFilter))`; order by `ideas.createdAt DESC`; map to `AdminIdeaListItem[]`; return `{ ok: true, data }` or `{ ok: false, error }`
- [X] T011 [P] [US1] Create `components/ideas/EvaluationPanel.tsx` — Client Component (`'use client'`); accepts props: `ideaId: number`, `currentStatus: IdeaStatus`, `onSuccess: () => void`; renders contextually: if `currentStatus === 'submitted'` show a "Start Review" button that calls `startReviewAction(ideaId)` on click; if `currentStatus === 'under_review'` show "Accept" button (calls `evaluateIdeaAction({ ideaId, status: 'accepted', comment })`) and "Reject" button (opens comment textarea required for rejection, then calls `evaluateIdeaAction`); use `react-hook-form` + `zodResolver(evaluateIdeaSchema)` for the Accept/Reject form; show inline field-level validation errors; on success call `onSuccess()` and show success toast via `useToast()`; if `currentStatus` is `'accepted'` or `'rejected'` render a read-only label "Evaluation complete"; buttons must be `disabled` during pending submission
- [X] T012 [P] [US1] Create `components/ideas/EvaluationPanel.test.tsx` — test: "Start Review" button renders for `submitted` status; clicking it calls `startReviewAction` with correct `ideaId`; "Accept" and "Reject" buttons render for `under_review` status; submitting Reject without comment shows "Rejection reason is required" error; submitting with comment calls `evaluateIdeaAction` with `{ status: 'rejected', comment }`; action error rendered in UI; `onSuccess` prop called on `{ ok: true }` response; read-only label rendered for `accepted` / `rejected` status
- [X] T013 [P] [US1] Create `components/ideas/AdminIdeaRow.tsx` — Client Component (`'use client'`); accepts `idea: AdminIdeaListItem` prop; displays title, category, submitter name, `createdAt` date, and current status; renders `<EvaluationPanel ideaId={idea.id} currentStatus={idea.status} onSuccess={handleSuccess} />`; `handleSuccess` refreshes the row data in-place using `router.refresh()` (Next.js `useRouter`) so the parent Server Component re-fetches without a full page reload (FR-019); show `reviewerName` and `reviewStartedAt` when status is `under_review`; show evaluation `adminName`, `comment`, and `createdAt` when evaluation is present
- [X] T014 [P] [US1] Create `components/ideas/AdminIdeaRow.test.tsx` — test: row renders idea title, category, submitter name, and status; `EvaluationPanel` is present; `onSuccess` triggers `router.refresh()` (mock `useRouter`); evaluation details (admin name, comment) rendered when `evaluation` is non-null; reviewer name and timestamp rendered when `status === 'under_review'`
- [X] T015 [US1] Create `components/ideas/AdminIdeaList.tsx` — Server Component; accepts `ideas: AdminIdeaListItem[]` prop and optional `activeFilter?: IdeaStatus` prop; maps ideas to `<AdminIdeaRow>`; renders empty state "No ideas found." when array is empty; filter UI is a `<select>` with options for all 4 statuses plus "All" (filter UI wired in US3 Phase 5 — for now render the select but do not handle onChange)
- [X] T016 [US1] Create `app/(protected)/admin/ideas/page.tsx` — Server Component; get session via `getSession()`; if `session.role !== 'admin'` redirect to `/access-denied`; call `getAdminIdeasAction()`; on `{ ok: false }` render error message; on success render `<AdminIdeaList ideas={data} />`; add `<h1>Idea Management</h1>` heading; add `app/(protected)/admin/ideas/error.tsx` boundary importing Next.js `'use client'` error component
- [X] T017 [US1] Write integration tests — `tests/integration/ideas/start-review.test.ts`: admin can transition submitted → under_review (sets reviewer_id + review_started_at); non-admin returns FORBIDDEN; already-under_review idea returns transition error; non-existent idea returns not-found. `tests/integration/ideas/evaluate.test.ts`: admin can accept under_review idea (creates evaluation row, updates status); admin can reject with comment; rejection without comment returns Zod error; direct submitted→accepted returns transition error; non-admin returns FORBIDDEN; transaction rolls back if DB error mid-write. `tests/integration/ideas/admin-list.test.ts` (basic): admin gets all ideas; non-admin returns FORBIDDEN; returned items include evaluation data when present
- [X] T018 [US1] Write E2E test `tests/e2e/idea-evaluation-flow.spec.ts` — (1) login as admin → navigate to `/admin/ideas` → click Start Review on a Submitted idea → verify row updates in-place to Under Review and success toast shown; (2) click Reject on the Under Review idea → submit without comment → verify validation error shown; enter comment → submit → verify row updates to Rejected and toast shown; (3) login as submitter → navigate to `/ideas` → verify the idea still appears (status display tested in US2); (4) login as non-admin → navigate to `/admin/ideas` → verify redirect to access-denied page

**Checkpoint**: User Story 1 fully functional — admin can complete the full Submitted → Under Review → Accepted/Rejected workflow with comments, in-place updates, and toast notifications.

---

## Phase 4: User Story 2 — Submitter Tracks Their Idea Status (Priority: P2)

**Goal**: All authenticated users see a status badge on every idea in the employee-facing listing. Submitters also see the admin's evaluation comment on their own ideas when accepted or rejected.

**Independent Test**: Log in as submitter → navigate to `/ideas` → verify all ideas show a status badge reflecting current status → have admin reject an idea with a comment → refresh `/ideas` → verify the submitter sees "Rejected" badge and the rejection comment → log in as a different user → verify that user cannot see the rejection comment.

### Implementation

- [X] T019 [P] [US2] Create `components/ideas/StatusBadge.tsx` — accepts `status: IdeaStatus` prop; renders a `<Badge>` (shadcn/ui) wrapping the status text label ("Submitted", "Under Review", "Accepted", "Rejected"); apply per-status Tailwind color classes: submitted = gray, under_review = yellow/amber, accepted = green, rejected = red; status text MUST always be visible inside the pill (FR-021, WCAG 1.4.1 — color not sole differentiator); use `aria-label={status}` on the badge element; colors must meet WCAG 4.5:1 contrast ratio against the pill background
- [X] T020 [P] [US2] Create `components/ideas/StatusBadge.test.tsx` — test: renders "Submitted" text for `submitted` status; renders "Under Review" text for `under_review`; renders "Accepted" text for `accepted`; renders "Rejected" text for `rejected`; badge element has correct `aria-label`; snapshot test for each variant
- [X] T021 [US2] Extend `getIdeasAction` in `actions/ideas.ts` — update the Drizzle SELECT to include `ideas.status`; ensure `IdeaListItem` type already has `status: IdeaStatus` (added in T007); existing callers receive the new field transparently (additive change). Extend `getIdeaDetailAction` — add a LEFT JOIN to `ideaEvaluations`; when the requesting `session.userId === idea.submitterId` populate `evaluation: IdeaEvaluationForSubmitter | null` in the returned type with comment, status, and createdAt; otherwise return `evaluation: null`
- [X] T022 [US2] Modify `components/ideas/IdeaRow.tsx` — import and render `<StatusBadge status={idea.status} />` in the row header alongside the existing title/category/submitter fields; in the expanded section: when `detail.evaluation` is non-null AND `currentUserId === idea.submitterId`, render the evaluation comment in a styled block (label "Admin feedback:", comment text); ensure comment is rendered via JSX text interpolation only — NO `dangerouslySetInnerHTML`
- [X] T023 [P] [US2] Modify `components/ideas/IdeaListClient.tsx` — confirm `status` is passed from `IdeaListItem` through to `IdeaRow`; update any props interface if `status` was not previously forwarded; no other logic changes
- [X] T024 [US2] Write integration tests `tests/integration/ideas/submitter-status.test.ts` — `getIdeasAction` returns `status` field on each item; `getIdeaDetailAction` returns `evaluation` comment when caller is the submitter and idea has an evaluation record; returns `evaluation: null` when caller is a different authenticated user; returns `evaluation: null` when idea has no evaluation record

**Checkpoint**: User Story 2 fully functional — status badges visible to all users; evaluation comments visible only to the idea's submitter.

---

## Phase 5: User Story 3 — Admin Filters Ideas by Status (Priority: P3)

**Goal**: Admins can filter the `/admin/ideas` listing to a single status using a dropdown. Selecting a filter updates the URL search param and narrows the results. Clearing returns all ideas. Empty state shown when no ideas match.

**Independent Test**: Log in as admin → navigate to `/admin/ideas` → select "Submitted" filter → verify only Submitted ideas shown → select "Under Review" → verify only Under Review ideas shown → select "All" → verify all ideas shown → select a status with no matching ideas → verify empty state message shown.

### Implementation

- [X] T025 [P] [US3] Update `components/ideas/AdminIdeaList.tsx` — convert to Client Component (`'use client'`); wire the status filter `<select>` `onChange` handler: on selection call `router.push(pathname + '?status=' + value)` using `useRouter` and `usePathname`; when `value === ''` (All), call `router.push(pathname)` to clear the param; set the `<select>` `defaultValue` to `activeFilter ?? ''`; render the empty state "No ideas found." when `ideas` is empty; keep `AdminIdeaRow` rendering unchanged
- [X] T026 [US3] Update `app/(protected)/admin/ideas/page.tsx` — accept `searchParams` prop (Next.js App Router pattern); read `searchParams.status`; validate it is a member of `IDEA_STATUSES` before passing to `getAdminIdeasAction` (ignore invalid values); pass validated `statusFilter` to `getAdminIdeasAction(statusFilter)` and `<AdminIdeaList activeFilter={statusFilter} />`
- [X] T027 [US3] Write integration test extension in `tests/integration/ideas/admin-list.test.ts` — `getAdminIdeasAction('submitted')` returns only Submitted ideas; `getAdminIdeasAction('under_review')` returns only Under Review ideas; `getAdminIdeasAction()` with no filter returns all ideas; `getAdminIdeasAction('accepted')` returns empty array when no accepted ideas exist

**Checkpoint**: All three user stories fully functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Delete guard for Under Review ideas, nav link, type safety, lint, full test pass, and PR.

- [X] T028 [P] Extend `deleteIdeaAction` in `actions/ideas.ts` — after loading the idea and before the permission check, add: `if (idea.status === 'under_review') return { ok: false, error: 'Ideas under review cannot be deleted.' }` (FR-022); no other changes to the action
- [X] T029 [P] Write integration test `tests/integration/ideas/delete-under-review.test.ts` — attempt to delete an idea with `status = 'under_review'` returns `{ ok: false, error: 'Ideas under review cannot be deleted.' }`; idea row remains in DB unchanged; ideas with other statuses (`submitted`, `accepted`, `rejected`) remain deletable (existing permission rules apply)
- [X] T030 [P] Update `app/(protected)/layout.tsx` nav bar — add "Idea Management" `<Link href="/admin/ideas">` link rendered only when `session.role === 'admin'`; verify existing nav links for submitters are unchanged
- [X] T031 [P] Run `npm run type-check` (`tsc --noEmit`) — resolve all TypeScript strict-mode errors in `lib/db/schema.ts`, `lib/ideas/transitions.ts`, `lib/ideas/validation.ts`, `actions/ideas.ts`, all new components, and the admin route; no `any` without justification; ensure Drizzle inferred types used throughout
- [X] T032 [P] Run `npm run lint` — resolve all ESLint errors and warnings in all new and modified files: `lib/ideas/`, `actions/ideas.ts`, `components/ideas/`, `components/ui/` (badge + toast), `app/(protected)/admin/ideas/`, `app/layout.tsx`
- [X] T033 Run full validation pass: `npm run test` (all Vitest unit + component + integration suites must pass) then `npx playwright test` (all E2E specs including the new `idea-evaluation-flow.spec.ts` must pass) then `npm run type-check`; all three commands must exit with code 0
- [ ] T034 Create PR from `003-idea-evaluation-workflow` → `main` via GitHub MCP; PR description must reference spec, list all FRs implemented (FR-001 to FR-022), note integration + E2E coverage, and confirm `npm run test` + `npx playwright test` + `npm run type-check` all pass; DO NOT merge — merge requires explicit user approval

---

## Dependencies (Story Completion Order)

```
Phase 1 (T001–T002)
  └── Phase 2 (T003–T007)
        ├── Phase 3 US1 (T008–T018)   🎯 MVP — full admin evaluation workflow
        │     └── Phase 4 US2 (T019–T024)  — requires getIdeasAction + IdeaRow from prior work
        │           └── Phase 5 US3 (T025–T027)  — requires AdminIdeaList from US1
        │                 └── Phase 6 Polish (T028–T034)
        └── [T005, T006, T007 parallelisable once T003+T004 complete]
```

**MVP Scope (Phases 1–3)**: 18 tasks → delivers complete admin evaluation workflow end-to-end. US2 (status badges for submitters) and US3 (filter) can follow.

---

## Parallel Execution Opportunities

Within each phase, tasks marked `[P]` can be worked simultaneously:

| Parallel Group | Tasks | Notes |
|---|---|---|
| shadcn/ui setup | T001, T002 | Different files |
| Transitions + Validation + Types | T005, T006, T007 | After T003+T004 complete |
| Three action implementations | T008, T009, T010 | Each in separate function in same file; T009+T010 after T008 interface established |
| EvaluationPanel + AdminIdeaRow | T011, T013 | After T008+T009 interfaces defined |
| Component tests | T012, T014 | Parallel with implementation |
| StatusBadge + its test | T019, T020 | Independent of all other US2 work |
| Filter UI + Page update | T025, T026 | T025 first, T026 after |
| Polish | T028, T029, T030, T031, T032 | All independent |

---

## Task Summary

| Phase | Story | Tasks | Count |
|---|---|---|---|
| Phase 1: Setup | — | T001–T002 | 2 |
| Phase 2: Foundational | — | T003–T007 | 5 |
| Phase 3: Admin Reviews Idea | US1 (P1) | T008–T018 | 11 |
| Phase 4: Submitter Tracks Status | US2 (P2) | T019–T024 | 6 |
| Phase 5: Admin Filters by Status | US3 (P3) | T025–T027 | 3 |
| Phase 6: Polish | — | T028–T034 | 7 |
| **Total** | | | **34** |

**MVP** (Phases 1–3): 18 tasks → full admin evaluation workflow end-to-end.

**Parallel opportunities**: 14 tasks across all phases. US1 stories can complete in ~11 sequential steps when parallelised.

**Independent test criteria per story**:
- **US1**: Admin full review journey testable via integration + E2E tests immediately after Phase 3
- **US2**: Status badge display testable by running `npm run test` for StatusBadge unit tests + manual `/ideas` page check
- **US3**: Filter testable by running the admin-list integration test + manual `/admin/ideas?status=submitted` check


