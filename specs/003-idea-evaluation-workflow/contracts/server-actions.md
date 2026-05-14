# Contracts: Server Actions

**Feature**: `003-idea-evaluation-workflow`
**Date**: 2026-05-14
**File**: `actions/ideas.ts` (extensions to the existing module)

All Server Actions return a discriminated `ActionResult` union and **MUST NOT throw** — all errors are caught and returned as `{ ok: false, error: string }`.

---

## Shared Types (extensions)

```typescript
// actions/ideas.ts — additions

export type IdeaStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected'

// Extended IdeaListItem — add status field (breaks no existing callers; new required field)
export type IdeaListItem = {
  id:            number
  title:         string
  category:      IdeaCategory
  submitterName: string
  submitterId:   number
  status:        IdeaStatus      // NEW
  createdAt:     number
  updatedAt:     number
  hasAttachment: boolean
}

// Admin-view item — includes evaluation data visible only to admin
export type AdminIdeaListItem = IdeaListItem & {
  reviewerName:    string | null  // display name of admin who started review, if any
  reviewStartedAt: number | null
  evaluation: {
    adminName: string
    status:    'accepted' | 'rejected'
    comment:   string | null
    createdAt: number
  } | null
}

// What the submitter sees for their own idea
export type IdeaEvaluationForSubmitter = {
  status:    'accepted' | 'rejected'
  comment:   string | null
  createdAt: number
}
```

---

## Modified Actions

### `getIdeasAction` (existing — extended)

Returns all submitted ideas, newest first. Now includes `status` on each item.

```typescript
export async function getIdeasAction(): Promise<ActionResult<IdeaListItem[]>>
```

**Change**: The returned `IdeaListItem` shape now includes `status: IdeaStatus`. All existing callers must handle this new field (no breaking change — additive).

**Auth**: Requires authenticated session. Returns `{ ok: false, error: 'UNAUTHENTICATED' }` if not logged in.

---

### `getIdeaDetailAction` (existing — extended)

Returns full idea detail. Now includes `status` and, when the requester is the submitter, the evaluation comment if present.

```typescript
export async function getIdeaDetailAction(
  id: number
): Promise<ActionResult<IdeaDetail & {
  status: IdeaStatus
  evaluation: IdeaEvaluationForSubmitter | null  // only populated when session.userId === submitterId
}>>
```

**Auth**: Requires authenticated session.

---

### `deleteIdeaAction` (existing — extended)

**Change**: Returns `{ ok: false, error: 'Ideas under review cannot be deleted.' }` when `idea.status === 'under_review'` (FR-022). No other behavior change.

```typescript
export async function deleteIdeaAction(id: number): Promise<ActionResult>
```

---

## New Actions

### `startReviewAction`

Transitions an idea from `submitted` → `under_review`. Records the acting admin's identity and timestamp.

```typescript
export async function startReviewAction(ideaId: number): Promise<ActionResult>
```

**Auth**: Requires admin role. Returns `{ ok: false, error: 'FORBIDDEN' }` for non-admin sessions (FR-014).

**Validation** (server-side, in order):
1. Session exists and role is `'admin'`.
2. Idea with `ideaId` exists.
3. `idea.status === 'submitted'` — returns `{ ok: false, error: 'Invalid status transition.' }` otherwise (FR-006).
4. `validateTransition('submitted', 'under_review')` guard confirms the transition.

**DB writes** (atomic):
- `UPDATE ideas SET status = 'under_review', reviewer_id = :adminId, review_started_at = :now WHERE id = :ideaId`

**Success response**: `{ ok: true, data: undefined }`

**Error responses**:
| Scenario | Error value |
|---|---|
| Not authenticated | `'UNAUTHENTICATED'` |
| Not admin | `'FORBIDDEN'` |
| Idea not found | `'Idea not found.'` |
| Invalid current status | `'Invalid status transition.'` |
| DB error | `'Failed to start review. Please try again.'` |

---

### `evaluateIdeaAction`

Transitions an idea from `under_review` → `accepted` or `rejected`. Creates the `idea_evaluations` record.

```typescript
export async function evaluateIdeaAction(payload: {
  ideaId:  number
  status:  'accepted' | 'rejected'
  comment?: string
}): Promise<ActionResult>
```

**Auth**: Requires admin role. Returns `{ ok: false, error: 'FORBIDDEN' }` for non-admin sessions (FR-014).

**Validation** (server-side, in order):
1. Session exists and role is `'admin'`.
2. `evaluateIdeaSchema.safeParse(payload)` — Zod discriminated union. If invalid: `{ ok: false, error: validationError }`.
3. Idea with `payload.ideaId` exists.
4. `idea.status === 'under_review'` — returns `{ ok: false, error: 'Invalid status transition.' }` otherwise (FR-006).
5. `validateTransition('under_review', payload.status)` guard confirms the transition.

**DB writes** (wrapped in a transaction):
- `UPDATE ideas SET status = :newStatus WHERE id = :ideaId`
- `INSERT INTO idea_evaluations (idea_id, admin_id, status, comment, created_at) VALUES (...)`

**Success response**: `{ ok: true, data: undefined }`

**Error responses**:
| Scenario | Error value |
|---|---|
| Not authenticated | `'UNAUTHENTICATED'` |
| Not admin | `'FORBIDDEN'` |
| Zod validation failure (e.g., missing rejection comment) | `'Rejection reason is required.'` |
| Idea not found | `'Idea not found.'` |
| Invalid current status | `'Invalid status transition.'` |
| DB error | `'Failed to save evaluation. Please try again.'` |

---

### `getAdminIdeasAction`

Returns all ideas for the admin management view, optionally filtered by a single status value. Includes evaluation data.

```typescript
export async function getAdminIdeasAction(
  statusFilter?: IdeaStatus
): Promise<ActionResult<AdminIdeaListItem[]>>
```

**Auth**: Requires admin role. Returns `{ ok: false, error: 'FORBIDDEN' }` for non-admin sessions (FR-013, FR-018).

**Filtering**: When `statusFilter` is provided and is a valid `IdeaStatus` value, results are filtered to that status. When omitted or `undefined`, all ideas are returned (FR-015).

**Joins**: Left join `idea_evaluations`, left join `users` (for submitter name, reviewer name, evaluator name). No attachment content included.

**Sort**: Newest first (`ideas.created_at DESC`).

**Success response**: `{ ok: true, data: AdminIdeaListItem[] }` (empty array when no ideas match)

**Error responses**:
| Scenario | Error value |
|---|---|
| Not authenticated | `'UNAUTHENTICATED'` |
| Not admin | `'FORBIDDEN'` |
| DB error | `'Failed to load ideas. Please try again.'` |

---

## Action Constraints

- All actions **MUST NOT** use `dangerouslySetInnerHTML` or return raw HTML.
- Comment text is stored as plain text; no sanitization beyond `max(1000)` is required (plain text only per Assumptions).
- All DB writes that touch both `ideas` and `idea_evaluations` in `evaluateIdeaAction` MUST be wrapped in a Drizzle transaction to guarantee atomicity (FR-022 rollback requirement).
- Evaluation records are never updated or deleted after insertion (FR-017).
