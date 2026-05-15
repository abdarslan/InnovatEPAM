# Data Model: Anonymous Idea Evaluation with Scoring System

## Overview

This document defines the data model changes required to implement anonymous idea evaluation with scoring. The model introduces a new `idea_ratings` table for audit trail and extends existing `ideas` and `idea_evaluation_log` tables.

## Schema Changes

### 1. New Table: `idea_ratings`

**Purpose**: Immutable audit trail of rating submissions. Each rating is recorded once per admin per stage with timestamp.

**SQL Definition**:
```sql
CREATE TABLE idea_ratings (
  id TEXT PRIMARY KEY,                                    -- UUID
  idea_id TEXT NOT NULL REFERENCES ideas(id),            -- Which idea
  stage INTEGER NOT NULL CHECK (stage IN (2, 3, 4)),     -- Stage 2|3|4 only
  rater_id TEXT NOT NULL REFERENCES users(id),           -- Which admin
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5), -- 1-5 rating
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (idea_id, stage)                               -- One rating per stage
);
```

**Indexes**:
```sql
CREATE INDEX idx_idea_ratings_idea_id ON idea_ratings(idea_id);
CREATE INDEX idx_idea_ratings_stage ON idea_ratings(stage);
CREATE INDEX idx_idea_ratings_rater_id ON idea_ratings(rater_id);
CREATE INDEX idx_idea_ratings_created_at ON idea_ratings(created_at);
```

**Drizzle ORM Schema**:
```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer, timestamp } from "drizzle-orm/sqlite-core";

export const idea_ratings = sqliteTable(
  "idea_ratings",
  {
    id: text("id").primaryKey(),
    ideaId: text("idea_id").notNull().references(() => ideas.id),
    stage: integer("stage").notNull(), // 2, 3, or 4
    raterId: text("rater_id").notNull().references(() => users.id),
    score: integer("score").notNull(), // 1-5
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      uniqueRatingPerStage: unique().on(table.ideaId, table.stage),
      indexIdeaId: index("idx_idea_ratings_idea_id").on(table.ideaId),
      indexStage: index("idx_idea_ratings_stage").on(table.stage),
      indexRaterId: index("idx_idea_ratings_rater_id").on(table.raterId),
      indexCreatedAt: index("idx_idea_ratings_created_at").on(table.createdAt),
    };
  }
);
```

### 2. Extended Table: `ideas`

**New Columns**: Store final aggregated ratings (denormalized for quick retrieval on completed ideas).

```sql
ALTER TABLE ideas ADD COLUMN alignment_rating INTEGER CHECK (alignment_rating BETWEEN 1 AND 5);
ALTER TABLE ideas ADD COLUMN feasibility_rating INTEGER CHECK (feasibility_rating BETWEEN 1 AND 5);
ALTER TABLE ideas ADD COLUMN impact_rating INTEGER CHECK (impact_rating BETWEEN 1 AND 5);
ALTER TABLE ideas ADD COLUMN anonymized BOOLEAN DEFAULT true;
```

**Drizzle Schema Extension**:
```typescript
export const ideas = sqliteTable("ideas", {
  // existing columns...
  
  alignmentRating: integer("alignment_rating"), // Stage 2 final score
  feasibilityRating: integer("feasibility_rating"), // Stage 3 final score
  impactRating: integer("impact_rating"), // Stage 4 final score
  anonymized: integer("anonymized", { mode: "boolean" }).default(true), // true for stages 2-4
});
```

**Migration Logic**:
- When rating is submitted in stage 2 and idea advances: `ideas.alignment_rating = rating.score`
- When rating is submitted in stage 3 and idea advances: `ideas.feasibility_rating = rating.score`
- When rating is submitted in stage 4 and idea completed/rejected: `ideas.impact_rating = rating.score`
- Stage 1: `anonymized = false` (submitter visible)
- Stage 2-4: `anonymized = true` (submitter hidden)
- After approval (or after rejection if business rule): Submitter visibility based on `anonymized` flag and idea status

### 3. Extended Table: `idea_evaluation_log` (or similar timeline table)

**New Column**: Link timeline events to their associated rating.

```sql
ALTER TABLE idea_evaluation_log ADD COLUMN rating_id TEXT REFERENCES idea_ratings(id);
```

**Drizzle Schema Extension**:
```typescript
export const ideaEvaluationLog = sqliteTable("idea_evaluation_log", {
  // existing columns...
  
  ratingId: text("rating_id").references(() => idea_ratings.id), // Link to rating (null for stage 1)
});
```

**Usage**:
- Stage 1 approval: `ratingId = NULL` (no rating for spam check)
- Stage 2 approval: `ratingId = <id from idea_ratings where stage=2>`
- Stage 3 approval: `ratingId = <id from idea_ratings where stage=3>`
- Stage 4 completion: `ratingId = <id from idea_ratings where stage=4>`

