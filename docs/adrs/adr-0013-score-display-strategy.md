# ADR-0013: Score Display Strategy

**Date**: May 15, 2026  
**Status**: Accepted  
**Context**: Anonymous Idea Evaluation with Scoring System (Feature 006)

## Problem

After an idea completes evaluation through all 4 stages, how should the three scores (Alignment, Feasibility, Impact) be displayed to users and admins?

Options:
1. **Show individual ratings only**: Display all three final scores without aggregation
2. **Aggregate across multiple admins**: Show average, min, max if multiple admins rated
3. **Show confidence score**: Display variance/agreement level alongside ratings
4. **Show narrative summary**: Hide numeric scores; show prose description instead

## Decision

**Show individual scores for each stage** (Option 1).

Display all three final ratings (Alignment, Feasibility, Impact) on completed ideas as individual 1-5 scores. No aggregation, no weighted calculations, no narratives.

Format: "Alignment: 4/5 | Feasibility: 3/5 | Impact: 5/5"

## Rationale

### Business Model
- InnovatEPAM uses **one admin per stage** (from specification clarifications)
- No multi-admin voting or consensus required
- Therefore, no aggregation needed: each stage has exactly one score

### Transparency
- Users/submitters want to understand how ideas were evaluated
- Simple numeric scores are immediately understandable (vs. weighted algorithms)
- Three separate scores show multi-dimensional evaluation (strategy, feasibility, impact)

### Simplicity
- No complex calculations (average, std dev, confidence intervals)
- No risk of "hidden logic" obscuring how scores are determined
- Easy to implement: just display `ideas.alignment_rating`, `ideas.feasibility_rating`, `ideas.impact_rating`

### Compliance & Audit
- Individual scores are traceable to specific admins (via timeline + ADR-0012)
- No "secret sauce" that combines ratings in unexpected ways
- Stakeholders can understand exact evaluation path

### User Experience
- Three separate, clearly-labeled scores are easier to understand than aggregates
- Helps submitters understand where idea is strong/weak
- Encourages future submissions: "My feasibility was 3/5; next time I'll focus on implementation details"

## Implementation

**Data Storage**:
- Denormalize final ratings on `ideas` table: `alignment_rating`, `feasibility_rating`, `impact_rating`
- Copy values from `idea_ratings` table when stage completes

**Display Component** (IdeaCard, DetailPage):
```typescript
{idea.status === "completed" && (
  <div className="mt-4 space-y-2">
    <h4 className="text-sm font-semibold">Evaluation Scores</h4>
    <div className="flex gap-4 text-sm">
      <div>Alignment: <span className="font-bold">{idea.alignmentRating}/5</span></div>
      <div>Feasibility: <span className="font-bold">{idea.feasibilityRating}/5</span></div>
      <div>Impact: <span className="font-bold">{idea.impactRating}/5</span></div>
    </div>
  </div>
)}
```

**Timeline Entry**:
```
Stage 2: Approved → Alignment: 4/5
Stage 3: Approved → Feasibility: 3/5
Stage 4: Approved → Impact: 5/5
```

## Consequences

### Positive
- ✅ Simple, understandable for all users
- ✅ Direct traceability to individual admins (via timeline + immutability)
- ✅ No hidden logic or "black box" calculations
- ✅ Easy to implement and maintain
- ✅ Aligns with business model (one admin per stage)

### Negative
- ⚠️ Doesn't show "overall consensus" if multiple admins were to rate same stage (but this doesn't happen per spec)
- ⚠️ Individual low scores might discourage submitters (mitigated by timeline comments)

### Mitigation
- Encourage detailed admin comments alongside ratings
- Highlight that each stage is a different evaluation dimension (not cumulative)
- In quickstart, explain what each score represents and how it affects next steps

## Alternatives Considered

### Aggregate Ratings (average)
- **Rejected**: Business model uses one admin per stage, so aggregation is mathematically unnecessary
- **Rejected**: Hides individual evaluator's specific score from audit trail

### Weighted Scoring (impact > feasibility > alignment)
- **Rejected**: No requirement in specification for weighted calculations
- **Rejected**: Adds complexity; risk of weights being misunderstood or politicized

### Narrative Summary ("Strong feasibility concern")
- **Rejected**: Less transparent than numeric scores
- **Rejected**: Subjective; harder to compare across ideas

## Related

- ADR-0012: Rating Immutability Design (immutable individual scores)
- Specification: [specs/006-anonymous-idea-scoring/spec.md](../../specs/006-anonymous-idea-scoring/spec.md#user-story-5)
- Data Model: [specs/006-anonymous-idea-scoring/data-model.md](../../specs/006-anonymous-idea-scoring/data-model.md#extended-table-ideas)

## Notes

- Denormalization of final scores on `ideas` table is justified for performance (dashboard load time target: <1s for 100+ ideas)
- Immutability of individual ratings ensures users see authentic, unmodified scores
- Three-dimensional scoring (alignment, feasibility, impact) provides richer feedback than single "go/no-go" decision
