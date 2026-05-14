<!--
  SYNC IMPACT REPORT
  Version change: 1.2.0 → 1.3.0
  Modified principles: None
  Added sections:
    - VII. TypeScript Strict Mode (new Core Principle) [v1.2.0]
    - Testing Principles (new top-level section with 8 sub-principles) [v1.2.0]
    - Governance: Version Control and Task-Based Auto-Commit Workflow [v1.3.0]
  Removed sections: N/A
  Templates updated:
    - .specify/templates/plan-template.md ✅ (Constitution Check items added for TypeScript Strict Mode and Testing)
    - .specify/templates/tasks-template.md ✅ (Testing setup tasks added to Phase 1)
  Follow-up TODOs: None
-->

# InnovatEPAM Constitution

## Preamble

InnovatEPAM Portal is a comprehensive digital platform designed to streamline
the innovation process within EPAM, enabling employees to submit creative ideas,
facilitating expert evaluation, and managing the implementation of top-tier
innovations with dedicated budget allocation.

This constitution governs all development decisions for this platform.

## Core Principles

### I. Clean Code (NON-NEGOTIABLE)
Every unit of code MUST be readable, purposeful, and minimal.
- Functions MUST do one thing; name them after what they do, not how.
- No dead code, commented-out blocks, or redundant abstractions.
- Variables and components MUST have intention-revealing names.
- Duplication MUST be eliminated through proper abstraction, not copy-paste.
- Code complexity MUST be justified — if it cannot be explained simply, it MUST be simplified.

### II. Simple, Responsive UI/UX with Tailwind (NON-NEGOTIABLE)
Every UI component MUST be simple, responsive, and built with Tailwind CSS.
- Tailwind utility classes are the ONLY styling mechanism; no custom CSS files unless absolutely unavoidable and documented.
- Layouts MUST be mobile-first and responsive across all breakpoints (sm, md, lg, xl).
- UI MUST use shadcn/ui components as the primary component library — no reinventing primitives.
- Visual hierarchy MUST be clear; users MUST be able to accomplish tasks without instruction.
- Animations and transitions MUST serve purpose — decorative-only motion MUST be avoided.

### III. Minimal Dependencies
Every external dependency MUST be justified before adoption.
- A new dependency MUST NOT be added if native platform APIs or already-present packages cover the need.
- Transitive dependency trees MUST be kept shallow; audit with `npm audit` on every change.
- Prefer battle-tested, actively maintained packages with small bundle footprints.
- Dependencies MUST be pinned to exact versions in `package.json` lock files.

### IV. Accessibility (NON-NEGOTIABLE)
Every rendered element MUST be accessible to all users.
- All non-text content (images, icons, illustrations) MUST have a text alternative (`alt`, `aria-label`, or `title`).
- Text and interactive elements MUST meet a minimum contrast ratio of **4.5:1** (WCAG AA) against their background.
- Interactive elements MUST be keyboard-navigable and MUST have visible focus indicators.
- Semantic HTML elements MUST be preferred over generic `div`/`span` with ARIA roles.
- Screen-reader-only text MUST use the `sr-only` Tailwind utility where visual label is absent.

### V. Error Handling (NON-NEGOTIABLE)
Every operation that can fail MUST have explicit, user-facing error handling.
- All async operations (API calls, data fetching, form submissions) MUST be wrapped in try/catch or use React error boundaries.
- Errors MUST surface a clear, actionable message to the user — never a raw stack trace.
- Loading, empty, and error states MUST be designed and implemented for every data-dependent UI.
- Server-side errors MUST be logged with sufficient context for diagnosis without exposing sensitive data to clients.
- Next.js `error.tsx` and `not-found.tsx` boundary files MUST be present at every route segment that fetches data.

### VI. Architecture Decision Records
Every significant technical choice MUST be recorded before implementation begins.
- During the `/speckit.plan` phase, any significant technical decision (e.g., introducing a new framework,
  database, API pattern, or third-party service) MUST produce an `adr-XXXX-[something]-decision.md` file in `docs/adrs/`
  using the standard **MADR** (Markdown Architecture Decision Record) format.
- The ADR MUST be created before `tasks.md` is generated — it is a gate on the `/speckit.tasks` command.
- ADR filenames MUST include zero-padded four-digit sequential integers.
- Each ADR MUST include at minimum: **Title**, **Status**, **Context**, **Decision**, **Consequences**.
- ADRs are immutable once status is `Accepted`; superseding decisions MUST create a new ADR and
  set the prior ADR's status to `Superseded by adr-XXXX-[something]-decision.md`.

