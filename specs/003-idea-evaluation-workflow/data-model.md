# Data Model: Idea Evaluation Workflow

**Feature**: `003-idea-evaluation-workflow`
**Date**: 2026-05-14
**Storage**: SQLite via Drizzle ORM (`drizzle-orm/sqlite-core`)

---

## Status Enum

The `IdeaStatus` type is shared across both tables and all validation schemas.

| Stored value | Display label | Transitions from | Transitions to |
|---|---|---|---|
| `submitted` | Submitted | — (initial) | `under_review` |
| `under_review` | Under Review | `submitted` | `accepted`, `rejected` |
| `accepted` | Accepted | `under_review` | — (terminal) |
| `rejected` | Rejected | `under_review` | — (terminal) |

```typescript
// lib/db/schema.ts
export const IDEA_STATUSES = ['submitted', 'under_review', 'accepted', 'rejected'] as const
export type IdeaStatus = typeof IDEA_STATUSES[number]
```

---

## Modified Entity: `ideas`

The existing `ideas` table is extended with one required and two nullable audit columns.

### New columns

| Column | SQLite Type | Drizzle | Nullable | Default | Notes |
|--------|-------------|---------|----------|---------|-------|
| `status` | `TEXT` | `text('status', { enum: IDEA_STATUSES }).notNull().default('submitted')` | No | `'submitted'` | FR-001, FR-002, FR-020 |
| `reviewer_id` | `INTEGER` | `integer('reviewer_id').references(() => users.id)` | Yes | `NULL` | FK → `users.id`; set when admin starts review (FR-016) |
| `review_started_at` | `INTEGER` | `integer('review_started_at')` | Yes | `NULL` | Unix ms; set when status → under_review (FR-016) |

### Full table reference (additions only)

```typescript
// lib/db/schema.ts — additions to the existing ideas table definition
export const ideas = sqliteTable('ideas', {
  // ... existing columns unchanged ...
  status:          text('status', { enum: IDEA_STATUSES }).notNull().default('submitted'),
  reviewerId:      integer('reviewer_id').references(() => users.id),
  reviewStartedAt: integer('review_started_at'),
})
```

### State transitions on `ideas.status`

```
submitted ──[startReviewAction]──► under_review ──[evaluateIdeaAction]──► accepted
                                                └──[evaluateIdeaAction]──► rejected
```

All other transitions are forbidden. The guard `validateTransition(from, to)` in `lib/ideas/transitions.ts` MUST be called server-side before any status update.

---

## New Entity: `idea_evaluations`

Stores the admin's final decision (Accepted or Rejected) on an idea. Each idea has **at most one** evaluation record (UNIQUE constraint on `idea_id`). This record is created only when transitioning from `under_review` → `accepted` or `rejected`.

| Column | SQLite Type | Drizzle | Nullable | Notes |
|--------|-------------|---------|----------|-------|
| `id` | `INTEGER` | `integer('id').primaryKey({ autoIncrement: true })` | No | Surrogate PK |
| `idea_id` | `INTEGER` | `integer('idea_id').notNull().unique().references(() => ideas.id)` | No | FK → `ideas.id`; UNIQUE enforces 1:0..1 |
| `admin_id` | `INTEGER` | `integer('admin_id').notNull().references(() => users.id)` | No | FK → `users.id`; the evaluating admin |
| `status` | `TEXT` | `text('status', { enum: ['accepted', 'rejected'] }).notNull()` | No | Final decision status |
| `comment` | `TEXT` | `text('comment')` | Yes | Required for `rejected`; optional for `accepted`; max 1000 chars. Enforced at app layer. |
| `created_at` | `INTEGER` | `integer('created_at').notNull()` | No | Unix ms timestamp of evaluation |

**Invariants**:
- `idea_id` is UNIQUE — only one evaluation record per idea.
- `status` can only be `'accepted'` or `'rejected'` — not `'submitted'` or `'under_review'`.
- When `status = 'rejected'`, `comment` MUST be non-empty (enforced in Zod schema, not DB constraint).
- The `created_at` timestamp and `admin_id` are immutable once inserted (FR-017).

