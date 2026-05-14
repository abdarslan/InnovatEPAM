'use server'

import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ideaAttachments, ideas, users, type IdeaCategory } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth/session'
import {
  MAX_ATTACHMENTS_PER_IDEA,
  MAX_TOTAL_ATTACHMENT_SIZE_BYTES,
  isPreviewEligibleMimeType,
  submitIdeaSchema,
  updateIdeaSchema,
  validateAttachmentFiles,
} from '@/lib/ideas/validation'

// ---------------------------------------------------------------------------
// Shared result type
// ---------------------------------------------------------------------------

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// List / detail shapes (no BLOB content)
// ---------------------------------------------------------------------------

export type IdeaAttachmentMeta = {
  id: number
  originalName: string
  mimeType: string
  sizeBytes: number
  previewEligible: boolean
}

export type IdeaListItem = {
  id: number
  title: string
  category: IdeaCategory
  submitterName: string
  submitterId: number
  createdAt: number
  updatedAt: number
  attachmentCount: number
  hasAttachment: boolean
}

export type IdeaDetail = IdeaListItem & {
  description: string
  attachments: IdeaAttachmentMeta[]
  attachmentName: string | null
  attachmentSize: number | null
  attachmentMimeType: string | null
}

type PreparedAttachmentInsert = {
  originalName: string
  mimeType: string
  sizeBytes: number
  previewEligible: boolean
  content: Buffer
  createdAt: number
}

function getAttachmentFilesFromFormData(formData: FormData) {
  const repeatedFiles = formData
    .getAll('attachments')
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (repeatedFiles.length > 0) {
    return repeatedFiles
  }

  const legacyFile = formData.get('attachment')
  if (legacyFile instanceof File && legacyFile.size > 0) {
    return [legacyFile]
  }

  return []
}

function parseRemoveAttachmentIds(formData: FormData) {
  const values = formData.getAll('removeAttachmentIds')

  if (values.length === 0) {
    const jsonValue = formData.get('removeAttachmentIds')
    if (typeof jsonValue === 'string' && jsonValue.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(jsonValue) as unknown
        if (Array.isArray(parsed)) {
          return parsed
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
        }
      } catch {
        return []
      }
    }
    return []
  }

  return values
    .map((value) => typeof value === 'string' ? Number(value) : Number.NaN)
    .filter((value) => Number.isInteger(value) && value > 0)
}

async function prepareAttachmentInserts(files: File[]) {
  const createdAt = Date.now()
  return Promise.all(files.map(async (file): Promise<PreparedAttachmentInsert> => ({
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    previewEligible: isPreviewEligibleMimeType(file.type),
    content: Buffer.from(await file.arrayBuffer()),
    createdAt,
  })))
}

function toAttachmentMeta(rows: Array<typeof ideaAttachments.$inferSelect>): IdeaAttachmentMeta[] {
  return rows.map((attachment) => ({
    id: attachment.id,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    previewEligible: attachment.previewEligible,
  }))
}

function withLegacyAttachmentFields(detail: Omit<IdeaDetail, 'attachmentName' | 'attachmentSize' | 'attachmentMimeType'>): IdeaDetail {
  const firstAttachment = detail.attachments[0]

  return {
    ...detail,
    attachmentName: firstAttachment?.originalName ?? null,
    attachmentSize: firstAttachment?.sizeBytes ?? null,
    attachmentMimeType: firstAttachment?.mimeType ?? null,
  }
}

function validateUpdatedAttachmentTotals(existingSizes: number[], removedSizes: number[], newFiles: File[]) {
  const remainingCount = existingSizes.length - removedSizes.length + newFiles.length
  if (remainingCount > MAX_ATTACHMENTS_PER_IDEA) {
    return 'You can upload up to 5 attachments.'
  }

  const existingTotal = existingSizes.reduce((sum, size) => sum + size, 0)
  const removedTotal = removedSizes.reduce((sum, size) => sum + size, 0)
  const newTotal = newFiles.reduce((sum, file) => sum + file.size, 0)

  if (existingTotal - removedTotal + newTotal > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
    return 'Attachments must total 25 MB or less.'
  }

  return null
}

// ---------------------------------------------------------------------------
// getIdeasAction
// ---------------------------------------------------------------------------

