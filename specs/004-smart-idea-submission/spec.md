# Feature Specification: Smart Idea Submission Forms

**Feature Branch**: `004-add-smart-idea-forms`

**Created**: 2026-05-14

**Status**: Draft

**Input**: User description: "implement smart idea submission forms. Depending on selected categories it should offer different fields. For example event plan category can ask planned date, planned number of attendees etc."

## Clarifications

### Session 2026-05-14

- Q: How should category-specific field definitions be modeled for extensibility in v1? → A: Use an extensible field-definition model where each category has configurable field rules and submissions store matched key/value details.
- Q: For Event Plan category, should planned date and planned number of attendees be required? → A: Both fields are optional in v1.
- Q: How should existing data be handled when category field rules change in this test project? → A: No migration is required in v1; cleaning/resetting the database is acceptable for this test environment.
- Q: Who can create or update category field rules? → A: Only administrators can create or update category field rules; regular users can only submit ideas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Category-Driven Form Experience (Priority: P1)

As an employee submitting an idea, I can choose an idea category and immediately see additional fields that are relevant to that category so I can provide complete and useful details in one submission flow.

**Why this priority**: This is the core value of the feature. If category-based fields are not shown correctly, the feature does not solve the problem.

**Independent Test**: Can be fully tested by selecting different categories in the idea form and verifying that each category shows only its expected additional fields.

**Acceptance Scenarios**:

1. **Given** a user is filling out the idea submission form, **When** they select the "Event Plan" category, **Then** category-specific fields such as planned date and planned number of attendees are displayed.
2. **Given** a user is filling out the form, **When** they switch from one category to another, **Then** the form updates to the newly relevant category-specific fields.
3. **Given** a user has selected a category with required category-specific fields, **When** they submit without completing those required fields, **Then** the form shows clear validation messages and prevents submission.
4. **Given** a user has selected the "Event Plan" category, **When** they submit without planned date and planned number of attendees, **Then** submission is allowed if all shared required fields are valid.

---

### User Story 2 - High-Quality Structured Submissions (Priority: P2)

As a reviewer, I receive submissions that include category-appropriate structured details, making ideas easier to evaluate and compare.

**Why this priority**: Better data quality improves downstream review and decision-making efficiency.

**Independent Test**: Can be fully tested by submitting ideas across multiple categories and confirming that each saved submission includes both common fields and the correct category-specific details.

**Acceptance Scenarios**:

1. **Given** a user submits an idea with valid category-specific data, **When** the submission is saved, **Then** both shared and category-specific data are stored with the idea.
2. **Given** a reviewer opens submitted ideas from different categories, **When** they view the details, **Then** they can see the category-specific information entered by the submitter.
3. **Given** a category has no extra fields, **When** a user selects that category, **Then** the user can submit using only the shared fields.

---

### User Story 3 - Predictable and Accessible Form Behavior (Priority: P3)

As an employee, I can confidently complete the form because category-based changes are clear, accessible, and do not unexpectedly lose valid input.

**Why this priority**: Usability and accessibility reduce failed submissions and user frustration.

**Independent Test**: Can be fully tested by using keyboard-only navigation, screen reader cues, and category switches while entering data.

**Acceptance Scenarios**:

1. **Given** a user navigates with keyboard only, **When** they choose a category and move through fields, **Then** focus order remains logical and all labels are clear.
2. **Given** a user has entered valid shared fields, **When** they change category, **Then** shared fields remain unchanged.
3. **Given** a user entered category-specific values and then changes category, **When** previously shown fields are no longer applicable, **Then** those values are excluded from submission unless they are applicable to the newly selected category.

---

### Edge Cases

