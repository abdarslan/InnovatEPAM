# Tasks: Global App UI System

**Input**: Design documents from `/specs/007-global-ui-ux/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Focus the current implementation phases on unit/component tasks for the app-wide visual system, page-surface hierarchy, and accessible state handling.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the app-wide theme and route-group foundations used by every story.

- [ ] T001 [P] Update global theme tokens and semantic surface variables in app/globals.css
- [ ] T002 [P] Update root document frame and shared body styling in app/layout.tsx
- [ ] T003 [P] Normalize auth route-group framing to the shared visual system in app/(auth)/layout.tsx
- [ ] T004 [P] Normalize protected route-group framing to the shared visual system in app/(protected)/layout.tsx
- [ ] T005 [P] Refresh shared layout guidance and barrel exports in components/layout/README.md and components/layout/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create reusable primitives that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 [P] Create reusable page surface framing component in components/layout/PageSurface.tsx
- [ ] T007 [P] Create reusable state surface component in components/layout/StateSurface.tsx

**Checkpoint**: Foundation ready; user story tasks can proceed.

---

## Phase 3: User Story 1 - Unified App Experience (Priority: P1) 🎯 MVP

**Goal**: Make public, auth, and protected routes feel like one product through shared theme, branding, and surface treatment.

**Independent Test**: Visit login, register, dashboard, and ideas routes and confirm typography, spacing, color hierarchy, cards, and brand presentation feel consistent.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add component tests for shared visual consistency helpers in components/layout/PageSurface.test.tsx and components/layout/StateSurface.test.tsx

### Implementation for User Story 1

- [ ] T010 [US1] Apply shared theme tokens and background treatment in app/globals.css and app/layout.tsx
- [ ] T011 [P] [US1] Align auth screens with the shared visual system in app/(auth)/layout.tsx, app/(auth)/login/page.tsx, app/(auth)/register/page.tsx, components/auth/LoginForm.tsx, and components/auth/RegisterForm.tsx
- [ ] T012 [P] [US1] Align protected shell branding and shared surfaces in app/(protected)/layout.tsx, components/layout/ProtectedShell.tsx, components/layout/AppSidebar.tsx, components/layout/AppTopbar.tsx, and components/layout/BrandHeader.tsx
- [X] T013 [P] [US1] Apply the shared visual system to core protected feature components in components/ideas/IdeaForm.tsx, components/ideas/IdeaListClient.tsx, components/ideas/AdminIdeaList.tsx, components/ideas/EvaluationPanel.tsx, and components/auth/UserTable.tsx

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Clear Page Structure Everywhere (Priority: P2)

**Goal**: Give every screen a predictable page hierarchy so users can distinguish title, content, and supporting actions quickly.

**Independent Test**: Review representative login, dashboard, list, form, and admin screens and confirm the page title, primary content, and supporting actions remain consistently framed.

### Tests for User Story 2

- [ ] T014 [P] [US2] Add component test for page surface framing in components/layout/PageSurface.test.tsx

### Implementation for User Story 2

- [ ] T017 [US2] Implement shared page surface framing in components/layout/PageSurface.tsx
- [ ] T018 [P] [US2] Adopt the shared page surface framing in representative auth and protected pages in app/(auth)/login/page.tsx, app/(auth)/register/page.tsx, app/(protected)/dashboard/page.tsx, app/(protected)/ideas/page.tsx, app/(protected)/ideas/new/page.tsx, app/(protected)/ideas/[id]/edit/page.tsx, app/(protected)/admin/dashboard/page.tsx, app/(protected)/admin/users/page.tsx, app/(protected)/admin/ideas/page.tsx, app/(protected)/admin/idea-field-rules/page.tsx, and app/(protected)/access-denied/page.tsx
- [X] T019 [P] [US2] Refactor shared list and table components to match the page surface hierarchy in components/ideas/IdeaList.tsx, components/ideas/IdeaRow.tsx, components/ideas/DraftList.tsx, components/ideas/AdminIdeaRow.tsx, components/ideas/AdminIdeaListFilter.tsx, and components/auth/UserTable.tsx
- [X] T020 [P] [US2] Update shared form and feedback components to follow the same structure in components/ideas/IdeaForm.tsx, components/ideas/RatingControl.tsx, components/ideas/StatusBadge.tsx, and components/ideas/DeleteIdeaButton.tsx

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Responsive and Accessible UI Standards (Priority: P3)

**Goal**: Ensure the whole app remains readable, keyboard-friendly, and stable across responsive breakpoints and state changes.

**Independent Test**: Resize the browser and navigate by keyboard across representative routes while checking loading, empty, and error states for visible focus, clear contrast, and no layout overlap.

### Tests for User Story 3

- [ ] T021 [P] [US3] Add component test for loading, empty, and error surfaces in components/layout/StateSurface.test.tsx

### Implementation for User Story 3

- [ ] T024 [US3] Implement shared state surface handling in components/layout/StateSurface.tsx
- [ ] T025 [P] [US3] Update route-level error and not-found pages to use the shared state surface in app/error.tsx, app/not-found.tsx, and app/(protected)/admin/ideas/error.tsx
- [X] T026 [P] [US3] Apply loading, empty, and error state patterns to key list and review experiences in components/ideas/IdeaListClient.tsx, components/ideas/DraftList.tsx, components/ideas/AdminIdeaList.tsx, components/ideas/EvaluationPanel.tsx, and components/ideas/IdeaTimeline.tsx
- [ ] T027 [P] [US3] Tighten responsive spacing, focus visibility, and keyboard affordances in components/layout/AppSidebar.tsx, components/layout/AppTopbar.tsx, components/auth/LoginForm.tsx, components/auth/RegisterForm.tsx, and components/ideas/IdeaForm.tsx

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, verification, and delivery governance.

- [X] T028 [P] Update quickstart and research notes with final validation commands and component coverage evidence in specs/007-global-ui-ux/quickstart.md and specs/007-global-ui-ux/research.md
- [X] T029 Run full quality gates for the global UI system using package.json scripts and record that integration/E2E execution is deferred for this phase
- [X] T030 [P] Record feature completion summary and validation evidence in specs/007-global-ui-ux/pr-summary.md
- [ ] T031 Create pull request with completed task IDs and request final approval in specs/007-global-ui-ux/pr-summary.md
- [ ] T032 Merge approved pull request to main via GitHub workflow after explicit user approval in specs/007-global-ui-ux/pr-summary.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user story phases.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 2; can proceed once the shared page surface primitive exists.
- **Phase 5 (US3)**: Depends on Phase 2; can proceed once the shared state surface primitive exists.
- **Phase 6 (Polish)**: Depends on completion of the desired user stories.

### User Story Dependencies

- **US1 (P1)**: Defines the MVP whole-app visual system and can be delivered first.
- **US2 (P2)**: Builds on the shared theme from US1 and the page surface primitive from Phase 2.
- **US3 (P3)**: Builds on the shared theme from US1 and the state surface primitive from Phase 2.

### Within Each User Story

- Tests are written before implementation and should fail first.
- Shared primitives before page adoption.
- Page adoption before route cleanup and polish.
- Story checkpoint before moving to the next priority.

### Parallel Opportunities

- Phase 1 tasks T001-T005 can run in parallel because they touch different route-group or documentation files.
- Phase 2 tasks T006-T007 can run in parallel.
- US1 tests T008 can run in parallel.
- US1 implementation tasks T011-T013 can run in parallel after T010.
- US2 tests T014 can run in parallel.
- US2 implementation tasks T018-T020 can run in parallel after T017.
- US3 tests T021 can run in parallel.
- US3 implementation tasks T025-T027 can run in parallel after T024.

---

## Parallel Example: User Story 1

```bash
# Parallel test tasks for US1
T008 components/layout/PageSurface.test.tsx, components/layout/StateSurface.test.tsx