export async function getIdeasAction(): Promise<ActionResult<IdeaListItem[]>> {
  try {
    await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in to view ideas.' }
  }
  try {
    const rows = await db
      .select({
        id: ideas.id,
        title: ideas.title,
        category: ideas.category,
        submitterName: users.displayName,
        submitterId: ideas.submitterId,
        createdAt: ideas.createdAt,
        updatedAt: ideas.updatedAt,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.submitterId, users.id))
      .orderBy(desc(ideas.createdAt))

    const ideaIds = rows.map((row) => row.id)
    const attachmentRows = ideaIds.length === 0
      ? []
      : await db
        .select({
          ideaId: ideaAttachments.ideaId,
        })
        .from(ideaAttachments)
        .where(inArray(ideaAttachments.ideaId, ideaIds))

    const attachmentCounts = new Map<number, number>()
    for (const row of attachmentRows) {
      attachmentCounts.set(row.ideaId, (attachmentCounts.get(row.ideaId) ?? 0) + 1)
    }

    const data: IdeaListItem[] = rows.map((row) => {
      const attachmentCount = attachmentCounts.get(row.id) ?? 0
      return {
        ...row,
        category: row.category as IdeaCategory,
        attachmentCount,
        hasAttachment: attachmentCount > 0,
      }
    })

    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Failed to load ideas. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// getIdeaDetailAction
// ---------------------------------------------------------------------------

export async function getIdeaDetailAction(id: number): Promise<ActionResult<IdeaDetail>> {
  try {
    await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in to view ideas.' }
  }
  try {
    const rows = await db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        category: ideas.category,
        submitterName: users.displayName,
        submitterId: ideas.submitterId,
        createdAt: ideas.createdAt,
        updatedAt: ideas.updatedAt,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.submitterId, users.id))
      .where(eq(ideas.id, id))

    if (rows.length === 0) return { ok: false, error: 'Idea not found.' }

    const attachmentRows = await db
      .select()
      .from(ideaAttachments)
      .where(eq(ideaAttachments.ideaId, id))
      .orderBy(ideaAttachments.createdAt)

    const attachments = toAttachmentMeta(attachmentRows)
    const row = rows[0]
    const data = withLegacyAttachmentFields({
      ...row,
      category: row.category as IdeaCategory,
      attachments,
      attachmentCount: attachments.length,
      hasAttachment: attachments.length > 0,
    })

    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Failed to load idea. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// submitIdeaAction
// ---------------------------------------------------------------------------

export async function submitIdeaAction(
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in to submit an idea.' }
  }

  const attachments = getAttachmentFilesFromFormData(formData)
  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    attachments,
  }

  const parsed = submitIdeaSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const attachmentValidation = validateAttachmentFiles(parsed.data.attachments)
  if (!attachmentValidation.success) {
    return { ok: false, error: attachmentValidation.error.issues[0].message }
  }

  const { title, description, category } = parsed.data
  const preparedAttachments = await prepareAttachmentInserts(parsed.data.attachments)

  try {
    const now = Date.now()
    const result = db.transaction((tx) => {
      const insertedIdea = tx
        .insert(ideas)
        .values({
          title,
          description,
          category,
          submitterId: session.userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: ideas.id })
        .all()

      if (preparedAttachments.length > 0) {
        tx.insert(ideaAttachments)
          .values(preparedAttachments.map((attachment) => ({
            ...attachment,
            ideaId: insertedIdea[0].id,
          })))
          .run()
      }

      return insertedIdea
    })

    return { ok: true, data: { id: result[0].id } }
  } catch {
    return { ok: false, error: 'Submission failed. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// updateIdeaAction
// ---------------------------------------------------------------------------

export async function updateIdeaAction(
  id: number,
  formData: FormData,
): Promise<ActionResult<void>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in to edit an idea.' }
  }

  const existing = await db
    .select({ submitterId: ideas.submitterId })
    .from(ideas)
    .where(eq(ideas.id, id))
    .all()
  if (existing.length === 0) return { ok: false, error: 'Idea not found.' }
  if (existing[0].submitterId !== session.userId) {
    return { ok: false, error: 'You are not authorised to edit this idea.' }
  }

  const attachments = getAttachmentFilesFromFormData(formData)
  const removeAttachmentIds = parseRemoveAttachmentIds(formData)
  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    attachments,
    removeAttachmentIds,
  }

  const parsed = updateIdeaSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const attachmentValidation = validateAttachmentFiles(parsed.data.attachments)
  if (!attachmentValidation.success) {
    return { ok: false, error: attachmentValidation.error.issues[0].message }
  }

  const existingAttachments = await db
    .select({
      id: ideaAttachments.id,
      sizeBytes: ideaAttachments.sizeBytes,
    })
    .from(ideaAttachments)
    .where(eq(ideaAttachments.ideaId, id))

  const existingAttachmentIds = new Set(existingAttachments.map((attachment) => attachment.id))
  if (parsed.data.removeAttachmentIds.some((attachmentId) => !existingAttachmentIds.has(attachmentId))) {
    return { ok: false, error: 'One or more selected attachments could not be found.' }
  }

  const removedSizes = existingAttachments
    .filter((attachment) => parsed.data.removeAttachmentIds.includes(attachment.id))
    .map((attachment) => attachment.sizeBytes)

  const totalValidationError = validateUpdatedAttachmentTotals(
    existingAttachments.map((attachment) => attachment.sizeBytes),
    removedSizes,
    parsed.data.attachments,
  )

  if (totalValidationError) {
    return { ok: false, error: totalValidationError }
  }

  const { title, description, category } = parsed.data
  const preparedAttachments = await prepareAttachmentInserts(parsed.data.attachments)

  try {
    db.transaction((tx) => {
      tx.update(ideas).set({
        title,
        description,
        category,
        updatedAt: Date.now(),
      }).where(eq(ideas.id, id)).run()

      if (parsed.data.removeAttachmentIds.length > 0) {
        tx.delete(ideaAttachments)
          .where(inArray(ideaAttachments.id, parsed.data.removeAttachmentIds))
          .run()
      }

      if (preparedAttachments.length > 0) {
        tx.insert(ideaAttachments)
          .values(preparedAttachments.map((attachment) => ({
            ...attachment,
            ideaId: id,
          })))
          .run()
      }
    })

    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Update failed. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// deleteIdeaAction
// ---------------------------------------------------------------------------

export async function deleteIdeaAction(id: number): Promise<ActionResult<void>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in to delete an idea.' }
  }

  const existing = await db
    .select({ submitterId: ideas.submitterId })
    .from(ideas)
    .where(eq(ideas.id, id))
    .all()
  if (existing.length === 0) return { ok: false, error: 'Idea not found.' }
  if (existing[0].submitterId !== session.userId && session.role !== 'admin') {
    return { ok: false, error: 'You are not authorised to delete this idea.' }
  }

  try {
    await db.delete(ideas).where(eq(ideas.id, id))
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Delete failed. Please try again.' }
  }
}
