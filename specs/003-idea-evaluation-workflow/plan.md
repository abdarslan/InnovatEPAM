# Implementation Plan: Idea Evaluation Workflow

**Branch**: `003-idea-evaluation-workflow` | **Date**: 2026-05-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-idea-evaluation-workflow/spec.md`

## Summary

Implement a strict four-stage idea evaluation pipeline with mandatory decision comments, immutable audit history, and role-scoped timeline visibility. Ideas progress linearly through Stage 1 Triage, Stage 2 Department Review, Stage 3 Feasibility, and Stage 4 Final Executive Decision; rejections terminate progression at the current stage. Every transition or decision records actor identity, timestamp, stage context, and comment. Idea cards expose a timeline for all authenticated viewers, while comment text is visible only to the idea submitter and admins.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js App Router

**Primary Dependencies**: Next.js, React, Drizzle ORM, Zod, react-hook-form, shadcn/ui components already in repo

**Storage**: SQLite via Drizzle ORM

**Testing**: Vitest + React Testing Library (unit/component), integration tests under `tests/integration`, Playwright E2E under `tests/e2e`

**Target Platform**: Internal web application (desktop and mobile responsive)

**Project Type**: Monolithic full-stack web app (Next.js App Router)

**Performance Goals**: Timeline and admin list render within normal dashboard page load expectations; decision actions complete with immediate in-place UI refresh and user feedback

**Constraints**: Linear stage progression only; mandatory non-empty comments for all approvals to next stage and all rejections/final decisions; immutable audit events; server-side authorization and field visibility enforcement

**Scale/Scope**: Internal portal scale (department-level usage), per-idea event timelines, single-idea evaluation actions (no bulk processing)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Clean Code** — Plan separates transition validation, authorization checks, persistence, and presentation responsibilities.
- [x] **II. Simple UI/UX** — Timeline is attached to idea cards with clear stage/outcome labels and responsive layout.
- [x] **III. Minimal Dependencies** — No new external dependencies planned; existing stack supports requirements.
- [x] **III.a Documentation Freshness** — No critical new external dependency/API adoption in this plan; existing framework patterns remain unchanged.
- [x] **IV. Accessibility** — Timeline entries include readable text labels (not color-only), and decision metadata is text-first.
- [x] **V. Error Handling** — Invalid transitions, unauthorized access, and validation failures are explicit server-side error cases.
- [x] **VI. ADRs** — Add a new ADR documenting append-only stage decision event model and visibility policy.
- [x] **VII. TypeScript Strict Mode** — Data contracts and action payloads remain strictly typed.
- [x] **Testing** — Plan includes unit/component, integration, and E2E validation for progression and visibility rules.
- [x] **Stack** — Solution remains within Next.js + React + Tailwind + shadcn/ui + TypeScript strict.
- [x] **Workflow Governance** — Plan produces artifacts for task-scoped implementation and PR merge gate flow.

## Project Structure

### Documentation (this feature)

```text
specs/003-idea-evaluation-workflow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── server-actions.md
└── tasks.md
```

### Source Code (repository root)

```text
actions/
├── ideas.ts

app/
├── (protected)/
│   ├── admin/
│   │   └── ideas/
│   └── ideas/

components/
├── ideas/
│   ├── AdminIdeaList.tsx
│   ├── AdminIdeaRow.tsx
│   ├── IdeaRow.tsx
│   ├── IdeaListClient.tsx
│   ├── StatusBadge.tsx
│   └── EvaluationPanel.tsx

lib/
├── db/
│   ├── schema.ts
│   └── migrations/
└── ideas/
   ├── transitions.ts
   └── validation.ts

docs/
└── adrs/

tests/
├── integration/
└── e2e/
```

**Structure Decision**: Extend the existing Next.js monorepo-style single app structure. No new top-level application modules are required.

## Phase 0: Research Results

All plan uncertainties are resolved in [research.md](research.md):
- Decision event persistence pattern (append-only event table)
- Stage progression enforcement strategy (single transition guard)
- Visibility projection strategy for timeline fields (server-side projection by requester role)
- Final decision modeling at Stage 4 (terminal approval/rejection semantics)

## Phase 1: Design Outputs

- Data entities and invariants defined in [data-model.md](data-model.md)
- Action/API behavioral contracts defined in [contracts/server-actions.md](contracts/server-actions.md)
- Verification and manual test workflow defined in [quickstart.md](quickstart.md)

## Post-Design Constitution Re-Check

- [x] No constitution violations introduced by design artifacts.
- [x] No new dependency needed.
- [x] Accessibility and server-side enforcement constraints remain first-class requirements.
- [x] ADR required for event-log data design and visibility policy is identified and queued before tasks.

## Complexity Tracking

No constitution violations requiring justification.
