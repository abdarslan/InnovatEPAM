# Feature Specification: Anonymous Idea Evaluation with Scoring System

**Feature Branch**: `006-anonymous-idea-scoring`

**Created**: May 15, 2026

**Status**: Draft

**Input**: User description: "make the evaluation of ideas anonymous. Admins shouldn't see who ideas belong to. Also implement a score system for idea evaluation. Admins must rate before a decision of stage except first stage. Since first stage is for initial check for spam etc. Second stage evaluation asks a rating from 1 to 5 for "Alignment" with department. 3rd stage asks for "Feasibility" rating and last one asks for "impact". Any completed idea shows these three ratings on them. Also in timeline any approval action shows the rating."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Views Anonymous Idea in Evaluation (Priority: P1)

As an admin evaluating ideas, I need to see the idea content and evaluation history without knowing the submitter's identity, so that my evaluation remains unbiased and fair.

**Why this priority**: Anonymity is core to the feature and must be implemented first. Without this, the entire evaluation fairness principle fails.

**Independent Test**: Can be fully tested by an admin accessing an idea in the evaluation dashboard and verifying that submitter information is hidden while all idea details remain visible. Delivers unbiased evaluation capability.

**Acceptance Scenarios**:

1. **Given** an idea is in evaluation stage 2 or beyond, **When** an admin opens the idea detail view, **Then** no submitter name, email, or profile information is displayed anywhere in the UI.
2. **Given** an idea has approval history, **When** an admin views the timeline, **Then** historical evaluator names are shown but submitter identity is never revealed.
3. **Given** multiple ideas are listed in the admin dashboard, **When** the admin views the idea list, **Then** submitter names are not visible in list, card, or table views.

---

### User Story 2 - Admin Rates Idea for Alignment (Priority: P1)

As an admin in stage 2 evaluation, I need to provide an alignment rating (1-5) indicating how well the idea aligns with our department's goals, so that we systematically score each idea.

**Why this priority**: Required before stage progression; directly enables the core scoring feature.

**Independent Test**: Can be tested by an admin accessing stage 2 evaluation UI, seeing the alignment rating control (1-5), submitting a rating, and confirming the rating is persisted and displayed. Delivers stage 2 scoring capability.

**Acceptance Scenarios**:

1. **Given** an idea is in stage 2 evaluation, **When** the admin views the evaluation panel, **Then** a 1-5 alignment rating control is displayed with clear instructions.
2. **Given** an admin submits an alignment rating, **When** the stage progression decision form is shown, **Then** the submitted rating is pre-filled and displayed as part of the submission.
3. **Given** an admin attempts to progress an idea to stage 3 without submitting an alignment rating, **When** they click the approve/advance button, **Then** a validation message requires a rating before progression.

---

### User Story 3 - Admin Rates Idea for Feasibility (Priority: P1)

As the assigned admin in stage 3 evaluation, I need to provide a feasibility rating (1-5) indicating how realistic and implementable the idea is, so that we assess technical and practical viability.

**Why this priority**: Required for stage 3 progression; completes mid-stage scoring.

**Independent Test**: Can be tested by advancing an idea to stage 3, seeing the feasibility rating control alongside the existing comment field, submitting a rating, and confirming persistence. Delivers stage 3 scoring capability.

**Acceptance Scenarios**:

1. **Given** an idea is in stage 3 evaluation and assigned to an admin, **When** the admin views the evaluation panel, **Then** a 1-5 feasibility rating control is displayed next to the comment field.
2. **Given** an admin submits a feasibility rating along with a comment, **When** the stage 4 progression is initiated, **Then** the feasibility rating is required and must be provided before progression.
3. **Given** an admin has submitted a feasibility rating, **When** viewing the idea timeline, **Then** the rating is displayed alongside the admin's approval action.

---

### User Story 4 - Admin Rates Idea for Impact (Priority: P1)

As an admin in stage 4 (final) evaluation, I need to provide an impact rating (1-5) indicating the potential business or organizational value of the idea, so that we quantify expected outcomes.

**Why this priority**: Required for stage 4 completion; completes the full scoring system.

**Independent Test**: Can be tested by advancing to stage 4, providing an impact rating, completing the evaluation, and verifying the rating persists. Delivers final-stage scoring capability.

**Acceptance Scenarios**:

1. **Given** an idea is in stage 4 evaluation, **When** the admin views the evaluation panel, **Then** a 1-5 impact rating control is displayed.
2. **Given** an admin completes stage 4 with an impact rating, **When** the idea status is set to "Completed", **Then** the impact rating is saved as part of the final decision.
3. **Given** an idea is marked as "Completed" or "Rejected", **When** the evaluation is finalized, **Then** the impact rating is required for completion (even if idea is rejected).

---

### User Story 5 - User Views Final Scores on Completed Idea (Priority: P2)

As a submitter viewing a completed evaluation, I need to see the three evaluation scores (Alignment, Feasibility, Impact) displayed on the idea card or detail view, so that I understand how the evaluation was scored.

