# ADR-0005: Idea Attachment Storage Strategy

**Status**: Superseded by adr-0008-idea-attachments-normalization.md
**Date**: 2026-05-14
**Feature**: `002-idea-submission`
**Deciders**: Speckit plan phase

---

## Context

The Idea Submission System (feature `002`) allows users to attach a single file (≤ 5 MB; PDF, DOCX, PNG, JPG/JPEG) to an idea submission. FR-019 mandates that the entire submission (idea record + attachment) is treated as a single atomic operation — if either component fails to persist, the whole submission must be rolled back.

Three storage strategies were considered:

1. **SQLite BLOB** — store binary content as a `blob` column in the `ideas` table alongside the idea record.
2. **Local filesystem** — write the file to a `data/uploads/` directory and store the path in the DB.
3. **External object storage** (S3, Cloudflare R2) — upload to a managed service and store the URL in the DB.

---

## Decision

**Store file content as a SQLite BLOB** using Drizzle ORM's `blob('attachment_content', { mode: 'buffer' })` column in the `ideas` table.

---

## Rationale

### Atomicity (FR-019)
Storing the BLOB in the same row as the idea record means a single SQLite `INSERT` / `UPDATE` transaction covers both. If the transaction is rolled back, no orphaned file is left behind. Filesystem and object storage strategies require a two-phase approach: write file → write DB row → rollback file if DB fails. This coordination logic adds complexity and failure surface.

### No New Dependencies
`blob()` is available in `drizzle-orm/sqlite-core`, which is already a project dependency. No new packages are required (Constitution Principle III).

### File Size Constraint
The 5 MB maximum cap keeps each BLOB within a size that SQLite handles comfortably. SQLite's theoretical BLOB limit is ~2 GB per value; WAL mode (already enabled) mitigates read/write contention during BLOB writes.

### Simplicity
Keeping all persistent data in one SQLite file is consistent with the existing project architecture (ADR-0001). There is no need to manage a separate upload directory, handle file permissions, or implement cleanup jobs for orphaned files.

---

## Consequences

### Positive
- True atomic save/rollback at zero additional code cost.
- No file cleanup logic required on failure paths.
- Single backup artefact (the SQLite DB file) covers all data including attachments.
- Consistent with existing storage layer (ADR-0001).

### Negative
- SQLite database file size grows with each attachment; large numbers of attachments will bloat the DB.
- BLOBs are returned in full on every attachment read — no range request / partial streaming support.
- Not suitable at scale (many users, large files); this is acceptable for v1 (internal tool, small team).

### Neutral
- File serving requires an authenticated API route (`GET /api/ideas/[id]/attachment`) that reads the BLOB and returns it as a binary `Response`. This is a standard Next.js App Router pattern.

---

## Supersedes

None.

## Related ADRs

- [ADR-0001: SQLite + Drizzle Decision](adr-0001-sqlite-drizzle-decision.md)
