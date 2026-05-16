ios/ or android/
# Implementation Plan: Global App UI System

**Branch**: `[007-global-ui-ux]` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-global-ui-ux/spec.md`

## Summary

Standardize the entire application with one shared visual system across public, auth, and protected routes by extending the existing Tailwind v4 theme tokens and route-group layouts, reusing shadcn/ui and current shared layout components, and validating consistent responsive and accessible states with unit, integration, and E2E tests.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+, Next.js App Router

**Primary Dependencies**: Next.js, Tailwind CSS v4 (`@theme`), shadcn/ui, existing auth/session stack

**Storage**: N/A

**Testing**: Vitest + React Testing Library + Playwright

**Target Platform**: Web (responsive desktop/tablet/mobile)

**Project Type**: Full-stack Next.js monolith

**Performance Goals**: Consistent visual rendering without noticeable layout shift; page surfaces must remain stable across breakpoint changes

**Constraints**: Tailwind utility classes only; no new dependency; WCAG AA contrast and keyboard accessibility; no custom CSS beyond the constitution; keep UI logic isolated and composable

**Scale/Scope**: Whole application surface, including public, auth, and protected route groups

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Clean Code** — Shared UI concerns stay isolated in route-group layouts and reusable components.
- [x] **II. Global Theme-Driven UI/UX** — Tailwind-only styling, shadcn/ui, and responsive global theme usage are preserved.
- [x] **III. Minimal Dependencies** — No new dependency is needed for this feature.
- [x] **III.a Documentation Freshness** — No new critical dependency/API choice; the existing Tailwind v4 decision remains covered by ADR-0003.
- [x] **IV. Accessibility** — Text alternatives, contrast, and keyboard navigation are explicit requirements.
- [x] **V. Error Handling** — Loading, empty, and error states are part of the visual system scope.
- [x] **VI. ADRs** — ADR-0014 documents the composition decision; ADR-0003 already covers the Tailwind theme decision.
- [x] **VII. TypeScript Strict Mode** — Strict TypeScript remains required with no `any` relaxation.
- [x] **Testing** — Vitest, React Testing Library, and Playwright remain the validation stack.
- [x] **Stack** — Next.js App Router + React 18+ + Tailwind + shadcn/ui + TypeScript strict mode.
- [x] **Workflow Governance** — Plan stays within the spec/plan/tasks flow and preserves PR-before-merge governance.

**GATE STATUS**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/007-global-ui-ux/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── visual-system-contract.md
│   ├── page-surface-contract.md
│   └── accessibility-state-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── layout.tsx
├── globals.css
├── page.tsx
├── (auth)/
│   └── layout.tsx
├── (protected)/
│   └── layout.tsx
└── ...route pages...

components/
├── layout/
└── ui/

lib/
├── auth/
└── navigation/

tests/
├── integration/
└── e2e/
```

**Structure Decision**: Keep the implementation within the existing App Router layouts and shared component directories; do not introduce a parallel design-system package or new app module.

## Phase 0: Research

Output: [research.md](./research.md)

Research resolved the scope questions around shared token usage, route-group composition, and whole-app state consistency.

## Phase 1: Design & Contracts

Artifacts created:
- [data-model.md](./data-model.md)
- [quickstart.md](./quickstart.md)
- [contracts/visual-system-contract.md](./contracts/visual-system-contract.md)
- [contracts/page-surface-contract.md](./contracts/page-surface-contract.md)
- [contracts/accessibility-state-contract.md](./contracts/accessibility-state-contract.md)
- [docs/adrs/adr-0014-global-app-ui-composition.md](../../docs/adrs/adr-0014-global-app-ui-composition.md)

Post-design constitution re-check: PASS

## Complexity Tracking

No constitution violations or exceptions identified.
