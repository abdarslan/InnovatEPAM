# Implementation Plan: Global UI/UX Framework

**Branch**: `[007-global-ui-ux]` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-global-ui-ux/spec.md`

## Summary

Implement a consistent global shell for protected routes with a left navigation system and top bar, including responsive off-canvas behavior on tablet/mobile, strict accessibility behavior for focus management, authorization-aware nav visibility, and theme-driven visual consistency based on Aura Innovation core tokens.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+, Next.js App Router

**Primary Dependencies**: Next.js, Tailwind CSS, shadcn/ui, existing auth/session stack

**Storage**: N/A for new persistence (uses existing auth/route metadata only)

**Testing**: Vitest + React Testing Library for unit/component, Playwright for E2E shell behavior

**Target Platform**: Web (responsive desktop/tablet/mobile)

**Project Type**: Full-stack Next.js monolith (UI-heavy feature scope)

**Performance Goals**:
- Navigation shell renders without blocking page content loads
- No observable top-bar layout shift for reserved search placeholder footprint across breakpoint changes

**Constraints**:
- Tailwind utility classes only
- shadcn/ui-first composition
- WCAG AA contrast and keyboard behavior compliance
- No new dependencies unless justified and documented

**Scale/Scope**:
- All protected routes using shared shell layout
- Sidebar/top bar global elements only
- Excludes route-specific page redesign

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Clean Code** — Layout, nav filtering, and accessibility control flows will remain isolated and composable.
- [x] **II. Global Theme-Driven UI/UX** — Core tokens and shell hierarchy are explicitly defined and enforced in spec requirements.
- [x] **III. Minimal Dependencies** — No new package is required; implementation uses existing stack.
- [x] **III.a Documentation Freshness** — No new critical dependency/API adoption planned in this feature.
- [x] **IV. Accessibility** — Explicit keyboard/focus requirements captured (focus enter/trap/escape/return).
- [x] **V. Error Handling** — Fallback behavior for missing logo and non-interactive placeholder behavior are specified.
- [x] **VI. ADRs** — No significant architecture deviation requiring new ADR (shell behavior stays within established Next.js layout patterns).
- [x] **VII. TypeScript Strict Mode** — No relaxation; all contracts and props to remain strictly typed.
- [x] **Testing** — Unit/component/E2E validation paths are defined for shell and responsive behavior.
- [x] **Stack** — Fully aligned with Next.js + React + Tailwind + shadcn/ui + strict TypeScript.
- [x] **Workflow Governance** — Plan is scoped for task-wise implementation and PR-before-merge workflow.

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
│   ├── global-shell-layout-contract.md
│   ├── sidebar-authorization-visibility-contract.md
│   └── topbar-placeholder-contract.md
└── tasks.md            # Created by /speckit.tasks
```

### Source Code (repository root)

```text
app/
├── (protected)/
│   └── layout.tsx                  # global shell composition point
└── globals.css                     # existing global theme surface tokens (if already defined)

components/
├── ui/                             # shared primitives
└── [global-shell]/                 # sidebar/topbar components (to be created/updated)

lib/
└── auth/                           # role/permission info consumed for nav filtering

tests/
├── integration/                    # layout/auth-visibility integration checks
└── e2e/                            # responsive shell and keyboard-flow scenarios
```

**Structure Decision**: Keep implementation within existing protected layout and shared component boundaries; no new app module needed.

## Phase 0: Research

Research was completed to resolve implementation-direction questions from clarified requirements and constitution constraints.

Output: [research.md](./research.md)

## Phase 1: Design & Contracts

Artifacts created:
- [data-model.md](./data-model.md)
- [quickstart.md](./quickstart.md)
- [contracts/global-shell-layout-contract.md](./contracts/global-shell-layout-contract.md)
- [contracts/sidebar-authorization-visibility-contract.md](./contracts/sidebar-authorization-visibility-contract.md)
- [contracts/topbar-placeholder-contract.md](./contracts/topbar-placeholder-contract.md)

Post-design constitution re-check: PASS

## Complexity Tracking

No constitution violations or complexity exceptions identified.