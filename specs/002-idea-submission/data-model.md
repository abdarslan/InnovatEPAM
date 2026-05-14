# Data Model: Idea Submission System (Multi-attachment)

**Feature**: `002-idea-submission`
**Date**: 2026-05-14
**Storage**: SQLite via Drizzle ORM (`drizzle-orm/sqlite-core`)

---

## Entities

### `ideas`

Represents the primary submitted idea record.

| Column | SQLite Type | Nullable | Notes |
|---|---|---|---|
| `id` | `INTEGER` | No | PK, auto increment |
| `title` | `TEXT` | No | 3-255 chars (validated) |
| `description` | `TEXT` | No | 10-5000 chars (validated) |
| `category` | `TEXT` | No | Enum from `IDEA_CATEGORIES` |
| `submitter_id` | `INTEGER` | No | FK -> `users.id` |
| `created_at` | `INTEGER` | No | Unix ms timestamp |
| `updated_at` | `INTEGER` | No | Unix ms timestamp |

### `idea_attachments`

Stores one row per attachment linked to an idea.

| Column | SQLite Type | Nullable | Notes |
|---|---|---|---|
| `id` | `INTEGER` | No | PK, auto increment |
| `idea_id` | `INTEGER` | No | FK -> `ideas.id` (cascade delete) |
| `original_name` | `TEXT` | No | File name from upload |
| `mime_type` | `TEXT` | No | Validated allowlist |
| `size_bytes` | `INTEGER` | No | Must satisfy size limits |
| `preview_eligible` | `INTEGER` | No | 0/1 flag derived from MIME support |
| `content` | `BLOB` | No | Raw bytes |
| `created_at` | `INTEGER` | No | Unix ms timestamp |

### Category Enum

| Stored value | Display label |
|---|---|
| `process_improvement` | Process Improvement |
| `technology_innovation` | Technology Innovation |
| `customer_experience` | Customer Experience |
| `workplace_culture` | Workplace Culture |
| `cost_reduction` | Cost Reduction |

---

## Relationships

```text
users (1) ----< ideas (N)
ideas (1) ----< idea_attachments (N)
```

- One user submits many ideas.
- One idea owns zero to five attachments.
- Deleting an idea removes related attachments.

---

## Validation Rules

| Rule | Constraint |
|---|---|
| Title | Required, trimmed, 3-255 chars |
| Description | Required, trimmed, 10-5000 chars |
| Category | Required enum |
| Attachment count | 0-5 per idea |
| Per-file size | <= 10 MB |
| Aggregate size | <= 25 MB |
| MIME type | Must be in approved allowlist |
| Preview metadata | `preview_eligible` derived from MIME (`image/*`, `audio/*`, `video/*`, `application/pdf`) |

---

## State Transitions

```text
[Submitted] --edit fields--> [Updated]
[Submitted] --add/remove attachments--> [Updated]
[Updated] --add/remove attachments--> [Updated]
[Submitted|Updated] --delete (owner/admin)--> [Deleted]
```

Notes:
- Attachment add/remove operations are part of standard owner edit capability.
- No review-state lifecycle is modeled in this spec.

---

## Migration Plan

1. Create `idea_attachments` table and indexes (`idea_id`, `created_at`).
2. Backfill existing single attachment columns (if present) into one `idea_attachments` row per idea.
3. Remove legacy single-attachment columns from `ideas` after data migration.

**Planned migration file**: `lib/db/migrations/0002_ideas_multi_attachments.sql`

---

## Action-layer DTO Shape

```typescript
type IdeaAttachmentMeta = {
  id: number
  originalName: string
  mimeType: string
  sizeBytes: number
  previewEligible: boolean
}

type IdeaDetail = {
  id: number
  title: string
  description: string
  category: IdeaCategory
  submitterId: number
  submitterName: string
  attachments: IdeaAttachmentMeta[]
  createdAt: number
  updatedAt: number
}
```