## Entity Relationships

```
users
  ├── 1:M idea_ratings (as rater)
  └── [existing: 1:M ideas (as creator), 1:M comments]

ideas
  ├── M:1 users (submitter)
  ├── 1:M idea_ratings
  ├── 1:M idea_evaluation_log
  └── [existing: 1:M comments, attachments, etc.]

idea_ratings
  ├── M:1 ideas
  ├── M:1 users (rater/admin)
  └── 1:M idea_evaluation_log (via rating_id)

idea_evaluation_log
  ├── M:1 ideas
  └── ?:1 idea_ratings (nullable)
```

## View Queries & Anonymization Logic

### Query 1: Fetch Idea for Admin Viewing (Anonymized)

**Purpose**: Return idea with PII filtered based on current stage.

```typescript
// lib/db/queries.ts
export async function getIdeaForAdminView(ideaId: string) {
  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
    with: {
      submitter: true,
      comments: true,
      ratings: true,
      evaluationLog: {
        with: { rating: true }
      }
    }
  });

  // Anonymize if in stages 2-4
  if (idea && idea.currentStage >= 2) {
    idea.submitter = null; // Hide submitter name, email, profile
  }

  return idea;
}
```

### Query 2: Fetch Timeline with Ratings

**Purpose**: Return timeline events with rating data joined.

```typescript
export async function getIdeaTimeline(ideaId: string) {
  return await db
    .select()
    .from(ideaEvaluationLog)
    .leftJoin(idea_ratings, eq(ideaEvaluationLog.ratingId, idea_ratings.id))
    .where(eq(ideaEvaluationLog.ideaId, ideaId))
    .orderBy(desc(ideaEvaluationLog.createdAt));
}
```

### Query 3: Fetch Completed Idea with All Ratings

**Purpose**: Display idea to users/admins post-evaluation with all three scores.

```typescript
export async function getCompletedIdeaWithRatings(ideaId: string) {
  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
    with: {
      submitter: true,
      ratings: {
        where: inArray(idea_ratings.stage, [2, 3, 4])
      }
    }
  });

  return {
    ...idea,
    alignmentRating: idea.alignmentRating,
    feasibilityRating: idea.feasibilityRating,
    impactRating: idea.impactRating
  };
}
```

## Data Integrity Constraints

| Constraint | Implementation | Rationale |
|-----------|-----------------|-----------|
| One rating per stage | `UNIQUE (idea_id, stage)` | Prevents duplicate ratings at same stage |
| Rating score range | `CHECK (score BETWEEN 1 AND 5)` | Enforces valid 1-5 scale |
| Valid stage | `CHECK (stage IN (2, 3, 4))` | Stages 1 has no rating |
| Referential integrity | FK to `ideas` and `users` | Ratings only exist for valid ideas/admins |
| Immutability | No UPDATE/DELETE on ratings | Audit trail cannot be modified |

## Anonymity Rules (Business Logic, Enforced at Query Layer)

```typescript
function shouldAnonymizeSubmitter(idea: Idea): boolean {
  // Stage 1: Show submitter (initial submission)
  if (idea.currentStage === 1) return false;
  
  // Stages 2-4: Hide submitter (during evaluation)
  if (idea.currentStage >= 2 && idea.currentStage <= 4) return true;
  
  // After rejection: Keep anonymous
  if (idea.status === "rejected") return true;
  
  // After approval: Reveal submitter to implementation team
  if (idea.status === "approved") return false;
  
  return true; // Default: anonymous
}
```

## Performance Considerations

| Operation | Optimization |
|-----------|--------------|
| Fetch anonymous idea list | Index on `(ideaId, stage)` for quick rating lookups |
| Timeline with ratings | LEFT JOIN + index on `rating_id` minimizes query cost |
| Admin dashboard (100+ ideas) | Denormalize `alignment_rating` on `ideas` table; avoid JOIN for aggregate |
| Rating submission | Unique constraint checked at DB level; no race condition |

## Migration Path

1. Create new `idea_ratings` table with migration
2. Add columns to `ideas`: `alignment_rating`, `feasibility_rating`, `impact_rating`, `anonymized`
3. Add column to `idea_evaluation_log`: `rating_id`
4. Update Drizzle schema in `lib/db/schema.ts`
5. Deploy migration (SQLite automatically applies schema changes)
6. No data backfill needed (new column defaults to NULL/false)

## Summary

The data model introduces:
- **1 new table** (`idea_ratings`): Immutable audit trail of submissions
- **4 new columns** on `ideas`: Final rating values + anonymization flag
- **1 new column** on `idea_evaluation_log`: Link to rating (for timeline display)
- **3 new indexes**: Fast lookup by idea, stage, and rater
- **Query-layer anonymization**: Business rules filter PII based on stage/status

All changes preserve backward compatibility; existing ideas continue to work with NULL ratings until they progress through stages 2-4.
