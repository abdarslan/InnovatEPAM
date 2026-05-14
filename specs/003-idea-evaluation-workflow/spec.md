# Feature Specification: Idea Evaluation Workflow

**Feature Branch**: `003-idea-evaluation-workflow`

**Created**: 2026-05-14

**Status**: Draft

**Input**: User description: "implement idea evaluation workflow. idea status tracking as submitted -> under review -> accepted/rejected. And admin can accept or reject with comments"

## Clarifications

### Session 2026-05-14

- Q: Where do admin evaluation actions (Start Review / Accept / Reject) live in the application? → A: New dedicated `admin/ideas` route, separate from the employee-facing `/ideas` listing.
- Q: Who can see admin evaluation comments (acceptance/rejection)? → A: Only the submitter of a given idea sees the evaluation comment; all other authenticated users see only the status badge.
- Q: Can an admin skip "Under Review" and directly Accept/Reject a "Submitted" idea? → A: No — "Under Review" is a required intermediate step; direct Submitted → Accepted/Rejected transitions are prohibited.
- Q: Can an admin evaluate multiple ideas at once (bulk operations)? → A: No — evaluation is strictly one idea at a time; bulk transitions are out of scope for v1.
- Q: Can an admin edit an evaluation comment after submission? → A: No — evaluation comments are immutable once submitted to preserve audit integrity.

- Q: What does the `admin/ideas` page show by default on first load? → A: All ideas across all statuses are shown by default; admins use filter controls to narrow the list.
- Q: What feedback does the admin receive after submitting a status transition? → A: A toast/success notification appears and the idea row updates in-place on the `admin/ideas` list — no full page reload.
- Q: How should existing idea rows be handled when the status column is added? → A: No data migration required — there are no existing ideas in the database; the status column MUST have a database-level default of "Submitted" for all new rows.
- Q: What visual differentiator must status badges use beyond color (WCAG 1.4.1)? → A: The status text label MUST always be visible inside the badge (colored pill containing the status word); color alone is not sufficient.
- Q: What happens if someone tries to delete an idea while it is in "Under Review"? → A: Deletion is blocked for ideas in "Under Review" status; the system returns a validation error and keeps the idea unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Reviews a Submitted Idea (Priority: P1)

An admin visits the dedicated `admin/ideas` page, sees all ideas across all statuses with filter controls available, picks one, marks it as "Under Review", and later either accepts or rejects it with a written comment explaining the decision.

**Why this priority**: The core of the evaluation workflow — without the ability for admins to transition idea status and record decisions, the feature has no value.

**Independent Test**: Can be fully tested by logging in as an admin, navigating to the idea management dashboard, transitioning a submitted idea through "Under Review" to "Accepted" or "Rejected", and verifying the status and comment are persisted and visible.

**Acceptance Scenarios**:

1. **Given** an admin viewing an idea in "Submitted" status, **When** they click "Start Review", **Then** the idea status changes to "Under Review" and the change is reflected immediately.
2. **Given** an admin viewing an idea in "Under Review" status, **When** they click "Accept" and provide an optional comment, **Then** the idea status changes to "Accepted", the comment is stored, a success toast is displayed, and the idea row updates in-place.
3. **Given** an admin viewing an idea in "Under Review" status, **When** they click "Reject" and provide a required comment, **Then** the idea status changes to "Rejected", the rejection reason is stored, a success toast is displayed, and the idea row updates in-place.
4. **Given** an admin attempting to reject an idea, **When** they submit without providing a rejection comment, **Then** a validation error is shown and the status is not changed.
5. **Given** an idea already in "Accepted" or "Rejected" status, **When** an admin views the idea, **Then** the evaluation actions (Accept/Reject) are not available and the final status is clearly displayed.
6. **Given** a non-admin authenticated user, **When** they attempt to access the admin idea management actions, **Then** they are denied access and shown an appropriate message.

---

### User Story 2 - Submitter Tracks Their Idea Status (Priority: P2)

An authenticated user who submitted an idea can view its current status ("Submitted", "Under Review", "Accepted", "Rejected") in the idea listing. If their idea was rejected, they can also see the admin's comment explaining why.

