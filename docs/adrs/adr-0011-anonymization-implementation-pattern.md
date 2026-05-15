# ADR-0011: Anonymization Implementation Pattern

**Date**: May 15, 2026  
**Status**: Accepted  
**Context**: Anonymous Idea Evaluation with Scoring System (Feature 006)

## Problem

How should we implement anonymity for idea submitters during evaluation stages 2-4? Two approaches are viable:

1. **UI-only masking**: Hide submitter fields in React components, but keep data in queries
2. **Query-layer filtering**: Filter submitter PII at the server action level before sending to UI

The challenge: Ensure submitter identity cannot be accessed even through browser inspection, API inspection, or accidental data exposure.

## Decision

**Implement anonymization at the query/server-action layer** (Approach 2).

Submitter PII (name, email, profile picture, user ID where possible) is filtered in server actions before returning idea data to UI components.

## Rationale

### Security
- UI-only masking is vulnerable to browser inspection (e.g., in React DevTools, network requests)
- Query-layer filtering is the source of truth; data never leaves the server unmasked

### Maintainability
- Single place to enforce rules (server actions) vs. checking every component
- Reduces risk of accidentally displaying submitter data in new components
- Easier to audit: "Where is submitter visible?" → Check server actions

### Performance
- No additional queries; filter happens inline in existing `getIdeaForAdminView()` action
- No performance penalty

### Precedent
- Consistent with existing InnovatEPAM patterns (server actions as data layer)
- Matches common industry practice (e.g., GitHub issues hide reporter name during peer review)

## Implementation

**Pattern**:
```typescript
export async function getIdeaForAdminView(ideaId: string) {
  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
    with: { submitter: true, ... }
  });

  // Anonymize based on stage
  if (idea && idea.currentStage >= 2 && idea.currentStage <= 4) {
    idea.submitter = null; // or { id: "anonymous", name: null, email: null }
  }

  return idea;
}
```

**Components receive**: `idea.submitter === null` and render conditionally:
```typescript
<div>{idea.submitter ? idea.submitter.name : "Anonymous"}</div>
```

## Consequences

### Positive
- ✅ Secure by default; no accidental data exposure
- ✅ Single enforcement point
- ✅ Audit trail clear: all filtering in `actions/`
- ✅ Matches existing codebase patterns

### Negative
- ⚠️ Server actions become more complex (add anonymization logic to each idea fetch)
- ⚠️ Slight overhead: check `idea.currentStage` on every query (negligible)

### Mitigation
- Create helper function `shouldAnonymizeSubmitter(idea)` to keep logic centralized and reusable
- Document in code comments why anonymization is needed

## Alternatives Considered

### UI-only Masking
- **Rejected**: Too easy to bypass; violates security-first principle

### Hybrid (component-level checks)
- **Rejected**: Distributes logic across codebase; harder to maintain and audit

## Related

- ADR-0012: Rating Immutability Design (complementary security measure)
- Feature Spec: [specs/006-anonymous-idea-scoring/spec.md](../../specs/006-anonymous-idea-scoring/spec.md)
