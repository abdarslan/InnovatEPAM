# Contracts: Server Actions

**Feature**: `003-idea-evaluation-workflow`  
**Date**: 2026-05-15  
**Scope**: Extensions to `actions/ideas.ts`

All actions return structured results and enforce authorization and transition validation on the server.

## Shared Types

```typescript
export type EvaluationStage =
  | 'stage_1_triage'
  | 'stage_2_department_review'
  | 'stage_3_feasibility'
  | 'stage_4_final_executive_decision'

export type DecisionType =
  | 'approve_next'
  | 'reject'
  | 'final_approve'
  | 'final_reject'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }
```

## 1) Decide Stage Transition

Applies an admin decision at current stage, validates linear flow, records immutable event, and updates current idea summary state.

```typescript
export async function decideIdeaStageAction(input: {
  ideaId: number
  decision: DecisionType
  comment: string
}): Promise<ActionResult>
```

### Authorization

- Requires authenticated admin user.
- Non-admin requests return `FORBIDDEN`.

### Validation

- `comment` must be non-empty for all decisions.
- Decision must be valid for current stage and non-terminal idea state.
- Skip/backward transitions are rejected.

### Side Effects

- Insert immutable decision event.
- Update idea `currentStage/currentOutcome/isTerminal` atomically.

### Errors

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `IDEA_NOT_FOUND`
- `INVALID_TRANSITION`
- `VALIDATION_ERROR`
- `CONFLICT_STALE_STATE`

## 2) Get Admin Ideas

Returns ideas for admin management with full timeline metadata visibility.

```typescript
export async function getAdminIdeasAction(input?: {
  stage?: EvaluationStage
  outcome?: 'in_progress' | 'rejected' | 'final_approved' | 'final_rejected'
}): Promise<ActionResult<Array<{
  id: number
  title: string
  submitterName: string
  currentStage: EvaluationStage
  currentOutcome: string
  isTerminal: boolean
}>>>
```

### Authorization

- Requires authenticated admin user.

### Notes

- Default returns all ideas.
- Filtering is optional.

## 3) Get Idea Timeline (Viewer-Aware Projection)

Returns timeline entries for idea card with role-based field projection.

```typescript
export async function getIdeaTimelineAction(input: {
  ideaId: number
}): Promise<ActionResult<Array<{
  sequence: number
  stage: EvaluationStage
  outcome: string
  decidedAt: number
  // Optional based on authorization context:
  comment?: string
  decidedByUser?: string
}>>>
```

### Authorization

- Requires authenticated user with access to idea card context.

### Projection Rules

- Submitter or admin: include `comment` and `decidedByUser`.
- Other authenticated viewers: omit `comment`; include non-sensitive progression fields only.

### Errors

- `UNAUTHENTICATED`
- `IDEA_NOT_FOUND`
- `FORBIDDEN` (if idea card itself not viewable)

## 4) Get Idea List Item Summary (Existing List Extension)

Existing list/read actions must include current stage and current outcome for status display.

```typescript
export type IdeaListItem = {
  id: number
  title: string
  currentStage: EvaluationStage
  currentOutcome: string
  isTerminal: boolean
  // existing fields omitted
}
```

## 5) Contract Invariants

- All transition decisions are server-authoritative.
- Comment requirement is enforced before persistence.
- Decision events are immutable after insertion.
- Timeline projection policy is enforced server-side.
- Transition write and summary update happen in one transaction.
