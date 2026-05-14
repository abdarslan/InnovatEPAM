# Pre-Plan Readiness Checklist: Idea Evaluation Workflow

**Purpose**: Validate that the spec is complete and unambiguous enough to begin /speckit.plan — testing the requirements, not the implementation
**Created**: 2026-05-14
**Feature**: [spec.md](../spec.md)
**Depth**: Standard pre-planning gate
**Audience**: Author (self-review before planning)
**Focus**: Completeness, Clarity, Consistency, Scenario Coverage, Non-Functional gaps

---

## Requirement Completeness

- [x] CHK001 — Is the default view of the `admin/ideas` route defined? **Resolved:** All ideas shown by default; filter controls available to narrow. [Spec §FR-015 updated]
- [ ] CHK002 — Are loading state requirements defined for the `admin/ideas` route while the idea list fetches? [Gap] *(Constitution mandates explicit loading states for every async operation)*
- [ ] CHK003 — Are empty-state requirements defined for the `admin/ideas` route when zero ideas exist in the system (distinct from "no ideas match filter")? [Gap]
- [x] CHK004 — Is a success confirmation requirement specified for the admin after a status transition completes? **Resolved:** FR-019 added — toast notification + in-place row update, no full page reload. [Spec §FR-019, §US1 scenarios 2–3]
- [x] CHK005 — Is a data migration requirement documented for setting the `status` field of pre-existing ideas to "Submitted"? **Resolved:** No migration needed — database has no existing idea rows. FR-020 requires a DB-level default of "Submitted". [Spec §FR-020, §Assumptions]
- [ ] CHK006 — Is the server-side error response format defined for illegal transition attempts (e.g., direct Submitted → Rejected)? [Gap, Spec §FR-006 edge case]
- [x] CHK007 — Is there a requirement specifying whether the `admin/ideas` route is protected by the same RBAC middleware? **Auto-resolved:** FR-018 added — same middleware as `admin/dashboard` and `admin/users`. [Spec §FR-018]
- [x] CHK008 — Are requirements defined for what happens to an idea in "Under Review" status if the idea is deleted? **Resolved:** FR-022 added — deletion is rejected with validation error; idea remains unchanged. [Spec §FR-022, §Edge Cases]

---

## Requirement Clarity

- [ ] CHK009 — Is "immediately" (US1 scenario 1) defined as a system behavior (e.g., optimistic update, server-confirmed response) rather than a vague timing term? [Ambiguity, Spec §US1 scenario 1]
- [ ] CHK010 — Is "clearly displayed" (US1 scenario 5 — final status shown when evaluation actions are hidden) quantified with specific visual or textual criteria? [Ambiguity, Spec §US1 scenario 5]
- [ ] CHK011 — Is "status badge" defined with enough specificity for design (e.g., label text per status, color intent, size) or intentionally deferred to implementation? [Ambiguity, Spec §FR-011]
- [ ] CHK012 — Is "shown an appropriate message" (US1 scenario 6 — non-admin access denied) defined with what that message must communicate? [Ambiguity, Spec §US1 scenario 6]
- [x] CHK013 — Does FR-015 reference "admin dashboard" while Q1 established `admin/ideas`? **Auto-resolved:** FR-015 and US1 narrative updated to reference `admin/ideas` consistently. [Spec §FR-015, §US1]
- [ ] CHK014 — Does the spec distinguish between how an acceptance comment (optional) and a rejection comment (required) are displayed in the submitter's view, or are they treated identically? [Clarity, Spec §FR-008, §FR-012]

---

## Requirement Consistency

