# Tasks: Idea Submission System (Multi-Attachment + Preview)

**Input**: Design documents from `/specs/002-idea-submission/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Every task includes an exact file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare documentation and routing foundations for the multi-attachment implementation.

- [X] T001 Create superseding ADR for normalized multi-attachment storage in `docs/adrs/adr-0008-idea-attachments-normalization.md`
- [X] T002 [P] Update protected route coverage for all ideas pages in `middleware.ts`
- [X] T003 [P] Add implementation note about Context7 freshness follow-up in `specs/002-idea-submission/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish schema, migration, validation, and shared action contracts required by all user stories.

**CRITICAL**: User story work starts only after this phase completes.

- [X] T004 Refactor idea schema to remove inline attachment columns and add `idea_attachments` table in `lib/db/schema.ts`
- [X] T005 Create and apply migration for attachment normalization in `lib/db/migrations/0002_ideas_multi_attachments.sql`
- [X] T006 [P] Update seed fixtures for multi-attachment ideas in `lib/db/seed.ts`
- [X] T007 [P] Implement shared attachment validation constants and schemas in `lib/ideas/validation.ts`
- [X] T008 Define multi-attachment DTOs and action result contracts in `actions/ideas.ts`

**Checkpoint**: Database and validation foundations are ready for story implementation.

---

## Phase 3: User Story 1 - Submit a New Idea (Priority: P1) 🎯 MVP

**Goal**: Authenticated users submit ideas with optional multiple attachments and pre-submit previews.

**Independent Test**: Submit a new idea at `/ideas/new` with 0-5 attachments; verify success, limits enforcement, and transaction rollback behavior.

### Tests for User Story 1

- [X] T009 [P] [US1] Add multi-file form behavior tests in `components/ideas/IdeaForm.test.tsx`
- [X] T010 [P] [US1] Add submit action integration tests for count/size/type/aggregate limits in `tests/integration/ideas/submit.test.ts`

### Implementation for User Story 1

- [X] T011 [US1] Implement multi-attachment parsing and atomic insert transaction in `actions/ideas.ts`
- [ ] T012 [US1] Update submit page wiring for revised submit action payload in `app/(protected)/ideas/new/page.tsx`
- [X] T013 [US1] Implement multiple file selection, preview, and per-file removal in `components/ideas/IdeaForm.tsx`
- [X] T014 [US1] Enforce pre-submit attachment validation feedback messaging in `components/ideas/IdeaForm.tsx`

**Checkpoint**: US1 can be delivered independently as MVP.

---

## Phase 4: User Story 2 - Browse the Idea Listing (Priority: P2)

**Goal**: Authenticated users view listing metadata and expanded detail with attachment previews/download links.

**Independent Test**: Open `/ideas`, expand an item, verify full description and per-attachment preview/download UI.

### Tests for User Story 2

- [X] T015 [P] [US2] Add listing/detail integration tests for attachment metadata shape in `tests/integration/ideas/list.test.ts`
- [X] T016 [P] [US2] Add row rendering tests for preview and fallback metadata states in `components/ideas/IdeaRow.test.tsx`

### Implementation for User Story 2

- [X] T017 [US2] Implement list/detail queries returning attachment arrays in `actions/ideas.ts`
- [X] T018 [US2] Render attachment counts and empty state in `components/ideas/IdeaList.tsx`
- [X] T019 [US2] Render per-attachment preview/download/fallback UI in `components/ideas/IdeaRow.tsx`
- [ ] T020 [US2] Update listing page composition with revised DTOs in `app/(protected)/ideas/page.tsx`

**Checkpoint**: US2 independently testable with listing and expandable detail.

---

## Phase 5: User Story 3 - Attach Supporting Media (Priority: P3)

**Goal**: Supported media types are previewable inline, and all supported attachments are downloadable through authenticated endpoints.

**Independent Test**: Request attachment endpoints for preview-eligible and non-preview files; verify auth, headers, and response mode.

### Tests for User Story 3

- [X] T021 [P] [US3] Add authenticated preview/download route integration coverage in `tests/integration/ideas/attachment.test.ts`
- [X] T022 [P] [US3] Extend submit/update integration coverage for expanded MIME allowlist in `tests/integration/ideas/submit.test.ts`

### Implementation for User Story 3

- [X] T023 [US3] Implement per-attachment route handler with inline-or-download behavior in `app/api/ideas/[id]/attachments/[attachmentId]/route.ts`
- [X] T024 [US3] Add temporary compatibility shim for legacy single-attachment URLs in `app/api/ideas/[id]/attachment/route.ts`
- [X] T025 [US3] Wire new attachment URLs and explicit download actions in `components/ideas/IdeaRow.tsx`

