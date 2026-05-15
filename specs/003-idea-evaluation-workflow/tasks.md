# Tasks: Idea Evaluation Workflow

**Input**: Design documents from `/specs/003-idea-evaluation-workflow/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/server-actions.md`, `quickstart.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare baseline documentation and test scaffolding used by all stories.

- [X] T001 Create ADR for append-only decision events and server-side visibility policy in `docs/adrs/adr-0010-idea-evaluation-event-log-and-visibility.md`
- [X] T002 [P] Create integration test folder and placeholder spec file in `tests/integration/ideas/.gitkeep`
- [X] T003 [P] Create E2E test placeholder for workflow in `tests/e2e/idea-evaluation-workflow.spec.ts`
- [X] T004 [P] Add task-scope test notes for this feature in `specs/003-idea-evaluation-workflow/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared data model, transition rules, and action contracts required by all user stories.

**CRITICAL**: No user story implementation starts before this phase completes.

- [X] T005 Add stage/outcome enums and current state fields to idea schema in `lib/db/schema.ts`
- [X] T006 Add immutable decision event table schema in `lib/db/schema.ts`
- [X] T007 Create migration for stage fields and decision events in `lib/db/migrations/0006_idea_evaluation_pipeline.sql`
- [X] T008 [P] Implement centralized transition guard for allowed stage moves in `lib/ideas/transitions.ts`
- [X] T009 [P] Implement Zod decision validation with mandatory comments in `lib/ideas/validation.ts`
- [X] T010 Update shared action/result and list item types for stage/outcome model in `actions/ideas.ts`

**Checkpoint**: Data model and transition/validation foundation complete.

---

## Phase 3: User Story 1 - Admin Runs 4-Stage Pipeline (Priority: P1) 🎯 MVP

**Goal**: Admin can move ideas through Stage 1 -> Stage 2 -> Stage 3 -> Stage 4 with mandatory comments and valid terminal decisions.

**Independent Test**: As admin, run full progression and rejection paths and verify invalid skip/backward transitions are rejected.

### Tests for User Story 1

- [X] T011 [P] [US1] Add integration tests for valid linear transitions and terminal outcomes in `tests/integration/ideas/decide-stage-action.test.ts`
- [X] T012 [P] [US1] Add integration tests for invalid skip/backward/terminal re-decision paths in `tests/integration/ideas/decide-stage-action-invalid.test.ts`

### Implementation for User Story 1

- [X] T013 [US1] Implement `decideIdeaStageAction` with admin authorization and transition enforcement in `actions/ideas.ts`
- [X] T014 [US1] Implement atomic write of decision event plus idea summary state update in `actions/ideas.ts`
- [X] T015 [P] [US1] Build admin decision panel for stage actions and mandatory comment input in `components/ideas/EvaluationPanel.tsx`
- [X] T016 [P] [US1] Build admin idea row with current stage/outcome and action controls in `components/ideas/AdminIdeaRow.tsx`
- [X] T017 [US1] Build admin idea management page loading admin list and decision controls in `app/(protected)/admin/ideas/page.tsx`
- [X] T018 [US1] Add component tests for decision form validation and action availability by stage in `components/ideas/EvaluationPanel.test.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Users View Audit Timeline (Priority: P2)

**Goal**: Idea cards show timeline history with role-scoped field visibility (submitter/admin see comments; others do not).

**Independent Test**: Compare timeline payload and rendered card content for submitter, admin, and other authenticated viewer.

### Tests for User Story 2

- [X] T019 [P] [US2] Add integration tests for timeline projection visibility by requester role in `tests/integration/ideas/timeline-visibility.test.ts`
- [X] T020 [P] [US2] Add integration tests for timeline ordering and submission-first event in `tests/integration/ideas/timeline-ordering.test.ts`

### Implementation for User Story 2

- [X] T021 [US2] Implement `getIdeaTimelineAction` with server-side role-based field projection in `actions/ideas.ts`
- [X] T022 [P] [US2] Implement timeline UI component attached to idea cards in `components/ideas/IdeaTimeline.tsx`
- [X] T023 [US2] Integrate timeline component into idea card row/detail rendering in `components/ideas/IdeaRow.tsx`
- [X] T024 [US2] Add tests for timeline rendering with privileged vs restricted fields in `components/ideas/IdeaTimeline.test.tsx`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Admin Maintains Decision Accountability (Priority: P3)

**Goal**: Decision history is immutable, attributable, and supports accountability reporting in admin context.

**Independent Test**: Verify recorded decision metadata remains unchanged and every event has actor/timestamp/comment.

### Tests for User Story 3

- [X] T025 [P] [US3] Add integration tests that decision events are immutable after creation in `tests/integration/ideas/decision-event-immutability.test.ts`
- [X] T026 [P] [US3] Add integration tests for actor and timestamp attribution completeness in `tests/integration/ideas/decision-attribution.test.ts`

### Implementation for User Story 3

- [X] T027 [US3] Enforce append-only behavior and block update/delete paths for decision events in `actions/ideas.ts`
- [X] T028 [US3] Add admin accountability display for deciding user and decision timestamp in `components/ideas/AdminIdeaRow.tsx`
- [X] T029 [US3] Add component tests for accountability metadata display in `components/ideas/AdminIdeaRow.test.tsx`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, quality checks, and delivery governance tasks.

- [X] T030 [P] Add E2E scenario for full 4-stage flow and visibility rule B in `tests/e2e/idea-evaluation-workflow.spec.ts`
- [X] T031 [P] Add/refresh quickstart verification steps for all smoke tests in `specs/003-idea-evaluation-workflow/quickstart.md`
- [X] T032 Run type check and capture pass/fix notes in `specs/003-idea-evaluation-workflow/quickstart.md` using `npm run type-check`
- [X] T033 Run lint and capture pass/fix notes in `specs/003-idea-evaluation-workflow/quickstart.md` using `npm run lint`
- [X] T034 Run all relevant tests and record evidence in `specs/003-idea-evaluation-workflow/quickstart.md` using `npm run test` and `npx playwright test`
- [X] T035 Create PR summary with completed task IDs and validation evidence in `specs/003-idea-evaluation-workflow/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 -> Phase 2 -> Phase 3/4/5 -> Phase 6
- User stories start only after Phase 2 is complete.
- US2 depends on US1 data/event generation paths.
- US3 depends on US1 decision event creation paths.

