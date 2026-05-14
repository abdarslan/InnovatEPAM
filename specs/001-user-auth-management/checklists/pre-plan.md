# Requirements Completeness Checklist: User Authentication & Management

**Purpose**: Lightweight pre-plan gate — validate spec completeness and clarity before `/speckit.plan` runs
**Created**: 2026-05-14
**Feature**: [spec.md](../spec.md)
**Audience**: Author | **Depth**: Lightweight | **Focus**: Full requirements completeness sweep

---

## Requirement Completeness

- [x] CHK001 — Are loading, error, and empty states explicitly required for all four auth-related UIs (registration form, login form, access-denied page, deactivated-account message)? [Completeness, Gap]
- [x] CHK002 — Is the exact content and layout of the access-denied page specified beyond "a clear explanation"? [Completeness, Spec §US3 Scenario 2]
- [x] CHK003 — Is the admin seeding mechanism (seed script, CLI tool, or back-office UI) described with enough detail to drive a planning decision? [Completeness, Spec §FR-015]
- [x] CHK004 — Are requirements defined for what happens when an `admin` user navigates to a submitter-only page? [Completeness, Spec §Edge Cases]

## Requirement Clarity

- [x] CHK005 — Is "8-hour sliding expiry" fully defined — does every authenticated request reset the timer, or only explicit navigations? [Clarity, Spec §FR-008]
- [x] CHK006 — Is the brute-force lockout counter reset mechanism fully specified — does successful login reset it, and does admin deactivation interact with it? [Clarity, Spec §FR-007a]
- [x] CHK007 — Is "redirect with original URL preserved" specified with enough detail — URL encoding, maximum length, and paths to exclude from preservation? [Clarity, Spec §FR-011]
- [x] CHK008 — Is "role-appropriate navigation" defined with a concrete list of elements shown or hidden per role, rather than left implicit? [Clarity, Spec §FR-012]

## Acceptance Criteria Quality

- [x] CHK009 — Are success criteria present for the account deactivation flow (US4)? [Acceptance Criteria, Gap]
- [x] CHK010 — Is SC-003 ("100% of admin-only routes") paired with a defined enumeration of which routes are admin-only? [Measurability, Spec §SC-003]
- [x] CHK011 — Are SC-001 and SC-002 time targets (2 min registration, 30 sec login) measurable under specified conditions (network, device class)? [Measurability, Spec §SC-001–SC-002]
- [x] CHK012 — Is there a success criterion for the brute-force lockout mechanism (FR-007a)? [Completeness, Gap]

## Scenario Coverage

- [x] CHK013 — Are requirements defined for concurrent sessions from multiple devices — permitted, blocked, or last-session-wins? [Coverage, Spec §Edge Cases]
- [x] CHK014 — Is the session-expiry-during-navigation scenario specified with a required UX response (redirect, inline message, or modal)? [Coverage, Spec §Edge Cases]
- [x] CHK015 — Are alternate flows defined for rapid duplicate submission of the login form before a response is received? [Coverage, Spec §US2]

## Non-Functional & Constitution Constraints

- [x] CHK016 — Are password storage requirements (hashing algorithm, salting strategy) documented or explicitly flagged as an ADR decision for the plan phase? [Non-Functional, Gap]
- [x] CHK017 — Are the testing constraints (Vitest + RTL unit/component, Playwright E2E, ≥80% coverage) traceable to specific user stories or acceptance scenarios in the spec? [Constitution Constraints, Spec §Constitution Constraints]
- [x] CHK018 — Is out-of-scope work (password reset, SSO, email verification) explicitly bounded in the spec to prevent scope creep during planning? [Completeness, Spec §Assumptions]
- [x] CHK019 — Are the TypeScript Strict Mode constraints (no `any`, explicit null handling) reflected in the Key Entities section's implied type contracts (User, Session, Role)? [Constitution Constraints, Spec §Constitution Constraints]

## Notes

- Items are requirements-quality tests — they validate what is *written in the spec*, not whether the system behaves correctly.
- Mark `[x]` when the requirement gap is resolved (either answered in spec or explicitly deferred with rationale).
- Unresolved gaps in CHK001–CHK015 are blockers for `/speckit.plan`; CHK016–CHK019 are strong recommendations.
