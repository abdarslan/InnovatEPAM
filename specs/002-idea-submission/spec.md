# Feature Specification: Idea Submission System

**Feature Branch**: `002-idea-submission`

**Created**: 2026-05-14

**Status**: Draft

**Input**:

## Clarifications

### Session 2026-05-14

- Q: Should there be an idea detail page, or should full content be surfaced within the listing? → A: Expandable row/drawer within the listing — no separate detail page in v1.
- Q: Can submitters edit or delete their own ideas after submission? → A: Yes — submitters can both edit and delete their own ideas.
- Q: Do admin-role users have special permissions over ideas? → A: Admins can delete any idea (moderation/abuse prevention); admins cannot edit other users' ideas.
- Q: Is the category field required or optional? → A: Category is required — submission is blocked if no category is selected.
- Q: What happens if one or more attachment uploads succeed but the idea record fails to save (or vice versa)? → A: Atomic — entire submission is rolled back on any partial failure; user is shown an error.
- Q: Is a confirmation step required before permanent idea deletion? → A: Yes — a confirmation dialog MUST be shown before any deletion, for both submitters and admins.
- Q: How should XSS risk from user-generated idea content be addressed? → A: React’s automatic JSX escaping is the declared protection; `dangerouslySetInnerHTML` is prohibited for any idea content field.
- Q: What are the maximum length constraints for title and description? → A: Title ≤ 255 characters; Description ≤ 5000 characters.
- Q: Must the file attachment download endpoint also require authentication? → A: Yes — FR-011 extended to explicitly cover the download endpoint.
- Q: Should error message field association and success announcement live regions be explicit FRs? → A: No — defer to implementation; Constitution Principle IV (WCAG 2.1 AA) is the binding mandate.
- Q: How should attachment editing work after submission? → A: Owners can add, upload, and delete individual attachments after submission while they retain edit permission on their own ideas.

**Input**: User description: "Idea submission system for InnovatEpam. Form with title, description and category. Idea listing view with optional supporting attachments." Updated scope: "add multimedia preview and multiple file support to the idea attachment system; update spec 002 only"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit a New Idea (Priority: P1)

An authenticated InnovatEPAM employee visits the idea submission page, fills out a form with a title, description, and category, optionally attaches multiple supporting files, previews supported media before submission, and submits the idea. They receive confirmation that their idea was received.

**Why this priority**: Core value of the feature — without idea submission, nothing else is meaningful.

**Independent Test**: Can be fully tested by logging in as an authenticated user, navigating to the submission form, completing all required fields, and verifying the idea appears in the database and confirmation is shown.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the idea submission page, **When** they provide a valid title, description, and category and submit the form, **Then** the idea is saved and a success message is displayed.
2. **Given** an authenticated user on the submission form, **When** they leave the title, description, or category blank and attempt to submit, **Then** the form shows a validation error and does not submit.
3. **Given** an authenticated user completing the form, **When** they attach up to 5 files within the allowed size and type limits, **Then** all selected files are accepted and stored with the idea.
4. **Given** an authenticated user completing the form, **When** they attach a supported image, audio, video, or PDF file, **Then** the form shows a preview for that file before submission.
5. **Given** an authenticated user completing the form, **When** they attach more than 5 files, exceed the allowed total upload size, or include a disallowed file type, **Then** the form displays an error and prevents submission.
6. **Given** an authenticated user who submits a valid form with attachments, **When** either any file storage step or the idea record save fails, **Then** the entire submission is rolled back and the user is shown an actionable error message.
7. **Given** an unauthenticated visitor, **When** they attempt to access the idea submission page, **Then** they are redirected to the login page.

---

### User Story 2 - Browse the Idea Listing (Priority: P2)

An authenticated user visits the idea listing page and sees all submitted ideas displayed with key information — title, category, submitter name, and submission date. Clicking or expanding a row reveals the full description plus preview and download options for any attached files.

**Why this priority**: Allows the community to discover and be inspired by submitted ideas; enables the platform's collaborative purpose.

**Independent Test**: Can be fully tested by navigating to the idea listing page after at least one idea has been submitted, and verifying all ideas appear with correct metadata.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the idea listing page with existing ideas, **When** the page loads, **Then** all submitted ideas are displayed with title, category, submitter name, and date.
2. **Given** an authenticated user viewing the listing, **When** they expand an idea row/drawer, **Then** the full description, attachment previews for supported media, and download links for all attached files are revealed.
3. **Given** an authenticated user on the idea listing page, **When** no ideas have been submitted yet, **Then** a friendly empty-state message is shown.
4. **Given** an unauthenticated visitor, **When** they attempt to access the idea listing page, **Then** they are redirected to the login page.

---

