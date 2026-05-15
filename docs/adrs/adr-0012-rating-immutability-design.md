# ADR-0012: Rating Immutability Design

**Date**: May 15, 2026  
**Status**: Accepted  
**Context**: Anonymous Idea Evaluation with Scoring System (Feature 006)

## Problem

Should admins be able to change their rating after submission? This affects compliance, audit trail integrity, and user trust.

Options:
1. **Mutable ratings**: Allow updates/corrections; log all changes
2. **Immutable ratings**: Lock ratings after submission; corrections via comments only
3. **Limited mutability**: Allow changes only before idea progresses to next stage

## Decision

**Implement immutable ratings** (Option 2).

Once an admin submits a rating as part of a stage decision, that rating **cannot be modified or deleted**. If an error is discovered, the admin must leave a follow-up comment acknowledging the issue.

## Rationale

### Compliance & Audit
- Immutable records are legally defensible; essential for organizations with compliance requirements
- Prevents tampering or retroactive changes to evaluation history
- Clear audit trail: original rating timestamp + evaluator + score never change

### User Trust
- Stakeholders (submitters, executive sponsors) can trust ratings are not manipulated post-hoc
- Transparent process: all decisions are permanent and timestamped

### Simplicity
- Avoids complex version-tracking logic
- Database constraint (`UNIQUE(idea_id, stage)`) naturally enforces 1-rating-per-stage

### Industry Standard
- Common in peer review systems (journals, conferences): reviewer scores locked after submission
- Expected by compliance teams

## Implementation

**Database Constraint**:
```sql
UNIQUE (idea_id, stage) -- Prevents duplicate/replacement ratings
```

**Server Action Logic**:
```typescript
export async function submitRating(request: SubmitRatingRequest) {
  // Check if rating already exists for this idea+stage
  const existing = await db.query.idea_ratings.findFirst({
    where: and(
      eq(idea_ratings.ideaId, request.ideaId),
      eq(idea_ratings.stage, request.stage)
    )
  });

  if (existing) {
    throw new Error("Rating already submitted for this stage. Cannot modify.");
  }

  // Insert new rating
  const newRating = await db.insert(idea_ratings).values({
    ...request,
    id: generateId()
  });

  return { success: true, ratingId: newRating.id };
}
```

**UI Feedback**:
- If admin attempts to change rating: Show disabled state + message "Rating submitted and locked"
- Display original rating with timestamp: "Locked on May 15, 2026 at 2:30 PM"

## Consequences

### Positive
- ✅ Audit trail is tamper-proof
- ✅ Legal defensibility in case of dispute
- ✅ Simple to implement (UNIQUE constraint does the work)
- ✅ Clear expectations: first submission is final
- ✅ Discourages hasty submissions (admins think twice before rating)

### Negative
- ⚠️ Admins cannot correct typos or genuine errors after submission
- ⚠️ May frustrate admins who want to "get it right"

### Mitigation
- Allow admins to leave follow-up comments explaining corrections
- Provide clear UI affordance to rate carefully before submitting (confirmation dialog)
- Document in quickstart: "Think carefully before submitting; ratings are permanent"

## Alternatives Considered

### Mutable with Change Logging
- **Rejected**: Complex version tracking; still not legally bulletproof (changes look suspicious)
- **Rejected**: Adds confusion: which rating is the "real" one?

### Limited Mutability (before stage progression)
- **Rejected**: Creates window of opportunity for manipulation after decision but before progression
- **Rejected**: Inconsistent user experience: "why can I change this but not after idea moves?"

## Related

- ADR-0011: Anonymization Implementation Pattern (complementary security)
- Feature Spec: [specs/006-anonymous-idea-scoring/spec.md](../../specs/006-anonymous-idea-scoring/spec.md)
- Data Model: [specs/006-anonymous-idea-scoring/data-model.md](../../specs/006-anonymous-idea-scoring/data-model.md)

## Notes

- This decision directly supports FR-010a (immutable ratings requirement)
- Immutability is a business rule, enforced at DB and application logic layers
