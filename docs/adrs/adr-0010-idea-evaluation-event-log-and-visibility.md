# ADR-0010: Idea Evaluation Event Log and Visibility

- Status: Accepted
- Date: 2026-05-15

## Context

The idea evaluation workflow requires:
- a strict 4-stage pipeline,
- immutable decision history,
- actor and timestamp accountability,
- role-scoped timeline field visibility.

A simple mutable status column cannot preserve complete audit history or enforce visibility safely.

## Decision

Use an append-only `idea_decision_events` table as the source of truth for evaluation history.

Keep summary state on `ideas` (`currentStage`, `currentOutcome`, `isTerminal`) for efficient list rendering.

Enforce visibility on the server when returning timeline entries:
- Admin and submitter see full details (including comments and deciding user).
- Other authenticated viewers see stage/outcome/timestamp progression without comments.

## Consequences

- Benefits:
  - Full, immutable audit trail.
  - Clear accountability for every decision.
  - Security-safe data projection for mixed-visibility timeline views.
  - Efficient idea list reads without replaying all events.
- Trade-offs:
  - Additional migration and schema complexity.
  - Actions must keep summary state and events consistent in one transaction.
