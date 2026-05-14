# Tasks: Idea Draft Management

**Input**: Design documents from `/specs/005-idea-draft-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include unit/component, integration, and E2E tasks because this feature changes persistence, authorization boundaries, and multi-step user flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and test files for draft management.

- [x] T001 Create draft actions module scaffold in actions/idea-drafts.ts
- [x] T002 [P] Create draft list UI scaffold in components/ideas/DraftList.tsx
- [x] T003 [P] Create draft migration stub in lib/db/migrations/0004_idea_drafts.sql
- [x] T004 [P] Create integration test scaffold for draft actions in tests/integration/ideas/draft-actions.test.ts
- [x] T005 [P] Create integration test scaffold for draft submission conversion in tests/integration/ideas/submit-draft.test.ts
- [x] T006 [P] Create E2E draft flow scaffold in tests/e2e/idea-draft-flow.spec.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared schema, validation, and contracts required by all user stories.

**CRITICAL**: No user story implementation starts until this phase is complete.

- [x] T007 Add draft table schemas and exported draft types in lib/db/schema.ts
- [x] T008 Implement SQL migration for idea_drafts, idea_draft_attachments, and idea_draft_field_values in lib/db/migrations/0004_idea_drafts.sql
- [x] T009 Add draft validation schemas and parse helpers in lib/ideas/validation.ts
- [x] T010 Add reusable dynamic-field validation path for draft payloads in lib/ideas/category-fields.ts
- [x] T011 Add draft action result types and shared mapper helpers in actions/idea-drafts.ts
- [x] T012 Add integration test utilities for seeding users and draft fixtures in tests/integration/ideas/draft-actions.test.ts

**Checkpoint**: Draft schema, migration, and shared validation/contracts are ready.

---

## Phase 3: User Story 1 - Save Idea as Draft (Priority: P1) 🎯 MVP

**Goal**: Submitters can save empty/partial idea forms as drafts and update them repeatedly.

**Independent Test**: Save a new empty draft, save partial content, update the same draft, and verify persistence across reload.

### Tests for User Story 1

- [x] T013 [P] [US1] Add component tests for Save Draft button states and relaxed validation behavior in components/ideas/IdeaForm.test.tsx
- [x] T014 [P] [US1] Add integration tests for create/update draft persistence and owner enforcement in tests/integration/ideas/draft-actions.test.ts
- [x] T015 [P] [US1] Add integration tests for draft attachment limits and dynamic value persistence in tests/integration/ideas/draft-actions.test.ts

### Implementation for User Story 1

- [x] T016 [US1] Implement upsertIdeaDraftAction with owner-scoped create/update logic in actions/idea-drafts.ts
- [x] T017 [US1] Implement draft attachment insert/update handling in actions/idea-drafts.ts
- [x] T018 [US1] Implement draft dynamic-field value upsert handling in actions/idea-drafts.ts
- [x] T019 [US1] Add Save Draft action path and draftId hidden state handling in components/ideas/IdeaForm.tsx
- [x] T020 [US1] Add success/error draft feedback UI (toast/inline) in components/ideas/IdeaForm.tsx
- [x] T021 [US1] Wire new idea page to support draft save callback state in app/(protected)/ideas/new/page.tsx

**Checkpoint**: P1 draft save/update flow is fully functional and independently testable.

---

## Phase 4: User Story 2 - View Drafts in Dashboard (Priority: P2)

**Goal**: Submitters can see only their own drafts in the dashboard with clear summary metadata.

**Independent Test**: Seed drafts for multiple users and verify dashboard shows only current submitter drafts plus correct empty state.

### Tests for User Story 2

- [x] T022 [P] [US2] Add integration tests for getMyIdeaDraftsAction owner-only listing and sort order in tests/integration/ideas/draft-actions.test.ts
- [x] T023 [P] [US2] Add component tests for draft list render, metadata display, and empty state in components/ideas/DraftList.test.tsx
- [x] T024 [P] [US2] Add E2E checks for dashboard draft visibility boundaries in tests/e2e/idea-draft-flow.spec.ts

### Implementation for User Story 2

- [x] T025 [US2] Implement getMyIdeaDraftsAction summary query in actions/idea-drafts.ts
- [x] T026 [US2] Implement DraftList component with continue links and summary rows in components/ideas/DraftList.tsx
- [x] T027 [US2] Integrate draft list section and empty/error states in app/(protected)/dashboard/page.tsx
- [x] T028 [US2] Add dashboard-access guard to ensure admin users do not receive draft data in actions/idea-drafts.ts

**Checkpoint**: P2 dashboard draft listing works and remains owner-scoped.

---

## Phase 5: User Story 3 - Resume Draft Editing (Priority: P3)

**Goal**: Submitters can continue a draft from dashboard, submit successfully, and have the draft removed atomically.

**Independent Test**: Open draft from dashboard, verify prefilled form, submit successfully, and confirm draft disappears from dashboard.

### Tests for User Story 3

- [x] T029 [P] [US3] Add integration tests for getIdeaDraftDetailAction owner access and not-found handling in tests/integration/ideas/draft-actions.test.ts
- [x] T030 [P] [US3] Add integration tests for submitIdeaAction draft conversion and transactional draft deletion in tests/integration/ideas/submit-draft.test.ts
- [x] T031 [P] [US3] Add E2E resume-to-submit flow validation in tests/e2e/idea-draft-flow.spec.ts

### Implementation for User Story 3

- [x] T032 [US3] Implement getIdeaDraftDetailAction with draft attachments and dynamic fields in actions/idea-drafts.ts
- [x] T033 [US3] Load draft context by query parameter and prefill form values in app/(protected)/ideas/new/page.tsx
- [x] T034 [US3] Extend IdeaForm draft state hydration for resumed edits in components/ideas/IdeaForm.tsx
- [x] T035 [US3] Extend submitIdeaAction to accept draftId, verify ownership, and convert draft into submitted records in actions/ideas.ts
- [x] T036 [US3] Delete source draft rows atomically after successful submit in actions/ideas.ts
- [x] T037 [US3] Ensure post-submit redirect/refresh removes converted draft from dashboard in app/(protected)/ideas/new/page.tsx

**Checkpoint**: P3 resume flow is complete, and successful submission removes the draft record.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation sync, and release readiness.

- [x] T038 [P] Add regression tests for cross-user/admin draft access denial in tests/integration/ideas/draft-actions.test.ts
- [x] T039 [P] Add accessibility checks for draft controls and keyboard flow in components/ideas/IdeaForm.test.tsx and components/ideas/DraftList.test.tsx
- [x] T040 [P] Update draft action contract details in specs/005-idea-draft-management/contracts/server-actions.md
- [x] T041 [P] Update finalized schema/relationship notes in specs/005-idea-draft-management/data-model.md
- [x] T042 [P] Update execution and verification steps in specs/005-idea-draft-management/quickstart.md
- [x] T043 Run feature validation commands (`npm run type-check`, `npm run lint`, `npm run test`) and record results in specs/005-idea-draft-management/quickstart.md
- [x] T044 Create PR summary with completed task IDs and merge-gate evidence in specs/005-idea-draft-management/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies, starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion and blocks all story work.
- **Phase 3 (US1)**: Depends on Phase 2 completion; delivers MVP draft save capability.
- **Phase 4 (US2)**: Depends on Phase 2 completion; can run in parallel with late US1 work once draft actions exist.
- **Phase 5 (US3)**: Depends on Phase 2 completion and consumes US1 draft-save outputs.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after foundational phase; no dependency on other stories.
- **US2 (P2)**: Starts after foundational phase; functionally benefits from US1 but remains independently testable with seeded drafts.
- **US3 (P3)**: Starts after US1 persistence paths are available because resume requires existing drafts.

### Within Each User Story

- Tests are authored before implementation and expected to fail first.
- Action contract and validation logic are implemented before UI integration.
- Persistence and authorization checks are completed before end-to-end wiring.

## Parallel Opportunities

- Setup tasks T002-T006 can run in parallel.
- Foundational tasks T009-T012 can run in parallel after schema/migration tasks T007-T008.
- US1 tests T013-T015 can run in parallel.
- US2 tests T022-T024 can run in parallel.
- US3 tests T029-T031 can run in parallel.
- Polish tasks T038-T042 can run in parallel.

## Parallel Example: User Story 2

```bash
# Parallel test work for dashboard draft visibility
Task T022: tests/integration/ideas/draft-actions.test.ts
Task T023: components/ideas/DraftList.test.tsx
Task T024: tests/e2e/idea-draft-flow.spec.ts
```

## Parallel Example: User Story 3

```bash
# Parallel resume and submit-conversion verification
Task T029: tests/integration/ideas/draft-actions.test.ts
Task T030: tests/integration/ideas/submit-draft.test.ts
Task T031: tests/e2e/idea-draft-flow.spec.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate save/update draft behavior independently.
4. Demo MVP before extending to dashboard/resume features.