### User Story Dependencies

- US1 (P1): starts after foundational completion; no dependency on other stories.
- US2 (P2): starts after foundational completion; uses decision events generated by US1 flows.
- US3 (P3): starts after foundational completion; validates and surfaces accountability from same event model.

### Within Each User Story

- Tests first, then action/service logic, then UI integration, then component tests.

---

## Parallel Execution Examples

### User Story 1

- [ ] T011 [P] [US1] Add integration tests for valid linear transitions and terminal outcomes in `tests/integration/ideas/decide-stage-action.test.ts`
- [ ] T012 [P] [US1] Add integration tests for invalid skip/backward/terminal re-decision paths in `tests/integration/ideas/decide-stage-action-invalid.test.ts`
- [ ] T015 [P] [US1] Build admin decision panel for stage actions and mandatory comment input in `components/ideas/EvaluationPanel.tsx`
- [ ] T016 [P] [US1] Build admin idea row with current stage/outcome and action controls in `components/ideas/AdminIdeaRow.tsx`

### User Story 2

- [ ] T019 [P] [US2] Add integration tests for timeline projection visibility by requester role in `tests/integration/ideas/timeline-visibility.test.ts`
- [ ] T020 [P] [US2] Add integration tests for timeline ordering and submission-first event in `tests/integration/ideas/timeline-ordering.test.ts`
- [ ] T022 [P] [US2] Implement timeline UI component attached to idea cards in `components/ideas/IdeaTimeline.tsx`

### User Story 3

- [ ] T025 [P] [US3] Add integration tests that decision events are immutable after creation in `tests/integration/ideas/decision-event-immutability.test.ts`
- [ ] T026 [P] [US3] Add integration tests for actor and timestamp attribution completeness in `tests/integration/ideas/decision-attribution.test.ts`

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate admin 4-stage pipeline end-to-end.

### Incremental Delivery

1. Deliver US1 for pipeline operation.
2. Deliver US2 for timeline visibility and transparency.
3. Deliver US3 for immutability/accountability controls.
4. Execute final polish and validation.

---

## PR Summary (T035)

**Feature**: Idea Evaluation Workflow (003)  
**Completed tasks**: T001–T035 (all 35 tasks)

### What was implemented

**Schema & Migrations**
- Extended `ideas` table with `current_stage`, `current_outcome`, `is_terminal`, `reviewer_id`, `review_started_at` columns (`lib/db/schema.ts`)
- Added `idea_decision_events` append-only table with `id`, `idea_id`, `stage`, `decision_type`, `outcome`, `comment`, `decided_by_user_id`, `decided_at`, `sequence` columns and an index on `(idea_id, decided_at)` (`lib/db/migrations/0006_idea_evaluation_pipeline.sql`)

**Transition Guard & Validation**
- `lib/ideas/transitions.ts` — `resolveStageDecision()` validates all allowed stage progressions; returns `null` for invalid moves
- `lib/ideas/validation.ts` — `decideIdeaStageSchema` (mandatory comment, typed decision) and `startReviewSchema`

**Server Actions** (`actions/ideas.ts`)
- `decideIdeaStageAction` — admin-only; validates transition, atomically writes decision event + updates idea summary with optimistic concurrency check
- `getIdeaTimelineAction` — role-aware; strips `comment` and `decidedByUser` for non-submitter/non-admin viewers
- `updateIdeaDecisionEventAction` / `deleteIdeaDecisionEventAction` — both return `FORBIDDEN_APPEND_ONLY`
- `submitIdeaAction` — extended to seed initial `stage_1_triage / submitted` event on creation

**UI Components**
- `components/ideas/EvaluationPanel.tsx` — 4-stage decision panel; stage-appropriate buttons; mandatory comment field; terminal state display
- `components/ideas/AdminIdeaRow.tsx` — shows current stage/outcome and latest decision attribution
- `components/ideas/IdeaTimeline.tsx` — ordered timeline of decision events; conditionally shows comment/decidedByUser

**Page Integration**
- `components/ideas/IdeaRow.tsx` — fetches and renders `IdeaTimeline` on expand
- `app/(protected)/ideas/new/page.tsx` — `onSuccess` now always navigates to `/ideas` after submission

**ADR**
- `docs/adrs/adr-0010-idea-evaluation-event-log-and-visibility.md` — documents append-only event log and server-side visibility policy

### Merge-gate evidence

| Gate | Result |
|------|--------|
| `npx vitest run` | **34 files, 182 tests — all pass** |
| `npx tsc --noEmit` | **0 errors** |
| `npx next lint` | **0 errors** (1 pre-existing `react-hooks/exhaustive-deps` warning in IdeaForm.tsx, out of scope) |
| `npx playwright test idea-evaluation-workflow.spec.ts` | **1 passed (29.9s)** |
