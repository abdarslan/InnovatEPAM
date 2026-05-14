# Contracts: Server Actions

**Feature**: `004-smart-idea-submission`
**Date**: 2026-05-14
**Primary Files**: `actions/ideas.ts`, `actions/idea-field-rules.ts`

All actions return a discriminated result union and do not throw expected business errors.

```ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }
```

## Shared Types

```ts
export type DynamicFieldType = 'text' | 'number' | 'date'

export type CategoryFieldRule = {
  id: number
  category: IdeaCategory
  fieldKey: string
  label: string
  fieldType: DynamicFieldType
  required: boolean
  minValue: number | null
  maxValue: number | null
  minLength: number | null
  maxLength: number | null
  helpText: string | null
  sortOrder: number
  isActive: boolean
  updatedAt: number
}

export type IdeaDynamicFieldValue = {
  fieldKey: string
  value: string
}
```

## Modified Action

### submitIdeaAction

Extends submission payload to include dynamic category field values.

```ts
export async function submitIdeaAction(
  formData: FormData
): Promise<ActionResult<{ id: number }>>
```

Validation sequence:

1. Enforce authentication.
2. Validate shared fields with `submitIdeaSchema`.
3. Load active rules for selected category.
4. Validate dynamic payload against rule-set.
5. Insert idea row and related `idea_field_values` rows in one transaction.

Error examples:

- `You must be logged in to submit an idea.`
- `Please provide a valid value for planned_attendees.`
- `Submission failed. Please try again.`

## Modified Action

### getIdeaDetailAction

Returns category-specific values together with existing idea detail.

```ts
export async function getIdeaDetailAction(
  id: number
): Promise<ActionResult<IdeaDetail & {
  dynamicFields: IdeaDynamicFieldValue[]
}>>
```

Visibility:

- Reviewers/admins can view category-specific details.
- Submitters can view their own category-specific values.

## New Action

### getCategoryFieldRulesAction

Returns active rule-set for a category (used by submission form).

```ts
export async function getCategoryFieldRulesAction(
  category: IdeaCategory
): Promise<ActionResult<CategoryFieldRule[]>>
```

Auth:

- Requires authenticated session.

## New Action

### getAdminCategoryFieldRulesAction

Returns all rules for admin management.

```ts
export async function getAdminCategoryFieldRulesAction(): Promise<ActionResult<CategoryFieldRule[]>>
```

Auth:

- Admin only; non-admin returns `FORBIDDEN`.

## New Action

### upsertCategoryFieldRuleAction

Creates or updates a category field rule.

```ts
export async function upsertCategoryFieldRuleAction(payload: {
  id?: number
  category: IdeaCategory
  fieldKey: string
  label: string
  fieldType: DynamicFieldType
  required: boolean
  minValue?: number
  maxValue?: number
  minLength?: number
  maxLength?: number
  helpText?: string
  sortOrder: number
  isActive: boolean
}): Promise<ActionResult<{ id: number }>>
```

Auth:

- Admin only (FR-019).

Behavior:

- Validates payload consistency by `fieldType`.
- Enforces uniqueness of `(category, fieldKey)`.
- Persists `updatedByAdminId` and `updatedAt` audit fields.

## New Action

### deleteCategoryFieldRuleAction (optional in v1)

Soft-disables a rule by setting `isActive=false`.

```ts
export async function deleteCategoryFieldRuleAction(
  id: number
): Promise<ActionResult>
```

Auth:

- Admin only.

Note:

- Hard delete is avoided to preserve references from historical `idea_field_values`.

## Authorization and Error Contract

- `UNAUTHENTICATED`: returned when session is missing for protected actions.
- `FORBIDDEN`: returned for non-admin access to rule-management actions.
- Validation errors are user-readable and field-specific.
- Unexpected persistence failures return generic retry-safe messages.