**Why this priority**: Without visibility into evaluation progress, submitters have no feedback loop — undermining the platform's value proposition.

**Independent Test**: Can be fully tested by submitting an idea, having an admin change its status, and verifying the submitter's listing view reflects the updated status and any comment.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the idea listing page, **When** they view their submitted ideas, **Then** each idea displays its current status clearly (e.g., a status badge).
2. **Given** an idea whose status has been changed to "Accepted" or "Rejected", **When** the submitter views the idea, **Then** they see the updated status and any admin comment associated with the decision.
3. **Given** an idea in "Rejected" status with a rejection comment, **When** the submitter expands the idea, **Then** the rejection reason comment is displayed.
4. **Given** an idea still in "Submitted" or "Under Review" status, **When** any authenticated user views the listing, **Then** the status badge reflects the correct current state.

---

### User Story 3 - Admin Filters Ideas by Status (Priority: P3)

An admin can filter the idea list in the `admin/ideas` route by status to focus on ideas requiring action (e.g., only see "Submitted" or "Under Review" ideas).

**Why this priority**: As the volume of ideas grows, admins need to prioritize their review queue efficiently.

**Independent Test**: Can be fully tested by populating ideas with multiple statuses and verifying that selecting a status filter shows only ideas matching that status.

**Acceptance Scenarios**:

1. **Given** an admin on the `admin/ideas` route, **When** they select a status filter (e.g., "Submitted"), **Then** only ideas matching that status are shown.
2. **Given** an admin on the `admin/ideas` route, **When** they clear the status filter, **Then** all ideas across all statuses are shown.
3. **Given** no ideas matching the selected status filter, **When** the filter is applied, **Then** an empty-state message is shown.

---

### Edge Cases

- What happens if an admin tries to transition an idea from "Accepted" back to "Under Review", or from "Submitted" directly to "Accepted/Rejected"? — Both backward transitions and forward-skips are prohibited; the server rejects the request with a validation error.
- What happens if two admins attempt to evaluate the same idea simultaneously? — Last-write-wins on status update; no optimistic concurrency conflict UI is required in v1.
- What if the admin's comment exceeds the maximum length? — A validation error is shown and the action is blocked until the comment is within limits.
- What if the database write fails during a status transition? — The operation is rolled back and the admin sees an error message; the idea status remains unchanged.
- What if someone attempts to delete an idea while it is in "Under Review"? — The deletion is rejected with a validation error; only ideas in non-review states are eligible for deletion under existing delete permissions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each idea MUST have a status field with four possible values: Submitted, Under Review, Accepted, Rejected.
- **FR-002**: Newly submitted ideas MUST default to "Submitted" status.
- **FR-003**: Admin users MUST be able to transition an idea from "Submitted" to "Under Review" only.
- **FR-004**: Admin users MUST be able to transition an idea from "Under Review" to "Accepted" only.
- **FR-005**: Admin users MUST be able to transition an idea from "Under Review" to "Rejected" only.
- **FR-006**: Status transitions MUST follow the strict sequence Submitted → Under Review → Accepted/Rejected; both backward transitions and direct Submitted → Accepted/Rejected skips MUST be prohibited and rejected server-side.
- **FR-007**: Admin users MUST provide a comment when rejecting an idea; the comment MUST be non-empty.
- **FR-008**: Admin users MAY provide an optional comment when accepting an idea.
- **FR-009**: Evaluation comments MUST be stored and associated with the idea's status change.
- **FR-010**: Evaluation comments MUST NOT exceed 1000 characters.
- **FR-011**: All authenticated users MUST be able to see the current status of every idea in the listing view as a status badge.
- **FR-012**: Only the submitter of an idea MUST be able to see the admin's evaluation comment for their own idea; other authenticated users MUST NOT see evaluation comments for ideas they did not submit.
- **FR-013**: Evaluation actions (Start Review, Accept, Reject) MUST be accessible only to users with the admin role, exposed exclusively via a dedicated `app/(protected)/admin/ideas` route.
- **FR-014**: Non-admin users MUST NOT be able to trigger any status transition, enforced on the server side.
- **FR-015**: The `admin/ideas` page MUST show all ideas across all statuses by default; admins MUST be able to filter the list by a single status value to narrow the view.
- **FR-016**: Every status transition MUST be recorded with the acting admin's identity and a timestamp.
- **FR-017**: Evaluation comments MUST be immutable once submitted; no edit or delete operation on a saved evaluation comment is permitted.
- **FR-018**: The `app/(protected)/admin/ideas` route MUST be protected by the same role-based access control middleware used by existing admin routes (`admin/dashboard`, `admin/users`), permitting access only to users with the admin role.
- **FR-019**: Upon a successful status transition, the system MUST display a brief toast notification to the admin and update the affected idea row in-place without a full page reload.
- **FR-020**: The `status` column on the `ideas` table MUST have a database-level default value of "Submitted"; no data migration script is required as the database contains no pre-existing idea rows.
- **FR-021**: Status badges MUST display the status text label visibly inside a colored pill component; color MUST NOT be the sole visual differentiator (WCAG 1.4.1). Required label text per status: "Submitted", "Under Review", "Accepted", "Rejected".
- **FR-022**: The system MUST reject deletion requests for ideas currently in "Under Review" status, returning a validation error and leaving the idea unchanged.

