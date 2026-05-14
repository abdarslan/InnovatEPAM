# Contracts: Server Actions & API Routes

**Feature**: `002-idea-submission`
**Date**: 2026-05-14
**Files**: `actions/ideas.ts`, `app/api/ideas/[id]/attachment/route.ts`

All Server Actions return a discriminated `ActionResult` union. They **MUST NOT throw** — all errors are caught and returned as `{ ok: false, error: string }`.

---

## Shared Types

```typescript
// actions/ideas.ts
type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

type IdeaListItem = {
  id:           number
  title:        string
  category:     IdeaCategory
  submitterName: string
  createdAt:    number
  updatedAt:    number
  hasAttachment: boolean
}

type IdeaDetail = IdeaListItem & {
  description:        string
  attachmentName:     string | null
  attachmentSize:     number | null
  attachmentMimeType: string | null
}
```

---

## `getIdeasAction`

Returns all submitted ideas, newest first. No attachment content is included.

```typescript
export async function getIdeasAction(): Promise<ActionResult<IdeaListItem[]>>
```

**Auth**: Requires authenticated session (`requireAuth()`). Returns `{ ok: false, error: 'UNAUTHENTICATED' }` if not logged in.

**Success response**: `{ ok: true, data: IdeaListItem[] }` (empty array when no ideas exist)

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to view ideas."` |
| DB error | `"Failed to load ideas. Please try again."` |

---

## `getIdeaDetailAction`

Returns full idea details (including description) for a single idea. No attachment content.

```typescript
export async function getIdeaDetailAction(
  id: number
): Promise<ActionResult<IdeaDetail>>
```

**Auth**: Requires authenticated session.

**Success response**: `{ ok: true, data: IdeaDetail }`

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to view ideas."` |
| Idea not found | `"Idea not found."` |
| DB error | `"Failed to load idea. Please try again."` |

---

## `submitIdeaAction`

Creates a new idea. Accepts a `FormData` object (required for file upload). Saves idea + optional attachment atomically in a single DB transaction.

```typescript
export async function submitIdeaAction(
  formData: FormData
): Promise<ActionResult<{ id: number }>>
```

**Auth**: Requires authenticated session.

**FormData fields**:

| Field | Type | Validation |
|-------|------|------------|
| `title` | `string` | Required; 3–255 chars after trim |
| `description` | `string` | Required; 10–5000 chars after trim |
| `category` | `string` | Required; one of `IDEA_CATEGORIES` |
| `attachment` | `File \| null` | Optional; ≤ 5 MB; MIME: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/png`, `image/jpeg` |

**Success response**: `{ ok: true, data: { id: number } }`

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to submit an idea."` |
| Validation failure | First Zod error message (e.g., `"Title must be at least 3 characters."`) |
| File too large | `"Attachment must be 5 MB or smaller."` |
| Disallowed file type | `"Only PDF, DOCX, PNG, and JPG files are allowed."` |
| DB / save error | `"Submission failed. Please try again."` |

---

## `updateIdeaAction`

Updates an existing idea. Only the submitter of the idea may call this action.

```typescript
export async function updateIdeaAction(
  id: number,
  formData: FormData
): Promise<ActionResult<void>>
```

**Auth**: Requires authenticated session. Verifies `session.userId === idea.submitterId`.

**FormData fields**: Same as `submitIdeaAction`.

**Success response**: `{ ok: true, data: undefined }`

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to edit an idea."` |
| Idea not found | `"Idea not found."` |
| Not the submitter | `"You are not authorised to edit this idea."` |
| Validation failure | First Zod error message |
| DB / save error | `"Update failed. Please try again."` |

---

## `deleteIdeaAction`

Permanently deletes an idea. The submitter may delete their own idea; admin-role users may delete any idea.

```typescript
export async function deleteIdeaAction(
  id: number
): Promise<ActionResult<void>>
```

**Auth**: Requires authenticated session. Permits if `session.userId === idea.submitterId` OR `session.role === 'admin'`.

**Success response**: `{ ok: true, data: undefined }`

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to delete an idea."` |
| Idea not found | `"Idea not found."` |
| Not submitter or admin | `"You are not authorised to delete this idea."` |
| DB error | `"Delete failed. Please try again."` |

---

## API Route: `GET /api/ideas/[id]/attachment`

Serves the raw file content for an idea's attachment. Protected — requires an active session cookie.

**File**: `app/api/ideas/[id]/attachment/route.ts`

**Method**: `GET`

**Auth**: Reads the session cookie via `requireAuth()`. Returns `401` if not authenticated.

**Parameters**:

| Source | Name | Type | Description |
|--------|------|------|-------------|
| Path | `id` | `string` | Idea ID (parsed as integer) |

**Success response**: Binary `Response` with headers:
- `Content-Type: <stored MIME type>`
- `Content-Disposition: attachment; filename="<stored filename>"`
- `Content-Length: <byte length>`

**Error responses**:

| Condition | HTTP Status | Body |
|-----------|-------------|------|
| Not authenticated | `401` | `Unauthorized` |
| Invalid `id` param | `400` | `Bad Request` |
| Idea not found or no attachment | `404` | `Not Found` |
| DB error | `500` | `Internal Server Error` |
