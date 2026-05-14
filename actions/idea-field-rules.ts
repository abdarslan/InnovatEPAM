'use server'

import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ideaCategoryFieldRules, type IdeaCategory } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth/session'
import { upsertCategoryFieldRuleSchema } from '@/lib/ideas/validation'

export type DynamicFieldType = 'text' | 'number' | 'date'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type CategoryFieldRulePayload = {
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
}

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

async function requireAdmin() {
  try {
    const session = await requireAuth()
    if (session.role !== 'admin') {
      return { ok: false as const, error: 'FORBIDDEN' }
    }
    return { ok: true as const, data: session }
  } catch {
    return { ok: false as const, error: 'UNAUTHENTICATED' }
  }
}

export async function getAdminCategoryFieldRulesAction(): Promise<ActionResult<CategoryFieldRule[]>> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  try {
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
        updatedAt: ideaCategoryFieldRules.updatedAt,
      })
      .from(ideaCategoryFieldRules)
      .orderBy(asc(ideaCategoryFieldRules.category), asc(ideaCategoryFieldRules.sortOrder))

    const data: CategoryFieldRule[] = rows.map((row) => ({
      ...row,
      category: row.category as IdeaCategory,
      fieldType: row.fieldType as DynamicFieldType,
      minValue: row.minValue ?? null,
      maxValue: row.maxValue ?? null,
      minLength: row.minLength ?? null,
      maxLength: row.maxLength ?? null,
      helpText: row.helpText ?? null,
    }))

    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Failed to load category field rules.' }
  }
}

export async function upsertCategoryFieldRuleAction(
  payload: CategoryFieldRulePayload,
): Promise<ActionResult<{ id: number }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const parsed = upsertCategoryFieldRuleSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const data = parsed.data
  const now = Date.now()

  try {
    if (data.id) {
      const duplicate = await db
        .select({ id: ideaCategoryFieldRules.id })
        .from(ideaCategoryFieldRules)
        .where(
          and(
            eq(ideaCategoryFieldRules.category, data.category),
            eq(ideaCategoryFieldRules.fieldKey, data.fieldKey),
          ),
        )

      const duplicateRow = duplicate.find((row) => row.id !== data.id)
      if (duplicateRow) {
        return { ok: false, error: 'Field key must be unique within the category.' }
      }

      await db
        .update(ideaCategoryFieldRules)
        .set({
          category: data.category,
          fieldKey: data.fieldKey,
          label: data.label,
          fieldType: data.fieldType,
          required: data.required,
          minValue: data.minValue ?? null,
          maxValue: data.maxValue ?? null,
          minLength: data.minLength ?? null,
          maxLength: data.maxLength ?? null,
          helpText: data.helpText ?? null,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          updatedAt: now,
          updatedByAdminId: auth.data.userId,
        })
        .where(eq(ideaCategoryFieldRules.id, data.id))

      return { ok: true, data: { id: data.id } }
    }

    const duplicate = await db
      .select({ id: ideaCategoryFieldRules.id })
      .from(ideaCategoryFieldRules)
      .where(
        and(
          eq(ideaCategoryFieldRules.category, data.category),
          eq(ideaCategoryFieldRules.fieldKey, data.fieldKey),
        ),
      )
      .all()

    if (duplicate.length > 0) {
      return { ok: false, error: 'Field key must be unique within the category.' }
    }

    const inserted = await db
      .insert(ideaCategoryFieldRules)
      .values({
        category: data.category,
        fieldKey: data.fieldKey,
        label: data.label,
        fieldType: data.fieldType,
        required: data.required,
        minValue: data.minValue ?? null,
        maxValue: data.maxValue ?? null,
        minLength: data.minLength ?? null,
        maxLength: data.maxLength ?? null,
        helpText: data.helpText ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        createdAt: now,
        updatedAt: now,
        updatedByAdminId: auth.data.userId,
      })
      .returning({ id: ideaCategoryFieldRules.id })

    return { ok: true, data: { id: inserted[0].id } }
  } catch {
    return { ok: false, error: 'Failed to save category field rule.' }
  }
}

export async function deleteCategoryFieldRuleAction(id: number): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'Invalid rule id.' }
  }

  try {
    await db
      .update(ideaCategoryFieldRules)
      .set({
        isActive: false,
        updatedAt: Date.now(),
        updatedByAdminId: auth.data.userId,
      })
      .where(eq(ideaCategoryFieldRules.id, id))

    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Failed to disable category field rule.' }
  }
}
