# Implementation Plan: Anonymous Idea Evaluation with Scoring System

**Branch**: `006-anonymous-idea-scoring` | **Date**: May 15, 2026 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-anonymous-idea-scoring/spec.md`

## Summary

Enhance the idea evaluation workflow with **anonymity during review** and **mandatory scoring system**. Admins cannot see submitter identity during evaluation stages 2-4, ensuring unbiased assessment. Each admin evaluates one stage and submits a mandatory 1-5 rating: **Stage 2** (Alignment), **Stage 3** (Feasibility), **Stage 4** (Impact). All three final ratings display on completed ideas and in the timeline for transparency and audit trail. Rejected ideas remain permanently anonymous; approved ideas unmask submitter for implementation team only.

**Technical Approach**: 
- Extend existing `ideas` table with rating fields and anonymization flag
- Create new `idea_ratings` table for immutable rating audit trail
- Add rating controls (1-5 star/numeric) to evaluation panels (Stages 2-4)
- Update timeline display to show ratings with approval actions
- Implement view-layer filtering to hide submitter PII during stages 2-4
- Create rating summary display on idea cards and detail pages

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+)

**Primary Dependencies**: Next.js 14+ (App Router), React 18+, Drizzle ORM (existing DB layer), shadcn/ui, Tailwind CSS

**Storage**: SQLite with Drizzle ORM (existing); add `idea_ratings` table and extend `ideas` schema

**Testing**: Vitest + React Testing Library (unit/component), Playwright (E2E), existing test structure in `tests/` directory

**Target Platform**: Web application (Next.js App Router); responsive for desktop and tablet admin workflows

**Project Type**: Full-stack web application (single Next.js monolith)

**Performance Goals**: 
- Dashboard load time < 1 second for 100+ ideas (SC-007)
- Evaluation completion < 2 minutes per stage (SC-006)
- No performance regression from anonymization queries

**Constraints**:
- No new npm dependencies without justified use of existing packages first
- Ratings must be immutable after submission (audit trail)
- Anonymity must be enforced at view/query level, not just UI masking
- TypeScript strict mode compliance mandatory

**Scale/Scope**: 
- 4 stages, 3 rating stages (2-4), 1 non-rating stage (1)
- Single rating per admin per idea per stage
- Display across dashboard, detail pages, timeline, and idea cards

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Clean Code** — Functions are single-purpose; no dead code; names are intention-revealing.
  - Rating validation, anonymization logic, and display functions will each be isolated; no complex multi-purpose functions.
- [x] **II. Simple UI/UX** — Tailwind-only styling; shadcn/ui components used; mobile-first responsive layout.
  - Use shadcn/ui or Tailwind-based rating control (star rating or radio buttons); responsive evaluation panels.
- [x] **III. Minimal Dependencies** — No new dependency added without justification; `npm audit` passes clean.
  - Rating controls: Use shadcn/ui primitives or Tailwind (no new npm rating library); existing validation libs sufficient.
- [x] **III.a Documentation Freshness** — For critical dependency/API choices, latest stable versions and docs are verified via Context7 MCP.
  - Drizzle ORM schema changes: Verify latest Drizzle migration patterns for new tables.
  - shadcn/ui rating pattern: Verify latest available rating component/implementation.
- [x] **IV. Accessibility** — All images/icons have text alternatives; contrast ≥ 4.5:1; keyboard-navigable.
  - Rating controls must be keyboard-navigable (arrow keys, Enter/Space to select); screen-reader labels for each rating level.
  - Color contrast: Ensure rating stars/numbers meet WCAG AA on all backgrounds.
- [x] **V. Error Handling** — All async paths have try/catch or error boundaries; error/loading/empty states designed.
  - Rating submission: Error state if save fails; success toast on save; validation error if required rating missing.
  - Empty state: No ratings yet (pre-completion); loading state during submission.
- [x] **VI. ADRs** — Every significant technical choice made during this plan has a corresponding `docs/adrs/adr-XXXX.md` (MADR format) created before `tasks.md` is generated.
  - Create ADR for: (1) Anonymization implementation pattern (view-layer vs. data-layer), (2) Rating immutability design, (3) Score display aggregation strategy.
- [x] **VII. TypeScript Strict Mode** — `"strict": true` in `tsconfig.json`; no `any` without justification; `===` used throughout; nullish coalescing/optional chaining preferred.
  - All rating types, admin IDs, stage numbers strictly typed; no implicit `any`.
- [x] **Testing** — Test tooling confirmed: Vitest + React Testing Library (unit/component), Playwright (E2E); `tests/integration/` and `tests/e2e/` directories planned; CI gates include `type-check`, `lint`, and all test suites.
  - Unit tests: Rating validation, anonymization logic, score display formatting.
  - Component tests: Rating control rendering, form submission, error states.
  - E2E tests: Full evaluation workflow (stage 2-4), timeline display, score visibility.
- [x] **Stack** — Next.js App Router + React 18+ + Tailwind + shadcn/ui + TypeScript strict mode.
- [x] **Workflow Governance** — Implementation plan supports task-scoped commits and a post-task-completion PR-before-merge gate to `main` with explicit user approval.

**GATE STATUS**: ✅ PASS — All constraints satisfied; no deviations required.

## Project Structure

### Documentation (this feature)

```text
specs/006-anonymous-idea-scoring/
├── spec.md              # Feature specification (created)
├── plan.md              # This file (Phase 0-1 output)
├── research.md          # Phase 0 output (generated below)
├── data-model.md        # Phase 1 output (generated below)
├── quickstart.md        # Phase 1 output (generated below)
├── contracts/           # Phase 1 output (if needed)
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (existing Next.js repository structure)

