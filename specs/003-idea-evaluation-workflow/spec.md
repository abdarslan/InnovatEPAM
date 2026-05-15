# Feature Specification: Idea Evaluation Workflow

**Feature Branch**: `003-idea-evaluation-workflow`

**Created**: 2026-05-15

**Status**: Draft

**Input**: User description: "Build a 4-stage evaluation pipeline for submitted ideas. The stages are Stage 1 Triage, Stage 2 Department Review, Stage 3 Feasibility, and Stage 4 Final Executive Decision. Ideas must progress linearly. Admins must leave a mandatory comment when rejecting an idea at any stage, or when approving it to move to the next stage. Create an audit history view so users can see the timeline of their idea's progress, attached to idea cards. Each transition or decision must include who decided and what comment was provided."

## Clarifications

### Session 2026-05-14

- Q: Where do admin evaluation actions (Start Review / Accept / Reject) live in the application? → A: New dedicated `admin/ideas` route, separate from the employee-facing `/ideas` listing.
- Q: Who can see admin evaluation comments (acceptance/rejection)? → A: The idea submitter and admins can see evaluation comments; other authenticated users see only stage/outcome without comment text.
- Q: Can an admin skip "Under Review" and directly Accept/Reject a "Submitted" idea? → A: No — "Under Review" is a required intermediate step; direct Submitted → Accepted/Rejected transitions are prohibited.
- Q: Can an admin evaluate multiple ideas at once (bulk operations)? → A: No — evaluation is strictly one idea at a time; bulk transitions are out of scope for v1.
- Q: Can an admin edit an evaluation comment after submission? → A: No — evaluation comments are immutable once submitted to preserve audit integrity.

- Q: What does the `admin/ideas` page show by default on first load? → A: All ideas across all statuses are shown by default; admins use filter controls to narrow the list.
- Q: What feedback does the admin receive after submitting a status transition? → A: A toast/success notification appears and the idea row updates in-place on the `admin/ideas` list — no full page reload.
- Q: How should existing idea rows be handled when the status column is added? → A: No data migration required — there are no existing ideas in the database; the status column MUST have a database-level default of "Submitted" for all new rows.
- Q: What visual differentiator must status badges use beyond color (WCAG 1.4.1)? → A: The status text label MUST always be visible inside the badge (colored pill containing the status word); color alone is not sufficient.
- Q: What happens if someone tries to delete an idea while it is in "Under Review"? → A: Deletion is blocked for ideas in "Under Review" status; the system returns a validation error and keeps the idea unchanged.

### Session 2026-05-15

- Q: Should stage transitions allow skipping or reordering? → A: No. Ideas move strictly in order from Stage 1 to Stage 4, with no skips or backward movement.
- Q: Is an admin comment required for approvals as well as rejections? → A: Yes. A non-empty admin comment is mandatory for every approval-to-next-stage transition and every rejection decision.
- Q: What should users see in idea progress history? → A: A timeline attached to each idea card showing every transition/decision, including stage, decision outcome, deciding user, comment, and timestamp.
- Q: Who can view comment text in timeline entries? → A: Only the idea submitter and admins can view comment text; other authenticated viewers see stage and outcome without comment text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Runs 4-Stage Pipeline (Priority: P1)

An admin evaluates a submitted idea through the defined pipeline stages in sequence: Stage 1 Triage, Stage 2 Department Review, Stage 3 Feasibility, and Stage 4 Final Executive Decision. At each decision point, the admin records a mandatory comment for either approval to the next stage or rejection.

**Why this priority**: The staged progression and decision capture are the core business process. Without this flow, ideas cannot be governed consistently.

**Independent Test**: Can be fully tested by taking one submitted idea through each stage in order, entering required comments on every decision, and verifying accepted progression and rejected termination behavior.

**Acceptance Scenarios**:

