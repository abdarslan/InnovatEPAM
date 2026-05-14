'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ideas, users, type IdeaCategory } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth/session'
import { submitIdeaSchema, updateIdeaSchema } from '@/lib/ideas/validation'

// ---------------------------------------------------------------------------
// Shared result type
// ---------------------------------------------------------------------------

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// List / detail shapes (no BLOB content)
// ---------------------------------------------------------------------------

export type IdeaListItem = {
  id: number
  title: string
  category: IdeaCategory
  submitterName: string
  submitterId: number
  createdAt: number
  updatedAt: number
  hasAttachment: boolean
}

export type IdeaDetail = IdeaListItem & {
  description: string
  attachmentName: string | null
  attachmentSize: number | null
  attachmentMimeType: string | null
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
        attachmentName: ideas.attachmentName,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.submitterId, users.id))
      .orderBy(ideas.createdAt)
    const data: IdeaListItem[] = rows
      .reverse()
      .map((r) => ({ ...r, category: r.category as IdeaCategory, hasAttachment: r.attachmentName !== null }))
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
        attachmentName: ideas.attachmentName,
        attachmentSize: ideas.attachmentSize,
        attachmentMimeType: ideas.attachmentMimeType,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.submitterId, users.id))
      .where(eq(ideas.id, id))
    if (rows.length === 0) return { ok: false, error: 'Idea not found.' }
    const r = rows[0]
    const data: IdeaDetail = {
      ...r,
      category: r.category as IdeaCategory,
      hasAttachment: r.attachmentName !== null,
    }
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

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    attachment: (() => {
      const f = formData.get('attachment')
      return f instanceof File && f.size > 0 ? f : undefined
    })(),
  }

  const parsed = submitIdeaSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const { title, description, category, attachment } = parsed.data

  let attachmentName: string | null = null
  let attachmentSize: number | null = null
  let attachmentMimeType: string | null = null
  let attachmentContent: Buffer | null = null

  if (attachment) {
    attachmentName = attachment.name
    attachmentSize = attachment.size
    attachmentMimeType = attachment.type
    attachmentContent = Buffer.from(await attachment.arrayBuffer())
  }

  try {
    const now = Date.now()
    const result = db.transaction(() => {
      return db
        .insert(ideas)
        .values({
          title,
          description,
          category,
          submitterId: session.userId,
          attachmentName,
          attachmentSize,
          attachmentMimeType,
          attachmentContent,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: ideas.id })
        .all()
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

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    attachment: (() => {
      const f = formData.get('attachment')
      return f instanceof File && f.size > 0 ? f : undefined
    })(),
  }

  const parsed = updateIdeaSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const { title, description, category, attachment } = parsed.data

  let attachmentName: string | null | undefined = undefined
  let attachmentSize: number | null | undefined = undefined
  let attachmentMimeType: string | null | undefined = undefined
  let attachmentContent: Buffer | null | undefined = undefined

  if (attachment) {
    attachmentName = attachment.name
    attachmentSize = attachment.size
    attachmentMimeType = attachment.type
    attachmentContent = Buffer.from(await attachment.arrayBuffer())
  }

  try {
    db.transaction(() => {
      const updateData: Record<string, unknown> = {
        title,
        description,
        category,
        updatedAt: Date.now(),
      }
      if (attachmentName !== undefined) {
        updateData.attachmentName = attachmentName
        updateData.attachmentSize = attachmentSize
        updateData.attachmentMimeType = attachmentMimeType
        updateData.attachmentContent = attachmentContent
      }
      db.update(ideas).set(updateData).where(eq(ideas.id, id)).run()
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
