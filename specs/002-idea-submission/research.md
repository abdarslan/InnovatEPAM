# Research: Idea Submission System (Multi-attachment + Multimedia Preview)

**Feature**: `002-idea-submission`
**Date**: 2026-05-14
**Branch**: `002-idea-submission`

All planning unknowns from the updated spec are resolved below.

---

## Decision 1: Attachment Storage Model

**Decision**: Move from inline single-file columns on `ideas` to a dedicated `idea_attachments` table (`ideas` 1:N `idea_attachments`), keeping binary content in SQLite BLOB columns.

**Rationale**:
- Multi-file support (up to 5 attachments) is naturally represented as 1:N rows.
- Transactional rollback required by FR-019 remains straightforward: insert/update idea and attachment rows in one DB transaction.
- No new storage service or dependency is introduced.
- Attachment-level operations (preview, download, remove individual files) become simpler and safer.

**Alternatives considered**:
- **Keep multiple attachment columns on `ideas`**: Does not scale cleanly and creates brittle schema evolution.
- **Filesystem/object storage references**: Adds infrastructure and orphan cleanup complexity.

---

## Decision 2: Upload Payload Contract

**Decision**: Continue using Server Action `FormData`, but switch to repeated attachment fields (`attachments`) and explicit remove semantics for edit (`removeAttachmentIds`).

**Rationale**:
- Native App Router FormData support already exists in the codebase.
- Repeated field names are a standard browser-native mechanism for multi-file uploads.
- Avoids JSON/base64 payload inflation and retains good browser compatibility.

**Alternatives considered**:
- **JSON API with base64 payloads**: Higher payload overhead and unnecessary complexity.
- **Third-party multipart libraries**: Not needed for Server Actions and violates minimal dependency principle.

---

## Decision 3: Preview + Download Delivery Contract

**Decision**: Expose per-attachment authenticated route `GET /api/ideas/[id]/attachments/[attachmentId]` with optional `?download=1`; default response is inline for preview-supported types and attachment disposition for others.

**Rationale**:
- Supports both inline preview and explicit download without duplicating endpoints.
- Attachment ID addressing is required in a multi-file model.
- Aligns with FR-011 by enforcing auth for all preview/download surfaces.

**Alternatives considered**:
- **Single legacy route (`/attachment`)**: Ambiguous in multi-file scenarios.
- **Separate preview and download endpoints**: More route surface with little benefit.

---

## Decision 4: Validation and Limits

**Decision**: Validate constraints server-side with Zod + procedural checks:
- count <= 5
- per-file size <= 10 MB
- aggregate size <= 25 MB
- MIME allowlist per spec

**Rationale**:
- Keeps authoritative enforcement server-side regardless of client behavior.
- Procedural aggregate checks complement schema-level single-file checks.
- Preserves existing validation architecture.

**Alternatives considered**:
- **Client-only enforcement**: Not trustworthy.
- **MIME sniffing package**: More robust but adds dependency not required for this scope.

---

## Decision 5: Post-submission Attachment Editing

**Decision**: Owners may add/upload/delete individual attachments after submission while they retain edit permissions on their own ideas.

**Rationale**:
- Matches latest clarification and keeps evaluation workflow out of scope.
- Avoids coupling this feature to downstream review states.
- Provides clear, testable owner-centric behavior.

**Alternatives considered**:
- **Attachment lock after a later workflow state**: Out of scope for this spec.
- **Full-set replacement only**: Worse UX and unnecessary data churn.

---

## Decision 6: Documentation Freshness Gate Handling

**Decision**: Proceed with in-repo locked versions and documented risk note because Context7 calls failed with API key auth error in this environment.

**Rationale**:
- Constitution permits proceeding with explicit risk and follow-up when Context7 is unavailable.
- Repository package versions (`next` 15.5.18, `drizzle-orm` 0.45.2) are known and stable in current project context.

**Alternatives considered**:
- **Block planning until Context7 restored**: Unnecessary delivery delay for a bounded update.

### Implementation Follow-up

- Re-run Context7 verification for Next.js App Router file handling and Drizzle relation/migration guidance before merging, once valid credentials are available.

---

## Summary Table

| Unknown | Decision | Alternatives Rejected |
|---|---|---|
| Multi-file schema shape | Normalize to `idea_attachments` table | Repeating columns, external storage pointers |
| Upload payload format | Repeated FormData `attachments` fields | Base64 JSON, multipart libs |
| Preview/download endpoint | Authenticated per-attachment route with optional `download` mode | Legacy single route only, split preview/download routes |
| Validation approach | Server-side count/size/type/aggregate enforcement | Client-only validation, new MIME lib |
| Post-submission attachment edits | Owner add/remove allowed with existing edit permission | Workflow-state lock, whole-set replacement |
| Freshness gate constraint | Proceed with risk note due Context7 auth failure | Hard block on plan generation |
