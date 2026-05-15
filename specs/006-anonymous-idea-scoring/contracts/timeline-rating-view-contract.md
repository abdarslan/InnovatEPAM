# Timeline Rating View Contract

## Endpoint Surface
- Transport: `getIdeaTimelineAction` in `actions/ideas.ts`
- Consumer: `components/ideas/IdeaTimeline.tsx`

## Timeline Entry Fields
- Existing: `sequence`, `stage`, `decisionType`, `outcome`, `decidedAt`, optional `comment`, optional `decidedByUser`
- Added for rating-enabled stages:
  - `ratingScore?: number` (1-5)
  - `ratingLabel?: 'Alignment' | 'Feasibility' | 'Impact'`

## Rules
- Stage 1 entries must not include rating metadata.
- Stage 2 entries with approval include Alignment rating.
- Stage 3 entries with approval include Feasibility rating.
- Stage 4 final decision includes Impact rating.
- Rating metadata is linked through `idea_decision_events.rating_id -> idea_ratings.id`.
