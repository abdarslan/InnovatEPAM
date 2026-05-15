# Tasks: Anonymous Idea Evaluation with Scoring System

**Input**: Design documents from `/specs/006-anonymous-idea-scoring/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: This feature explicitly requires automated validation coverage in the specification success criteria, so unit/component/integration/E2E tests are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2])
- All task descriptions include concrete file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and test harness updates

- [X] T001 Add feature contract notes in specs/006-anonymous-idea-scoring/contracts/rating-submission-contract.md
- [X] T002 [P] Add feature contract notes in specs/006-anonymous-idea-scoring/contracts/anonymized-idea-view-contract.md
- [X] T003 [P] Add feature contract notes in specs/006-anonymous-idea-scoring/contracts/timeline-rating-view-contract.md
- [X] T004 Create test data helper for evaluation stages in tests/setup.ts
- [X] T005 [P] Create integration test file scaffold in tests/integration/anonymous-evaluation.test.ts
- [X] T006 [P] Create E2E test file scaffold in tests/e2e/anonymous-evaluation.spec.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema, domain rules, and shared utilities required by all stories

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Update idea and rating schemas in lib/db/schema.ts
- [X] T008 Create migration for ratings and timeline linkage in lib/db/migrations/0011_anonymous_idea_scoring.sql
- [X] T009 [P] Add database relation/query helpers for ratings in lib/db/index.ts
- [X] T010 Implement shared stage-rating validation utilities in lib/ideas/validation.ts
- [X] T011 [P] Add stage-to-rating-label mapping utility in lib/ideas/transitions.ts
- [X] T012 Implement immutable rating guard helper in actions/ideas.ts
- [X] T013 Add timeline rating hydration query helper in actions/ideas.ts
- [X] T014 Add role/stage anonymization helper for admin idea views in actions/ideas.ts

**Checkpoint**: Foundation complete. User stories can now be implemented.

---

## Phase 3: User Story 1 - Admin Views Anonymous Idea in Evaluation (Priority: P1) 🎯 MVP

**Goal**: Hide submitter identity in stages 2-4 while preserving usable evaluation details for admins.

**Independent Test**: Admin can open stage 2/3/4 idea views and lists without seeing submitter identity, while stage 1 still shows submitter and timeline preserves evaluator identity.

### Tests for User Story 1

- [X] T015 [P] [US1] Add server-side anonymization rule tests in tests/integration/anonymous-evaluation.test.ts
- [X] T016 [P] [US1] Add admin list anonymization UI test in components/ideas/AdminIdeaList.test.tsx
- [X] T017 [P] [US1] Add timeline identity visibility test in components/ideas/IdeaTimeline.test.tsx

### Implementation for User Story 1

- [X] T018 [US1] Apply anonymized submitter mapping in admin idea fetches in actions/ideas.ts
- [X] T019 [US1] Hide submitter fields for stage 2-4 rows in components/ideas/AdminIdeaList.tsx
- [X] T020 [US1] Hide submitter fields for stage 2-4 details in components/ideas/IdeaRow.tsx
- [X] T021 [US1] Keep evaluator attribution visible in timeline entries in components/ideas/IdeaTimeline.tsx
- [X] T022 [US1] Ensure stage 1 still shows submitter identity in components/ideas/AdminIdeaList.tsx

**Checkpoint**: US1 independently functional and testable.

---

## Phase 4: User Story 2 - Admin Rates Idea for Alignment (Priority: P1)

**Goal**: Require stage 2 alignment rating (1-5) before advancing to stage 3.

**Independent Test**: Admin at stage 2 cannot approve without alignment rating; successful submit persists immutable stage-2 rating and links it to timeline event.

### Tests for User Story 2

- [X] T023 [P] [US2] Add stage 2 rating-required validation test in tests/integration/anonymous-evaluation.test.ts
- [X] T024 [P] [US2] Add stage 2 evaluation panel behavior test in components/ideas/EvaluationPanel.test.tsx
- [X] T025 [P] [US2] Add rating control interaction test in components/ideas/RatingControl.test.tsx

### Implementation for User Story 2

- [X] T026 [US2] Create reusable rating control component in components/ideas/RatingControl.tsx
- [X] T027 [US2] Add stage 2 alignment rating input to evaluation panel in components/ideas/EvaluationPanel.tsx
- [X] T028 [US2] Persist stage 2 rating with immutability guard in actions/ideas.ts
- [X] T029 [US2] Write stage 2 timeline event with rating reference in actions/ideas.ts
- [X] T030 [US2] Update stage 2 advance action validation for required rating in actions/ideas.ts

**Checkpoint**: US2 independently functional and testable.

---

## Phase 5: User Story 3 - Admin Rates Idea for Feasibility (Priority: P1)

**Goal**: Require stage 3 feasibility rating (1-5) before advancing to stage 4.

**Independent Test**: Admin at stage 3 cannot approve without feasibility rating; successful submit persists immutable stage-3 rating and links it to timeline event.

### Tests for User Story 3

- [X] T031 [P] [US3] Add stage 3 rating-required validation test in tests/integration/anonymous-evaluation.test.ts
- [X] T032 [P] [US3] Add stage 3 evaluation panel feasibility test in components/ideas/EvaluationPanel.test.tsx
- [X] T033 [P] [US3] Add stage 3 timeline-rating association test in components/ideas/IdeaTimeline.test.tsx

### Implementation for User Story 3

- [X] T034 [US3] Add stage 3 feasibility rating flow to evaluation panel in components/ideas/EvaluationPanel.tsx
- [X] T035 [US3] Persist stage 3 feasibility rating immutably in actions/ideas.ts
- [X] T036 [US3] Write stage 3 timeline event with feasibility label in actions/ideas.ts
- [X] T037 [US3] Update stage 3 advance action validation for required rating in actions/ideas.ts

**Checkpoint**: US3 independently functional and testable.

---

## Phase 6: User Story 4 - Admin Rates Idea for Impact (Priority: P1)

**Goal**: Require stage 4 impact rating (1-5) before final completion decision.

**Independent Test**: Admin at stage 4 cannot finalize approved/rejected decision without impact rating; successful submit persists immutable stage-4 rating and final status.

### Tests for User Story 4

- [X] T038 [P] [US4] Add stage 4 rating-required finalization test in tests/integration/anonymous-evaluation.test.ts
- [X] T039 [P] [US4] Add stage 4 evaluation panel impact test in components/ideas/EvaluationPanel.test.tsx
- [X] T040 [P] [US4] Add stage 4 completion timeline event test in components/ideas/IdeaTimeline.test.tsx

### Implementation for User Story 4

- [X] T041 [US4] Add stage 4 impact rating flow to evaluation panel in components/ideas/EvaluationPanel.tsx
- [X] T042 [US4] Persist stage 4 impact rating immutably in actions/ideas.ts
- [X] T043 [US4] Enforce required impact rating for approve/reject finalization in actions/ideas.ts
- [X] T044 [US4] Apply post-finalization identity rule (approved unmask, rejected stays anonymous) in actions/ideas.ts

**Checkpoint**: US4 independently functional and testable.

---

## Phase 7: User Story 5 - User Views Final Scores on Completed Idea (Priority: P2)

**Goal**: Show Alignment/Feasibility/Impact ratings on completed ideas in list and detail views.

**Independent Test**: User viewing completed idea sees all three ratings with consistent labels and formatting on cards and detail views.

### Tests for User Story 5

- [X] T045 [P] [US5] Add completed idea score visibility integration test in tests/integration/anonymous-evaluation.test.ts
- [X] T046 [P] [US5] Add completed idea score badge rendering test in components/ideas/IdeaRow.test.tsx
- [X] T047 [P] [US5] Add completed idea list score formatting test in components/ideas/IdeaListClient.test.tsx

### Implementation for User Story 5

- [X] T048 [US5] Add completed-score summary rendering in components/ideas/IdeaRow.tsx
- [X] T049 [US5] Add completed-score summary rendering in components/ideas/IdeaListClient.tsx
- [X] T050 [US5] Add completed-score retrieval mapping in actions/ideas.ts
- [X] T051 [US5] Add status-badge adjunct for score-ready completed ideas in components/ideas/StatusBadge.tsx

**Checkpoint**: US5 independently functional and testable.

---

## Phase 8: User Story 6 - Timeline Shows Rating with Approval Actions (Priority: P2)

**Goal**: Show stage-specific rating labels/scores alongside approval timeline actions.

**Independent Test**: Timeline displays stage 2/3/4 approval entries with score labels and stage 1 entries without ratings.

### Tests for User Story 6

- [X] T052 [P] [US6] Add timeline rating label formatting integration test in tests/integration/anonymous-evaluation.test.ts
- [X] T053 [P] [US6] Add stage 1 no-rating timeline rendering test in components/ideas/IdeaTimeline.test.tsx
- [X] T054 [P] [US6] Add stage 2-4 rating timeline rendering test in components/ideas/IdeaTimeline.test.tsx

### Implementation for User Story 6

- [X] T055 [US6] Add stage label + score formatting helpers in components/ideas/IdeaTimeline.tsx
- [X] T056 [US6] Render rating details on approval timeline entries in components/ideas/IdeaTimeline.tsx
- [X] T057 [US6] Ensure stage 1 timeline entries explicitly render without rating in components/ideas/IdeaTimeline.tsx
- [X] T058 [US6] Expose timeline rating hydration from server action responses in actions/ideas.ts

**Checkpoint**: US6 independently functional and testable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening across all user stories

- [X] T059 [P] Add E2E coverage for full stage 1-4 evaluation flow in tests/e2e/anonymous-evaluation.spec.ts
- [X] T060 [P] Add accessibility checks for keyboard and labels in rating control tests in components/ideas/RatingControl.test.tsx
- [X] T061 Optimize rating/timeline query performance for dashboard list loads in actions/ideas.ts
- [X] T062 Validate quickstart scenarios against implementation in specs/006-anonymous-idea-scoring/quickstart.md
- [X] T063 Run and fix type/lint/test suite failures in package.json scripts (`npm run lint`, `npm run test`, `npm run test:e2e`)
- [X] T064 Create PR summarizing completed task IDs and validation evidence
- [ ] T065 Merge approved PR to `main` after explicit user approval via GitHub MCP tooling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories
- **Phases 3-8 (User Stories)**: Depend on Phase 2 completion
- **Phase 9 (Polish)**: Depends on completion of all targeted user stories

### User Story Dependencies

- **US1 (P1)**: Starts after foundational phase; no user-story dependency
- **US2 (P1)**: Starts after foundational phase; independent from US1
- **US3 (P1)**: Depends on foundational phase and reuses US2 rating control
- **US4 (P1)**: Depends on foundational phase and reuses US2/US3 rating flow
- **US5 (P2)**: Depends on US2-US4 rating persistence
- **US6 (P2)**: Depends on US2-US4 timeline rating linkage

### Within Each User Story

- Tests first (expected to fail before implementation)
- Data/action logic before UI wiring when both are required
- Validation before stage transition logic
- Story checkpoint validation before moving to next priority

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks T009/T011 can run after T007/T008 begin
- US1-US4 can be staffed in parallel once foundational work is done, with shared component coordination
- US5 and US6 can run in parallel after US2-US4 are complete
- Polish tasks T059/T060 can run in parallel

---

## Parallel Example: User Story 1

```text
Run in parallel:
- T015 [US1] tests/integration/anonymous-evaluation.test.ts
- T016 [US1] components/ideas/AdminIdeaList.test.tsx
- T017 [US1] components/ideas/IdeaTimeline.test.tsx
```

## Parallel Example: User Story 2

```text
Run in parallel:
- T023 [US2] tests/integration/anonymous-evaluation.test.ts
- T024 [US2] components/ideas/EvaluationPanel.test.tsx
- T025 [US2] components/ideas/RatingControl.test.tsx
```

## Parallel Example: User Story 3

```text
Run in parallel:
- T031 [US3] tests/integration/anonymous-evaluation.test.ts
- T032 [US3] components/ideas/EvaluationPanel.test.tsx
- T033 [US3] components/ideas/IdeaTimeline.test.tsx
```

## Parallel Example: User Story 4

```text
Run in parallel:
- T038 [US4] tests/integration/anonymous-evaluation.test.ts
- T039 [US4] components/ideas/EvaluationPanel.test.tsx
- T040 [US4] components/ideas/IdeaTimeline.test.tsx
```

## Parallel Example: User Story 5

```text
Run in parallel:
- T045 [US5] tests/integration/anonymous-evaluation.test.ts
- T046 [US5] components/ideas/IdeaRow.test.tsx
- T047 [US5] components/ideas/IdeaListClient.test.tsx
```

## Parallel Example: User Story 6

```text
Run in parallel:
- T052 [US6] tests/integration/anonymous-evaluation.test.ts
- T053 [US6] components/ideas/IdeaTimeline.test.tsx
- T054 [US6] components/ideas/IdeaTimeline.test.tsx
```

---

## Implementation Strategy

### MVP First (Core Anonymous Evaluation + Mandatory Ratings)

1. Complete Phase 1 and Phase 2
2. Deliver US1 (anonymity) and validate independently
3. Deliver US2-US4 (mandatory stage ratings) and validate independently
4. Demo admin workflow from stage 2 through stage 4 completion

### Incremental Delivery

1. Ship US1 (anonymous evaluation behavior)
2. Ship US2 (alignment rating)
3. Ship US3 (feasibility rating)
4. Ship US4 (impact rating + finalization rules)
5. Ship US5 (completed idea score visibility)
6. Ship US6 (timeline score visibility)

### Team Parallel Strategy

1. One developer on schema + server actions (Phase 2)
2. One developer on evaluation UI/rating controls (US2-US4)
3. One developer on read/display surfaces (US1, US5, US6)
4. Shared ownership for integration + E2E hardening in Phase 9

---

## Notes

- [P] tasks use separate files or independent test scopes
- Story labels map each task to a single user story for traceability
- Ratings are immutable once submitted (FR-010a)
- One admin evaluates each stage; no multi-admin same-stage rating
- Rejection at any stage is final; no re-evaluation loop
- Merge to `main` only after explicit user approval
