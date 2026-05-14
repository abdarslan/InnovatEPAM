# ADR-0009: Separate Draft Storage from Submitted Ideas

**Status**: Accepted
**Date**: 2026-05-15
**Feature**: `005-idea-draft-management`
**Deciders**: Speckit plan phase

## Context

Feature 005 introduces owner-only draft management for idea preparation. Drafts can be empty/partial, are shown only in the submitter dashboard, and must never be visible to admins or non-owners. On successful final submission, the draft must be deleted and only the submitted idea remains.

The existing data model already uses `ideas`, `idea_attachments`, and `idea_field_values` for submitted content and reviewer/admin workflows.

## Decision

Store drafts in dedicated draft tables:

- `idea_drafts`
- `idea_draft_attachments`
- `idea_draft_field_values`

Do not add a `draft` status to the existing `ideas` table.

## Alternatives Considered

### Option A: Add `draft` to `ideas.status` (rejected)

Pros:

- Reuses existing table and some query paths.

Cons:

- High leakage risk: existing list/admin/evaluation queries must all remember to filter out draft rows.
- Draft-specific relaxed validation and lifecycle differ from submitted ideas and increase branching complexity in shared logic.
- Contradicts requirement emphasis that draft records remain separate from submitted idea workflows.

### Option B: Dedicated draft tables (chosen)

Pros:

- Strong separation of concerns: draft lifecycle isolated from evaluation/public listing surfaces.
- Reduces accidental exposure risk for admins/non-owners.
- Clean transactional submit flow: convert draft to submitted idea and remove draft atomically.
- Preserves existing idea workflow behavior with minimal regression risk.

Cons:

- Adds migration/schema complexity with additional tables.
- Requires explicit conversion logic from draft tables to submitted tables.

## Consequences

- `lib/db/schema.ts` gains draft tables and related exported types.
- Migration `lib/db/migrations/0004_idea_drafts.sql` creates draft tables/indexes.
- New actions file `actions/idea-drafts.ts` handles owner-scoped draft operations.
- `submitIdeaAction` in `actions/ideas.ts` supports draft-origin submission and deletes draft atomically after success.
- Admin idea-management actions remain unchanged in data source scope (`ideas` only).
