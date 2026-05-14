# Data Model: Idea Draft Management

**Feature**: `005-idea-draft-management`
**Date**: 2026-05-15
**Storage**: SQLite via Drizzle ORM (`drizzle-orm/sqlite-core`)
**Migration**: `lib/db/migrations/0004_idea_drafts.sql`

## Existing Entities Reused

### ideas

- Continues to represent submitted ideas only.
- No draft records are stored in this table.
- Existing evaluation/review workflows continue to operate only on submitted ideas.

### idea_attachments

- Continues to represent attachments for submitted ideas only.

### idea_field_values

- Continues to represent dynamic category-specific values for submitted ideas only.

## New Entity: idea_drafts

Owner-scoped in-progress submission record.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | integer PK | Yes | Auto-increment primary key |
| submitterId | integer FK users.id | Yes | Draft owner |
| title | text nullable | No | Partial or empty allowed |
| description | text nullable | No | Partial or empty allowed |
| category | text nullable (`IDEA_CATEGORIES`) | No | Optional until selected |
| createdAt | integer | Yes | Unix ms |
| updatedAt | integer | Yes | Unix ms |

### Constraints

- Owner access only at application layer (submitter must equal session user).
- Admin role is denied at application layer (explicit check in all draft actions).
- Indexed by `submitterId` for dashboard listing (sorted by `updatedAt DESC` in application layer).

## New Entity: idea_draft_attachments

Attachment payloads scoped to drafts.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | integer PK | Yes | Auto-increment primary key |
| draftId | integer FK idea_drafts.id | Yes | Parent draft |
| originalName | text | Yes | File name |
| mimeType | text | Yes | MIME type |
| sizeBytes | integer | Yes | Raw bytes |
| previewEligible | integer boolean | Yes | Same policy as submitted attachments |
| content | blob | Yes | Binary content |
| createdAt | integer | Yes | Unix ms |

### Constraints

- `draftId` FK uses cascade delete.
- Same file count/total-size guard rails as submission flow.

## New Entity: idea_draft_field_values

Dynamic category field values saved for drafts.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | integer PK | Yes | Auto-increment primary key |
| draftId | integer FK idea_drafts.id | Yes | Parent draft |
| fieldKey | text | Yes | Dynamic key |
| value | text | Yes | Raw string value |
| createdAt | integer | Yes | Unix ms |
| updatedAt | integer | Yes | Unix ms |

### Constraints

- Unique key `(draftId, fieldKey)`.
- Cascade delete when draft is removed/submitted.

## Relationships

- users 1 -> N idea_drafts via `submitterId`.
- idea_drafts 1 -> N idea_draft_attachments via `draftId`.
- idea_drafts 1 -> N idea_draft_field_values via `draftId`.

## Validation Rules

### Draft save validation

- Authentication required.
- Ownership required for updates.
- Required-field checks are skipped.
- If present, dynamic values are validated as type-safe/coercible for active category rules.
- Invalid/unknown dynamic keys are rejected.
- Attachment limits still enforced (count/type/size) to prevent malformed stored payloads.

### Final submission from draft

- Apply full `submitIdeaSchema` and dynamic-field required validation.
- Persist to `ideas`, `idea_attachments`, `idea_field_values` in one transaction.
- Delete source draft rows in same transaction.

## State Transitions

- `new` -> `draft_saved`: first save creates draft.
- `draft_saved` -> `draft_saved`: repeated save updates same draft.
- `draft_saved` -> `submitted`: successful final submit creates idea and removes draft.
- `draft_saved` -> `deleted`: explicit submitter delete (if implemented in v1).