```text
# Core database and data layer
lib/db/
├── schema.ts            # Drizzle schema (MODIFY: add idea_ratings table, extend ideas)
├── migrations/          # Migration files (MODIFY: create new rating table migration)
└── index.ts             # DB client

# Server actions (existing pattern)
actions/
├── idea-evaluation.ts   # MODIFY: add rating submission action
└── ideas.ts             # MODIFY: add anonymization logic

# React components
components/ideas/
├── EvaluationPanel.tsx  # MODIFY: add rating control + validation
├── IdeaTimeline.tsx     # MODIFY: display ratings with approval actions
├── IdeaRow.tsx          # MODIFY: display score badges on completed ideas
├── AdminIdeaList.tsx    # MODIFY: hide submitter info in stages 2-4
└── [new] RatingControl.tsx # NEW: reusable 1-5 rating component

# App routes (existing)
app/(protected)/admin/
└── [nested components consuming above]

# Tests (existing structure)
tests/
├── integration/         # MODIFY: add rating workflow tests
└── e2e/                 # MODIFY: add evaluation + timeline tests
```

**Structure Decision**: 
Leverage existing Next.js App Router structure. Anonymization is implemented via server-side view logic (actions and data queries filter PII based on stage). Rating controls are isolated in a new `RatingControl` component following shadcn/ui patterns. Drizzle schema extended with `idea_ratings` table for audit trail. Timeline and score display components updated to fetch and render ratings.

## Phase 0: Research & Unknowns Resolution

**All clarifications completed in specification phase.** No research tasks needed.

### Reference Materials (Pre-verified)

1. **Drizzle ORM Migration Pattern**: Review `lib/db/migrations/` for existing migration structure before designing new `idea_ratings` table migration.
2. **shadcn/ui Rating Component**: Verify if shadcn/ui offers a pre-built rating component; if not, design with Tailwind + React primitives (radio buttons or accessible button group).
3. **Next.js Server Actions**: Confirm existing action patterns in `actions/` for consistency with rating submission handler.
4. **Timeline Rendering**: Review existing `IdeaTimeline.tsx` component to understand timeline event structure and rendering pattern before adding rating display.

## Phase 1: Design & Contracts

### 1.1 Data Model

**New Table**: `idea_ratings`
```sql
CREATE TABLE idea_ratings (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  stage INTEGER NOT NULL CHECK (stage IN (2, 3, 4)),
  rater_id TEXT NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (idea_id, stage) -- One rating per idea per stage
);
```

**Extended Table**: `ideas` table adds columns:
- `alignment_rating` (INTEGER, nullable, 1-5): Final alignment score (Stage 2)
- `feasibility_rating` (INTEGER, nullable, 1-5): Final feasibility score (Stage 3)
- `impact_rating` (INTEGER, nullable, 1-5): Final impact score (Stage 4)
- `anonymized` (BOOLEAN, default true): Flag for stages 2-4 anonymity enforcement

**Extended Table**: `idea_evaluation_log` or similar timeline table:
- Add `rating_id` (TEXT, FK to idea_ratings, nullable): Link approval action to rating score
- Existing entries for stage 1 have NULL rating_id; stages 2-4 entries reference their rating_id

**Implementation Details** (deferred to tasks):
- Drizzle schema update in `lib/db/schema.ts`
- Database migration creation
- View queries: Add logic to exclude submitter fields when idea is in stages 2-4

