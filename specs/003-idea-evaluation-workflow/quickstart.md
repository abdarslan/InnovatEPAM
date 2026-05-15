# Quickstart: Idea Evaluation Workflow

**Feature**: `003-idea-evaluation-workflow`  
**Date**: 2026-05-15

## Purpose

Validate end-to-end behavior for the updated 4-stage evaluation workflow and timeline visibility model.

## Prerequisites

- Dependencies installed: `npm install`
- Database ready: `npm run db:migrate` and optional `npm run db:seed`
- App running: `npm run dev`

## Core Paths

- Admin evaluation: `/admin/ideas`
- User idea listing/cards: `/ideas`

## Smoke Test 1: Linear Stage Progression

1. Sign in as admin.
2. Open `/admin/ideas` and pick an idea in Stage 1 Triage.
3. Approve to next stage with a non-empty comment.
4. Confirm idea moves to Stage 2 Department Review.
5. Repeat approval with comment for Stage 2 -> Stage 3.
6. Repeat approval with comment for Stage 3 -> Stage 4.
7. Submit Stage 4 final decision with non-empty comment.
8. Confirm idea is terminal and no further transitions are available.

Expected:
- No skip/backward options are accepted.
- Every approved progression requires comment.

## Smoke Test 2: Rejection at Intermediate Stage

1. Sign in as admin.
2. Move a different idea to Stage 2.
3. Reject with non-empty comment.

Expected:
- Idea becomes terminally rejected at Stage 2.
- Further transition attempts are blocked.

## Smoke Test 3: Comment Validation

1. Sign in as admin.
2. Attempt any progression decision with empty comment.

Expected:
- Validation error is returned.
- No event is persisted.
- Idea current stage/outcome remains unchanged.

## Smoke Test 4: Timeline Integrity

1. Open an idea card after multiple decisions.
2. Review timeline entries.

Expected:
- Entries are chronological.
- Each decision entry contains stage, outcome, actor, comment, and timestamp for privileged viewers.
- Submission appears as first timeline event.

## Smoke Test 5: Visibility Rule (Clarification B)

1. View the same idea card as:
   - idea submitter
   - admin
   - authenticated user who is neither submitter nor admin

Expected:
- Submitter/admin: can view comment text and deciding user metadata.
- Other authenticated viewers: can view stage/outcome progression but comment text is hidden.

## Integration Test Checklist

- Transition guard rejects skip and backward transitions.
- Terminal ideas reject additional decisions.
- Concurrency: stale state decision fails when another valid decision commits first.
- Timeline projection excludes restricted fields for non-privileged viewers.

## Task-Scope Notes

- `T011`/`T012`: prioritize transition legality and terminal-state protections first.
- `T019`/`T020`: timeline tests must assert both ordering and role-scoped projections.
- For every decision action test, validate both idea summary state and event-log append behavior.
- Use seeded admin + submitter identities so attribution fields are deterministic.

## Suggested Commands

```bash
npm run type-check
npm run lint
npm run test
npx vitest run tests/integration/ideas/
npx playwright test
```