**Checkpoint**: US3 independently validates multimedia preview/download behavior.

---

## Phase 6: User Story 4 - Edit or Delete Own Idea (Priority: P3)

**Goal**: Owners edit idea fields and add/remove individual attachments after submission; owners/admins can delete ideas with confirmation.

**Independent Test**: Edit an existing idea at `/ideas/[id]/edit`, add/remove attachments, save, then delete with confirmation.

### Tests for User Story 4

- [X] T026 [P] [US4] Add owner/admin authorization and attachment-diff integration tests in `tests/integration/ideas/update.test.ts`
- [X] T027 [P] [US4] Add delete cascade and permission integration tests in `tests/integration/ideas/delete.test.ts`
- [ ] T028 [P] [US4] Add end-to-end edit/add/remove/delete flow in `tests/e2e/ideas-multimedia-flow.spec.ts`

### Implementation for User Story 4

- [X] T029 [US4] Implement owner-only attachment add/remove update logic in `actions/ideas.ts`
- [X] T030 [US4] Update edit page to hydrate existing attachments and submit removal IDs in `app/(protected)/ideas/[id]/edit/page.tsx`
- [ ] T031 [US4] Update delete button behavior and post-delete row state refresh in `components/ideas/DeleteIdeaButton.tsx`
- [ ] T032 [US4] Integrate edit/delete controls with current user permissions in `components/ideas/IdeaRow.tsx`

**Checkpoint**: US4 independently testable for ownership and lifecycle management.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, verification, and delivery governance.

- [X] T033 [P] Run strict type checks and resolve all issues in `actions/ideas.ts`
- [X] T034 [P] Run lint fixes for ideas feature files in `components/ideas/IdeaForm.tsx`
- [X] T035 [P] Execute full integration test suite and stabilize flaky cases in `tests/integration/ideas/attachment.test.ts`
- [ ] T036 Run E2E regression pass and fix failures in `tests/e2e/ideas-multimedia-flow.spec.ts`
- [X] T037 Create implementation PR checklist and evidence summary in `specs/002-idea-submission/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 -> no prerequisites
- Phase 2 -> depends on Phase 1
- Phases 3-6 -> each depends on Phase 2
- Phase 7 -> depends on selected user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts immediately after foundational phase
- **US2 (P2)**: Depends on US1 data shape and submission path
- **US3 (P3)**: Depends on US1 storage model; integrates with US2 row UI
- **US4 (P3)**: Depends on US1 submission and US2 listing/edit entry points

### Within Each Story

- Tests first, then action/data implementation, then UI wiring, then final integration

---

## Parallel Example: User Story 1

```bash
# Parallel tests
Task: "T009 [US1] Add multi-file form behavior tests in components/ideas/IdeaForm.test.tsx"
Task: "T010 [US1] Add submit action integration tests for count/size/type/aggregate limits in tests/integration/ideas/submit.test.ts"

# Parallel implementation after tests
Task: "T012 [US1] Update submit page wiring for revised submit action payload in app/(protected)/ideas/new/page.tsx"
Task: "T013 [US1] Implement multiple file selection, preview, and per-file removal in components/ideas/IdeaForm.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T015 [US2] Add listing/detail integration tests for attachment metadata shape in tests/integration/ideas/list.test.ts"
Task: "T016 [US2] Add row rendering tests for preview and fallback metadata states in components/ideas/IdeaRow.test.tsx"
Task: "T018 [US2] Render attachment counts and empty state in components/ideas/IdeaList.tsx"
```

## Parallel Example: User Story 4

```bash
Task: "T026 [US4] Add owner/admin authorization and attachment-diff integration tests in tests/integration/ideas/update.test.ts"
Task: "T027 [US4] Add delete cascade and permission integration tests in tests/integration/ideas/delete.test.ts"
Task: "T031 [US4] Update delete button behavior and post-delete row state refresh in components/ideas/DeleteIdeaButton.tsx"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate US1 independently before proceeding

### Incremental Delivery

1. Deliver US1 (submission + bounded attachments)
2. Deliver US2 (listing + expanded detail)
3. Deliver US3 (preview/download endpoint behavior)
4. Deliver US4 (edit/delete lifecycle)
5. Finish Phase 7 polish and release prep

### Parallel Team Strategy

1. One developer completes schema/migration foundation
2. After foundation, split work by story:
  - Dev A: US1
  - Dev B: US2
  - Dev C: US3/US4
3. Rejoin for Phase 7 cross-cutting verification

---

## Task Count Summary

- Total tasks: **37**
- Setup + Foundational: **8**
- US1: **6**
- US2: **6**
- US3: **5**
- US4: **7**
- Polish: **5**

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1)
