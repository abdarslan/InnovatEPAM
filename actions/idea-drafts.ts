'use server'

// Draft management actions for owner-scoped draft persistence.
// All actions enforce authentication and return ActionResult<T>.

import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import {
  ideaDrafts,
  ideaDraftAttachments,
  ideaDraftFieldValues,
  type IdeaDraft,
  type IdeaDraftAttachment,
  type IdeaDraftFieldValue,
} from '@/lib/db/schema'
import {
  parseDraftFormData,
  validateAttachmentFiles,
  isPreviewEligibleMimeType,
  collectDynamicFieldEntries,
} from '@/lib/ideas/validation'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// -----------------------------------------------------------------------
// Public result types
// -----------------------------------------------------------------------

/** Minimal summary shown in the dashboard draft list */
export type IdeaDraftSummary = {
  id: number
  title: string | null
  category: string | null
  updatedAt: number
}

/** Full draft payload used to prefill IdeaForm when resuming */
export type IdeaDraftDetail = {
  id: number
  title: string | null
  description: string | null
  category: string | null
  updatedAt: number
  attachments: Array<{
    id: number
    originalName: string
    mimeType: string
    sizeBytes: number
    previewEligible: boolean
  }>
  fieldValues: Record<string, string>
}

// -----------------------------------------------------------------------
// Mapper helpers
// -----------------------------------------------------------------------

function toDraftSummary(row: Pick<IdeaDraft, 'id' | 'title' | 'category' | 'updatedAt'>): IdeaDraftSummary {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    updatedAt: row.updatedAt,
  }
}

function toDraftDetail(
  draft: IdeaDraft,
  attachments: IdeaDraftAttachment[],
  fieldValues: IdeaDraftFieldValue[],
): IdeaDraftDetail {
  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    category: draft.category,
    updatedAt: draft.updatedAt,
    attachments: attachments.map((a) => ({
      id: a.id,
      originalName: a.originalName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      previewEligible: a.previewEligible,
    })),
    fieldValues: Object.fromEntries(fieldValues.map((fv) => [fv.fieldKey, fv.value])),
  }
}

// -----------------------------------------------------------------------
// T016: upsertIdeaDraftAction — create or update a draft
// -----------------------------------------------------------------------

/**
 * Creates a new draft or updates an existing one (identified by `draftId` in formData).
 * All fields are optional — drafts can be saved at any level of completeness.
 * Attachments and dynamic field values are handled in the same call.
 */
export async function upsertIdeaDraftAction(
  formData: FormData,
): Promise<ActionResult<{ draftId: number }>> {
  try {
    const session = await requireAuth()
    if (session.role === 'admin') {
      return { ok: false, error: 'Admins do not have access to draft management.' }
    }
    const parsed = parseDraftFormData(formData)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid draft data.' }
    }

    const { draftId: existingDraftId, title, description, category, attachments, removeAttachmentIds } = parsed.data

    // T017: Validate attachments
    if (attachments.length > 0) {
      const attachmentValidation = validateAttachmentFiles(attachments)
      if (!attachmentValidation.success) {
        return { ok: false, error: attachmentValidation.error.issues[0]?.message ?? 'Attachment error.' }
      }
    }

    const now = Date.now()

    // T016: If draftId provided, verify ownership before updating
    if (existingDraftId !== undefined) {
      const [existing] = db
        .select({ id: ideaDrafts.id, submitterId: ideaDrafts.submitterId })
        .from(ideaDrafts)
        .where(eq(ideaDrafts.id, existingDraftId))
        .all()

      if (!existing) return { ok: false, error: 'Draft not found.' }
      if (existing.submitterId !== session.userId) return { ok: false, error: 'Not authorized.' }

      // Update core draft fields
      db.update(ideaDrafts)
        .set({
          title: title ?? null,
          description: description ?? null,
          category: category ?? null,
          updatedAt: now,
        })
        .where(eq(ideaDrafts.id, existingDraftId))
        .run()

      // T017: Handle attachment changes — remove flagged ones, then add new uploads
      if (removeAttachmentIds.length > 0) {
        db.delete(ideaDraftAttachments)
          .where(and(eq(ideaDraftAttachments.draftId, existingDraftId), inArray(ideaDraftAttachments.id, removeAttachmentIds)))
          .run()
      }
      for (const file of attachments) {
        const buffer = Buffer.from(await file.arrayBuffer())
        db.insert(ideaDraftAttachments).values({
          draftId: existingDraftId,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          previewEligible: isPreviewEligibleMimeType(file.type),
          content: buffer,
          createdAt: now,
        }).run()
      }

      // T018: Upsert dynamic field values
      await upsertDynamicFieldValues(existingDraftId, formData, now)

      return { ok: true, data: { draftId: existingDraftId } }
    }

    // Create new draft
    const [inserted] = db
      .insert(ideaDrafts)
      .values({
        submitterId: session.userId,
        title: title ?? null,
        description: description ?? null,
        category: category ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: ideaDrafts.id })
      .all()

    const newDraftId = inserted.id

    // T017: Insert attachments for new draft
    for (const file of attachments) {
      const buffer = Buffer.from(await file.arrayBuffer())
      db.insert(ideaDraftAttachments).values({
        draftId: newDraftId,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        previewEligible: isPreviewEligibleMimeType(file.type),
        content: buffer,
        createdAt: now,
      }).run()
    }

    // T018: Insert dynamic field values for new draft
    await upsertDynamicFieldValues(newDraftId, formData, now)

    return { ok: true, data: { draftId: newDraftId } }
  } catch {
    return { ok: false, error: 'An unexpected error occurred.' }
  }
}

