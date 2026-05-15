# Anonymized Idea View Contract

## Endpoint Surface
- Transport: Next.js server action projections in `actions/ideas.ts`
- Consumers: `components/ideas/AdminIdeaList.tsx`, `components/ideas/AdminIdeaRow.tsx`

## Shape
- Based on `AdminIdeaListItem`
- `submitterName` / submitter identity fields are anonymized by server projection when rules apply.

## Anonymization Rules
- Stage 1 (`stage_1_triage`): submitter is visible to admin.
- Stage 2-4 (`stage_2_department_review`, `stage_3_feasibility`, `stage_4_final_executive_decision`): submitter is hidden.
- Final approved: submitter visible for implementation follow-up.
- Final rejected: submitter remains hidden.

## Output Expectations
- Hidden identity is rendered as `Anonymous`.
- Timeline evaluator identity remains visible for audit.
