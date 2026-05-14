# Quickstart: Smart Idea Submission Forms

**Feature**: `004-smart-idea-submission`
**Branch**: `004-add-smart-idea-forms`
**Date**: 2026-05-14

## Prerequisites

- Node.js 18+
- Dependencies installed via `npm install`
- This project is a test environment where DB reset is acceptable

## Planned File Changes

### Database

| File | Change | Purpose |
|---|---|---|
| `lib/db/schema.ts` | Modify | Add `event_plan` category and new dynamic-field tables/types |
| `lib/db/migrations/0003_dynamic_idea_fields.sql` | New | Create `idea_category_field_rules` and `idea_field_values` |
| `lib/db/seed.ts` | Modify | Seed Event Plan rules (`planned_date`, `planned_attendees`) |

### Validation and Domain Logic

| File | Change | Purpose |
|---|---|---|
| `lib/ideas/validation.ts` | Modify | Add dynamic validation helpers and rule-aware submission parsing |
| `lib/ideas/category-fields.ts` | New | Rule loading, coercion, and category field validation utilities |

### Server Actions

| File | Change | Purpose |
|---|---|---|
| `actions/ideas.ts` | Modify | Extend submit/detail flows with dynamic category field values |
| `actions/idea-field-rules.ts` | New | Admin-only create/update/list actions for field rules |

### UI

| File | Change | Purpose |
|---|---|---|
| `components/ideas/IdeaForm.tsx` | Modify | Render dynamic fields based on selected category and active rules |
| `components/ideas/IdeaRow.tsx` | Modify | Show category-specific values in expanded detail view |
| `app/(protected)/admin/idea-field-rules/page.tsx` | New | Admin rule management surface |

### Tests

| File | Change | Purpose |
|---|---|---|
| `components/ideas/IdeaForm.test.tsx` | Modify | Add category-switch and dynamic field validation coverage |
| `tests/integration/ideas/submit-dynamic-fields.test.ts` | New | Verify transaction save for ideas + dynamic values |
| `tests/integration/ideas/admin-field-rules.test.ts` | New | Verify admin-only rule management and rule uniqueness |
| `tests/e2e/idea-dynamic-form-flow.spec.ts` | New | Full submission journey with Event Plan optional fields |

## Local Run

1. Reset or recreate DB for clean test environment.
2. Apply migrations.

```bash
npm run db:migrate
```

3. Seed baseline users and category field rules.

```bash
npm run db:seed
```

4. Start app.

```bash
npm run dev
```

5. Open submission page and verify dynamic behavior.

- Select `Event Plan` and confirm optional fields appear.
- Switch categories and confirm irrelevant fields are removed from submission.
- Submit and verify details render in idea detail/reviewer view.

## Verification Commands

```bash
npm run type-check
npm run lint
npm run test
npx playwright test tests/e2e/idea-dynamic-form-flow.spec.ts
```

## Implementation Validation Evidence

All phases implemented and validated as of 2026-05-14.

### Type-check

`npm run type-check` → exit 0 (no TypeScript errors) after all phases.

### Unit / Component Tests Passed

| File | Tests |
|---|---|
| `components/ideas/IdeaForm.test.tsx` | 7 ✓ — static validation, dynamic rendering, category switch stale-value drop, aria-describedby association |
| `components/ideas/IdeaRow.test.tsx` | dynamic field display ✓ |
| `components/ideas/AdminIdeaRow.test.tsx` | admin dynamic detail rendering ✓ |

### Integration Tests Passed

| File | Tests |
|---|---|
| `tests/integration/ideas/submit-dynamic-fields.test.ts` | event_plan value persistence, stale-category rejection, detail payload includes dynamic fields |
| `tests/integration/ideas/admin-field-rules.test.ts` | non-admin FORBIDDEN for list/upsert/delete; admin create/update/list/disable; duplicate key rejection |

### E2E Scenarios (Playwright)

| Spec | Scenario |
|---|---|
| `tests/e2e/idea-dynamic-form-flow.spec.ts` | Event Plan optional fields submission succeeds |
| `tests/e2e/idea-dynamic-form-flow.spec.ts` | Category switch drops non-applicable dynamic values |

### Key Files Delivered

| Path | Phase |
|---|---|
| `lib/db/schema.ts` | Phase 2 — extended categories, new tables |
| `lib/db/migrations/0003_dynamic_idea_fields.sql` | Phase 2 — migration |
| `lib/ideas/category-fields.ts` | Phase 2 — rule loading + coercion |
| `actions/ideas.ts` | US1+US2 — submit + detail extended |
| `actions/idea-field-rules.ts` | US3 — admin rule CRUD |
| `components/ideas/IdeaForm.tsx` | US1+US3 — dynamic UI + a11y |
| `components/ideas/IdeaRow.tsx` | US2 — dynamic detail view |
| `components/ideas/AdminIdeaRow.tsx` | US2 — admin dynamic detail view |
| `app/(protected)/admin/idea-field-rules/page.tsx` | US3 — admin governance UI |
| `app/(protected)/admin/layout.tsx` | US3 — admin sub-nav |
