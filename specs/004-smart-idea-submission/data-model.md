# Data Model: Smart Idea Submission Forms

**Feature**: `004-smart-idea-submission`
**Date**: 2026-05-14
**Storage**: SQLite via Drizzle ORM (`drizzle-orm/sqlite-core`)

## Existing Entity: ideas (extended behavior)

The existing `ideas` table remains the parent record for every submission.

- Existing shared fields remain unchanged (`title`, `description`, `category`, submitter and attachment metadata).
- Category-specific data is moved to child records in `idea_field_values`.
- `category` continues to identify which rule-set applies at submission/view time.

### Category scope

- Existing categories remain supported.
- `event_plan` is added as a valid category value for v1 examples.

## New Entity: idea_category_field_rules

Admin-managed metadata that defines which additional fields apply per category.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | integer PK | Yes | Auto-increment primary key |
| category | text | Yes | Idea category key, e.g. `event_plan` |
| fieldKey | text | Yes | Stable machine key (e.g. `planned_date`) |
| label | text | Yes | UI label shown on form |
| fieldType | text enum | Yes | `text` | `number` | `date` |
| required | integer boolean | Yes | `1` required, `0` optional |
| minValue | real nullable | No | Numeric lower bound when applicable |
| maxValue | real nullable | No | Numeric upper bound when applicable |
| minLength | integer nullable | No | Text length lower bound |
| maxLength | integer nullable | No | Text length upper bound |
| helpText | text nullable | No | Optional UI hint |
| sortOrder | integer | Yes | Rendering order within category |
| isActive | integer boolean | Yes | Soft enable/disable |
| createdAt | integer | Yes | Unix ms |
| updatedAt | integer | Yes | Unix ms |
| updatedByAdminId | integer FK users.id | Yes | Audit actor |

### Constraints

- Unique key: `(category, fieldKey)`.
- `fieldType` allowed values: `text`, `number`, `date`.
- Only admin users can create/update rows (application-level auth guard).

## New Entity: idea_field_values

Per-submission key/value records for category-specific entries.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | integer PK | Yes | Auto-increment primary key |
| ideaId | integer FK ideas.id | Yes | Parent idea |
| ruleId | integer FK idea_category_field_rules.id | Yes | Rule snapshot reference |
| fieldKey | text | Yes | Denormalized key for resilient reads |
| value | text | Yes | Raw submitted value |
| createdAt | integer | Yes | Unix ms |
| updatedAt | integer | Yes | Unix ms |

### Constraints

- Unique key: `(ideaId, fieldKey)`.
- Deleting an idea cascades/deletes related field values.
- Values are validated against active rule-set before insert/update.

## Relationships

- users (admin) 1 -> N idea_category_field_rules via `updatedByAdminId`.
- ideas 1 -> N idea_field_values via `ideaId`.
- idea_category_field_rules 1 -> N idea_field_values via `ruleId`.

## Validation Rules

### Shared submission validation

- Existing title/description/category/attachment constraints from `submitIdeaSchema` remain enforced.

### Dynamic category validation

For selected category:

1. Load active rules ordered by `sortOrder`.
2. For each rule:
   - If required and missing: reject with field-specific message.
   - If `number`: parse numeric and enforce `minValue`/`maxValue` when provided.
   - If `date`: enforce valid date string; Event Plan date remains optional in v1.
   - If `text`: enforce `minLength`/`maxLength` when provided.
3. Ignore/reject unknown field keys not present in active rules.
4. Persist only applicable keys for selected category.

## State and Change Behavior

- Changing selected category in the form updates visible dynamic fields immediately.
- Shared core values remain intact across category changes.
- Non-applicable dynamic values are excluded from submission payload.
- For this test project v1, historical migration/backfill is not required; DB reset is acceptable.

## Seeded v1 Event Plan example

- Category: `event_plan`
- Field 1:
  - `fieldKey`: `planned_date`
  - `fieldType`: `date`
  - `required`: `false`
- Field 2:
  - `fieldKey`: `planned_attendees`
  - `fieldType`: `number`
  - `required`: `false`
  - `minValue`: `1`