# Parallel implementation tasks for US1
T011 app/(auth)/layout.tsx, app/(auth)/login/page.tsx, app/(auth)/register/page.tsx, components/auth/LoginForm.tsx, components/auth/RegisterForm.tsx
T012 app/(protected)/layout.tsx, components/layout/ProtectedShell.tsx, components/layout/AppSidebar.tsx, components/layout/AppTopbar.tsx, components/layout/BrandHeader.tsx
T013 components/ideas/IdeaForm.tsx, components/ideas/IdeaListClient.tsx, components/ideas/AdminIdeaList.tsx, components/ideas/EvaluationPanel.tsx, components/auth/UserTable.tsx
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks in Phase 3.
3. Validate the app-wide visual system across public, auth, and protected routes.
4. Demo the product-wide visual baseline before page-surface and state-surface refinements.

### Incremental Delivery

1. Deliver US1 as the shared visual system baseline.
2. Deliver US2 for consistent page hierarchy and surface framing.
3. Deliver US3 for responsive and accessible state consistency.
4. Complete polish and the PR/merge gate.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Developer A: US1 theme and brand consistency.
3. Developer B: US2 page surface hierarchy.
4. Developer C: US3 responsive and accessible state surfaces.

---

## Notes

- [P] tasks denote file-independent work suitable for parallel execution.
- [USx] labels map each task to a specific user story for traceability.
- All tasks include concrete file paths and are executable by an LLM agent.
- The whole-app scope includes public, auth, and protected routes.
- During the current implementation phases, validation stays at component scope; integration and E2E work are deferred.
- Do not merge to `main` until explicit final user approval is received.