1. **Given** an idea is at Stage 1 Triage, **When** an admin approves it and provides a non-empty comment, **Then** it moves to Stage 2 Department Review and the decision is saved.
2. **Given** an idea is at Stage 2 Department Review, **When** an admin approves it and provides a non-empty comment, **Then** it moves to Stage 3 Feasibility and the decision is saved.
3. **Given** an idea is at Stage 3 Feasibility, **When** an admin approves it and provides a non-empty comment, **Then** it moves to Stage 4 Final Executive Decision and the decision is saved.
4. **Given** an idea is at any active stage, **When** an admin rejects it and provides a non-empty comment, **Then** the idea is marked Rejected and cannot progress further.
5. **Given** an admin attempts to approve or reject without a comment, **When** they submit the decision, **Then** the system blocks the action and shows a validation error.
6. **Given** an admin attempts to skip a stage or move backward, **When** they submit the transition, **Then** the system rejects the request and leaves the idea unchanged.

---

### User Story 2 - Users View Audit Timeline (Priority: P2)

A user views an idea card and can see a timeline of idea progress events; detailed comment text is visible only to the idea submitter and admins.

**Why this priority**: Trust in the process requires transparent progress and accountability for each stage decision.

**Independent Test**: Can be tested by processing one idea through multiple transitions and verifying each timeline entry is visible, ordered, and complete on the idea card.

**Acceptance Scenarios**:

1. **Given** an idea with one or more decisions recorded, **When** a user opens its card, **Then** they can see a timeline of transitions and decisions.
2. **Given** a timeline entry is shown to the idea submitter or an admin, **When** they read it, **Then** it includes stage name, decision outcome, deciding user identity, comment, and timestamp.
3. **Given** a timeline entry is shown to an authenticated viewer who is neither admin nor submitter, **When** they read it, **Then** they see stage name and decision outcome but not comment text.
4. **Given** an idea is newly submitted and has no stage transition yet, **When** a user views the timeline, **Then** the initial submission appears as the first event.
5. **Given** an idea is rejected at any stage, **When** the submitter or an admin views the timeline, **Then** the rejection event and its comment are clearly visible.

---

### User Story 3 - Admin Maintains Decision Accountability (Priority: P3)

An admin can demonstrate full accountability for any idea decision by relying on immutable history that captures who made each decision and why.

**Why this priority**: Governance and review quality depend on a reliable decision record.

**Independent Test**: Can be tested by making multiple decisions by different admins and verifying history entries remain unchanged and attributable.

**Acceptance Scenarios**:

1. **Given** multiple admins evaluate an idea over time, **When** the timeline is viewed, **Then** each entry identifies the specific admin who made that decision.
2. **Given** a decision has been recorded, **When** someone attempts to alter its comment or actor attribution later, **Then** the system rejects the change.
3. **Given** an idea reaches Stage 4 and receives a final executive decision, **When** the timeline is viewed, **Then** that final decision appears as a distinct terminal entry.

---

### Edge Cases