### Key Entities

- **Idea**: Existing entity — extended with a `status` field (Submitted | Under Review | Accepted | Rejected) and a relationship to zero or one evaluation record.
- **IdeaEvaluation**: New entity stored in a dedicated database table — represents an admin's decision on an idea. Attributes: idea reference (FK), new status, evaluating admin reference (FK), comment (optional for Accepted, required for Rejected), timestamp. Relationship to Idea: 1:0..1 (one idea has at most one evaluation record).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can complete the full review of an idea (Submitted → Under Review → Accepted/Rejected with comment) in under 60 seconds from the `admin/ideas` route.
- **SC-002**: Status changes are reflected in the submitter's idea listing within one page refresh (no stale data shown to the viewer after a transition).
- **SC-003**: 100% of status transitions are enforced server-side — no unauthorized transition is possible regardless of client manipulation.
- **SC-004**: All rejection decisions include a non-empty comment — the system never persists a rejection without a reason.
- **SC-005**: Admins can filter the idea list to "Submitted" or "Under Review" status to locate actionable items in under 10 seconds.

## Assumptions

- Admins are users with the existing admin role defined in the authentication system (feature 001-user-auth-management).
- Ideas are already being submitted via the idea submission system (feature 002-idea-submission); this feature extends that data model. No data migration is required as no idea rows exist in the database at the time this feature is deployed.
- There is no email or in-app notification system in scope for v1 — submitters check status manually via the listing view.
- The evaluation comment is plain text only; rich text or markdown formatting is out of scope for v1.
- Bulk status transitions (evaluating multiple ideas simultaneously) are out of scope for v1; each evaluation action targets exactly one idea.
- Evaluation comments are immutable once saved — no correction or edit capability is provided in v1.
- Evaluation comments (both acceptance and rejection) are private to the submitter — non-submitter authenticated users see only the status badge for any idea they did not author.
- Mobile-responsive display of status badges and admin comment is required in line with the existing UI conventions.

## Constitution Constraints *(non-negotiable)*

The following constraints are mandated by the project constitution and MUST NOT be relaxed:

- **Stack**: Next.js App Router, React 18+, Tailwind CSS, shadcn/ui, TypeScript strict mode.
- **Accessibility**: All non-text content MUST have text alternatives; text contrast ≥ 4.5:1 (WCAG AA).
- **Error Handling**: Every async operation MUST have explicit error handling; error/loading/empty states are required.
- **Dependencies**: No new dependency without documented justification aligned with Principle III.
- **Critical Documentation**: For crucial dependency/framework/API decisions, latest versions and authoritative docs MUST be verified via Context7 MCP.
- **Styling**: Tailwind utility classes only — no custom CSS without constitutional amendment.
- **Delivery Governance**: Completion of all spec tasks MUST trigger PR creation; merge to `main` requires explicit final user approval and GitHub MCP merge execution.
