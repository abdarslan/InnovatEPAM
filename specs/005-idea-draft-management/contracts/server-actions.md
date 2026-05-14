# Contracts: Server Actions

**Feature**: `005-idea-draft-management`
**Date**: 2026-05-15
**Primary Files**: `actions/idea-drafts.ts`, `actions/ideas.ts`

All actions return a discriminated result union:

```ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }
```

## Shared Types

```ts
export type IdeaDraftSummary = {
  id: number
  title: string | null
  category: string | null
  updatedAt: number
}

export type IdeaDraftDetail = {
  id: number
  title: string | null
  description: string | null
  category: string | null
  updatedAt: number
  attachments: Array<{
    id: number
    originalName: string
    mimeType: string
    sizeBytes: number
    previewEligible: boolean
  }>
  fieldValues: Record<string, string>
}
```

## New Actions

### upsertIdeaDraftAction

Creates or updates a draft owned by current submitter.

```ts
export async function upsertIdeaDraftAction(
  formData: FormData
): Promise<ActionResult<{ draftId: number }>>
```

Rules:

- Requires authenticated submitter session. Admin role returns `{ ok: false }`.
- Accepts empty or partial fields.
- If `draftId` provided, updates owner draft; otherwise creates new draft.
- Persists dynamic values (keyed by `dynamic_<fieldKey>` FormData entries) and attachments.

Error examples:

- `You must be logged in.`
- `Admins do not have access to draft management.`
- `Draft not found.`
- `Not authorized.`

### getMyIdeaDraftsAction

Lists current submitter drafts for dashboard.

```ts
export async function getMyIdeaDraftsAction(): Promise<ActionResult<IdeaDraftSummary[]>>
```

Rules:

- Returns only drafts where `submitterId === session.userId`.
- Sorted by `updatedAt DESC`.
- Admin role returns `{ ok: false, error: 'Admins do not have access to draft management.' }`.

### getIdeaDraftDetailAction

Returns a single owner draft for resume flow.

```ts
export async function getIdeaDraftDetailAction(
  draftId: number
): Promise<ActionResult<IdeaDraftDetail>>
```

Rules:

- Owner-only access. Admin role returns `{ ok: false }`.
- `fieldValues` is a `Record<string, string>` keyed by `fieldKey`.
- Attachments do not include binary `content` field (metadata only).

### deleteIdeaDraftAction

Deletes a draft owned by current submitter.

```ts
export async function deleteIdeaDraftAction(
  draftId: number
): Promise<ActionResult>
```

Rules:

- Owner-only access. Admin role returns `{ ok: false }`.
- Cascade deletes draft attachments and draft dynamic values (enforced by SQLite FK cascade).

## Modified Action

### submitIdeaAction

Supports submission from both standard form and resumed draft context.

```ts
export async function submitIdeaAction(
  formData: FormData
): Promise<ActionResult<{ id: number }>>
```

Draft-related behavior:

- If `draftId` field exists in FormData (non-empty string coerced to int), verifies draft ownership before any DB operations.
- Performs full submit validation (required fields enforced as per `submitIdeaSchema`).
- In one SQLite transaction:
  1. Creates `ideas` row,
  2. Creates `idea_attachments` rows,
  3. Creates `idea_field_values` rows,
  4. Deletes source draft row from `idea_drafts` (cascades to `idea_draft_attachments` and `idea_draft_field_values`).

Error examples:

- `Draft not found or access denied.`
- `Submission failed. Please try again.`

## Authorization and Visibility Contract

- Draft list/detail/update/delete endpoints are submitter-owner scoped.
- Admin role does not bypass draft visibility constraints.
- Existing admin idea actions (`getAdminIdeasAction`, evaluation actions) continue reading only submitted `ideas` data and never include drafts.