- What happens if an admin attempts Stage 1 directly to Stage 3 (or any skip)? — The request is rejected and no transition is recorded.
- What happens if an admin attempts to move an idea backward to a prior stage? — The request is rejected and no transition is recorded.
- What happens if an admin submits an approval or rejection without a comment? — The decision is blocked with a validation error.
- What happens if two admins submit decisions for the same idea at nearly the same time? — Only one valid transition is accepted; the losing request is rejected as no longer valid for the current stage.
- What happens if an idea is rejected at Stage 2 or Stage 3? — The idea remains terminally Rejected and cannot move to later stages unless a future feature explicitly introduces reopen rules.
- What happens if a non-admin, non-submitter viewer opens timeline details? — The viewer can see stage/outcome progression but comment text remains hidden.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every submitted idea MUST enter a four-stage evaluation pipeline with these ordered stages: Stage 1 Triage, Stage 2 Department Review, Stage 3 Feasibility, Stage 4 Final Executive Decision.
- **FR-002**: Ideas MUST progress linearly through stages; stage skipping and backward movement MUST be rejected.
- **FR-003**: Approval at Stage 1 MUST move the idea to Stage 2; approval at Stage 2 MUST move the idea to Stage 3; approval at Stage 3 MUST move the idea to Stage 4.
- **FR-004**: Rejection at any stage MUST mark the idea as Rejected and terminate further stage progression.
- **FR-005**: Every approval that advances an idea to the next stage MUST require a non-empty admin comment.
- **FR-006**: Every rejection decision at any stage MUST require a non-empty admin comment.
- **FR-007**: The Stage 4 Final Executive Decision MUST record a final outcome (Approved or Rejected) with a mandatory non-empty comment.
- **FR-008**: Only admin users MUST be able to execute stage transitions and stage decisions.
- **FR-009**: Every transition and decision MUST record the deciding user identity, decision comment, stage context, and timestamp.
- **FR-010**: The system MUST maintain an audit history timeline for each idea, and the timeline MUST be attached to the idea card.
- **FR-011**: Authenticated users who can view an idea card MUST be able to view that idea's timeline entries in chronological order.
- **FR-012**: For the idea submitter and admins, each timeline entry MUST display stage name, decision outcome, deciding user identity, comment text, and decision timestamp.
- **FR-013**: For authenticated viewers who are neither admin nor submitter, timeline entries MUST display stage name and decision outcome while comment text is hidden.
- **FR-014**: Decision records in audit history MUST be immutable after creation.
- **FR-015**: Each idea card MUST show the current stage and current outcome state derived from the latest valid decision.
- **FR-016**: The timeline MUST include the initial submission event as the starting point for idea progress history.

- **FR-017**: Visibility rules for timeline entry fields MUST be enforced server-side and not rely only on client-side rendering.

### Key Entities

- **Idea**: Existing entity that now carries current evaluation position (current stage and current outcome) for display and routing through the pipeline.
- **IdeaDecisionEvent**: Immutable audit event that represents a transition or decision in the pipeline. Attributes include idea reference, stage, decision outcome, deciding user identity, mandatory comment, and timestamp.
- **IdeaTimeline**: Ordered collection of submission and decision events associated with an idea, rendered in the idea card as a readable progress history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of accepted progression decisions (Stage 1→2, 2→3, 3→4) are recorded with a non-empty admin comment.
- **SC-002**: 100% of rejection decisions at any stage are recorded with a non-empty admin comment.
- **SC-003**: 100% of recorded transitions include stage, decision outcome, deciding user identity, comment, and timestamp.
- **SC-004**: 100% of invalid transitions (skip, backward, or non-admin decision attempts) are blocked.
- **SC-005**: In usability validation, users can identify an idea's current stage and latest decision from the idea card timeline within 10 seconds in at least 90% of attempts.

## Assumptions

- Admins are users with the existing admin role defined in feature 001-user-auth-management.
- Stage 4 Final Executive Decision is performed by users who hold the admin role in v1; separate executive-only role modeling is out of scope.
- This feature extends ideas created in feature 002-idea-submission.
- Comments are plain text and must be non-empty for all decision actions.
- Audit history is immutable and append-only.
- Notification channels outside in-app timeline visibility are out of scope for v1.
- Multi-idea bulk decisions are out of scope for v1; decisions are performed one idea at a time.

## Constitution Constraints *(non-negotiable)*

The following constraints are mandated by the project constitution and MUST NOT be relaxed:

- **Stack**: Next.js App Router, React 18+, Tailwind CSS, shadcn/ui, TypeScript strict mode.
- **Accessibility**: All non-text content MUST have text alternatives; text contrast ≥ 4.5:1 (WCAG AA).
- **Error Handling**: Every async operation MUST have explicit error handling; error/loading/empty states are required.
- **Dependencies**: No new dependency without documented justification aligned with Principle III.
- **Critical Documentation**: For crucial dependency/framework/API decisions, latest versions and authoritative docs MUST be verified via Context7 MCP.
- **Styling**: Tailwind utility classes only — no custom CSS without constitutional amendment.
- **Delivery Governance**: Completion of all spec tasks MUST trigger PR creation; merge to `main` requires explicit final user approval and GitHub MCP merge execution.