### 1.2 Contracts (API boundaries)

**Server Action Interface**: Rating Submission
```typescript
// actions/idea-evaluation.ts
interface SubmitRatingRequest {
  ideaId: string;
  stage: 2 | 3 | 4;
  score: number; // 1-5
  adminComment: string;
  adminId: string;
}

interface SubmitRatingResponse {
  success: boolean;
  ratingId?: string;
  error?: string;
}
```

**Component Props**: Rating Control
```typescript
interface RatingControlProps {
  stage: 2 | 3 | 4;
  stageName: "Alignment" | "Feasibility" | "Impact";
  currentRating?: number; // undefined if not yet submitted
  disabled?: boolean; // true if immutable/already submitted
  onRatingChange: (score: number) => void;
  loading?: boolean;
  error?: string;
}
```

**Timeline Event Structure**: Include rating
```typescript
interface TimelineEvent {
  // existing fields...
  ratingId?: string; // if stage 2-4 approval
  ratingScore?: number; // 1-5
  ratingStage?: "Alignment" | "Feasibility" | "Impact";
}
```

### 1.3 Feature Flows (High-Level)

**Flow 1: Admin Evaluates Idea in Stage 2**
1. Admin opens idea detail page; submitter info is hidden (anonymized: true, stage 2-4)
2. Evaluation panel shows "Alignment Rating (1-5)" with rating control
3. Admin selects a rating (e.g., 4) and clicks "Approve/Advance to Stage 3"
4. Server action validates: rating required, saves to `idea_ratings` (stage=2, score=4)
5. Updates `ideas.alignment_rating = 4` and current stage to 3
6. Timeline entry shows: "Approved → Stage 3 — Alignment: 4/5"
7. Next admin sees idea at stage 3 with submitter still anonymous

**Flow 2: Idea Completes Evaluation (Stage 4)**
1. Admin in stage 4 provides impact rating (1-5) and chooses "Approved" or "Rejected"
2. Server validates: rating required; saves rating; marks idea as completed
3. Updates `ideas` table: `impact_rating = [score]`, status = "Completed"
4. If Approved: Submitter identity is now available to implementation team
5. If Rejected: Submitter remains anonymous (never revealed)

**Flow 3: Completed Idea Display for Users**
1. Non-admin user views completed idea dashboard
2. Idea card shows: Title, Description, Status: Completed, **Ratings: Alignment: 4/5 | Feasibility: 4/5 | Impact: 4/5**
3. Timeline shows each stage approval with rating displayed inline

### 1.4 Quickstart

See [quickstart.md](quickstart.md) (generated separately)

### 1.5 ADRs (Architecture Decision Records)

Three ADRs to create before tasks.md generation:

1. **adr-XXXX-anonymization-implementation-pattern.md**
   - Decision: Anonymity enforced at query/view layer (server actions filter PII) vs. UI-only masking
   - Chosen: Query layer (more secure)

2. **adr-XXXX-rating-immutability-design.md**
   - Decision: Ratings immutable after submission; audit trail preserved
   - Chosen: UNIQUE(idea_id, stage) constraint prevents duplicate submissions; DELETE/UPDATE forbidden

3. **adr-XXXX-score-display-strategy.md**
   - Decision: Show individual ratings only (no aggregation across admins, since one admin per stage)
   - Chosen: Display all three final ratings (alignment, feasibility, impact) on completed idea

## Phase 2: Task Generation

Task generation is deferred to `/speckit.tasks` command. 

**Expected Task Categories**:
- Database: Schema updates, migrations, view queries
- Backend: Server actions (rating submission, anonymization filters)
- Frontend: Rating control component, evaluation panel updates, timeline updates, score display
- Testing: Unit, component, E2E tests
- Documentation: ADRs, quickstart, API contracts

---

## Notes

- **Immutability**: Once a rating is submitted, it cannot be modified. If an admin discovers an error, they must note it in a follow-up comment; ratings remain locked for audit compliance.
- **Anonymity Boundary**: Stage 1 (spam check) sees submitter; Stages 2-4 do NOT see submitter; after approval, implementation team sees submitter; after rejection, submitter stays anonymous forever.
- **No Re-evaluation**: Rejection at any stage is final. Ideas never progress backward or return to earlier stages.
- **Single Admin Per Stage**: Only one admin is assigned to evaluate each idea at each stage. No multi-admin voting or consensus required.
- **Timeline Auditing**: Every rating submission is recorded with admin identity, timestamp, and score. Timeline reflects all approvals and ratings for full transparency.
