# Research: Idea Evaluation Workflow

**Feature**: `003-idea-evaluation-workflow`  
**Date**: 2026-05-15  
**Phase**: 0 — Research

## Decision 1: Represent Progress as Append-Only Decision Events

**Decision**: Use an append-only event record per transition/decision, tied to idea id, stage, outcome, actor id, comment, and timestamp.

**Rationale**: The spec requires immutable audit history and timeline rendering with full accountability metadata for each change. Append-only events provide a natural source for timeline reconstruction and prevent accidental mutation of prior decisions.

**Alternatives considered**:
- Update-in-place idea status columns only: rejected because it loses intermediate audit detail.
- Mutable history rows: rejected because it violates immutability requirement.

## Decision 2: Keep Current Idea Position as Derived Summary + Persisted Snapshot

**Decision**: Store current stage/outcome on idea records for list performance while preserving full event history for timeline detail.

**Rationale**: Admin and user list views need quick access to current state. Persisting current position avoids expensive timeline aggregation for every list row while still allowing full historical display from events.

**Alternatives considered**:
- Derive current stage solely by replaying events every read: rejected due to read complexity and avoidable query overhead.

## Decision 3: Enforce Linear Progression with a Single Transition Guard

**Decision**: Implement a centralized transition guard that validates allowed next states from current state.

**Rationale**: The workflow has strict linear stage progression with no skip/backward transitions. Centralizing transition rules avoids drift across actions and ensures server-side consistency.

**Alternatives considered**:
- UI-only stage gating: rejected because spec requires server-side enforcement.
- Repeated per-action inline checks: rejected due to duplicated logic risk.

## Decision 4: Mandatory Comment Validation at All Decision Points

**Decision**: Require non-empty comments for every approval-to-next-stage and every rejection/final decision at schema validation level.

**Rationale**: The clarified spec explicitly mandates comments for all such decisions. Schema-level validation gives consistent behavior for UI and integration surfaces.

**Alternatives considered**:
- Optional comment for approvals: rejected because it conflicts with spec.

## Decision 5: Role-Scoped Timeline Field Visibility via Server Projection

**Decision**: Project timeline response fields based on requester role/ownership: submitter and admins receive full entry including comment; other authenticated users receive stage/outcome/timestamp without comment text.

**Rationale**: Clarification B requires mixed visibility in the same timeline feature. Server-side projection prevents data leakage and satisfies the requirement that client-side hiding alone is insufficient.

**Alternatives considered**:
- Return full payload and hide on client: rejected due to security and requirement mismatch.
- Hide timeline entirely from non-submitter users: rejected because spec requires timeline progress visibility for authenticated viewers.

## Decision 6: Stage 4 Final Executive Decision as Terminal Event

**Decision**: Model Stage 4 final decision as explicit terminal outcomes: final approved or final rejected, each with required comment.

**Rationale**: The fourth stage must capture a distinct executive terminal decision while preserving consistent event shape across pipeline stages.

**Alternatives considered**:
- Collapse stage 4 into stage 3 approval: rejected because it removes required distinct stage semantics.

## Decision 7: Concurrency Handling for Near-Simultaneous Decisions

**Decision**: Validate expected current stage/outcome in the same transaction that writes the event and summary update; reject stale requests.

**Rationale**: Prevents double transitions when two admins act at the same time and matches edge-case expectation that only one valid transition succeeds.

**Alternatives considered**:
- Last-write-wins updates: rejected because it can produce invalid or ambiguous timeline progression.

## Decision 8: ADR Requirement for Event History Model

**Decision**: Add a new ADR documenting why append-only timeline events plus server-projected visibility were selected.

**Rationale**: This is a significant architectural decision impacting storage, security, and querying strategy and must be recorded before task generation.

**Alternatives considered**:
- No ADR: rejected due to constitution requirement for significant technical choices.

## Summary

All planning unknowns are resolved. The design phase proceeds with:
- Append-only decision events
- Derived current stage/outcome on ideas
- Central transition guard
- Server-enforced role-based field projection
- Stage 4 terminal executive decision modeling