```typescript
// lib/db/schema.ts — new table
export const EVALUATION_STATUSES = ['accepted', 'rejected'] as const
export type EvaluationStatus = typeof EVALUATION_STATUSES[number]

export const ideaEvaluations = sqliteTable('idea_evaluations', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  ideaId:    integer('idea_id').notNull().unique().references(() => ideas.id),
  adminId:   integer('admin_id').notNull().references(() => users.id),
  status:    text('status', { enum: EVALUATION_STATUSES }).notNull(),
  comment:   text('comment'),
  createdAt: integer('created_at').notNull(),
})

export type IdeaEvaluation    = typeof ideaEvaluations.$inferSelect
export type NewIdeaEvaluation = typeof ideaEvaluations.$inferInsert
```

---

## Relationships

```
users (1) ──────────────────────────────────< ideas (N)
  id                                            submitter_id

users (1) ─────────────[reviewer]─────────────< ideas (N)
  id                                            reviewer_id  [nullable]

users (1) ─────────────[evaluator]────────────< idea_evaluations (N)
  id                                            admin_id

ideas (1) ──────────────────────────────────◇─ idea_evaluations (0..1)
  id                                            idea_id  [UNIQUE]
```

- One `user` (submitter) may submit zero or many `ideas`.
- One `user` (admin) may start review on zero or many `ideas` (via `ideas.reviewer_id`).
- One `user` (admin) may create zero or many `idea_evaluations`.
- One `idea` has at most one `idea_evaluation` (enforced by UNIQUE constraint).

---

## Drizzle Migration

**File**: `lib/db/migrations/0002_add_evaluation_workflow.sql`

```sql
-- Add status tracking to ideas
ALTER TABLE ideas ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted';
ALTER TABLE ideas ADD COLUMN reviewer_id INTEGER REFERENCES users(id);
ALTER TABLE ideas ADD COLUMN review_started_at INTEGER;

-- Create idea evaluations table
CREATE TABLE idea_evaluations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id    INTEGER NOT NULL UNIQUE REFERENCES ideas(id),
  admin_id   INTEGER NOT NULL REFERENCES users(id),
  status     TEXT NOT NULL CHECK (status IN ('accepted', 'rejected')),
  comment    TEXT,
  created_at INTEGER NOT NULL
);
```

---

## Validation Rules

### `startReviewSchema` (lib/ideas/validation.ts)

```typescript
export const startReviewSchema = z.object({
  ideaId: z.number().int().positive(),
})
```

- Server action validates: session is admin role, idea exists, current status is `'submitted'`.
- Transition `submitted → under_review` confirmed by `validateTransition()`.

### `evaluateIdeaSchema` (lib/ideas/validation.ts)

```typescript
export const evaluateIdeaSchema = z.discriminatedUnion('status', [
  z.object({
    ideaId:  z.number().int().positive(),
    status:  z.literal('accepted'),
    comment: z.string().max(1000).optional(),
  }),
  z.object({
    ideaId:  z.number().int().positive(),
    status:  z.literal('rejected'),
    comment: z.string().min(1, 'Rejection reason is required').max(1000),
  }),
])
```

- Server action validates: session is admin role, idea exists, current status is `'under_review'`.
- Transition `under_review → accepted|rejected` confirmed by `validateTransition()`.
- `comment` is required when `status === 'rejected'` (FR-007); optional when `status === 'accepted'` (FR-008).
- `comment` may not exceed 1000 characters when provided (FR-010).

---

## State Machine Guard

**File**: `lib/ideas/transitions.ts`

```typescript
import type { IdeaStatus } from '@/lib/db/schema'

const ALLOWED_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
  submitted:    ['under_review'],
  under_review: ['accepted', 'rejected'],
  accepted:     [],
  rejected:     [],
}

export function validateTransition(from: IdeaStatus, to: IdeaStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}
```

---

## Deletion Guard

The existing `deleteIdeaAction` in `actions/ideas.ts` MUST be extended to reject deletion of ideas in `'under_review'` status (FR-022):

```typescript
if (idea.status === 'under_review') {
  return { ok: false, error: 'Ideas under review cannot be deleted.' }
}
```