### Incremental Delivery

1. Deliver US1 draft save/update.
2. Deliver US2 dashboard visibility.
3. Deliver US3 resume-and-submit conversion.
4. Finish polish and PR evidence.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Then split:
   - Engineer A: US1 action + form save workflow.
   - Engineer B: US2 dashboard listing UI + list action.
   - Engineer C: US3 resume submission conversion + integration tests.

## Notes

- `[P]` marks tasks that can run without dependency/file conflicts.
- `[USx]` labels map tasks to individual user stories.
- Each task includes concrete file path(s) and is ready for direct implementation.
- Commit after each distinct completed task or inseparable task cluster.
- Merge to `main` only after explicit final user approval and PR gate checks.

---

## PR Summary (T044)

**Feature**: Idea Draft Management (005)  
**Completed tasks**: T001–T044 (all 44 tasks)

### What was implemented

**Schema & Migrations**
- Added `idea_drafts`, `idea_draft_attachments`, `idea_draft_field_values` tables with cascade deletes (`lib/db/schema.ts`, `lib/db/migrations/0005_idea_drafts.sql`)

**Validation**
- Extended `lib/ideas/validation.ts` with `saveDraftSchema`, `parseDraftFormData`, and `SaveDraftInput` — all fields optional (no required constraints for drafts)
- Extended `lib/ideas/category-fields.ts` with `validateDraftDynamicFieldValues` that skips required-field enforcement

