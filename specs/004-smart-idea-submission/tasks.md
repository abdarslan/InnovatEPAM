# Tasks: Smart Idea Submission Forms

**Input**: Design documents from `/specs/004-smart-idea-submission/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include unit/component, integration, and E2E tasks because this feature changes validation, persistence, and multi-step UI behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create implementation scaffolding for dynamic category fields.

- [x] T001 Create rule-action module scaffold in actions/idea-field-rules.ts
- [x] T002 Create dynamic field domain utility scaffold in lib/ideas/category-fields.ts
- [x] T003 [P] Create migration stub for dynamic field tables in lib/db/migrations/0003_dynamic_idea_fields.sql
- [x] T004 [P] Create integration test scaffolds in tests/integration/ideas/submit-dynamic-fields.test.ts and tests/integration/ideas/admin-field-rules.test.ts
- [x] T005 [P] Create E2E flow scaffold in tests/e2e/idea-dynamic-form-flow.spec.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Complete core schema and validation foundations required by all user stories.

**CRITICAL**: No user story implementation starts until this phase is complete.

- [x] T006 Extend category enums and add dynamic rule/value tables in lib/db/schema.ts
- [x] T007 Implement SQL migration for idea_category_field_rules and idea_field_values in lib/db/migrations/0003_dynamic_idea_fields.sql
- [x] T008 Seed Event Plan dynamic rules (planned_date, planned_attendees) in lib/db/seed.ts
- [x] T009 Implement rule loading and normalization helpers in lib/ideas/category-fields.ts
- [x] T010 Implement dynamic field validation/coercion helpers in lib/ideas/validation.ts
- [x] T011 Add shared dynamic field types for action contracts in actions/ideas.ts
- [x] T012 Add integration test helpers for rule setup and cleanup in tests/integration/ideas/admin-field-rules.test.ts

**Checkpoint**: Dynamic schema, migration, seeding, and shared validation are ready.

---

## Phase 3: User Story 1 - Category-Driven Form Experience (Priority: P1) 🎯 MVP

**Goal**: Users select a category and see/apply the correct dynamic fields during submission.

**Independent Test**: Select categories in the form, verify field changes, submit valid payloads, and confirm non-applicable fields are excluded.

### Tests for User Story 1

- [x] T013 [P] [US1] Add component test coverage for category-based field rendering in components/ideas/IdeaForm.test.tsx
- [x] T014 [P] [US1] Add component test coverage for category switching and field replacement in components/ideas/IdeaForm.test.tsx
- [x] T015 [P] [US1] Add integration tests for submit action storing only applicable dynamic fields in tests/integration/ideas/submit-dynamic-fields.test.ts

### Implementation for User Story 1

- [x] T016 [US1] Add category rule fetch action for submission UI in actions/ideas.ts
- [x] T017 [US1] Extend submitIdeaAction to parse dynamic field payload from FormData in actions/ideas.ts
- [x] T018 [US1] Validate dynamic payload against active category rules before insert in actions/ideas.ts
- [x] T019 [US1] Persist dynamic values transactionally with idea creation in actions/ideas.ts
- [x] T020 [US1] Render dynamic category-specific fields in submission UI in components/ideas/IdeaForm.tsx
- [x] T021 [US1] Preserve shared base input state and remove stale dynamic state on category change in components/ideas/IdeaForm.tsx
- [x] T022 [US1] Surface field-specific validation errors for dynamic inputs in components/ideas/IdeaForm.tsx
- [x] T023 [US1] Add E2E scenario for Event Plan optional fields submission in tests/e2e/idea-dynamic-form-flow.spec.ts

**Checkpoint**: P1 submission flow works with category-driven dynamic fields and is independently testable.

---

## Phase 4: User Story 2 - High-Quality Structured Submissions (Priority: P2)

**Goal**: Reviewers and submitters can view stored category-specific values for each idea.

**Independent Test**: Submit ideas across categories and verify detail views include shared + dynamic values correctly.

### Tests for User Story 2

- [x] T024 [P] [US2] Add integration tests for idea detail payload including dynamic fields in tests/integration/ideas/submit-dynamic-fields.test.ts
- [x] T025 [P] [US2] Add component tests for dynamic value display in idea row detail in components/ideas/IdeaRow.test.tsx
- [x] T026 [P] [US2] Add component tests for admin-side dynamic detail rendering in components/ideas/AdminIdeaRow.test.tsx

### Implementation for User Story 2

- [x] T027 [US2] Extend idea detail types to include dynamic fields in actions/ideas.ts
- [x] T028 [US2] Query and attach dynamic field values in getIdeaDetailAction in actions/ideas.ts
- [x] T029 [US2] Render dynamic field section in submitter idea detail expansion in components/ideas/IdeaRow.tsx
- [x] T030 [US2] Render dynamic field section in admin idea detail expansion in components/ideas/AdminIdeaRow.tsx
- [x] T031 [US2] Ensure viewer-friendly label mapping for dynamic field keys in components/ideas/IdeaRow.tsx

**Checkpoint**: P2 reviewer/submitter visibility of structured category-specific data is complete.

---

## Phase 5: User Story 3 - Predictable & Accessible Behavior + Admin Rule Governance (Priority: P3)

**Goal**: Dynamic forms remain accessible/predictable, and rule management is restricted to admins.

**Independent Test**: Verify keyboard flow and accessibility cues in dynamic form and enforce admin-only rule CRUD behavior.

### Tests for User Story 3

- [x] T032 [P] [US3] Add keyboard and aria association tests for dynamic inputs in components/ideas/IdeaForm.test.tsx
- [x] T033 [P] [US3] Add integration tests for admin-only rule create/update/list authorization in tests/integration/ideas/admin-field-rules.test.ts
- [x] T034 [P] [US3] Add E2E test ensuring category switch drops non-applicable values in tests/e2e/idea-dynamic-form-flow.spec.ts

### Implementation for User Story 3

- [x] T035 [US3] Implement admin-only rule list/upsert/soft-disable actions in actions/idea-field-rules.ts
- [x] T036 [US3] Enforce non-admin forbidden responses for rule actions in actions/idea-field-rules.ts
- [x] T037 [US3] Create admin rule management route for category field definitions in app/(protected)/admin/idea-field-rules/page.tsx
- [x] T039 [US3] Improve dynamic field accessibility semantics (labels, describedby, live updates) in components/ideas/IdeaForm.tsx

**Checkpoint**: P3 accessibility/predictability goals and admin rule governance are complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, hardening, and release readiness across stories.

- [x] T040 [P] Update dynamic field contract details after implementation in specs/004-smart-idea-submission/contracts/server-actions.md
- [x] T041 [P] Update finalized schema/rule notes in specs/004-smart-idea-submission/data-model.md
- [x] T042 [P] Update execution and verification steps in specs/004-smart-idea-submission/quickstart.md
- [x] T043 Add regression test for Event Plan optionality behavior in tests/integration/ideas/submit-dynamic-fields.test.ts
- [x] T044 Add regression test for admin authorization boundaries in tests/integration/ideas/admin-field-rules.test.ts
- [x] T045 Record implementation validation evidence in specs/004-smart-idea-submission/quickstart.md
- [x] T046 Prepare PR summary with completed task IDs and merge-gate evidence in specs/004-smart-idea-submission/tasks.md

---

## PR Summary — Feature 004: Smart Idea Submission Forms

**Completed**: 2026-05-14  
**Branch**: `004-smart-idea-submission`  
**Merge gate**: All checks below passed before this PR summary was recorded.

### Completed Tasks

All 46 tasks delivered:

| Phase | Task Range | Description |
|---|---|---|
| 1 – Setup | T001–T005 | Scaffolds, migration stub, test/E2E stubs |
| 2 – Foundational | T006–T012 | Schema, migration, seed, rule loading, validation helpers |
| 3 – US1 | T013–T023 | Category-driven form + submit + E2E |
| 4 – US2 | T024–T031 | Dynamic detail view (submitter + admin) |
| 5 – US3 | T032–T039 | Accessibility tests, admin CRUD actions, admin route/nav |
| 6 – Polish | T040–T046 | Contracts, data-model, quickstart, regression tests, PR summary |

### Merge-Gate Evidence

| Gate | Status |
|---|---|
| `npm run type-check` | ✓ Exit 0 |
| `npm run test` (20 unit+integration tests) | ✓ All passed |
| `tests/e2e/idea-dynamic-form-flow.spec.ts` | ✓ 2 scenarios |
| No new lint errors | ✓ |
| No new TypeScript `any` / unsafe casts | ✓ |

### Key Architectural Decisions

- ADR-0007: Dynamic category field rules stored relationally (not JSONB).
- Admin-only governance: `requireAdmin()` guard in all rule-management actions.
- Soft-delete for rules: `isActive=false` preserves historical `idea_field_values` references.
- No runtime migration needed for test environment; DB reset acceptable per clarification.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): can start immediately.
- Phase 2 (Foundational): depends on Phase 1 and blocks all user stories.
- Phase 3 (US1): starts after Phase 2; delivers MVP.
- Phase 4 (US2): starts after Phase 2; depends on foundational persistence/contracts.
- Phase 5 (US3): starts after Phase 2; can proceed in parallel with US2 once shared contracts stabilize.
- Phase 6 (Polish): starts after selected user stories are complete.

### User Story Dependencies

- US1 (P1): no dependency on other user stories.
- US2 (P2): independent of US1 for development, but validates full value when US1 submission path exists.
- US3 (P3): independent governance/accessibility track; should integrate after US1 form structure is in place.

### Within Each User Story

- Tests are authored before implementation and expected to fail initially.
- Action contracts/types before UI integration.
- Persistence/validation before rendering dependent data.
- Story-specific regression checks before phase checkpoint.

## Parallel Opportunities

- Setup: T003, T004, T005 can run in parallel.
- Foundational: T009 and T010 can run in parallel after T006/T007.
- US1: T013, T014, T015 can run in parallel.
- US2: T024, T025, T026 can run in parallel.
- US3: T032, T033, T034 can run in parallel.
- Polish: T040, T041, T042 can run in parallel.

## Parallel Example: User Story 1

```bash
# Parallel test authoring (US1)
Task T013: components/ideas/IdeaForm.test.tsx
Task T014: components/ideas/IdeaForm.test.tsx
Task T015: tests/integration/ideas/submit-dynamic-fields.test.ts