- User changes category after entering category-specific values.
- User selects a category that has zero additional fields.
- User selects a category with many additional fields and leaves some required fields blank.
- Planned date is in the past for categories where future planning is expected.
- Planned number of attendees is zero, negative, or unrealistically large.
- Temporary save failure occurs after the user completes a long category-specific form.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a category selector in the idea submission form.
- **FR-002**: The system MUST show a shared set of base idea fields for all categories.
- **FR-003**: The system MUST display additional fields dynamically based on the currently selected category.
- **FR-004**: For the "Event Plan" category, the system MUST include fields for planned date and planned number of attendees.
- **FR-004a**: For the "Event Plan" category in v1, both planned date and planned number of attendees MUST be optional fields.
- **FR-005**: The system MUST define, for each category-specific field, whether it is required or optional.
- **FR-006**: The system MUST prevent submission when required category-specific fields are missing.
- **FR-007**: Validation messages MUST identify the specific missing or invalid field in user-friendly language.
- **FR-008**: The system MUST validate category-specific value formats and boundaries before accepting submission.
- **FR-009**: When a user changes category, the form MUST update visible category-specific fields immediately.
- **FR-010**: Shared base fields MUST retain their entered values when category changes.
- **FR-011**: Data from category-specific fields that are no longer applicable after a category change MUST NOT be submitted.
- **FR-012**: The system MUST store submitted category-specific data together with the selected category and base idea data.
- **FR-013**: Reviewers MUST be able to view category-specific submission details for each idea.
- **FR-014**: The form MUST remain usable for categories that have no additional fields.
- **FR-015**: The category-driven form behavior MUST be accessible to keyboard and assistive technology users.
- **FR-016**: The system MUST support an extensible category field-definition model so categories can define configurable additional field rules without redesigning the base submission flow.
- **FR-017**: Submitted category-specific values MUST be stored as key/value details bound to the selected category and validated against that category's configured field rules.
- **FR-018**: For v1 test-project rollout, the system does not require migration of historical category-specific submissions; database reset/cleaning is an acceptable operational approach.
- **FR-019**: Only administrators MUST be able to create or update category field rules; non-admin users MUST NOT be able to modify category field definitions.

### Key Entities *(include if feature involves data)*

- **Idea Submission**: A user-submitted idea containing shared fields plus a selected category and any applicable category-specific values.
- **Idea Category**: A classification of idea type (for example, Event Plan) that determines which additional fields apply.
- **Category Field Rule**: A configurable definition of an additional field tied to a category, including label, data type, requiredness, and validation constraints.
- **Category Field Value**: A submitted key/value detail captured for a specific idea according to the selected category's field rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users can submit an idea in their selected category on the first attempt without validation-related abandonment.
- **SC-002**: Users can complete a category-based idea submission in under 4 minutes for standard categories.
- **SC-003**: 100% of submitted ideas include all required category-specific information for their selected category.
- **SC-004**: Reviewer follow-up requests for missing submission details decrease by at least 30% within one release cycle after launch.
- **SC-005**: At least 90% of pilot users report that category-based fields make the form clearer and easier to complete.

## Assumptions

- Existing idea submission permissions and authentication remain unchanged.
- The set of idea categories is predefined and managed by the organization.
- Category field rule management is an admin-only capability.
- Only one category is selected per idea submission.
- Category-specific fields are determined by business rules and can differ in requiredness.
- In v1, "Event Plan" category-specific fields (planned date and planned number of attendees) are optional.
- Category field rules are centrally managed and may evolve over time without changing the base submission experience.
- For this test project in v1, no historical data migration is required when category rules evolve; database cleaning/reset is acceptable.
- Categories and field labels use business terminology already familiar to employees.

## Constitution Constraints *(non-negotiable)*

The following constraints are mandated by the project constitution and MUST NOT be relaxed:

- **Stack**: Next.js App Router, React 18+, Tailwind CSS, shadcn/ui, TypeScript strict mode.
- **Accessibility**: All non-text content MUST have text alternatives; text contrast >= 4.5:1 (WCAG AA).
- **Error Handling**: Every async operation MUST have explicit error handling; error/loading/empty states are required.
- **Dependencies**: No new dependency without documented justification aligned with Principle III.
- **Critical Documentation**: For crucial dependency/framework/API decisions, latest versions and authoritative docs MUST be verified via Context7 MCP.
- **Styling**: Tailwind utility classes only - no custom CSS without constitutional amendment.
- **Delivery Governance**: Completion of all spec tasks MUST trigger PR creation; merge to `main` requires explicit final user approval and GitHub MCP merge execution.