### VII. TypeScript Strict Mode (NON-NEGOTIABLE)
All TypeScript source MUST compile with `"strict": true` in `tsconfig.json`. No exceptions.
- The `any` type is FORBIDDEN without an inline `// eslint-disable-next-line` comment and a written
  justification in the same PR description.
- `unknown` MUST be used instead of `any` when the type is genuinely unknown at authoring time.
- `null` and `undefined` MUST be handled explicitly; optional chaining (`?.`) and nullish coalescing
  (`??`) are preferred over defensive `if` chains.
- Type inference is preferred over redundant explicit annotations; annotate only at boundaries
  (function parameters, return types, exported APIs).
- No implicit type coercions: `==` is FORBIDDEN; `===` MUST be used.

**Rationale**: TypeScript strict mode catches entire classes of runtime errors at compile time.
Weakening it trades short-term convenience for long-term instability.

## Technology Stack

This project MUST use the following stack. Deviations require an amendment to this constitution.

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Server and client components; file-based routing |
| UI Library | React 18+ | Hooks-first; no class components |
| Styling | Tailwind CSS | Utility-first; no inline styles |
| Components | shadcn/ui | Radix-based primitives; copy-into-repo pattern |
| Language | TypeScript | Strict mode enabled; no `any` without justification |

No additional UI frameworks (e.g., Material UI, Chakra, Ant Design) MUST be introduced alongside shadcn/ui.

## Testing Principles

### 1. Testing Philosophy
Testing is specification-driven engineering, not post-implementation cleanup.
Non-negotiable rules:
- TDD MUST be practiced for core business logic and reproducible bug fixes.
- Every logic change MUST move through RED → GREEN → REFACTOR.
- Tests for core submission and review logic MUST be authored before production code.
- When a specification and an implementation disagree, the test is the source of truth.

### 2. Coverage Requirements
Coverage is a design constraint, not a reporting afterthought.
Non-negotiable rules:
- The project MUST target a Testing Pyramid of approximately 70% unit/component, 20% integration,
  and 10% E2E tests.
- Unit tests MUST cover React components, utilities, business rules, and validation logic.
- Integration tests MUST cover Next.js Server Actions / API routes and SQLite-backed database
  operations.
- E2E tests MUST be limited to critical user workflows: registration, login, submission flow,
  and admin approval flow.
- Static analysis MUST include `tsc --noEmit` and `next lint` on every pull request.
- Coverage gates for core business-logic modules MUST be at least 80% line coverage.

### 3. Test Types and Organization
Test layout MUST make it obvious which layer owns each behavior.
Non-negotiable rules:
- Unit and component tests MUST live adjacent to the files they test
  (e.g., `components/ui/button.test.tsx`) or in a dedicated `__tests__` folder mirroring the
  `app/` and `lib/` directories.
- Integration tests MUST live under `tests/integration/**/*.test.ts` and focus on database
  interactions and API boundaries.
- E2E tests MUST live under `tests/e2e/**/*.spec.ts` and MUST be grouped by user journey
  (e.g., `student-submission-flow.spec.ts`).

### 4. Naming Conventions
Test naming MUST communicate scope, subject, and expected behavior.
Non-negotiable rules:
- Test files MUST use the `ComponentName.test.tsx` or `module.test.ts` pattern.
- E2E test files MUST use the `journey-name.spec.ts` pattern.
- Top-level suites MUST use `describe('ComponentName', ...)` or `describe('Feature Name', ...)`.
- Individual test cases MUST use the `it('should [expected behavior] when [condition]', ...)` pattern.

### 5. Test Anatomy
Every test MUST be readable as a small proof of behavior.
Non-negotiable rules:
- Tests MUST follow the Arrange-Act-Assert (AAA) structure.
- Each test MUST be independent and runnable in isolation.
- Shared global state is FORBIDDEN; mocks, environment variables, timers, and test database states
  MUST be reset between tests.
- Assertions MUST remain local to the behavior under test; test one primary behavior path per
  `it` block.

### 6. Mocking and Test Data
Test doubles and fixtures MUST model external behavior without hiding defects.
Non-negotiable rules:
- External services (e.g., email providers, external auth) MUST be mocked.
- Integration tests MUST verify against a real SQLite test database file, not mocked database
  drivers.
- Complex domain setup MUST use reusable helpers such as `createTestUser()` and
  `seedTestProject()` rather than copy-pasted setup logic.
- Test doubles MUST be reset between tests so state cannot leak across cases.

### 7. Quality Criteria (CRITICAL)
Every test is production-quality code.
Non-negotiable rules:
- Tests MUST assert observable behavior and user interactions, not internal React state.
- Component tests MUST interact with the DOM as a user would — finding elements by role or text,
  not by arbitrary CSS class selectors.
