import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  ideaCategoryFieldRules,
  type IdeaCategory,
  type DynamicFieldType,
} from '@/lib/db/schema'

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
}

export type DynamicFieldValidationResult = {
  ok: boolean
  errors: Record<string, string>
  normalizedValues: Record<string, string>
}

export async function getActiveRulesForCategory(
  category: IdeaCategory,
): Promise<CategoryFieldRule[]> {
  const rows = await db
    .select({
      id: ideaCategoryFieldRules.id,
      category: ideaCategoryFieldRules.category,
      fieldKey: ideaCategoryFieldRules.fieldKey,
      label: ideaCategoryFieldRules.label,
      fieldType: ideaCategoryFieldRules.fieldType,
      required: ideaCategoryFieldRules.required,
      minValue: ideaCategoryFieldRules.minValue,
      maxValue: ideaCategoryFieldRules.maxValue,
      minLength: ideaCategoryFieldRules.minLength,
      maxLength: ideaCategoryFieldRules.maxLength,
      helpText: ideaCategoryFieldRules.helpText,
      sortOrder: ideaCategoryFieldRules.sortOrder,
      isActive: ideaCategoryFieldRules.isActive,
    })
    .from(ideaCategoryFieldRules)
    .where(
      and(
        eq(ideaCategoryFieldRules.category, category),
        eq(ideaCategoryFieldRules.isActive, true),
      ),
    )
    .orderBy(asc(ideaCategoryFieldRules.sortOrder))

  return rows.map((row) => ({
    ...row,
    category: row.category as IdeaCategory,
    fieldType: row.fieldType as DynamicFieldType,
  }))
}

export function validateDynamicFieldValues(
  rules: CategoryFieldRule[],
  rawValues: Record<string, FormDataEntryValue | null>,
): DynamicFieldValidationResult {
  const errors: Record<string, string> = {}
  const normalizedValues: Record<string, string> = {}

  const ruleByKey = new Map(rules.map((rule) => [rule.fieldKey, rule]))

  for (const [fieldKey, rawValue] of Object.entries(rawValues)) {
    const rule = ruleByKey.get(fieldKey)
    if (!rule) {
      const asString = typeof rawValue === 'string' ? rawValue.trim() : ''
      if (asString.length > 0) {
        errors[fieldKey] = 'This field is not valid for the selected category.'
      }
    }
  }

  for (const rule of rules) {
    const rawValue = rawValues[rule.fieldKey]
    const value = typeof rawValue === 'string' ? rawValue.trim() : ''

    if (value.length === 0) {
      if (rule.required) {
        errors[rule.fieldKey] = `${rule.label} is required.`
      }
      continue
    }

    if (rule.fieldType === 'text') {
      if (rule.minLength !== null && value.length < rule.minLength) {
        errors[rule.fieldKey] = `${rule.label} must be at least ${rule.minLength} characters.`
        continue
      }
      if (rule.maxLength !== null && value.length > rule.maxLength) {
        errors[rule.fieldKey] = `${rule.label} must be ${rule.maxLength} characters or fewer.`
        continue
      }
      normalizedValues[rule.fieldKey] = value
      continue
    }

    if (rule.fieldType === 'number') {
      const parsedNumber = Number(value)
      if (!Number.isFinite(parsedNumber)) {
        errors[rule.fieldKey] = `${rule.label} must be a valid number.`
        continue
      }
      if (rule.minValue !== null && parsedNumber < rule.minValue) {
        errors[rule.fieldKey] = `${rule.label} must be at least ${rule.minValue}.`
        continue
      }
      if (rule.maxValue !== null && parsedNumber > rule.maxValue) {
        errors[rule.fieldKey] = `${rule.label} must be ${rule.maxValue} or less.`
        continue
      }
      normalizedValues[rule.fieldKey] = String(parsedNumber)
      continue
    }

    // Date validation: use YYYY-MM-DD input format for consistency with HTML date inputs.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      errors[rule.fieldKey] = `${rule.label} must be a valid date (YYYY-MM-DD).`
      continue
    }
    normalizedValues[rule.fieldKey] = value
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    normalizedValues,
  }
}
