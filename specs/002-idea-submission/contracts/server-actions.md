# Contracts: Server Actions & API Routes (Multi-attachment)

**Feature**: `002-idea-submission`
**Date**: 2026-05-14
**Files**: `actions/ideas.ts`, `app/api/ideas/[id]/attachments/[attachmentId]/route.ts`

All Server Actions return a discriminated `ActionResult` union and must surface controlled error strings.

---

## Shared Types

```typescript
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type IdeaAttachmentMeta = {
  id: number
  originalName: string
  mimeType: string
  sizeBytes: number
  previewEligible: boolean
}

type IdeaListItem = {
  id: number
  title: string
  category: IdeaCategory
  submitterName: string
  submitterId: number
  createdAt: number
  updatedAt: number
  attachmentCount: number
}

type IdeaDetail = IdeaListItem & {
  description: string
  attachments: IdeaAttachmentMeta[]
}
```

---

## `getIdeasAction`

```typescript
export async function getIdeasAction(): Promise<ActionResult<IdeaListItem[]>>
```

**Auth**: Required.

**Success**: Returns ideas newest first with attachment count metadata.

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to view ideas."` |
| Query error | `"Failed to load ideas. Please try again."` |

---

## `getIdeaDetailAction`

```typescript
export async function getIdeaDetailAction(id: number): Promise<ActionResult<IdeaDetail>>
```

**Auth**: Required.

**Success**: Returns full idea description and attachment metadata array (no binary content).

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to view ideas."` |
| Not found | `"Idea not found."` |
| Query error | `"Failed to load idea. Please try again."` |

---

## `submitIdeaAction`

```typescript
export async function submitIdeaAction(formData: FormData): Promise<ActionResult<{ id: number }>>
```

**Auth**: Required.

**FormData fields**:

| Field | Type | Rules |
|---|---|---|
| `title` | `string` | Required, 3-255 |
| `description` | `string` | Required, 10-5000 |
| `category` | `string` | Required enum |
| `attachments` | `File[]` (repeated key) | Optional, 0-5 files, each <= 10 MB, total <= 25 MB, MIME allowlist |

**Success**: `{ ok: true, data: { id } }`

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to submit an idea."` |
| Validation failure | First validation message |
| Transaction failure | `"Submission failed. Please try again."` |

---

## `updateIdeaAction`

```typescript
export async function updateIdeaAction(id: number, formData: FormData): Promise<ActionResult<void>>
```

**Auth**: Required; owner only.

**FormData fields**:

| Field | Type | Rules |
|---|---|---|
| `title` | `string` | Required |
| `description` | `string` | Required |
| `category` | `string` | Required |
| `attachments` | `File[]` (repeated key) | Optional new uploads, subject to limits |
| `removeAttachmentIds` | `string` (JSON array or repeated key) | Optional attachment IDs owner wants removed |

**Behavior**:
- Existing attachments remain unless explicitly removed.
- New attachments are appended unless limits would be exceeded.

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to edit an idea."` |
| Not found | `"Idea not found."` |
| Not owner | `"You are not authorised to edit this idea."` |
| Validation failure | First validation message |
| Transaction failure | `"Update failed. Please try again."` |

---

## `deleteIdeaAction`

```typescript
export async function deleteIdeaAction(id: number): Promise<ActionResult<void>>
```

**Auth**: Required; owner or admin.

**Behavior**: Hard delete idea and related attachments in one operation.

**Failure cases**:

| Condition | `error` value |
|---|---|
| Not authenticated | `"You must be logged in to delete an idea."` |
| Not found | `"Idea not found."` |
| Not authorised | `"You are not authorised to delete this idea."` |
| Delete failure | `"Delete failed. Please try again."` |

---

## API Route: `GET /api/ideas/[id]/attachments/[attachmentId]`

Returns attachment binary for preview/download, auth-protected.

**Method**: `GET`

**Auth**: Required session.

**Params**:

| Source | Name | Type |
|---|---|---|
| Path | `id` | idea id |
| Path | `attachmentId` | attachment id |
| Query | `download` | `"1"` to force download |

**Response behavior**:
- `Content-Type`: stored MIME type
- `Content-Disposition`:
  - `inline` when preview-eligible and `download` is not set
  - `attachment` when `download=1` or preview not eligible

**Error responses**:

| Condition | Status | Body |
|---|---|---|
| Unauthenticated | `401` | `Unauthorized` |
| Invalid IDs | `400` | `Bad Request` |
| Not found / mismatched relation | `404` | `Not Found` |
| Server error | `500` | `Internal Server Error` |

---

## Backward Compatibility Note

Existing legacy route `GET /api/ideas/[id]/attachment` may be retained temporarily as a compatibility shim for single-attachment rows during migration, then removed once all callers use attachment-id routing.
