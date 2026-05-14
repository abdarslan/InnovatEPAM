# Implementation Plan: Idea Evaluation Workflow

**Branch**: `003-idea-evaluation-workflow` | **Date**: 2026-05-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-idea-evaluation-workflow/spec.md`

## Summary

Implement a status-tracked idea evaluation workflow for InnovatEPAM. Ideas move through a strict linear state machine: Submitted → Under Review → Accepted | Rejected. A new dedicated `app/(protected)/admin/ideas` route gives admin users the ability to start review, accept, or reject ideas with optional/required comments. The submitter of an idea can see the evaluation comment; all other authenticated users see only the status badge. Status is stored as an enum column on the `ideas` table (database-level default: "submitted"); evaluation decisions are stored in a new `idea_evaluations` table (1:0..1 with ideas). All transitions are enforced server-side via Zod validation + explicit allowlist; the UI responds with in-place row updates and toast notifications. No new external npm dependencies required — shadcn/ui Badge + Toast are added via the copy-into-repo pattern.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)

**Primary Dependencies**: Next.js 15 (App Router), React 19, Drizzle ORM 0.45, Zod 4, react-hook-form 7, shadcn/ui (Badge, Toast/Toaster), iron-session 8

**Storage**: SQLite via better-sqlite3 + Drizzle ORM; `ideas` table extended with `status` + audit columns; new `idea_evaluations` table for final decisions

**Testing**: Vitest + React Testing Library (unit/component); Playwright (E2E); integration tests against real SQLite test DB

**Target Platform**: Next.js web application (Node.js server; browser client)

**Project Type**: Web application (full-stack Next.js) — extends existing feature 002

**Performance Goals**: Status transition completes in < 2 s; admin listing loads in < 2 s; in-place row update without full page reload (FR-019)

**Constraints**: No new external npm dependencies without documented justification; WCAG 2.1 AA (FR-021); TypeScript strict mode; Tailwind-only styling; server-side transition enforcement (FR-014); comment immutability (FR-017)

**Scale/Scope**: Small internal team (< 100 users); no pagination; single SQLite DB file; v1 single-evaluation per idea

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Clean Code** — Server actions are single-purpose (`startReviewAction`, `evaluateIdeaAction`); `validateTransition()` in `lib/ideas/transitions.ts` is a single-purpose guard; components named by role (StatusBadge, EvaluationPanel, AdminIdeaRow); no dead code.
- [x] **II. Simple UI/UX** — Tailwind-only styling; shadcn/ui Badge + Toast used via copy-into-repo pattern; filter UI uses a select dropdown; mobile-first layout follows existing admin dashboard conventions.
- [x] **III. Minimal Dependencies** — No new npm packages. shadcn/ui Badge and Toast components are added using the copy-into-repo pattern (managed by shadcn CLI, no additional npm entries).
- [x] **III.a Documentation Freshness** — Drizzle ORM `ALTER TABLE` / migration pattern and shadcn/ui Badge + Toast API verified against project-installed versions (drizzle-orm 0.45, Next.js 15). No new external API choices introduced.
- [x] **IV. Accessibility** — StatusBadge renders text label inside colored pill (FR-021, WCAG 1.4.1); Toast has `aria-live` region; EvaluationPanel form controls have associated `<label>` elements; comment textarea has `aria-describedby` for validation errors; contrast enforced via shadcn theme.
- [x] **V. Error Handling** — All 3 new server actions have explicit try/catch + `{ ok: false, error }` returns; admin listing and evaluation form have loading/empty/error states; delete action updated to check Under Review status (FR-022).
- [x] **VI. ADRs** — ADR-0006 (separate `idea_evaluations` table vs. inline columns on `ideas`) created before `tasks.md` generation.
- [x] **VII. TypeScript Strict Mode** — `"strict": true` already in `tsconfig.json`; all new Drizzle types inferred; no `any`; `===` throughout; transition validator uses exhaustive switch.
- [x] **Testing** — Vitest + RTL for unit/component (StatusBadge, EvaluationPanel, AdminIdeaRow); integration tests in `tests/integration/ideas/`; Playwright E2E for admin evaluation journey; CI gates confirmed.
- [x] **Stack** — Next.js 15 App Router + React 19 + Tailwind CSS 4 + shadcn/ui + TypeScript strict.
- [x] **Workflow Governance** — Task-scoped commits planned; PR-before-merge gate to `main` required.

**Violations requiring justification**: None.

## Project Structure

### Documentation (this feature)

```text
specs/003-idea-evaluation-workflow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── server-actions.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
actions/
└── ideas.ts             # EXTEND: startReviewAction, evaluateIdeaAction, getAdminIdeasAction
                         # MODIFY: getIdeasAction (add status), deleteIdeaAction (block Under Review)

app/
└── (protected)/
    └── admin/
        └── ideas/
            └── page.tsx       # NEW: Admin idea management with status filter (FR-013, FR-015)

components/
└── ideas/
    ├── StatusBadge.tsx          # NEW: accessible colored pill (FR-021)
    ├── StatusBadge.test.tsx
    ├── EvaluationPanel.tsx      # NEW: Start Review / Accept / Reject form (FR-003–FR-008)
    ├── EvaluationPanel.test.tsx
    ├── AdminIdeaRow.tsx         # NEW: row with inline evaluation actions + in-place update (FR-019)
    ├── AdminIdeaRow.test.tsx
    ├── AdminIdeaList.tsx        # NEW: admin listing with status filter dropdown (FR-015)
    └── IdeaRow.tsx              # MODIFY: add StatusBadge display (FR-011)

components/
└── ui/
    ├── badge.tsx                # NEW: shadcn/ui Badge (copy-into-repo, no new npm dep)
    ├── toast.tsx                # NEW: shadcn/ui Toast primitives (copy-into-repo)
    ├── toaster.tsx              # NEW: Toaster wrapper component
    └── use-toast.ts             # NEW: useToast hook

lib/
└── ideas/
    ├── validation.ts            # EXTEND: evaluateIdeaSchema, startReviewSchema
    └── transitions.ts           # NEW: validateTransition() state machine guard

lib/db/
├── schema.ts                    # MODIFY: add status to ideas; add idea_evaluations table
└── migrations/
    └── 0002_add_evaluation_workflow.sql   # NEW: ALTER TABLE + CREATE TABLE

docs/adrs/
└── adr-0006-idea-evaluation-table-decision.md  # NEW

tests/
├── integration/
│   └── ideas/
│       ├── start-review.test.ts
│       ├── evaluate.test.ts
│       ├── admin-list.test.ts
│       └── delete-under-review.test.ts
└── e2e/
    └── idea-evaluation-flow.spec.ts
```

**Structure Decision**: Single Next.js project — extends the existing repository root layout established in features 001 and 002. No new top-level directories needed.

## Complexity Tracking

No constitution violations requiring justification.
