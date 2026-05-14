# Research: Idea Evaluation Workflow

**Feature**: `003-idea-evaluation-workflow`
**Date**: 2026-05-14
**Phase**: 0 — Research

---

## Research Questions

This phase resolved all NEEDS CLARIFICATION items from the Technical Context before Phase 1 design began.

---

## RQ-001: Toast Notification — Which approach, no new npm dep?

**Decision**: Use shadcn/ui Toast components (`toast.tsx`, `toaster.tsx`, `use-toast.ts`) added via the copy-into-repo pattern.

**Rationale**: The project already uses shadcn/ui's copy-into-repo pattern for `button.tsx`, `alert-dialog.tsx`, and `collapsible.tsx`. Adding `Toast` follows the exact same approach — running `npx shadcn@latest add toast` copies `@radix-ui/react-toast`-backed components into `components/ui/`. This satisfies FR-019 (toast notification on success) without introducing a new npm package entry. `sonner` would require adding `sonner` to `package.json`; rejected per Principle III.

**Alternatives considered**:
- `sonner` (separate npm package) — Rejected: adds a new dependency where the project-provided shadcn/ui Toast meets the need.
- `window.alert()` — Rejected: not a "brief toast notification"; poor UX; not accessible.
- Inline success message in form — Rejected: FR-019 explicitly requires a toast + in-place row update.

---

## RQ-002: Status Badge Component — shadcn/ui Badge vs. custom?

**Decision**: Use shadcn/ui `Badge` component added via copy-into-repo (`components/ui/badge.tsx`). Wrap it in a feature-level `StatusBadge` component that applies per-status Tailwind color classes.

**Rationale**: shadcn/ui `Badge` provides the accessible pill primitive. `StatusBadge` adds the per-status color mapping (WCAG 1.4.1 text-label requirement from FR-021). No new npm dependency needed; the `class-variance-authority` package already present in `package.json` handles variant styling.

**Alternatives considered**:
- Custom `<span>` with Tailwind — Would work but reinvents a primitive already available via shadcn; rejected per Principle II.
- `@radix-ui/react-badge` directly — Does not exist as a standalone package; shadcn/ui Badge is the canonical approach for this stack.

---

## RQ-003: State Machine Enforcement — Library vs. pure TypeScript?

**Decision**: Pure TypeScript function `validateTransition(from: IdeaStatus, to: IdeaStatus): boolean` in `lib/ideas/transitions.ts`, using an explicit allowlist object.

**Rationale**: The transition graph is simple (4 states, 3 valid transitions). An external state machine library (XState, robot) is significant overhead for 10 lines of business logic. The allowlist approach is readable, exhaustively typed, and trivially testable.

```typescript
// lib/ideas/transitions.ts (design)
const ALLOWED: Record<IdeaStatus, IdeaStatus[]> = {
  submitted:    ['under_review'],
  under_review: ['accepted', 'rejected'],
  accepted:     [],
  rejected:     [],
}

export function validateTransition(from: IdeaStatus, to: IdeaStatus): boolean {
  return ALLOWED[from].includes(to)
}
```

**Alternatives considered**:
- XState — Full state machine library; correct semantics but far exceeds the complexity of 3 transitions. Rejected per Principle III (minimal dependencies).
- Robot (micro state machine) — Still an additional npm dep. Rejected for same reason.
- Inline switch statement per action — Would duplicate logic across `startReviewAction` and `evaluateIdeaAction`. Rejected per Principle I (no duplication).

---

## RQ-004: Data Storage — Separate `idea_evaluations` table vs. inline columns on `ideas`?

**Decision**: Separate `idea_evaluations` table (1:0..1 relationship with `ideas`). See ADR-0006 for full record.

**Rationale**: Separates the idea content schema from the evaluation audit data. Enforces the 1:0..1 relationship via a UNIQUE constraint on `idea_id`. Aligns with the spec's `IdeaEvaluation` entity definition. The audit attributes (admin_id, new_status, comment, created_at) are co-located and clearly scoped.

**Alternatives considered**:
- Inline columns (`admin_id`, `evaluation_comment`, `evaluated_at`, `reviewer_id`, `review_started_at`) on `ideas` — Simpler join-free reads but `ideas` table becomes wide with nullable audit columns. Rejected; see ADR-0006.
- Single `idea_status_transitions` table recording all transitions — More flexible audit log but over-engineered for a 3-transition, 1:0..1 relationship. Rejected; spec explicitly defines IdeaEvaluation as the entity.

---