### User Story 3 - Attach Supporting Media (Priority: P3)

An authenticated user optionally attaches multiple supporting files, including documents, images, audio, and video, to support their idea during submission and can confirm what will be uploaded through previews or file summaries.

**Why this priority**: Enhances idea quality with supporting materials but is not required for core submission flow.

**Independent Test**: Can be tested independently by submitting an idea with multiple valid attachments and verifying each attachment is accessible from the submitted idea, with previews shown for supported media types.

**Acceptance Scenarios**:

1. **Given** a user filling out the submission form, **When** they attach up to 5 supported files with a combined total size of 25 MB or less, **Then** the files are accepted and associated with the submitted idea.
2. **Given** a user filling out the submission form, **When** they attach a supported image, audio, video, or PDF file, **Then** they can inspect a preview before submitting the idea.
3. **Given** a user filling out the submission form, **When** they attach a supported file type that cannot be previewed inline, **Then** the system shows the file name, type, and size so they can confirm the selection.
4. **Given** a user filling out the submission form, **When** they do not attach any file, **Then** the idea is submitted successfully without an attachment.
5. **Given** a user who has already selected one or more files, **When** they remove an individual file before submitting, **Then** the remaining files stay selected and the idea can still be submitted.

---

### User Story 4 - Edit or Delete Own Idea (Priority: P3)

A submitter can return to their submitted idea and either update its content or delete it entirely if they no longer wish it to be visible.

**Why this priority**: Important for submitter ownership and data quality, but dependent on the core submission flow being in place first.

**Independent Test**: Can be tested by submitting an idea, editing its title/description, verifying the change is reflected in the listing, then deleting the idea and confirming it is removed.

**Acceptance Scenarios**:

1. **Given** an authenticated user who submitted an idea, **When** they edit the title, description, category, add attachments, or remove individual attachments and save, **Then** the updated content is persisted and visible in the listing.
2. **Given** an authenticated user who submitted an idea, **When** they click delete, **Then** a confirmation dialog is shown; if confirmed, the idea is removed from the listing and no longer accessible.
3. **Given** an authenticated user viewing an idea they did not submit, **When** they attempt to edit or delete it, **Then** the action is refused and an error is shown.
4. **Given** an authenticated admin, **When** they confirm deletion of any idea, **Then** the idea is removed from the listing regardless of who submitted it.

---

### Edge Cases

- What happens when the server is unavailable during submission? User sees a clear error message; no partial data is saved.
- How does the system handle concurrent submissions from the same user? Each submission is independent; no locking required.
- What if the idea listing has a very large number of entries? Pagination is out of scope for v1; listing renders all entries.
- What happens if the attachment upload succeeds but the idea record fails to save? The entire submission is treated as atomic — all attachments and the idea record are rolled back and the user is shown an error.
- What happens when a user selects more than the maximum number of attachments? The system blocks the extra selection and explains the attachment limit before submission.
- What happens when a file type is allowed for upload but not for inline preview? The system still accepts the attachment and provides file metadata plus a download action instead of a preview.
- What happens when an owner removes all attachments during edit? The idea remains valid and can be saved with zero attachments.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Authenticated users MUST be able to submit an idea by providing a title, description, and category.
- **FR-002**: System MUST validate that the title (3–255 characters), description (10–5000 characters), and category fields are all non-empty before allowing submission.
- **FR-003**: System MUST provide a predefined list of categories for the user to select from.
- **FR-004**: Users MUST be able to optionally attach up to 5 files to their idea submission.
- **FR-005**: System MUST reject attachments that exceed 10 MB per file, exceed 25 MB combined per submission, or are of a disallowed file type.
- **FR-006**: System MUST accept common document, image, audio, and video file types (PDF, DOCX, PNG, JPG, JPEG, GIF, MP3, WAV, MP4, WEBM).
- **FR-006a**: System MUST show a pre-submission preview for supported image, audio, video, and PDF attachments.
- **FR-006b**: System MUST show file name, file type, and file size for accepted attachments that do not support inline preview.
- **FR-007**: System MUST display a confirmation message upon successful idea submission.
- **FR-008**: Authenticated users MUST be able to view a listing of all submitted ideas.
- **FR-009**: Idea listing MUST display the title, category, submitter's name, and submission date for each idea.
- **FR-009a**: Each idea row MUST be expandable (via a drawer or accordion) to reveal the full description plus previews for supported attachments and download links for all attached files.
- **FR-010**: Idea listing MUST display a friendly empty-state message when no ideas have been submitted.
- **FR-011**: Only authenticated users MUST be able to access the submission form, idea listing, attachment preview surfaces, and attachment download endpoint; all four surfaces require a valid session.
- **FR-012**: Unauthenticated users MUST be redirected to the login page when attempting to access protected pages.
- **FR-013**: System MUST provide clear error messages for validation failures on the submission form.
- **FR-013a**: System MUST allow users to remove individual selected attachments before submission without resetting the rest of the form.
- **FR-014**: Submitters MUST be able to edit the title, description, and category of their own ideas after submission.
- **FR-014a**: Submitters MUST be able to add attachments to their own ideas and remove individual existing attachments without replacing the whole attachment set.
- **FR-015**: Submitters MUST be able to delete their own ideas; deleted ideas MUST be immediately removed from the listing.
- **FR-016**: System MUST prevent any user from editing or deleting an idea they did not submit.
- **FR-017**: Admin-role users MUST be able to delete any idea regardless of the original submitter.
- **FR-018**: Admin-role users MUST NOT be able to edit the content of ideas submitted by other users.
- **FR-019**: Idea submission MUST be treated as a single atomic operation — if either the idea record or any attachment fails to persist, the entire submission MUST be rolled back and the user shown an error.
- **FR-020**: The system MUST display a confirmation dialog before permanently deleting any idea; deletion MUST only proceed upon explicit user confirmation.
- **FR-021**: All user-generated idea content (title, description) MUST be rendered using React’s standard JSX interpolation only; use of `dangerouslySetInnerHTML` for any idea content field is prohibited.