- [x] CHK015 — Does US1's narrative imply a filtered default view conflicting with FR-015? **Resolved by Q1:** US1 updated to reflect "all ideas" default; FR-015 now states default explicitly. [Spec §US1, §FR-015]
- [ ] CHK016 — Does US2's title ("If their idea was rejected, they can also see the admin's comment") understate the actual requirement, which covers both acceptance and rejection comments per FR-012 and US2 scenario 2? [Inconsistency, Spec §US2 title vs §FR-012]
- [x] CHK017 — Are US1 scenario references to the "admin dashboard" updated to reflect the `admin/ideas` route? **Auto-resolved:** US1 narrative updated. [Spec §US1]
- [ ] CHK018 — Is the IdeaEvaluation entity's "comment" field described consistently as a single field across the Key Entities section, FR-007 (required for rejection), FR-008 (optional for acceptance), and FR-009 (must be stored)? [Consistency, Spec §FR-007–009 vs §Key Entities]

---

## Acceptance Criteria Quality

- [ ] CHK019 — Is SC-001 ("admins can complete a full review in under 60 seconds") a system performance SLA or a UX usability target — and if the latter, is there a defined test protocol? [Measurability, Spec §SC-001]
- [ ] CHK020 — Is SC-005 ("filter to locate actionable items in under 10 seconds") verifiable as a system metric (e.g., query response time) or does it require a usability study? [Measurability, Spec §SC-005]
- [ ] CHK021 — Can SC-003 ("100% of transitions enforced server-side") be verified via automated integration tests, and are those tests implicitly required by this SC? [Measurability, Spec §SC-003]

---

## Scenario Coverage

- [ ] CHK022 — Is there a scenario covering what an admin sees when viewing an idea that has already been evaluated (i.e., the admin views a "Rejected" or "Accepted" idea in the `admin/ideas` route and sees the stored comment)? [Coverage, Gap]
- [ ] CHK023 — Is there a scenario for a submitter viewing an accepted idea with an optional comment vs. one without any comment — to confirm the display handles the null comment case gracefully? [Coverage, Gap, Spec §FR-008]
- [ ] CHK024 — Are requirements defined for what all authenticated users (non-submitters, non-admins) see when they view an idea that has been rejected — specifically confirming they see the status badge but NOT the rejection reason? [Coverage, Spec §FR-012]
- [ ] CHK025 — Is there a scenario for an admin evaluating an idea and then immediately verifying the employee-facing listing reflects the updated status (end-to-end consistency between admin action and employee view)? [Coverage, Spec §SC-002]

---

## Non-Functional Requirements

- [x] CHK026 — Are status badge accessibility requirements defined to ensure color is NOT the sole visual differentiator? **Resolved:** FR-021 added — text label always visible inside colored pill; label text per status defined. [Spec §FR-021]
- [ ] CHK027 — Are screen reader / ARIA live region requirements defined for the admin's UI to announce the result of a status transition action? [Gap, Non-Functional]
- [ ] CHK028 — Is mobile responsiveness explicitly required for the `admin/ideas` route and its evaluation action controls (not just the status badges in the employee listing)? [Ambiguity, Spec §Assumptions vs §FR-013]

---

## Dependencies & Assumptions

- [x] CHK029 — Is the IdeaEvaluation entity storage strategy (separate table vs. columns on ideas) documented? **Auto-resolved:** Key Entities updated — IdeaEvaluation is explicitly a dedicated database table. [Spec §Key Entities]
- [x] CHK030 — Is the dependency on feature 002's data model explicitly referenced so the planner can sequence migration tasks? **Resolved:** No migration tasks needed — database is empty; FR-020 documents the DB default strategy. [Spec §FR-020]

---

## Notes

- **Checklist created**: 2026-05-14 — pre-planning gate for `003-idea-evaluation-workflow`
- **Items resolved during clarification**: CHK001, CHK004, CHK005, CHK007, CHK008, CHK013, CHK015, CHK017, CHK026, CHK029, CHK030.
- Remaining clarity items CHK009–CHK014 can be deferred to planning if implementation decisions are acceptable there.
- Remaining non-functional items CHK027–CHK028 should be addressed before component-level UI design starts.
- Mark items `[x]` as resolved; add inline notes with resolution or spec line reference.
