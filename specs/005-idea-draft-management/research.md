# Research: Idea Draft Management

**Feature**: `005-idea-draft-management`
**Date**: 2026-05-15

## Decision 1: Store drafts in dedicated draft tables

- Decision: Use dedicated tables (`idea_drafts`, `idea_draft_attachments`, `idea_draft_field_values`) instead of adding a `draft` status to `ideas`.
- Rationale: Drafts must be invisible to admins and non-owners, and must remain outside evaluation/public idea workflows. Physical separation reduces accidental leakage risk in existing listing/admin queries.
- Alternatives considered:
  - Add `draft` to `ideas.status`: rejected because it increases the chance of cross-surface leakage and requires defensive filtering in many existing queries.
  - Save drafts only in browser local storage: rejected because draft data must persist across sessions/devices.

## Decision 2: Draft save uses relaxed validation

- Decision: Draft save accepts empty/partial payloads and does not enforce final-submit required-field validation.
- Rationale: Clarified requirement states submitters can save at any preparation stage, including with no required fields completed.
- Alternatives considered:
  - Require title before save: rejected by clarification.
  - Reuse full submit validation for draft save: rejected because it undermines draft value.

## Decision 3: Resume flow uses dashboard entry + prefilled new-idea form

- Decision: Show owner-only drafts on dashboard and open resume with draft id context into the idea form route.
- Rationale: Reuses existing form UX while satisfying one-click continue behavior from dashboard.
- Alternatives considered:
  - Build separate draft editor route/components: rejected due to duplication and higher maintenance.
  - Embed full editor inside dashboard list: rejected for reduced focus and poor mobile ergonomics.

## Decision 4: Submitting a draft performs atomic create-and-delete

- Decision: Final submit from a resumed draft creates submitted idea records (plus attachments/dynamic values) and deletes the source draft within one transaction.
- Rationale: Clarified requirement mandates draft deletion after successful submission; atomicity prevents duplicate retention or partial persistence.
- Alternatives considered:
  - Submit first, then asynchronously delete draft: rejected due to possible orphaned drafts on failure.
  - Keep archived draft after submit: rejected by clarification.

## Decision 5: Keep no-expiry retention policy

- Decision: Drafts do not auto-expire and remain until explicit submitter submit/delete action.
- Rationale: Clarified requirement and user expectation for long-running preparation.
- Alternatives considered:
  - TTL-based cleanup (30/90 days): rejected by clarification.
  - Soft-expire + restore model: rejected as unnecessary complexity for v1.

## Decision 6: No new dependencies

- Decision: Implement with existing Next.js, Drizzle, Zod, react-hook-form, and existing auth/session utilities.
- Rationale: Meets constitution dependency constraints and keeps scope focused.
- Alternatives considered:
  - Add draft state management/form persistence libraries: rejected because current stack already supports required behavior.