### Key Entities

- **Idea**: Represents a submitted innovation idea with a title, description, category, zero or more attachments, submitter reference, and submission timestamp.
- **Category**: A predefined classification for an idea (e.g., Process Improvement, Technology Innovation, Customer Experience, Workplace Culture, Cost Reduction).
- **Attachment**: A file associated with an idea, storing the file name, size, media type, preview eligibility, and binary content or storage reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users can complete and submit an idea in under 2 minutes from arriving at the submission page.
- **SC-002**: The idea listing page loads and displays all submitted ideas in under 2 seconds under normal usage conditions.
- **SC-003**: 100% of successfully submitted ideas are immediately visible in the idea listing without requiring a manual refresh.
- **SC-004**: Submission form validation prevents 100% of incomplete submissions (missing required fields).
- **SC-005**: Attachment validation prevents 100% of oversized, over-count, over-total-size, or disallowed file uploads from being processed.
- **SC-006**: Users receive clear, actionable feedback for every form error within the same page interaction.
- **SC-007**: Users can review every selected attachment through a preview or file summary before submission with no more than one interaction per attachment.
- **SC-008**: 100% of supported image, audio, video, and PDF attachments displayed in the idea listing offer an inline preview to authenticated users.

## Assumptions

- The existing user authentication system is reused — only authenticated users can access submission and listing features.
- File attachments are optional; an idea can be submitted without any attachment.
- Categories are predefined by the system; users cannot create or modify categories.
- The initial set of categories covers: Process Improvement, Technology Innovation, Customer Experience, Workplace Culture, and Cost Reduction.
- The idea listing is visible to all authenticated users, not restricted to the original submitter or admins.
- Ideas do not have an approval or moderation workflow in this version — all submitted ideas are immediately visible.
- File attachment storage uses the existing infrastructure; no new storage service is introduced.
- The maximum file size limit is 10 MB per attachment, with a 25 MB combined attachment limit per idea.
- Allowed file types are: PDF, DOCX, PNG, JPG, JPEG, GIF, MP3, WAV, MP4, WEBM.
- Up to 5 files can be attached per idea.
- Inline preview is expected for supported image, audio, video, and PDF attachments; other accepted files fall back to metadata plus download.
- The idea listing is sorted by submission date (newest first) by default.
- Pagination or infinite scroll for large listing volumes is out of scope for v1.
- There is no separate idea detail page in v1; full content is surfaced via an expandable row/drawer in the listing.

## Constitution Constraints *(non-negotiable)*

The following constraints are mandated by the project constitution and MUST NOT be relaxed:

- **Stack**: Next.js App Router, React 18+, Tailwind CSS, shadcn/ui, TypeScript strict mode.
- **Accessibility**: All non-text content MUST have text alternatives; text contrast ≥ 4.5:1 (WCAG AA).
- **Error Handling**: Every async operation MUST have explicit error handling; error/loading/empty states are required.
- **Dependencies**: No new dependency without documented justification aligned with Principle III.
- **Critical Documentation**: For crucial dependency/framework/API decisions, latest versions and authoritative docs MUST be verified via Context7 MCP.
- **Styling**: Tailwind utility classes only — no custom CSS without constitutional amendment.
- **Delivery Governance**: Completion of all spec tasks MUST trigger PR creation; merge to `main` requires explicit final user approval and GitHub MCP merge execution.