## RQ-005: "Start Review" Audit Trail — How is the Submitted → Under Review transition recorded (FR-016)?

**Decision**: Add `reviewer_id` (integer nullable FK → `users.id`) and `review_started_at` (integer nullable Unix ms) columns to the `ideas` table.

**Rationale**: FR-016 requires every transition to record the acting admin's identity and a timestamp. The final evaluation (Accepted/Rejected) is stored in `idea_evaluations`. The "Start Review" step is an intermediate transition with no comment — recording it directly on `ideas` with two audit columns avoids a second `idea_evaluations` row (which would break the 1:0..1 spec invariant).

**Alternatives considered**:
- Store "Under Review" entry in `idea_evaluations` — Breaks the 1:0..1 relationship since a later Accepted/Rejected record would be a second row. Rejected.
- Skip auditing "Start Review" — Violates FR-016. Rejected.

---

## RQ-006: Admin Ideas Listing Filter — URL search params vs. client state?

**Decision**: URL search param (`?status=submitted`), read via Next.js `searchParams` prop in the page Server Component. Filter UI is a `<select>` that triggers `router.push` / `router.replace`.

**Rationale**: URL-based filtering is the idiomatic Next.js App Router approach. It makes filters bookmarkable, shareable, and survives page refreshes. No additional client-state management library needed. Matches the pattern used in the existing admin dashboard.

**Alternatives considered**:
- `useState` + client-side filtering — Works but loses filter state on refresh; not bookmarkable. Rejected.
- Third-party filter library — No new dependency justified for a single-field filter. Rejected.

---

## RQ-007: Drizzle Migration Strategy — ALTER TABLE vs. new migration file?

**Decision**: New migration file `lib/db/migrations/0002_add_evaluation_workflow.sql` containing:
1. `ALTER TABLE ideas ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted'`
2. `ALTER TABLE ideas ADD COLUMN reviewer_id INTEGER REFERENCES users(id)`
3. `ALTER TABLE ideas ADD COLUMN review_started_at INTEGER`
4. `CREATE TABLE idea_evaluations (...)` with all columns

**Rationale**: Following the existing migration pattern (0000, 0001 files), a new SQL migration file is generated via `npx drizzle-kit generate` after schema changes. The `DEFAULT 'submitted'` on the status column satisfies FR-020 (no data migration required as no rows exist). SQLite supports `ALTER TABLE ... ADD COLUMN` for nullable or DEFAULT-bearing columns.

**Alternatives considered**:
- Edit existing migration files — Breaks idempotency and the migration history. Rejected.
- Reset and recreate DB — Acceptable only in dev; not safe for production. Rejected.

---

## RQ-008: Comment Validation — Zod schema rules?

**Decision**: New Zod schema `evaluateIdeaSchema` in `lib/ideas/validation.ts` with a discriminated union:

```typescript
// lib/ideas/validation.ts (design)
export const evaluateIdeaSchema = z.discriminatedUnion('status', [
  z.object({
    status:  z.literal('accepted'),
    comment: z.string().max(1000).optional(),
  }),
  z.object({
    status:  z.literal('rejected'),
    comment: z.string().min(1, 'Rejection reason is required').max(1000),
  }),
])
```

**Rationale**: A discriminated union makes the "required for rejected, optional for accepted" rule explicit in the type system (FR-007, FR-008, FR-010). This also drives react-hook-form's conditional validation without additional imperative logic.

**Alternatives considered**:
- Single schema with `.superRefine()` — Works but loses the discriminated-union type narrowing. Rejected.
- Two separate schemas — More verbose; the discriminated union expresses the constraint more cleanly.

---

## Summary of Decisions

| # | Question | Decision |
|---|----------|----------|
| RQ-001 | Toast notification | shadcn/ui Toast (copy-into-repo, no new npm dep) |
| RQ-002 | Status badge | shadcn/ui Badge + `StatusBadge` wrapper |
| RQ-003 | State machine enforcement | Pure TS allowlist in `lib/ideas/transitions.ts` |
| RQ-004 | Evaluation storage | Separate `idea_evaluations` table (1:0..1) |
| RQ-005 | Start Review audit | `reviewer_id` + `review_started_at` on `ideas` |
| RQ-006 | Admin filter | URL search param `?status=` + Next.js `searchParams` |
| RQ-007 | Migration | New `0002_add_evaluation_workflow.sql` via drizzle-kit |
| RQ-008 | Comment validation | Zod discriminated union by `status` |

**All NEEDS CLARIFICATION items resolved. Phase 1 design may proceed.**
