# Tasks: Global UI/UX Framework

**Input**: Design documents from `/specs/007-global-ui-ux/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Include unit/component, integration, and E2E tasks for shell behavior, accessibility, and responsive layout contracts.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared files and feature scaffolding used by all user stories.

- [X] T001 Create global shell component directory and barrel exports in components/layout/index.ts
- [X] T002 Create global navigation config scaffold in lib/navigation/global-nav.ts
- [X] T003 [P] Create navigation and shell contract types in lib/navigation/types.ts
- [X] T004 [P] Create shell-focused test directories and placeholders in tests/integration/global-shell/README.md and tests/e2e/global-shell/README.md
- [X] T005 [P] Add feature README for implementation conventions in components/layout/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core shell primitives that all stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Implement authorization filter utility for navigation items in lib/auth/navigation-permissions.ts
- [X] T007 [P] Implement responsive shell mode utility in lib/navigation/shell-viewport-mode.ts
- [X] T008 [P] Implement off-canvas state and focus-session hook in components/layout/useOffCanvasNavigation.ts
- [X] T009 Create base AppSidebar component skeleton in components/layout/AppSidebar.tsx
- [X] T010 Create base AppTopbar component skeleton in components/layout/AppTopbar.tsx
- [X] T011 Integrate new shell composition into protected layout in app/(protected)/layout.tsx
- [X] T012 Create reusable brand header component with explicit fallback API in components/layout/BrandHeader.tsx

**Checkpoint**: Foundation ready; user story tasks can proceed.

---

## Phase 3: User Story 1 - Global Navigation Shell (Priority: P1) 🎯 MVP

**Goal**: Deliver persistent top bar + left navigation with responsive off-canvas behavior and authorization-aware destination visibility.

**Independent Test**: Log in as admin and non-admin users, navigate protected routes on desktop and mobile widths, confirm shell presence, authorized-only links, active-state indication, and keyboard drawer behavior.

### Tests for User Story 1

- [X] T013 [P] [US1] Add component tests for authorized-only sidebar rendering in components/layout/AppSidebar.test.tsx
- [X] T014 [P] [US1] Add component tests for active route indicator behavior in components/layout/NavigationItems.test.tsx
- [X] T015 [P] [US1] Add integration test for protected layout shell persistence in tests/integration/global-shell/protected-layout-shell.test.tsx
- [X] T016 [P] [US1] Add E2E test for responsive off-canvas toggle and route navigation in tests/e2e/global-shell/global-shell-responsive.spec.ts
- [X] T017 [P] [US1] Add E2E keyboard accessibility test for drawer focus lifecycle in tests/e2e/global-shell/global-shell-a11y.spec.ts

### Implementation for User Story 1

- [X] T018 [US1] Implement navigation item rendering and active-state mapping in components/layout/NavigationItems.tsx
- [X] T019 [US1] Implement authorization-aware nav filtering flow in lib/navigation/global-nav.ts and lib/auth/navigation-permissions.ts
- [X] T020 [US1] Implement desktop fixed sidebar and mobile/tablet off-canvas behavior in components/layout/AppSidebar.tsx
- [X] T021 [US1] Implement top-bar navigation toggle and shell controls in components/layout/AppTopbar.tsx
- [X] T022 [US1] Implement off-canvas focus enter/trap/escape/restore behavior in components/layout/useOffCanvasNavigation.ts
- [X] T023 [US1] Wire AppSidebar and AppTopbar into protected layout with route-stable shell frame in app/(protected)/layout.tsx

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Cohesive Visual Foundation (Priority: P2)

**Goal**: Enforce global shell visual consistency with core Aura tokens, typography rules, and robust brand header fallback behavior.

**Independent Test**: Verify shell color/typography roles and brand header behavior across protected routes and breakpoints, including missing logo fallback and long app name handling.

### Tests for User Story 2

- [X] T024 [P] [US2] Add component tests for brand header fallback and long-name layout behavior in components/layout/BrandHeader.test.tsx
- [X] T025 [P] [US2] Add integration test for shell token/typography role classes in tests/integration/global-shell/global-shell-theme-contract.test.tsx
- [X] T026 [P] [US2] Add E2E theme consistency smoke test in tests/e2e/global-shell/global-shell-theme.spec.ts

### Implementation for User Story 2

- [X] T027 [US2] Apply core Aura token variables and semantic shell mappings in app/globals.css
- [X] T028 [US2] Apply token-driven shell classes and motion states in components/layout/AppSidebar.tsx and components/layout/AppTopbar.tsx
- [X] T029 [US2] Implement brand logo fallback and resilient text rendering in components/layout/BrandHeader.tsx
- [X] T030 [US2] Add WCAG-focused visible focus and contrast-safe states in components/layout/AppSidebar.tsx and components/layout/AppTopbar.tsx

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Future-Ready Header Space (Priority: P3)

**Goal**: Provide a non-interactive top-bar placeholder with stable alignment and minimum footprint across responsive tiers.

**Independent Test**: Resize viewport and navigate across protected routes to verify placeholder remains non-interactive, aligned, and layout-stable with no adjacent control shift.

### Tests for User Story 3

- [X] T031 [P] [US3] Add component tests for non-interactive placeholder semantics in components/layout/SearchPlaceholder.test.tsx
- [X] T032 [P] [US3] Add integration test for placeholder footprint contract by breakpoint in tests/integration/global-shell/topbar-placeholder-contract.test.tsx
- [X] T033 [P] [US3] Add E2E layout-shift regression test for top-bar placeholder in tests/e2e/global-shell/global-shell-placeholder.spec.ts

### Implementation for User Story 3

- [X] T034 [US3] Implement reserved placeholder component with breakpoint min-width contract in components/layout/SearchPlaceholder.tsx
- [X] T035 [US3] Integrate placeholder alignment slot into top bar composition in components/layout/AppTopbar.tsx
- [X] T036 [US3] Ensure placeholder cannot receive focus or interactions in components/layout/SearchPlaceholder.tsx

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, verification, and delivery governance.

- [X] T037 [P] Update feature quickstart with final verification commands and evidence in specs/007-global-ui-ux/quickstart.md
- [X] T038 Run full quality gates for feature scope using package.json scripts and Playwright config in package.json and playwright.config.ts
- [X] T039 [P] Record feature completion summary and validation evidence in specs/007-global-ui-ux/pr-summary.md
- [ ] T040 Create pull request with completed task IDs and request final approval in specs/007-global-ui-ux/pr-summary.md
- [ ] T041 Merge approved pull request to main via GitHub workflow after explicit user approval in specs/007-global-ui-ux/pr-summary.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all story phases.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 2; can proceed after US1 baseline shell exists.
- **Phase 5 (US3)**: Depends on Phase 2 and top-bar composition from US1.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories; defines MVP shell behavior.
- **US2 (P2)**: Builds on shell components from US1 for token and visual consistency.
- **US3 (P3)**: Builds on top-bar structure from US1; independent of US2 logic.

### Within Each User Story

- Tests are written before implementation tasks and should fail first.
- Utilities/config before component composition.
- Component composition before layout integration.
- Story-level checkpoint before moving to next story.

### Parallel Opportunities

- Phase 1 tasks marked [P] can run in parallel.
- Phase 2 tasks T007 and T008 can run in parallel.
- US1 tests T013-T017 can run in parallel.
- US2 tests T024-T026 can run in parallel.
- US3 tests T031-T033 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Parallel test tasks for US1
T013 components/layout/AppSidebar.test.tsx
T014 components/layout/NavigationItems.test.tsx
T015 tests/integration/global-shell/protected-layout-shell.test.tsx
T016 tests/e2e/global-shell/global-shell-responsive.spec.ts
T017 tests/e2e/global-shell/global-shell-a11y.spec.ts

# Parallel implementation prep tasks for US1
T018 components/layout/NavigationItems.tsx
T019 lib/navigation/global-nav.ts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks in Phase 3.
3. Validate shell persistence, responsive drawer behavior, and authorization filtering.
4. Demo MVP before visual/theming enhancements.

### Incremental Delivery

1. Deliver US1 as functional shell baseline.
2. Deliver US2 for full visual/theme compliance.
3. Deliver US3 for future-search placeholder contract.
4. Complete polish and PR gate.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Developer A: US1 behavior and accessibility.
3. Developer B: US2 token and brand consistency.
4. Developer C: US3 placeholder contract and layout stability.

---

## Notes

- [P] tasks denote file-independent work suitable for parallel execution.
- [USx] labels map each task to a specific user story for traceability.
- All tasks include concrete file paths and are executable by an LLM agent.
- Do not merge to `main` until explicit final user approval is received.