/** T018 helper: upsert draft_field_values rows from FormData dynamic_ prefixed entries */
async function upsertDynamicFieldValues(
  draftId: number,
  formData: FormData,
  now: number,
): Promise<void> {
  const rawDynamicValues = collectDynamicFieldEntries(formData)

  for (const [fieldKey, rawValue] of Object.entries(rawDynamicValues)) {
    const value = typeof rawValue === 'string' ? rawValue.trim() : ''
    if (value.length === 0) continue

    const [existing] = db
      .select({ id: ideaDraftFieldValues.id })
      .from(ideaDraftFieldValues)
      .where(
        and(
          eq(ideaDraftFieldValues.draftId, draftId),
          eq(ideaDraftFieldValues.fieldKey, fieldKey),
        ),
      )
      .all()

    if (existing) {
      db.update(ideaDraftFieldValues)
        .set({ value, updatedAt: now })
        .where(eq(ideaDraftFieldValues.id, existing.id))
        .run()
    } else {
      db.insert(ideaDraftFieldValues).values({
        draftId,
        fieldKey,
        value,
        createdAt: now,
        updatedAt: now,
      }).run()
    }
  }
}

// -----------------------------------------------------------------------
// T025/T028: getMyIdeaDraftsAction — owner-only listing, admin denied
// -----------------------------------------------------------------------

export async function getMyIdeaDraftsAction(): Promise<ActionResult<IdeaDraftSummary[]>> {
  try {
    const session = await requireAuth()
    // T028: Explicitly deny admin access to draft data
    if (session.role === 'admin') {
      return { ok: false, error: 'Admins do not have access to draft management.' }
    }

    const rows = db
      .select({
        id: ideaDrafts.id,
        title: ideaDrafts.title,
        category: ideaDrafts.category,
        updatedAt: ideaDrafts.updatedAt,
      })
      .from(ideaDrafts)
      .where(eq(ideaDrafts.submitterId, session.userId))
      .orderBy(desc(ideaDrafts.updatedAt))
      .all()

    return { ok: true, data: rows.map(toDraftSummary) }
  } catch {
    return { ok: false, error: 'An unexpected error occurred.' }
  }
}

// -----------------------------------------------------------------------
// T032: getIdeaDraftDetailAction — owner-only full payload for form prefill
// -----------------------------------------------------------------------

export async function getIdeaDraftDetailAction(
  draftId: number,
): Promise<ActionResult<IdeaDraftDetail>> {
  try {
    const session = await requireAuth()
    if (session.role === 'admin') {
      return { ok: false, error: 'Admins do not have access to draft management.' }
    }

    const [draft] = db
      .select()
      .from(ideaDrafts)
      .where(eq(ideaDrafts.id, draftId))
      .all()

    if (!draft) return { ok: false, error: 'Draft not found.' }
    if (draft.submitterId !== session.userId) return { ok: false, error: 'Not authorized.' }

    const attachments = db
      .select()
      .from(ideaDraftAttachments)
      .where(eq(ideaDraftAttachments.draftId, draftId))
      .all()

    const fieldValues = db
      .select()
      .from(ideaDraftFieldValues)
      .where(eq(ideaDraftFieldValues.draftId, draftId))
      .all()

    return { ok: true, data: toDraftDetail(draft, attachments, fieldValues) }
  } catch {
    return { ok: false, error: 'An unexpected error occurred.' }
  }
}

// -----------------------------------------------------------------------
// T032: deleteIdeaDraftAction — owner-only hard delete
// -----------------------------------------------------------------------

export async function deleteIdeaDraftAction(draftId: number): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    if (session.role === 'admin') {
      return { ok: false, error: 'Admins do not have access to draft management.' }
    }

    const [draft] = db
      .select({ id: ideaDrafts.id, submitterId: ideaDrafts.submitterId })
      .from(ideaDrafts)
      .where(eq(ideaDrafts.id, draftId))
      .all()

    if (!draft) return { ok: false, error: 'Draft not found.' }
    if (draft.submitterId !== session.userId) return { ok: false, error: 'Not authorized.' }

    db.delete(ideaDrafts).where(eq(ideaDrafts.id, draftId)).run()

    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'An unexpected error occurred.' }
  }
}
