'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  ideas,
  ideaEvaluations,
  users,
  IDEA_STATUSES,
  type IdeaCategory,
  type IdeaStatus,
} from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth/session'
import {
  submitIdeaSchema,
  updateIdeaSchema,
  startReviewSchema,
  evaluateIdeaSchema,
} from '@/lib/ideas/validation'
import { validateTransition } from '@/lib/ideas/transitions'

export type { IdeaStatus }

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
  status: IdeaStatus
  submitterName: string
  submitterId: number
  createdAt: number
  updatedAt: number
  hasAttachment: boolean
}

export type IdeaEvaluationForSubmitter = {
  adminName: string
  status: 'accepted' | 'rejected'
  comment: string | null
  createdAt: number
}

export type IdeaDetail = IdeaListItem & {
  description: string
  attachmentName: string | null
  attachmentSize: number | null
  attachmentMimeType: string | null
  evaluation: IdeaEvaluationForSubmitter | null
}

export type AdminIdeaListItem = IdeaListItem & {
  reviewerName: string | null
  reviewStartedAt: number | null
  evaluation: {
    adminName: string
    status: 'accepted' | 'rejected'
    comment: string | null
    createdAt: number
  } | null
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
        status: ideas.status,
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
      .map((r) => ({
        ...r,
        category: r.category as IdeaCategory,
        status: r.status as IdeaStatus,
        hasAttachment: r.attachmentName !== null,
      }))
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
    // Use raw joins for aliases
    const rows = await db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        category: ideas.category,
        status: ideas.status,
        submitterName: users.displayName,
        submitterId: ideas.submitterId,
        createdAt: ideas.createdAt,
        updatedAt: ideas.updatedAt,
        attachmentName: ideas.attachmentName,
        attachmentSize: ideas.attachmentSize,
        attachmentMimeType: ideas.attachmentMimeType,
        evalStatus:    ideaEvaluations.status,
        evalComment:   ideaEvaluations.comment,
        evalCreatedAt: ideaEvaluations.createdAt,
        evalAdminId:   ideaEvaluations.adminId,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.submitterId, users.id))
      .leftJoin(ideaEvaluations, eq(ideaEvaluations.ideaId, ideas.id))
      .where(eq(ideas.id, id))
    if (rows.length === 0) return { ok: false, error: 'Idea not found.' }
    const r = rows[0]

    let evaluation: IdeaEvaluationForSubmitter | null = null
    if (r.evalStatus !== null && r.evalAdminId !== null && r.evalCreatedAt !== null) {
      // Fetch admin name
      const adminRows = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, r.evalAdminId))
      evaluation = {
        adminName: adminRows[0]?.displayName ?? 'Admin',
        status: r.evalStatus as 'accepted' | 'rejected',
        comment: r.evalComment ?? null,
        createdAt: r.evalCreatedAt,
      }
    }

    const data: IdeaDetail = {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category as IdeaCategory,
      status: r.status as IdeaStatus,
      submitterName: r.submitterName,
      submitterId: r.submitterId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      attachmentName: r.attachmentName,
      attachmentSize: r.attachmentSize,
      attachmentMimeType: r.attachmentMimeType,
      hasAttachment: r.attachmentName !== null,
      evaluation,
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
    .select({ submitterId: ideas.submitterId, status: ideas.status })
    .from(ideas)
    .where(eq(ideas.id, id))
    .all()
  if (existing.length === 0) return { ok: false, error: 'Idea not found.' }
  if (existing[0].submitterId !== session.userId && session.role !== 'admin') {
    return { ok: false, error: 'You are not authorised to delete this idea.' }
  }
  if (existing[0].status === 'under_review') {
    return { ok: false, error: 'Ideas under review cannot be deleted.' }
  }

  try {
    await db.delete(ideas).where(eq(ideas.id, id))
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Delete failed. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// startReviewAction — admin only, Submitted → UnderReview
// ---------------------------------------------------------------------------

export async function startReviewAction(ideaId: number): Promise<ActionResult<void>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in.' }
  }
  if (session.role !== 'admin') {
    return { ok: false, error: 'Only admins can start a review.' }
  }

  const parsed = startReviewSchema.safeParse({ ideaId })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const rows = await db
    .select({ status: ideas.status })
    .from(ideas)
    .where(eq(ideas.id, ideaId))
    .all()
  if (rows.length === 0) return { ok: false, error: 'Idea not found.' }

  const currentStatus = rows[0].status as IdeaStatus
  if (!validateTransition(currentStatus, 'under_review')) {
    return { ok: false, error: `Cannot move idea from '${currentStatus}' to 'under_review'.` }
  }

  try {
    db.transaction(() => {
      db.update(ideas)
        .set({ status: 'under_review', reviewerId: session.userId, reviewStartedAt: Date.now(), updatedAt: Date.now() })
        .where(eq(ideas.id, ideaId))
        .run()
    })
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Failed to start review. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// evaluateIdeaAction — admin only, UnderReview → Accepted | Rejected
// ---------------------------------------------------------------------------

export async function evaluateIdeaAction(
  payload: unknown,
): Promise<ActionResult<void>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in.' }
  }
  if (session.role !== 'admin') {
    return { ok: false, error: 'Only admins can evaluate ideas.' }
  }

  const parsed = evaluateIdeaSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { ideaId, status, comment } = parsed.data

  const rows = await db
    .select({ status: ideas.status })
    .from(ideas)
    .where(eq(ideas.id, ideaId))
    .all()
  if (rows.length === 0) return { ok: false, error: 'Idea not found.' }

  const currentStatus = rows[0].status as IdeaStatus
  if (!validateTransition(currentStatus, status)) {
    return { ok: false, error: `Cannot move idea from '${currentStatus}' to '${status}'.` }
  }

  try {
    db.transaction(() => {
      db.update(ideas)
        .set({ status, updatedAt: Date.now() })
        .where(eq(ideas.id, ideaId))
        .run()
      db.insert(ideaEvaluations)
        .values({
          ideaId,
          adminId:   session.userId,
          status,
          comment:   comment ?? null,
          createdAt: Date.now(),
        })
        .run()
    })
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Evaluation failed. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// getAdminIdeasAction — admin only, all ideas with reviewer + evaluation info
// ---------------------------------------------------------------------------

export async function getAdminIdeasAction(
  statusFilter?: IdeaStatus,
): Promise<ActionResult<AdminIdeaListItem[]>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in.' }
  }
  if (session.role !== 'admin') {
    return { ok: false, error: 'Only admins can access this list.' }
  }

  // Validate statusFilter
  if (statusFilter !== undefined && !(IDEA_STATUSES as readonly string[]).includes(statusFilter)) {
    return { ok: false, error: 'Invalid status filter.' }
  }

  try {
    const query = db
      .select({
        id:              ideas.id,
        title:           ideas.title,
        category:        ideas.category,
        status:          ideas.status,
        submitterName:   users.displayName,
        submitterId:     ideas.submitterId,
        createdAt:       ideas.createdAt,
        updatedAt:       ideas.updatedAt,
        attachmentName:  ideas.attachmentName,
        reviewerId:      ideas.reviewerId,
        reviewStartedAt: ideas.reviewStartedAt,
        evalStatus:      ideaEvaluations.status,
        evalComment:     ideaEvaluations.comment,
        evalCreatedAt:   ideaEvaluations.createdAt,
        evalAdminId:     ideaEvaluations.adminId,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.submitterId, users.id))
      .leftJoin(ideaEvaluations, eq(ideaEvaluations.ideaId, ideas.id))
      .orderBy(ideas.createdAt)

    const rows = statusFilter
      ? (await query).filter((r) => r.status === statusFilter)
      : await query

    // Collect unique reviewer/admin IDs to fetch names
    const adminIds = new Set<number>()
    for (const r of rows) {
      if (r.reviewerId)   adminIds.add(r.reviewerId)
      if (r.evalAdminId)  adminIds.add(r.evalAdminId)
    }

    const adminMap = new Map<number, string>()
    if (adminIds.size > 0) {
      const adminRows = await db.select({ id: users.id, displayName: users.displayName }).from(users)
      for (const a of adminRows) {
        if (adminIds.has(a.id)) adminMap.set(a.id, a.displayName)
      }
    }

    const data: AdminIdeaListItem[] = rows.reverse().map((r) => ({
      id:              r.id,
      title:           r.title,
      category:        r.category as IdeaCategory,
      status:          r.status as IdeaStatus,
      submitterName:   r.submitterName,
      submitterId:     r.submitterId,
      createdAt:       r.createdAt,
      updatedAt:       r.updatedAt,
      hasAttachment:   r.attachmentName !== null,
      reviewerName:    r.reviewerId ? (adminMap.get(r.reviewerId) ?? null) : null,
      reviewStartedAt: r.reviewStartedAt ?? null,
      evaluation: r.evalStatus !== null && r.evalAdminId !== null && r.evalCreatedAt !== null
        ? {
          adminName: adminMap.get(r.evalAdminId) ?? 'Admin',
          status: r.evalStatus as 'accepted' | 'rejected',
          comment: r.evalComment ?? null,
          createdAt: r.evalCreatedAt,
        }
        : null,
    }))

    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Failed to load ideas. Please try again.' }
  }
}
