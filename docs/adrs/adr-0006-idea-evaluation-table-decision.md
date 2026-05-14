# ADR-0006: Separate `idea_evaluations` Table for Evaluation Data

**Date**: 2026-05-14
**Status**: Accepted
**Feature**: `003-idea-evaluation-workflow`

---

## Context

Feature 003 introduces an idea evaluation workflow in which admin users can transition ideas through a strict state machine (Submitted → Under Review → Accepted/Rejected). When an admin accepts or rejects an idea they must optionally or mandatorily provide a comment. The spec defines an `IdeaEvaluation` entity with the following attributes: idea reference (FK), new status, evaluating admin reference (FK), comment (optional/required by decision type), and timestamp. The spec states the relationship is 1:0..1 — each idea has at most one evaluation record.

Two design alternatives were evaluated for persisting this evaluation data.

---

## Decision

Store evaluation data in a **dedicated `idea_evaluations` table** with a UNIQUE constraint on `idea_id`, rather than adding inline nullable columns to the existing `ideas` table.

---

## Alternatives Considered

### Option A — Inline columns on `ideas` (rejected)

Add the following nullable columns directly to the `ideas` table:

```sql
ALTER TABLE ideas ADD COLUMN evaluation_status TEXT;         -- 'accepted' | 'rejected'
ALTER TABLE ideas ADD COLUMN evaluation_admin_id INTEGER;    -- FK → users.id
ALTER TABLE ideas ADD COLUMN evaluation_comment TEXT;
ALTER TABLE ideas ADD COLUMN evaluated_at INTEGER;
```

**Pros**:
- Single table scan when listing ideas; no JOIN needed for evaluation data.
- Simpler Drizzle query.

**Cons**:
- The `ideas` table is already wide (11 columns after feature 002). Adding 4 more nullable audit columns increases cognitive overhead for readers of the schema.
- The 1:0..1 cardinality constraint is implicit — nullability on all four columns is the only enforcement; it is easy to leave the table in a partial evaluation state.
- Evaluation attributes (who evaluated, when, what decision, reason) are semantically distinct from idea content attributes (title, description, category, submitter). Mixing them in one table violates single-responsibility at the schema level.
- Violates the spec's explicit `IdeaEvaluation` entity definition — the spec clearly models evaluation as a separate entity.

### Option B — Separate `idea_evaluations` table (chosen)

Create a new table with the UNIQUE constraint on `idea_id`:

```sql
CREATE TABLE idea_evaluations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id    INTEGER NOT NULL UNIQUE REFERENCES ideas(id),
  admin_id   INTEGER NOT NULL REFERENCES users(id),
  status     TEXT    NOT NULL CHECK (status IN ('accepted', 'rejected')),
  comment    TEXT,
  created_at INTEGER NOT NULL
);
```

**Pros**:
- The UNIQUE constraint on `idea_id` enforces the 1:0..1 relationship at the database level.
- Evaluation attributes are co-located and clearly scoped to the decision record.
- The `ideas` table remains focused on idea content; the `idea_evaluations` table is focused on evaluation audit data.
- Aligns directly with the spec's `IdeaEvaluation` entity definition.
- Immutability of evaluation records (FR-017) is natural: the row is inserted once and never updated; no partial-nullability confusion.
- A CHECK constraint on `status` adds a second layer of enforcement beyond the application layer.

**Cons**:
- Requires a LEFT JOIN when fetching ideas with their evaluation status for the admin listing.
- Slightly more complex Drizzle query vs. single-table scan.

---

## Consequences

- **`lib/db/schema.ts`** gains a new `ideaEvaluations` table definition and exported `IdeaEvaluation`/`NewIdeaEvaluation` types.
- **`lib/db/migrations/0002_add_evaluation_workflow.sql`** includes a `CREATE TABLE idea_evaluations` statement.
- **`getAdminIdeasAction`** and **`getIdeaDetailAction`** use a LEFT JOIN against `idea_evaluations`.
- **`evaluateIdeaAction`** inserts into `idea_evaluations` and updates `ideas.status` in the same Drizzle transaction.
- No update or delete operations are performed on `idea_evaluations` rows (FR-017 immutability).
- The UNIQUE constraint means attempting to evaluate an already-evaluated idea results in a DB constraint error, providing a second safety net beyond the `validateTransition()` guard.
