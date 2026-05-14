# Feature Specification: Idea Draft Management

**Feature Branch**: `005-start-specify-run`

**Created**: 2026-05-15

**Status**: Draft

**Input**: User description: "implement draft management system. submitters should be able to save during their idea form preperation as draft. They can see their drafts in their dashboard. And with a click they can continue working on them. Drafts are not visible to anybody else including admins."

## Clarifications

### Session 2026-05-15

- Q: What should happen to a draft after successful final submission? → A: Delete the draft record and keep only the submitted idea.
- Q: What minimum validation is required to save a draft? → A: Allow draft save with no required fields and store partial input as-is.
- Q: What is the draft retention policy? → A: No automatic expiry; drafts remain until user submits or deletes them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save Idea as Draft (Priority: P1)

As a submitter preparing an idea, I can save my in-progress form as a draft at any point so I do not lose my work before final submission.

**Why this priority**: Preventing work loss during idea preparation is the core user value and unlocks all other draft workflows.

**Independent Test**: Can be fully tested by a submitter entering partial idea data, saving a draft, leaving the page, and confirming the saved draft state persists when returning.

**Acceptance Scenarios**:

1. **Given** a signed-in submitter has entered no idea fields yet, **When** they choose to save as draft, **Then** the system creates an empty draft record successfully.
2. **Given** a signed-in submitter has entered partial idea details, **When** they choose to save as draft, **Then** the system stores the draft and confirms it was saved.
3. **Given** a signed-in submitter has an existing draft, **When** they save it again after edits, **Then** the existing draft is updated without creating a duplicate.

---

### User Story 2 - View Drafts in Dashboard (Priority: P2)

As a submitter, I can see all of my own drafts in my dashboard so I can track and manage unfinished ideas.

**Why this priority**: After saving, users need clear visibility into what they have in progress to continue their work efficiently.

**Independent Test**: Can be fully tested by creating multiple drafts for one submitter and verifying only those drafts appear in that submitter dashboard list.

**Acceptance Scenarios**:

1. **Given** a submitter has one or more saved drafts, **When** they open their dashboard, **Then** they see a list of their drafts with enough summary information to identify each one.
2. **Given** a submitter has no drafts, **When** they open their dashboard, **Then** they see an explicit empty state indicating no drafts are available.

---

### User Story 3 - Resume Draft Editing (Priority: P3)

As a submitter, I can open a saved draft from the dashboard and continue editing the idea form from where I left off.

**Why this priority**: Resuming saved work completes the draft lifecycle and ensures saved drafts are actionable.

**Independent Test**: Can be fully tested by selecting a saved draft from the dashboard and verifying the form loads with previously entered values ready for further edits.

**Acceptance Scenarios**:

1. **Given** a submitter has a saved draft, **When** they choose to continue that draft from the dashboard, **Then** the form opens pre-filled with the draft data.
2. **Given** a submitter resumes and edits a draft, **When** they save again, **Then** the latest changes are reflected the next time the draft is opened.
3. **Given** a submitter submits a resumed draft successfully, **When** they return to the dashboard, **Then** that draft no longer appears in the draft list.

---

### Edge Cases

- What happens when a submitter tries to open a draft that no longer exists? The system shows a clear not-found message and returns the user to the draft list.
- How does the system handle simultaneous edits of the same draft from multiple browser tabs? The most recent save is preserved and the user is informed when a newer saved version exists.
- What happens when a submitter attempts to access another submitter's draft directly? Access is denied and no draft data is exposed.
- What happens when an admin or evaluator attempts to access any draft? Access is denied and drafts remain hidden.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow signed-in submitters to save an in-progress idea form as a draft without requiring final submission.
- **FR-002**: System MUST persist all draft form fields currently provided by the submitter, including partial and optional values.
- **FR-003**: System MUST allow a submitter to update an existing draft multiple times.
- **FR-004**: System MUST display a draft list in the submitter dashboard containing only drafts owned by that submitter.
- **FR-005**: System MUST allow a submitter to open a selected draft from the dashboard and continue editing from saved values.
- **FR-006**: System MUST prevent non-owners from viewing or modifying draft data.
- **FR-007**: System MUST ensure drafts are not visible in admin interfaces, evaluator workflows, or public idea listings.
- **FR-008**: System MUST keep draft records separate from submitted ideas so drafts are excluded from review, evaluation, and approval processes.
- **FR-009**: System MUST provide user-facing confirmation after a successful draft save and a clear error message when saving fails.
- **FR-010**: System MUST preserve draft data across user sessions without automatic expiration until the submitter explicitly submits the idea or deletes the draft.
- **FR-011**: System MUST delete the corresponding draft record immediately after successful final submission so only the submitted idea remains.
- **FR-012**: System MUST allow draft saves without enforcing final-submission required-field validation, and MUST store whatever partial values are currently provided.

### Key Entities *(include if feature involves data)*

- **Draft Idea**: An in-progress idea owned by a single submitter, containing form content and lifecycle state indicating it is not yet submitted.
- **Draft Owner**: The authenticated submitter identity associated with each draft; used to enforce strict access control.
- **Draft Summary**: Lightweight representation of a draft for dashboard listing (for example, title placeholder, last updated timestamp, and status).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of submitters can save a partially completed idea as a draft in under 10 seconds during usability testing.
- **SC-002**: 95% of submitters can locate and open one of their saved drafts from the dashboard in under 30 seconds.
- **SC-003**: 100% of access-control test cases confirm that non-owners, including admins, cannot view or edit draft content.
- **SC-004**: 90% of submitters successfully resume and continue editing a previously saved draft on their first attempt.
- **SC-005**: 0 draft records appear in review and evaluation workflows during acceptance testing.

## Assumptions

- Draft management applies only to authenticated submitter accounts and not to anonymous users.
- A draft can be converted to a normal idea record by using the existing final submit action when the submitter is ready.
- Final submission removes the draft record and the submitted idea becomes the only retained version in normal workflows.
- Draft save uses relaxed validation and final submission continues to enforce full submission validation.
- Drafts do not expire automatically and remain available until submitter action.
- Dashboard already exists as the primary location for submitter work-in-progress items.
- A submitter may maintain multiple drafts at the same time.

## Constitution Constraints *(non-negotiable)*

The following constraints are mandated by the project constitution and MUST NOT be relaxed:

- **Stack**: Next.js App Router, React 18+, Tailwind CSS, shadcn/ui, TypeScript strict mode.
- **Accessibility**: All non-text content MUST have text alternatives; text contrast ≥ 4.5:1 (WCAG AA).
- **Error Handling**: Every async operation MUST have explicit error handling; error/loading/empty states are required.
- **Dependencies**: No new dependency without documented justification aligned with Principle III.
- **Critical Documentation**: For crucial dependency/framework/API decisions, latest versions and authoritative docs MUST be verified via Context7 MCP.
- **Styling**: Tailwind utility classes only — no custom CSS without constitutional amendment.
- **Delivery Governance**: Completion of all spec tasks MUST trigger PR creation; merge to `main` requires explicit final user approval and GitHub MCP merge execution.