**Why this priority**: Provides transparency after evaluation; depends on scores being created first.

**Independent Test**: Can be tested by a non-admin user accessing a completed idea and verifying all three scores are visible in a consistent format. Delivers user-facing score visibility.

**Acceptance Scenarios**:

1. **Given** an idea has completed evaluation with all three scores, **When** any user views the idea detail page, **Then** the three ratings (Alignment, Feasibility, Impact) are displayed with clear labels.
2. **Given** an idea is displayed in a list or dashboard, **When** the idea is in "Completed" status, **Then** score badges or summary is visible on the idea card.
3. **Given** different ideas have different score combinations, **When** displayed together, **Then** scores are consistently formatted and comparable.

---

### User Story 6 - Timeline Shows Rating with Approval Actions (Priority: P2)

As an admin or reviewer viewing the idea evaluation timeline, I need to see which rating was submitted with each approval action, so that I can track the evaluation progression and understand scoring decisions.

**Why this priority**: Provides evaluation transparency and audit trail; depends on timeline component updates.

**Independent Test**: Can be tested by viewing the timeline of a multi-stage evaluated idea and verifying that each advancement action displays its associated rating. Delivers timeline transparency.

**Acceptance Scenarios**:

1. **Given** an idea has multiple approval actions in the timeline, **When** viewing the timeline, **Then** each approval action shows the rating that was submitted (e.g., "Approved Stage 2 - Alignment: 4/5").
2. **Given** an admin hovers over or expands a timeline entry, **When** the action is an evaluation stage progression, **Then** the specific rating score is visible.
3. **Given** stage 1 (spam check) has no rating requirement, **When** viewing the timeline, **Then** stage 1 approval shows no rating (or shows N/A).

---

### Edge Cases

- What happens when an anonymous idea is approved and becomes public? (How is submitter information made available to implementation team?)
- What happens if an idea in stage 1 (spam check with no rating) is approved vs. rejected? (How is that decision recorded without a rating?)
- Can an admin see their own identity in the approval timeline for ideas they evaluated? (Or is all timeline identity hidden?)
- What is the process if an admin needs to correct or update their rating after submission?
- How are rejection decisions visually distinguished from approvals in the timeline and idea detail view?

## Clarifications

### Session May 15, 2026

- Q: How should multiple admin ratings be handled per stage? → A: One admin per stage only; each stage has exactly one assigned evaluator who submits a rating.
- Q: When should submitter identity be revealed after evaluation completes? → A: Reveal only if idea is approved for implementation (rejected ideas remain anonymous).
- Q: How are ratings handled if an idea is returned to a previous stage? → A: No re-evaluation—rejection at any stage is final. Ideas never return to earlier stages.
- Q: Should admins see their own identity in the approval timeline? → A: Yes, admins see their own name for actions they completed, but submitter identity is always hidden.
- Q: Can admins update their rating after initial submission? → A: No, ratings are immutable after submission to preserve audit trail integrity.

### Functional Requirements

- **FR-001**: System MUST anonymize idea submitter identity in admin evaluation views for stages 2-4, hiding name, email, profile picture, and any user identification markers.
- **FR-002**: System MUST prevent access to submitter information for admins during evaluation stages 2, 3, and 4, with submitter identity only visible pre-stage 2 (during submission) and post-completion (for implementation).
- **FR-003**: System MUST display a 1-5 alignment rating control in stage 2 evaluation with clear visual indicators (e.g., star rating, numeric input, or radio buttons).
- **FR-004**: System MUST require an alignment rating to be submitted before an idea can progress from stage 2 to stage 3, with validation error if missing.
- **FR-005**: System MUST display a 1-5 feasibility rating control in stage 3 evaluation with consistent UI/UX to stage 2.
- **FR-006**: System MUST require a feasibility rating to be submitted before an idea can progress from stage 3 to stage 4, with validation error if missing.
- **FR-007**: System MUST display a 1-5 impact rating control in stage 4 evaluation with consistent UI/UX to previous stages.
- **FR-008**: System MUST require an impact rating to be submitted before an idea can be marked as "Completed" or "Rejected" in stage 4.
- **FR-009**: System MUST NOT require a rating submission in stage 1 (initial spam check), treating stage 1 as a preliminary gate.
- **FR-010**: System MUST persist all submitted ratings in the database with timestamp and evaluator information.
- **FR-010a**: System MUST treat submitted ratings as immutable—once an admin submits a rating for a stage, that rating cannot be modified or deleted.
- **FR-011**: System MUST display all three ratings (Alignment, Feasibility, Impact) on completed ideas in the user-facing view (dashboard, detail page, list cards).
- **FR-012**: System MUST display rating badges or summary on completed idea cards in lists and dashboards for quick visual reference.
- **FR-013**: System MUST show each rating with consistent labeling ("Alignment", "Feasibility", "Impact") across all UI locations.
- **FR-014**: System MUST update the idea timeline to include rating information with each approval/advancement action (e.g., "Approved - Alignment: 4/5").
- **FR-015**: System MUST display timeline entries clearly showing which stage transition occurred with the associated rating for that stage.
- **FR-016**: System MUST show stage 1 timeline entries without rating indicators, as stage 1 has no rating requirement.
- **FR-017**: System MUST allow admins to view their own identity in the approval timeline for accountability, even if submitter is anonymous.
- **FR-018**: System MUST enforce one rating per stage—only the assigned admin for that stage can submit the rating for that idea.