**Server Actions** (`actions/idea-drafts.ts`)
- `upsertIdeaDraftAction` — create/update draft with attachments and dynamic field values; owner-scoped
- `getMyIdeaDraftsAction` — list all drafts for the current submitter
- `getIdeaDraftDetailAction` — fetch full draft detail (attachments + field values)
- `deleteIdeaDraftAction` — remove a draft; verifies ownership
- All four actions deny admin role access with a clear error message

**UI Components**
- `components/ideas/IdeaForm.tsx` — Save Draft button (conditional on `draftAction` prop), inline attachment count validation, draft feedback state
- `components/ideas/DraftList.tsx` — accessible list (`aria-label="Your drafts"`), Continue links, empty state, formatted dates

**Page Integration**
- `app/(protected)/ideas/new/page.tsx` — reads `?draftId=` param, prefills form from draft, updates URL after first save
- `app/(protected)/dashboard/page.tsx` — renders `<DraftList>` for submitter role; admin view unchanged

**Submit Integration** (`actions/ideas.ts`)
- `submitIdeaAction` accepts optional `draftId`, verifies ownership, atomically deletes the source draft inside the same transaction

### Merge-gate evidence

| Gate | Result |
|------|--------|
| `npx vitest run` | **27 files, 171 tests — all pass** |
| `npx tsc --noEmit` (feature 005 files) | **0 errors** |
| `npx next lint` | **✔ No ESLint warnings or errors** |

> Note: 4 pre-existing TypeScript errors in feature 004 test fixtures (`attachmentName`) remain unchanged and are out of scope for this PR.
