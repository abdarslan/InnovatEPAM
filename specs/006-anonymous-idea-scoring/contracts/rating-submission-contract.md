# Rating Submission Contract

## Endpoint Surface
- Transport: Next.js server action (`decideIdeaStageAction`) in `actions/ideas.ts`
- Caller: Admin evaluation UI (`components/ideas/EvaluationPanel.tsx`)

## Input
- `ideaId: number` (required, positive integer)
- `decision: 'approve_next' | 'reject' | 'final_approve' | 'final_reject'` (required)
- `comment: string` (required, trimmed, 1-1000 chars)
- `ratingScore?: number` (required for stage 2-4 approval/finalization, integer 1-5)

## Rules
- Stage 1 (`stage_1_triage`) does not accept ratings.
- Stage 2 approval requires Alignment rating.
- Stage 3 approval requires Feasibility rating.
- Stage 4 final approve/final reject requires Impact rating.
- Rating is immutable once persisted for `(ideaId, stage)`.

## Success Response
```json
{ "ok": true, "data": {} }
```

## Failure Responses
```json
{ "ok": false, "error": "VALIDATION_ERROR" }
```
```json
{ "ok": false, "error": "RATING_REQUIRED" }
```
```json
{ "ok": false, "error": "RATING_ALREADY_SUBMITTED" }
```
```json
{ "ok": false, "error": "INVALID_TRANSITION" }
```