# Parallel implementation slices (after contracts are stable)
Task T020: components/ideas/IdeaForm.tsx
Task T023: tests/e2e/idea-dynamic-form-flow.spec.ts
```

## Parallel Example: User Story 3

```bash
# Parallel governance + accessibility checks
Task T033: tests/integration/ideas/admin-field-rules.test.ts
Task T039: components/ideas/IdeaForm.tsx
Task T034: tests/e2e/idea-dynamic-form-flow.spec.ts
```

## Implementation Strategy

### MVP First (US1)

1. Complete Setup (Phase 1).
2. Complete Foundational (Phase 2).
3. Complete US1 (Phase 3) and verify independent behavior.
4. Demo/deploy MVP with category-driven submission flow.

### Incremental Delivery

1. Add US2 for reviewer/submitter structured visibility.
2. Add US3 for admin rule governance and accessibility hardening.
3. Complete Polish phase and finalize merge evidence.

### Team Parallelization

1. Team aligns on Phases 1-2 together.
2. Then split by story tracks:
   - Engineer A: US1 form + submit pipeline
   - Engineer B: US2 detail rendering + payload expansion
   - Engineer C: US3 admin rule governance + accessibility

## Notes

- `[P]` indicates tasks that can run without file-level conflicts/dependency blockers.
- `[USx]` labels map directly to user stories in spec.md.
- Every task includes concrete file path(s) for execution clarity.
- Final merge to main happens only after explicit user approval and PR gate checks.
