# Data Model: Idea Evaluation Workflow

**Feature**: `003-idea-evaluation-workflow`  
**Date**: 2026-05-15

## Overview

The model supports:
- Strict four-stage linear progression
- Mandatory decision comments
- Immutable audit history for timeline display
- Role-based timeline field visibility

## Enumerations

### Stage

| Value | Label | Sequence |
|---|---|---|
| `stage_1_triage` | Stage 1 Triage | 1 |
| `stage_2_department_review` | Stage 2 Department Review | 2 |
| `stage_3_feasibility` | Stage 3 Feasibility | 3 |
| `stage_4_final_executive_decision` | Stage 4 Final Executive Decision | 4 |

### Outcome

| Value | Meaning |
|---|---|
| `in_progress` | Idea is active in current stage, awaiting decision |
| `approved_to_next_stage` | Non-terminal approval that advances to next stage |
| `rejected` | Terminal rejection at current stage |
| `final_approved` | Terminal approval at Stage 4 |
| `final_rejected` | Terminal rejection at Stage 4 |

## Entity: Idea (extended)

Represents the current summary state for listing and card headers.

### Core attributes

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | number | Yes | Existing primary key |
| `title` | string | Yes | Existing |
| `submitterId` | number | Yes | Existing |
| `currentStage` | Stage | Yes | Current workflow stage |
| `currentOutcome` | Outcome | Yes | Derived from latest valid decision/event |
| `isTerminal` | boolean | Yes | True when no further progression allowed |
| `createdAt` | timestamp | Yes | Existing |
| `updatedAt` | timestamp | Yes | Existing |

### Validation rules

- New ideas start at `currentStage=stage_1_triage`, `currentOutcome=in_progress`, `isTerminal=false`.
- If `currentOutcome` is `rejected`, `final_approved`, or `final_rejected`, `isTerminal` must be true.

## Entity: IdeaDecisionEvent (new, immutable)

Single append-only event per transition/decision used to render timeline.

### Attributes

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | number | Yes | Primary key |
| `ideaId` | number | Yes | FK to idea |
| `stage` | Stage | Yes | Stage where decision occurred |
| `decisionType` | enum | Yes | `approve_next`, `reject`, `final_approve`, `final_reject`, `submitted` |
| `outcome` | Outcome | Yes | Normalized outcome value |
| `comment` | string | Yes for all decisions except `submitted` | Non-empty for approve/reject/final decisions |
| `decidedByUserId` | number | Yes for all decisions except optional system submission attribution | Actor for decision |
| `decidedAt` | timestamp | Yes | Event timestamp |
| `sequence` | number | Yes | Monotonic per idea for ordering |

### Validation rules

- Event rows are append-only; update/delete operations are forbidden.
- For `decisionType in (approve_next, reject, final_approve, final_reject)`, `comment` must be non-empty.
- For `decisionType=submitted`, comment may be empty and is optional.

## Entity: IdeaTimelineView (read projection)

Read model attached to idea cards.

### Shared visible fields (all authenticated viewers)

| Field | Type |
|---|---|
| `stage` | Stage label |
| `outcome` | Outcome label |
| `decidedAt` | timestamp |
| `sequence` | number |

### Privileged fields (submitter + admin only)

| Field | Type |
|---|---|
| `comment` | string |
| `decidedByUser` | display identity |

### Visibility rule

- Server decides field projection by requester context.
- Non-admin, non-submitter viewers never receive `comment` in response payload.

## Relationships

- One Idea has many IdeaDecisionEvents.
- One User can author many IdeaDecisionEvents.
- One Idea has one timeline projection built from ordered IdeaDecisionEvents.

## State Transitions

### Allowed transitions

| Current Stage | Current Outcome | Decision | Next Stage | Next Outcome | Terminal |
|---|---|---|---|---|---|
| Stage 1 | in_progress | approve_next | Stage 2 | in_progress | No |
| Stage 1 | in_progress | reject | Stage 1 | rejected | Yes |
| Stage 2 | in_progress | approve_next | Stage 3 | in_progress | No |
| Stage 2 | in_progress | reject | Stage 2 | rejected | Yes |
| Stage 3 | in_progress | approve_next | Stage 4 | in_progress | No |
| Stage 3 | in_progress | reject | Stage 3 | rejected | Yes |
| Stage 4 | in_progress | final_approve | Stage 4 | final_approved | Yes |
| Stage 4 | in_progress | final_reject | Stage 4 | final_rejected | Yes |

### Forbidden transitions

- Stage skipping (e.g., Stage 1 -> Stage 3)
- Backward transitions (e.g., Stage 3 -> Stage 2)
- Any transition when `isTerminal=true`

## Invariants

- Every progression/rejection/final decision must have a non-empty comment.
- Every decision event has actor identity and timestamp.
- Timeline ordering is deterministic by `(sequence, decidedAt)`.
- Current idea summary (`currentStage`, `currentOutcome`, `isTerminal`) must be consistent with latest valid event.
