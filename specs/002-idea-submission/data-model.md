# Data Model: Idea Submission System

**Feature**: `002-idea-submission`
**Date**: 2026-05-14
**Storage**: SQLite via Drizzle ORM (`drizzle-orm/sqlite-core`)

---

## Entities

### `ideas`

Represents a submitted innovation idea. Attachment metadata and content are stored inline to guarantee atomic save/rollback (FR-019).

| Column | SQLite Type | Drizzle | Nullable | Notes |
|--------|-------------|---------|----------|-------|
| `id` | `INTEGER` | `integer().primaryKey({ autoIncrement: true })` | No | Surrogate PK |
| `title` | `TEXT` | `text().notNull()` | No | Max 255 chars (enforced via Zod) |
| `description` | `TEXT` | `text().notNull()` | No | Free-form text |
| `category` | `TEXT` | `text({ enum: CATEGORIES }).notNull()` | No | One of 5 predefined values |
| `submitter_id` | `INTEGER` | `integer().notNull().references(() => users.id)` | No | FK → `users.id` |
| `attachment_name` | `TEXT` | `text()` | Yes | Original filename |
| `attachment_size` | `INTEGER` | `integer()` | Yes | Byte length |
| `attachment_mime_type` | `TEXT` | `text()` | Yes | MIME type string |
| `attachment_content` | `BLOB` | `blob('attachment_content', { mode: 'buffer' })` | Yes | Raw file bytes |
| `created_at` | `INTEGER` | `integer().notNull()` | No | Unix timestamp ms (`Date.now()`) |
| `updated_at` | `INTEGER` | `integer().notNull()` | No | Unix timestamp ms; updated on edit |

**Invariants**:
- All four `attachment_*` columns are always either all `NULL` (no attachment) or all non-`NULL` (attachment present). No partial attachment state is allowed.
- `category` must be one of the 5 canonical enum values.
- `submitter_id` references a row in `users` (FK constraint).

---

### Category Enum

Stored as `text` with a Drizzle enum constraint. The TypeScript union type mirrors these values.

| Stored value | Display label |
|---|---|
| `process_improvement` | Process Improvement |
| `technology_innovation` | Technology Innovation |
| `customer_experience` | Customer Experience |
| `workplace_culture` | Workplace Culture |
| `cost_reduction` | Cost Reduction |

---

## Relationships

```
users (1) ──────< ideas (N)
  id                submitter_id
```

- One `user` may submit zero or many `ideas`.
- Each `idea` belongs to exactly one `user` (the submitter).
- No junction tables required in v1.

---

## Drizzle Schema (reference)

```typescript
// lib/db/schema.ts (additions)

import { integer, sqliteTable, text, blob } from 'drizzle-orm/sqlite-core'

export const IDEA_CATEGORIES = [
  'process_improvement',
  'technology_innovation',
  'customer_experience',
  'workplace_culture',
  'cost_reduction',
] as const

export type IdeaCategory = typeof IDEA_CATEGORIES[number]

export const ideas = sqliteTable('ideas', {
  id:                  integer('id').primaryKey({ autoIncrement: true }),
  title:               text('title').notNull(),
  description:         text('description').notNull(),
  category:            text('category', { enum: IDEA_CATEGORIES }).notNull(),
  submitterId:         integer('submitter_id').notNull().references(() => users.id),
  attachmentName:      text('attachment_name'),
  attachmentSize:      integer('attachment_size'),
  attachmentMimeType:  text('attachment_mime_type'),
  attachmentContent:   blob('attachment_content', { mode: 'buffer' }),
  createdAt:           integer('created_at').notNull(),
  updatedAt:           integer('updated_at').notNull(),
})

export type Idea    = typeof ideas.$inferSelect
export type NewIdea = typeof ideas.$inferInsert
```

---

## Validation Rules

Enforced by Zod schemas in `lib/ideas/validation.ts`.

| Field | Rule |
|-------|------|
| `title` | Required; 3–255 characters after trim |
| `description` | Required; 10–5000 characters after trim |
| `category` | Required; must be one of `IDEA_CATEGORIES` |
| `attachment` (file) | Optional; if present: size ≤ 5,242,880 bytes (5 MB); MIME type in `['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']` |

---

## State Transitions

Ideas are mutable in v1 (submitter can edit/delete; admin can delete). No formal approval workflow — all ideas are immediately visible.

```
[Submitted] ──edit──> [Updated]
[Submitted] ──delete (submitter or admin)──> [Deleted / removed]
[Updated]   ──delete (submitter or admin)──> [Deleted / removed]
```

Deletion is a hard delete — row is removed from the `ideas` table. No soft-delete or audit trail in v1.

---

## Migration

A single Drizzle migration adds the `ideas` table. No changes to the `users` table are required.

**Migration file**: `lib/db/migrations/0001_add_ideas_table.sql`
