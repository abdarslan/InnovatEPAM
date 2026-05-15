# Research Findings: Anonymous Idea Evaluation with Scoring System

**Status**: Complete — All specification ambiguities clarified in `/speckit.clarify` phase. No additional research tasks required.

## Pre-Verified Reference Materials

### 1. Drizzle ORM Schema & Migrations

**Source**: Existing `lib/db/schema.ts` and `lib/db/migrations/`

**Finding**: InnovatEPAM uses Drizzle ORM with SQLite. Existing migrations follow pattern:
- SQL migration files in `lib/db/migrations/` with sequential numbering
- Schema defined in TypeScript using Drizzle's fluent API
- Drizzle automatically manages table relationships and constraints

**Application**: 
- New `idea_ratings` table will follow existing pattern (Drizzle schema + migration)
- Use `UNIQUE(idea_id, stage)` constraint to enforce one-rating-per-stage rule
- Foreign keys to existing `ideas` and `users` tables already established

### 2. shadcn/ui Component Library

**Source**: Project dependency in `package.json`; existing components in `components/ui/`

**Finding**: InnovatEPAM uses shadcn/ui v0.8+ with Tailwind CSS. No pre-built rating component available in shadcn/ui core.

**Application**:
- Build rating control using shadcn/ui Button or RadioGroup primitives + Tailwind
- Accessible via keyboard (Tab, Arrow Keys, Enter/Space)
- Visual: 5 clickable stars (or radio buttons) with 1-5 numeric labels
- Consistent styling with existing shadcn/ui components (border-radius, spacing, hover states)

### 3. Next.js Server Actions Pattern

**Source**: Existing `actions/ideas.ts` and `actions/auth.ts`

**Finding**: InnovatEPAM uses Next.js 14+ App Router with server actions for mutations. Pattern:
```typescript
"use server";

interface RequestPayload { /* ... */ }
interface ResponsePayload { /* ... */ }

export async function myAction(req: RequestPayload): Promise<ResponsePayload> {
  // Auth check
  // Validation
  // DB operation
  // Return result
}
```

**Application**:
- Create `submitRating()` server action in `actions/idea-evaluation.ts`
- Validate: admin auth, idea exists, stage valid (2-4), score 1-5, no prior rating
- Save to `idea_ratings` table; update `ideas` table with final ratings on stage 4
- Return { success, ratingId } or error message

### 4. Timeline Event Rendering

**Source**: `components/ideas/IdeaTimeline.tsx` (existing component)

**Finding**: Timeline renders events from `idea_evaluation_log` table with event type, admin name, timestamp, and action (approved/rejected). Current structure:
```typescript
interface TimelineEvent {
  id: string;
  idea_id: string;
  event_type: "stage_advanced" | "stage_rejected" | "comment_added";
  admin_id: string;
  created_at: Date;
  // ... other fields
}
```

**Application**:
- Extend TimelineEvent with optional `rating_id`, `rating_score`, `rating_stage`
- Timeline renderer: If rating exists, append "— Alignment: 4/5" to event message
- Update query in `actions/` to LEFT JOIN `idea_ratings` when fetching timeline

### 5. Anonymization Implementation Pattern

**Source**: Existing `AdminIdeaRow.tsx`, `AdminIdeaList.tsx` (components that display ideas to admins)

**Finding**: Current pattern shows all submitter info on admin dashboards. Anonymization must be enforced at:
- **Query layer** (server actions): Filter submitter fields based on idea.stage
- **View layer** (components): Display "Anonymous" or omit submitter field entirely

**Application**:
- In `actions/ideas.ts`: Add filter logic `if (idea.stage >= 2) { idea.submitter = null }`
- Components receive `idea.submitter === null` and render "(Anonymous)" or skip display
- More secure than UI-only masking; database query is source of truth

## Decision Summary

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Rating Control UI | Custom shadcn/ui Button group with Tailwind | No new npm dependency; consistent with existing UI |
| Drizzle Schema | New table + UNIQUE constraint | Enforces 1-rating-per-stage at DB level |
| Server Actions | Follow existing `actions/` pattern | Consistency with codebase conventions |
| Anonymization Layer | Query-layer filtering (server actions) | More secure than UI masking; single source of truth |
| Timeline Integration | LEFT JOIN `idea_ratings` on fetch | Minimal schema change; rating linked to event |

## No Further Research Required

All technical unknowns have been resolved through:
1. Code review of existing patterns (Drizzle, shadcn/ui, server actions, timeline)
2. Specification clarifications (5 Q&A sessions) establishing business rules
3. Architecture decision templates prepared for ADR creation in Phase 1

**Next Step**: Generate tasks.md with specific implementation tasks for developers.