- Every test MUST have meaningful assertions.
- Expected values MUST be human-validated during review, especially for admin routing authorization.

### 8. Tools and Frameworks
Testing and quality tooling MUST align with the Next.js ecosystem.
Non-negotiable rules:
- Static analysis MUST use Next.js built-in ESLint (`next lint`) and TypeScript `tsc --noEmit`.
- Unit and component testing MUST use **Vitest** (or Jest configured for Next.js) alongside
  **React Testing Library**.
- The assertion library is standard Vitest/Jest `expect`.
- E2E testing MUST run on **Playwright** against a built Next.js application.
- Required execution commands:
  - Type check: `npm run type-check`
  - Lint: `npm run lint`
  - Unit/component tests: `npm run test`
  - E2E tests: `npx playwright test`
- CI/CD for `main` MUST execute type checks, linting, and all tests as merge gates.

## Accessibility Standards

Minimum compliance target: **WCAG 2.1 Level AA**.

- Contrast ratio for normal text: **≥ 4.5:1**
- Contrast ratio for large text (18pt / 14pt bold): **≥ 3:1**
- All form inputs MUST have associated `<label>` elements.
- Focus order MUST follow a logical DOM sequence.
- Dynamic content changes MUST announce via `aria-live` regions where appropriate.
- Accessibility MUST be validated in CI using automated tooling (e.g., axe-core) and supplemented by manual keyboard testing.

## Governance

This constitution supersedes all informal conventions and individual preferences.

- **Amendments** require a documented rationale, an incremented version number per semantic versioning rules, and a propagation review across all templates.
- **MAJOR** bump: Removal or redefinition of a non-negotiable principle.
- **MINOR** bump: New principle, new mandatory section, or material stack change.
- **PATCH** bump: Wording clarification, typo fix, non-semantic refinement.
- All pull requests MUST include a Constitution Check confirming no principle is violated.
- Complexity MUST be justified in PR description; unexplained complexity is grounds for rejection.
- Ratified principles are binding from the moment they appear in this file at version ≥ 1.0.0.

## Version Control and Task-Based Auto-Commit Workflow

Every Speckit command boundary and every completed implementation task is a save point.
Commits MUST be created automatically at these transitions so the repository always reflects
a coherent, reviewable snapshot.

### 1. Commit Triggers and Scope

| Trigger point | When it fires | Commit scope |
|---|---|---|
| **After `/speckit.constitution`** | Constitution written or amended | Updated `constitution.md` |
| **Before `/speckit.specify`** | Feature branch created | Outstanding changes on prior branch |
| **Before `/speckit.plan`** | Specification finalized | Specs and clarification docs |
| **After `/speckit.tasks`** | Task list generated | Task checklist markdown file |
| **During `/speckit.implement`** | **After EVERY completed checklist item** | The specific code and tests for that single task |
| **After `/speckit.implement`** | Entire feature completed | Final cleanup and integration tweaks |

### 2. Hook Bypassing Rules (The Safety Valve)

To prevent git hooks from blocking documentation phases while still protecting the Next.js build:

- Auto-commits generated during planning phases (`constitution`, `specify`, `clarify`, `plan`,
  `tasks`) MAY bypass strict pre-commit hooks (`--no-verify` is allowed) because they primarily
  modify markdown files.
- Auto-commits generated during or after `/speckit.implement` MUST NOT bypass pre-commit hooks.
  Every task-based code commit MUST successfully pass `next lint`, `tsc --noEmit`, and the
  relevant Vitest suite.

### 3. Non-Negotiable Workflow Rules

- **Strict Branching**: A feature branch (e.g., `feature/student-submission`) MUST be created
  before `/speckit.specify` runs. Committing directly to `main` is FORBIDDEN.
- **Granular Implementation**: During the implementation phase, you MUST pause and commit after
  completing each individual task on the generated task list. Do not write the entire feature in
  one go.
- **Commit Naming**: Commit messages MUST follow conventional commit patterns and reference the
  phase or task:
  - Planning: `docs(speckit): generate implementation plan for [feature]`
  - Implementation: `feat([feature]): implement [specific task name from checklist]`
  - Testing: `test([feature]): add Vitest coverage for [specific task]`
- **No Empty Commits**: If the working tree is clean at a trigger point, the auto-commit MUST be
  skipped silently.

**Rationale**: Atomic, task-aligned commits ensure the Next.js build is never broken by a massive
code dump. It makes every step independently reviewable, simplifies bisect debugging and ensures safe rollback points if a specific UI component or Server Action goes off the
rails during implementation.

**Version**: 1.3.0 | **Ratified**: 2026-05-14 | **Last Amended**: 2026-05-14
