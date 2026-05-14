# ADR-0008: Idea Attachments Normalization

**Status**: Accepted
**Date**: 2026-05-14
**Feature**: `002-idea-submission`
**Deciders**: Speckit implement phase

---

## Context

The idea submission feature has already shipped with a single attachment stored directly on the `ideas` table as inline metadata and a BLOB column. Feature `002-idea-submission` now expands this behavior to support up to five attachments per idea, authenticated preview/download for each attachment, and owner-managed add/remove operations after submission.

Keeping multiple attachment columns on `ideas` would make the schema brittle, complicate attachment-level routes, and make post-submission add/remove flows harder to model. The platform still needs transactional persistence inside SQLite without introducing external storage or new dependencies.

---

## Decision

Keep attachment binary content in SQLite, but normalize storage into a dedicated `idea_attachments` table related to `ideas` with a one-to-many association.

The new table stores one row per attachment with:

- `idea_id`
- `original_name`
- `mime_type`
- `size_bytes`
- `preview_eligible`
- `content`
- `created_at`

The legacy inline attachment columns on `ideas` are migrated into the new table and then removed from the main idea record shape.

---

## Consequences

### Positive

- Supports bounded multi-attachment submissions without denormalized columns.
- Keeps create, update, and delete operations transactional within a single SQLite database.
- Enables attachment-level preview/download endpoints and owner-managed removal semantics.
- Preserves the project constraint of avoiding new infrastructure and external dependencies.

### Negative

- Reads that need full attachment metadata now require a join or secondary query.
- Migration complexity increases because legacy single-attachment rows must be backfilled.
- SQLite database growth remains tied to binary attachment volume.

### Neutral

- The prior storage decision to keep BLOBs in SQLite remains valid; only the table shape changes.

---

## Supersedes

- [ADR-0005: Idea Attachment Storage Strategy](adr-0005-idea-attachment-storage.md)

## Related ADRs

- [ADR-0001: SQLite + Drizzle Decision](adr-0001-sqlite-drizzle-decision.md)