### Non-Functional Requirements

- All rating submissions MUST be recorded with metadata (evaluator ID, timestamp, stage) for audit trail.
- The anonymity mechanism MUST not introduce performance degradation in evaluation dashboard load times.
- Rating display components MUST be responsive and work on mobile/tablet devices for admins on the go.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins see no submitter identifying information during evaluation stages 2-4, verified by UI inspection and automated tests.
- **SC-002**: All stage 2+ ideas require and display an alignment rating before progression, with 100% validation coverage.
- **SC-003**: Feasibility and impact ratings follow the same enforcement model with 100% stage progression validation.
- **SC-004**: 95% of completed ideas display all three ratings (Alignment, Feasibility, Impact) correctly formatted.
- **SC-005**: Timeline shows 100% of approval actions with associated ratings for stages 2-4.
- **SC-006**: Admins can complete an idea evaluation with all required ratings in under 2 minutes per stage.
- **SC-007**: No performance regression on evaluation dashboard—load time remains under 1 second for idea lists with 100+ ideas.
- **SC-008**: 100% of audit trail entries correctly record rating, stage, evaluator, and timestamp for compliance.

## Key Entities *(include if feature involves data)*

- **Idea**: Extends existing idea entity with anonymization flag and rating fields.
- **IdeaRating**: New entity capturing individual rating submissions (stage, rater ID, score, timestamp, stage type).
- **EvaluationTimeline**: Extends existing timeline to include rating references for each approval/progression action.

### Data Model Changes

- **ideas** table: Add `anonymized` (boolean, default true for stages 2-4), `alignment_rating` (int 1-5, nullable), `feasibility_rating` (int 1-5, nullable), `impact_rating` (int 1-5, nullable).
- **idea_ratings** table: New table with columns: `id`, `idea_id`, `stage` (int 1-4), `rater_id` (FK to users), `score` (int 1-5), `created_at`, `updated_at`.
- **idea_evaluation_log** or similar: Update existing timeline to include optional `rating_id` (FK to idea_ratings) for tracking which rating was submitted with each action.

## Assumptions

- The existing idea evaluation system has 4 distinct stages (stage 1, 2, 3, 4) that already support progression.
- Admins are the only role that submits ratings; standard users cannot rate ideas.
- Each stage (2, 3, 4) has exactly one assigned admin who evaluates and submits a rating for that stage. There is no scenario where multiple admins rate the same idea at the same stage.
- Rejection at any stage is final—ideas do not return to earlier stages for revision. Once rejected, the idea workflow ends.
- Ratings are submitted once and become immutable after submission; admins cannot edit or delete submitted ratings to preserve audit trail integrity.
- Ratings are submitted as part of the stage decision/progression; each admin adds a rating in addition to leaving a comment.
- All admins in the system should have permission to view and rate ideas (no additional role-based restrictions beyond existing admin status).
- Anonymization applies only during active evaluation (stages 2-4); submitter is identifiable at submission (stage 1) and after approval for implementation.
- Rejected ideas remain anonymous—submitter identity is never revealed, even after final rejection in stage 4.
- The UI will use numeric 1-5 scale with consistent visual representation (e.g., stars, filled circles, or numeric input) across all three rating types.
- Completed idea means idea has passed or been rejected after final evaluation (stage 4); at this point, the submitter may be unmasked or idea becomes public-facing.

## Constitution Constraints *(non-negotiable)*

The following constraints are mandated by the project constitution and MUST NOT be relaxed:

- **Stack**: Next.js App Router, React 18+, Tailwind CSS, shadcn/ui, TypeScript strict mode.
- **Accessibility**: All non-text content MUST have text alternatives; text contrast ≥ 4.5:1 (WCAG AA). Rating controls MUST be keyboard navigable and screen reader compatible.
- **Error Handling**: Every async operation MUST have explicit error handling; error/loading/empty states are required. Rating submission MUST show success/error feedback.
- **Dependencies**: No new dependency without documented justification aligned with Principle III. Rate limiting or complex score aggregation must use existing libraries if possible.
- **Critical Documentation**: For anonymization logic and scoring rules, latest implementation patterns MUST be verified.
- **Styling**: Tailwind utility classes only — no custom CSS without constitutional amendment. Use shadcn/ui rating component or build with Tailwind.
- **Delivery Governance**: Completion of all spec tasks MUST trigger PR creation; merge to `main` requires explicit final user approval and GitHub MCP merge execution.
