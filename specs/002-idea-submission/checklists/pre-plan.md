# Pre-Plan Checklist: Idea Submission System

**Purpose**: Author self-review — validate security, testing strategy, and accessibility/UX requirement quality before implementation planning
**Created**: 2026-05-14
**Feature**: [spec.md](../spec.md)
**Depth**: Standard (~20 items)
**Audience**: Author (self-gate before `/speckit.plan`)
**Focus areas**: Security & Authorization (B) · Testing Strategy Coverage (C) · Accessibility & UX (D)

---

## Security & Authorization Requirements

- [ ] CHK001 - Is server-side enforcement of authorization explicitly required, or do FR-016/FR-017/FR-018 only imply it? [Clarity, Spec §FR-016–FR-018]
- [x] CHK002 - Is there an explicit requirement that the file download endpoint (`/api/ideas/[id]/attachment`) must be authentication-protected? [Gap, Spec §FR-011] → **Resolved**: FR-011 updated to explicitly cover the download endpoint.
- [ ] CHK003 - Is MIME type validation required to be performed server-side, not only via the file picker `accept` attribute? [Clarity, Spec §FR-005]
- [x] CHK004 - Are maximum length constraints defined for user-generated content (title, description) to prevent abusive payloads? [Gap, Spec §FR-002] → **Resolved**: FR-002 updated; title 3–255 chars, description 10–5000 chars.
- [ ] CHK005 - Is a requirement defined for what happens when a user whose account is inactive attempts to submit or view ideas? [Gap, Edge Case]
- [x] CHK006 - Does the spec address the risk of XSS from rendering user-generated idea content (title, description) in the listing? [Gap, Security] → **Resolved**: FR-021 added; React JSX escaping declared as protection; `dangerouslySetInnerHTML` prohibited.
- [ ] CHK007 - Are requirements defined for whether admin delete actions require any audit trail or confirmation log? [Gap, Spec §FR-017]

---

## Testing Strategy Coverage

- [ ] CHK008 - Does each user story's "Independent Test" cover both the happy path and the auth-failure (unauthenticated redirect) path? [Completeness, Spec §US1–US4]
- [ ] CHK009 - Are the RBAC acceptance scenarios (own idea vs. others' idea vs. admin) sufficient to derive independent integration tests for FR-016/FR-017/FR-018? [Completeness, Spec §US4]
- [ ] CHK010 - Is a test scenario explicitly defined for the file deselect (remove before submit) flow? [Coverage, Spec §US3]
- [ ] CHK011 - Is "immediately visible" in SC-003 defined precisely enough to write a deterministic, non-flaky test? [Measurability, Spec §SC-003]
- [ ] CHK012 - Are acceptance criteria defined for the partial-failure/atomic-rollback case that are testable at the integration layer? [Coverage, Spec §FR-019]
- [ ] CHK013 - Is a test scenario defined for the edit flow where an attachment is replaced or removed on an existing idea? [Coverage, Gap]
- [ ] CHK014 - Are the concurrent-submission and server-unavailable edge cases resolved with testable acceptance criteria, or left open? [Measurability, Spec §Edge Cases]

---

## Accessibility & UX Requirements

- [ ] CHK015 - Are keyboard interaction requirements defined for the expandable row (e.g., Enter/Space to toggle open/close)? [Gap, Accessibility]
- [x] CHK016 - Are form validation error messages required to be programmatically associated with their respective input fields (e.g., `aria-describedby`)? [Gap, Accessibility, Spec §FR-013] → **Deferred**: Constitution Principle IV (WCAG 2.1 AA) is the binding mandate; no spec-level FR added.
- [x] CHK017 - Is the success/confirmation message required to be announced to screen readers via an `aria-live` region? [Gap, Accessibility, Spec §FR-007] → **Deferred**: Constitution Principle IV (WCAG 2.1 AA) is the binding mandate; no spec-level FR added.
- [x] CHK018 - Is a delete confirmation step (e.g., dialog or "are you sure?" prompt) required before permanent idea deletion? [Gap, UX, Spec §FR-015] → **Resolved**: FR-020 added; confirmation dialog required for all deletions.
- [ ] CHK019 - Is an accessible label required for the file attachment input, and is the allowed file types/size communicated to users before they select a file? [Gap, Accessibility, Spec §FR-004]
- [ ] CHK020 - Are loading and progress states required during idea submission and idea listing data fetch? [Gap, UX, Spec §FR-007]
- [ ] CHK021 - Is a filename preview (showing the selected file's name after selection) required in the file input UX? [Gap, UX, Spec §FR-004]
