# Research: Idea Submission System

**Feature**: `002-idea-submission`
**Date**: 2026-05-14
**Branch**: `002-idea-submission`

All NEEDS CLARIFICATION items and key unknowns from the Technical Context are resolved below.

---

## Decision 1: File Attachment Storage Strategy

**Decision**: Store file content as a SQLite BLOB (`blob('content', { mode: 'buffer' })`) in the `ideas` table alongside the idea record.

**Rationale**:
- FR-019 mandates atomic submission — if either the file or the idea record fails to save, the entire submission must be rolled back. Storing both in the same SQLite row and transaction guarantees this atomicity with no additional coordination logic.
- The 5 MB file size cap keeps the maximum BLOB size within SQLite's acceptable range (SQLite handles BLOBs up to its page-size limit, effectively several GB).
- No new infrastructure or dependencies are required — `blob()` is available in `drizzle-orm/sqlite-core` (already a project dependency).
- Avoids the two-phase problem of filesystem + DB: no orphaned files on disk if the DB transaction fails.

**Alternatives considered**:
- **Filesystem storage** (`data/uploads/{uuid}.ext` + path in DB): Better read performance for large files, but atomicity requires manual cleanup of the written file on DB failure. Adds complexity and risk of orphaned files.
- **External object storage** (S3, R2): Appropriate at scale but introduces a new service dependency, violating Constitution Principle III.

---

## Decision 2: Next.js 15 Server Action File Upload Pattern

**Decision**: Use `FormData` natively in Server Actions. Read the `File` object with `formData.get('file')` and convert to a Node.js `Buffer` via `Buffer.from(await file.arrayBuffer())`.

**Rationale**:
- Next.js 15 App Router Server Actions receive `FormData` natively — no `multipart` parsing library is needed.
- `File` (the Web API `Blob` subclass) is available in the Server Action environment. `arrayBuffer()` returns the raw bytes which can be stored as a SQLite BLOB buffer.
- Zero new dependencies. Pattern is consistent with the existing `'use server'` action conventions in `actions/auth.ts`.

**Alternatives considered**:
- **`multer` / `formidable`**: Not applicable to Server Actions — these are Express-era middleware incompatible with App Router.
- **`next-connect`**: Unnecessary complexity.

---

## Decision 3: Expandable Row / Drawer in Idea Listing

**Decision**: Use the `shadcn/ui` **Collapsible** component (`@radix-ui/react-collapsible`) to toggle full idea content within each listing row.

**Rationale**:
- `Collapsible` is already part of the shadcn/ui library available in this project. Install via `npx shadcn@latest add collapsible` — no external dep addition required beyond what shadcn's registry manages.
- Provides keyboard-accessible expand/collapse with WAI-ARIA `aria-expanded` out of the box (Constitution Principle IV compliance).
- Lighter than a modal/drawer: content stays inline in the list, preserving spatial context for the user.

**Alternatives considered**:
- **shadcn/ui Accordion**: Semantically implies a group where only one item is open at a time. `Collapsible` is the correct primitive for independent row toggles.
- **Custom CSS `details`/`summary`**: Valid HTML semantic, but loses the design system consistency of shadcn/ui.

---

## Decision 4: File Download API Route

**Decision**: Expose a dedicated Next.js API route at `app/api/ideas/[id]/attachment/route.ts` (GET) that reads the BLOB from the DB and streams it as an `application/octet-stream` (or the stored MIME type) `Response`.

**Rationale**:
- Server Actions cannot return file `Response` objects — they return serialisable data only.
- A `route.ts` GET handler can return `new Response(buffer, { headers: { 'Content-Type', 'Content-Disposition' } })` natively in Next.js 15 App Router with no new deps.
- The route enforces authentication (via `requireAuth()`) before serving any attachment, preventing unauthenticated file access.

**Alternatives considered**:
- **Serve via `public/` static folder**: Not viable for dynamic, permission-controlled binary content.
- **Base64 encode in JSON response**: Inflates payload size by ~33%, complicates client streaming.

---

## Decision 5: Zod Validation for File Fields

**Decision**: Validate file MIME type and size using `z.custom<File>()` with `.refine()` predicates in a new `lib/ideas/validation.ts` module.

**Rationale**:
- Zod 4 is already a project dependency. `z.custom<File>()` accepts a native `File` object and `.refine()` allows arbitrary async/sync predicates for MIME type check and byte-length check.
- Keeps validation co-located with the schema pattern established in `lib/auth/validation.ts`.
- MIME type checking on both client (file picker `accept` attribute) and server (Zod refine) provides defense-in-depth.

**Alternatives considered**:
- **`file-type` npm package**: More robust MIME detection (magic bytes), but adds a new dependency. Acceptable for v2 when upload volume justifies it.

---

## Summary Table

| Unknown | Decision | Alternatives Rejected |
|---------|----------|-----------------------|
| File storage mechanism | SQLite BLOB in `ideas` table | Filesystem (atomicity risk), S3/R2 (new service) |
| File upload in Server Action | Native `FormData.get('file')` → `Buffer.from(arrayBuffer())` | multer/formidable (Express-only), next-connect (overkill) |
| Expandable row component | shadcn/ui `Collapsible` | Accordion (wrong semantic), `details`/`summary` (breaks design system) |
| File download delivery | Authenticated `GET /api/ideas/[id]/attachment` route | `public/` static (no auth), base64 JSON (overhead) |
| File field validation | Zod `z.custom<File>().refine()` | `file-type` package (new dep), manual checks (scattered) |
