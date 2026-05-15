'use server'

import { and, asc, desc, eq, inArray, max } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  ideaAttachments,
  ideaDrafts,
  ideas,
  ideaCategoryFieldRules,
  ideaDecisionEvents,
  ideaEvaluations,
  ideaFieldValues,
  ideaRatings,
  users,
  IDEA_STATUSES,
  type IdeaCategory,
  type IdeaDecisionType,
  type IdeaEvaluationOutcome,
  type IdeaEvaluationStage,
  type IdeaRatingStage,
  type IdeaStatus,
} from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth/session'
import {
  collectDynamicFieldEntries,
  MAX_ATTACHMENTS_PER_IDEA,
  MAX_TOTAL_ATTACHMENT_SIZE_BYTES,
  isPreviewEligibleMimeType,
  submitIdeaSchema,
  type UpsertCategoryFieldRuleInput,
  updateIdeaSchema,
  startReviewSchema,
  evaluateIdeaSchema,
  decideIdeaStageSchema,
  validateDecisionRatingRequirement,
  validateAttachmentFiles,
} from '@/lib/ideas/validation'
import { getStageRatingLabel, resolveStageDecision, validateTransition, type StageRatingLabel } from '@/lib/ideas/transitions'
import { getActiveRulesForCategory, validateDynamicFieldValues } from '@/lib/ideas/category-fields'

export type { IdeaStatus }

export type EvaluationStage = IdeaEvaluationStage
export type EvaluationOutcome = IdeaEvaluationOutcome
export type DecisionType = Exclude<IdeaDecisionType, 'submitted'>

// ---------------------------------------------------------------------------
// Shared result type
// ---------------------------------------------------------------------------

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

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

export type IdeaAttachmentMeta = {
  id: number
  originalName: string
  mimeType: string
  sizeBytes: number
  previewEligible: boolean
}

// ---------------------------------------------------------------------------
// List / detail shapes (no BLOB content)
// ---------------------------------------------------------------------------

export type IdeaListItem = {
  id: number
  title: string
  category: IdeaCategory
  status: IdeaStatus
  currentStage: EvaluationStage
  currentOutcome: EvaluationOutcome
  isTerminal: boolean
  submitterName: string
  isSubmitterAnonymous?: boolean
  submitterId: number
  createdAt: number
  updatedAt: number
  hasAttachment: boolean
  attachmentCount: number
  alignmentRating?: number | null
  feasibilityRating?: number | null
  impactRating?: number | null
}

export type IdeaEvaluationForSubmitter = {
  adminName: string
  status: 'accepted' | 'rejected'
  comment: string | null
  createdAt: number
}

export type IdeaDetail = IdeaListItem & {
  description: string
  attachments: IdeaAttachmentMeta[]
  // legacy compat fields (first attachment, for backward compat)
  attachmentName: string | null
  attachmentSize: number | null
  attachmentMimeType: string | null
  evaluation: IdeaEvaluationForSubmitter | null
  dynamicFields: IdeaDynamicFieldValue[]
}

export type AdminIdeaListItem = IdeaListItem & {
  reviewerName: string | null
  reviewStartedAt: number | null
  latestDecisionAt: number | null
  latestDecidedByUserName: string | null
  evaluation: {
    adminName: string
    status: 'accepted' | 'rejected'
    comment: string | null
    createdAt: number
  } | null
}

export type IdeaTimelineEntry = {
  sequence: number
  stage: EvaluationStage
  decisionType: IdeaDecisionType
  outcome: EvaluationOutcome
  decidedAt: number
  comment?: string
  decidedByUser?: string
  ratingScore?: number
  ratingLabel?: StageRatingLabel
}

function mapOutcomeToLegacyStatus(outcome: EvaluationOutcome): IdeaStatus {
  if (outcome === 'in_progress' || outcome === 'approved_to_next_stage') return 'under_review'
  if (outcome === 'final_approved') return 'accepted'
  if (outcome === 'rejected' || outcome === 'final_rejected') return 'rejected'
  return 'submitted'
}

function toRatingStage(stage: EvaluationStage): IdeaRatingStage | null {
  if (stage === 'stage_2_department_review') return 'stage_2_department_review'
  if (stage === 'stage_3_feasibility') return 'stage_3_feasibility'
  if (stage === 'stage_4_final_executive_decision') return 'stage_4_final_executive_decision'
  return null
}

function shouldAnonymizeSubmitterForAdminView(input: {
  stage: EvaluationStage
  outcome: EvaluationOutcome
}): boolean {
  if (input.outcome === 'final_approved') return false
  if (input.outcome === 'rejected' || input.outcome === 'final_rejected') return true
  return input.stage !== 'stage_1_triage'
}

function applyAdminAnonymization<T extends { submitterName: string; isSubmitterAnonymous?: boolean }>(
  item: T,
  stage: EvaluationStage,
  outcome: EvaluationOutcome,
): T {
  const shouldHideIdentity = shouldAnonymizeSubmitterForAdminView({ stage, outcome })
  if (!shouldHideIdentity) {
    return { ...item, isSubmitterAnonymous: false }
  }

  return {
    ...item,
    submitterName: 'Anonymous',
    isSubmitterAnonymous: true,
  }
}

async function assertStageRatingIsMutable(ideaId: number, stage: EvaluationStage): Promise<ActionResult<void>> {
  const ratingStage = toRatingStage(stage)
  if (!ratingStage) {
    return { ok: true, data: undefined }
  }

  const existing = await db
    .select({ id: ideaRatings.id })
    .from(ideaRatings)
    .where(and(eq(ideaRatings.ideaId, ideaId), eq(ideaRatings.stage, ratingStage)))
    .limit(1)

  if (existing.length > 0) {
    return { ok: false, error: 'RATING_ALREADY_SUBMITTED' }
  }

  return { ok: true, data: undefined }
}

async function getTimelineRatingByDecisionEventId(ideaId: number) {
  const rows = await db
    .select({
      eventId: ideaDecisionEvents.id,
      score: ideaRatings.score,
      stage: ideaRatings.stage,
    })
    .from(ideaDecisionEvents)
    .leftJoin(ideaRatings, eq(ideaDecisionEvents.ratingId, ideaRatings.id))
    .where(eq(ideaDecisionEvents.ideaId, ideaId))

  const ratingByEventId = new Map<number, { score: number; label: StageRatingLabel }>()
  for (const row of rows) {
    if (row.score === null || row.stage === null) continue
    const label = getStageRatingLabel(row.stage as EvaluationStage)
    if (!label) continue
    ratingByEventId.set(row.eventId, { score: row.score, label })
  }

  return ratingByEventId
}

// ---------------------------------------------------------------------------
// getCategoryFieldRulesAction
// ---------------------------------------------------------------------------

export async function getCategoryFieldRulesAction(
  category: IdeaCategory,
): Promise<ActionResult<CategoryFieldRule[]>> {
  try {
    await requireAuth()
  } catch {
    return { ok: false, error: 'You must be logged in to load category rules.' }
  }

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
      .where(
        and(
          eq(ideaCategoryFieldRules.category, category),
          eq(ideaCategoryFieldRules.isActive, true),
        ),
      )
      .orderBy(asc(ideaCategoryFieldRules.sortOrder))

    const data: CategoryFieldRule[] = rows.map((row) => ({
      ...row,
      category: row.category as IdeaCategory,
      fieldType: row.fieldType as UpsertCategoryFieldRuleInput['fieldType'],
      minValue: row.minValue ?? null,
      maxValue: row.maxValue ?? null,
      minLength: row.minLength ?? null,
      maxLength: row.maxLength ?? null,
      helpText: row.helpText ?? null,
    }))

    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Failed to load category rules. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Attachment helpers
// ---------------------------------------------------------------------------

function getAttachmentFilesFromFormData(formData: FormData): File[] {
  const multi = formData.getAll('attachments')
  if (multi.length > 0) return multi.filter((f): f is File => f instanceof File && f.size > 0)
  const single = formData.get('attachment')
  return single instanceof File && single.size > 0 ? [single] : []
}

function parseRemoveAttachmentIds(formData: FormData): number[] {
  const values = formData.getAll('removeAttachmentIds')
  if (values.length > 0) {
    return values
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n > 0)
  }
  const json = formData.get('removeAttachmentIds')
  if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json)
      if (Array.isArray(parsed)) return parsed.filter((n) => Number.isInteger(n) && n > 0)
    } catch { /* ignore */ }
  }
  return []
}

async function prepareAttachmentInserts(files: File[]) {
  return Promise.all(
    files.map(async (file) => ({
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      previewEligible: isPreviewEligibleMimeType(file.type),
      content: Buffer.from(await file.arrayBuffer()),
      createdAt: Date.now(),
    })),
  )
}

function validateUpdatedAttachmentTotals(
  existingSizes: number[],
  removedSizes: number[],
  newFiles: File[],
): string | null {
  const remainingCount = existingSizes.length - removedSizes.length + newFiles.length
  if (remainingCount > MAX_ATTACHMENTS_PER_IDEA) {
    return `You can upload up to ${MAX_ATTACHMENTS_PER_IDEA} attachments.`
  }
  const existingTotal = existingSizes.reduce((s, n) => s + n, 0)
  const removedTotal = removedSizes.reduce((s, n) => s + n, 0)
  const newTotal = newFiles.reduce((s, f) => s + f.size, 0)
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
        status: ideas.status,
        currentStage: ideas.currentStage,
        currentOutcome: ideas.currentOutcome,
        isTerminal: ideas.isTerminal,
        submitterName: users.displayName,
        submitterId: ideas.submitterId,
        alignmentRating: ideas.alignmentRating,
        feasibilityRating: ideas.feasibilityRating,
        impactRating: ideas.impactRating,
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
        .select({ ideaId: ideaAttachments.ideaId })
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
        status: row.status as IdeaStatus,
        currentStage: row.currentStage as EvaluationStage,
        currentOutcome: row.currentOutcome as EvaluationOutcome,
        isTerminal: Boolean(row.isTerminal),
        attachmentCount,
        hasAttachment: attachmentCount > 0,
        alignmentRating: row.alignmentRating ?? null,
        feasibilityRating: row.feasibilityRating ?? null,
        impactRating: row.impactRating ?? null,
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
  let session
  try {
    session = await requireAuth()
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
        status: ideas.status,
        currentStage: ideas.currentStage,
        currentOutcome: ideas.currentOutcome,
        isTerminal: ideas.isTerminal,
        submitterName: users.displayName,
        submitterId: ideas.submitterId,
        alignmentRating: ideas.alignmentRating,
        feasibilityRating: ideas.feasibilityRating,
        impactRating: ideas.impactRating,
        createdAt: ideas.createdAt,
        updatedAt: ideas.updatedAt,
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
      const adminRows = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, r.evalAdminId))
      evaluation = {
        adminName: adminRows[0]?.displayName ?? 'Admin',
        status: r.evalStatus as 'accepted' | 'rejected',
        comment: r.evalComment ?? null,
        createdAt: r.evalCreatedAt,
      }
    }

    const dynamicRows = await db
      .select({ fieldKey: ideaFieldValues.fieldKey, value: ideaFieldValues.value })
      .from(ideaFieldValues)
      .where(eq(ideaFieldValues.ideaId, id))

    const attachmentRows = await db
      .select({
        id: ideaAttachments.id,
        originalName: ideaAttachments.originalName,
        mimeType: ideaAttachments.mimeType,
        sizeBytes: ideaAttachments.sizeBytes,
        previewEligible: ideaAttachments.previewEligible,
      })
      .from(ideaAttachments)
      .where(eq(ideaAttachments.ideaId, id))
      .orderBy(asc(ideaAttachments.createdAt))

    const attachments: IdeaAttachmentMeta[] = attachmentRows.map((a) => ({
      id: a.id,
      originalName: a.originalName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      previewEligible: a.previewEligible,
    }))

    const firstAttachment = attachments[0] ?? null
    const baseData: IdeaDetail = {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category as IdeaCategory,
      status: r.status as IdeaStatus,
      currentStage: r.currentStage as EvaluationStage,
      currentOutcome: r.currentOutcome as EvaluationOutcome,
      isTerminal: Boolean(r.isTerminal),
      submitterName: r.submitterName,
      submitterId: r.submitterId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      attachments,
      attachmentCount: attachments.length,
      hasAttachment: attachments.length > 0,
      // legacy compat fields
      attachmentName: firstAttachment?.originalName ?? null,
      attachmentSize: firstAttachment?.sizeBytes ?? null,
      attachmentMimeType: firstAttachment?.mimeType ?? null,
      evaluation,
      dynamicFields: dynamicRows,
      alignmentRating: r.alignmentRating ?? null,
      feasibilityRating: r.feasibilityRating ?? null,
      impactRating: r.impactRating ?? null,
    }

    const data = session.role === 'admin'
      ? applyAdminAnonymization(baseData, baseData.currentStage, baseData.currentOutcome)
      : baseData

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

  const attachmentFiles = getAttachmentFilesFromFormData(formData)
  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    attachments: attachmentFiles,
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

  // T035: Parse optional draftId for atomic draft deletion on submit
  const rawDraftId = formData.get('draftId')
  const draftId =
    typeof rawDraftId === 'string' && rawDraftId !== ''
      ? parseInt(rawDraftId, 10)
      : null

  // T035: Verify ownership before any DB writes when draftId is provided
  if (draftId !== null && Number.isFinite(draftId)) {
    const draftRows = await db
      .select({ submitterId: ideaDrafts.submitterId })
      .from(ideaDrafts)
      .where(eq(ideaDrafts.id, draftId))
      .all()
    if (draftRows.length === 0 || draftRows[0].submitterId !== session.userId) {
      return { ok: false, error: 'Draft not found or access denied.' }
    }
  }

  const dynamicEntries = collectDynamicFieldEntries(formData)
  const activeRules = await getActiveRulesForCategory(category)
  const dynamicValidation = validateDynamicFieldValues(activeRules, dynamicEntries)
  if (!dynamicValidation.ok) {
    const firstError = Object.values(dynamicValidation.errors)[0] ?? 'Invalid dynamic field input.'
    return { ok: false, error: firstError }
  }

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

      const insertedIdeaId = insertedIdea[0].id

      if (preparedAttachments.length > 0) {
        tx.insert(ideaAttachments)
          .values(preparedAttachments.map((a) => ({ ...a, ideaId: insertedIdeaId })))
          .run()
      }

      tx.insert(ideaDecisionEvents)
        .values({
          ideaId: insertedIdeaId,
          stage: 'stage_1_triage',
          decisionType: 'submitted',
          outcome: 'in_progress',
          comment: null,
          decidedByUserId: session.userId,
          decidedAt: now,
          sequence: 1,
        })
        .run()

      const dynamicValueRows = Object.entries(dynamicValidation.normalizedValues)
        .map(([fieldKey, value]) => {
          const rule = activeRules.find((r) => r.fieldKey === fieldKey)
          if (!rule) return null
          return {
            ideaId: insertedIdeaId,
            ruleId: rule.id,
            fieldKey,
            value,
            createdAt: now,
            updatedAt: now,
          }
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)

      if (dynamicValueRows.length > 0) {
        tx.insert(ideaFieldValues).values(dynamicValueRows).run()
      }

      // T035: Atomically delete the source draft if draftId was provided
      if (draftId !== null && Number.isFinite(draftId)) {
        tx.delete(ideaDrafts).where(eq(ideaDrafts.id, draftId)).run()
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

  const attachmentFiles = getAttachmentFilesFromFormData(formData)
  const removeAttachmentIds = parseRemoveAttachmentIds(formData)
  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    attachments: attachmentFiles,
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
    .select({ id: ideaAttachments.id, sizeBytes: ideaAttachments.sizeBytes })
    .from(ideaAttachments)
    .where(eq(ideaAttachments.ideaId, id))

  const existingAttachmentIds = new Set(existingAttachments.map((a) => a.id))
  if (parsed.data.removeAttachmentIds.some((aId) => !existingAttachmentIds.has(aId))) {
    return { ok: false, error: 'One or more selected attachments could not be found.' }
  }

  const removedSizes = existingAttachments
    .filter((a) => parsed.data.removeAttachmentIds.includes(a.id))
    .map((a) => a.sizeBytes)

  const totalValidationError = validateUpdatedAttachmentTotals(
    existingAttachments.map((a) => a.sizeBytes),
    removedSizes,
    parsed.data.attachments,
  )
  if (totalValidationError) return { ok: false, error: totalValidationError }

  const { title, description, category } = parsed.data
  const preparedAttachments = await prepareAttachmentInserts(parsed.data.attachments)

  try {
    db.transaction((tx) => {
      tx.update(ideas).set({ title, description, category, updatedAt: Date.now() }).where(eq(ideas.id, id)).run()

      if (parsed.data.removeAttachmentIds.length > 0) {
        tx.delete(ideaAttachments)
          .where(inArray(ideaAttachments.id, parsed.data.removeAttachmentIds))
          .run()
      }

      if (preparedAttachments.length > 0) {
        tx.insert(ideaAttachments)
          .values(preparedAttachments.map((a) => ({ ...a, ideaId: id })))
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
// decideIdeaStageAction - admin only, 4-stage evaluation pipeline
// ---------------------------------------------------------------------------

export async function decideIdeaStageAction(input: {
  ideaId: number
  decision: DecisionType
  comment: string
  ratingScore?: number
}): Promise<ActionResult<void>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'UNAUTHENTICATED' }
  }

  if (session.role !== 'admin') {
    return { ok: false, error: 'FORBIDDEN' }
  }

  const parsed = decideIdeaStageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'VALIDATION_ERROR' }
  }

  const ideaRows = await db
    .select({
      id: ideas.id,
      currentStage: ideas.currentStage,
      currentOutcome: ideas.currentOutcome,
      isTerminal: ideas.isTerminal,
      reviewerId: ideas.reviewerId,
    })
    .from(ideas)
    .where(eq(ideas.id, parsed.data.ideaId))
    .all()

  if (ideaRows.length === 0) {
    return { ok: false, error: 'IDEA_NOT_FOUND' }
  }

  const idea = ideaRows[0]
  const currentState = {
    stage: idea.currentStage as EvaluationStage,
    outcome: idea.currentOutcome as EvaluationOutcome,
    isTerminal: Boolean(idea.isTerminal),
  }

  const next = resolveStageDecision(currentState, parsed.data.decision)
  if (!next) {
    return { ok: false, error: 'INVALID_TRANSITION' }
  }

  const ratingValidation = validateDecisionRatingRequirement({
    stage: currentState.stage,
    decision: parsed.data.decision,
    ratingScore: input.ratingScore,
  })
  if (!ratingValidation.ok) {
    return { ok: false, error: ratingValidation.error }
  }

  const mutabilityResult = await assertStageRatingIsMutable(parsed.data.ideaId, currentState.stage)
  if (!mutabilityResult.ok) {
    return mutabilityResult
  }

  const now = Date.now()
  const eventOutcome: EvaluationOutcome =
    parsed.data.decision === 'approve_next' ? 'approved_to_next_stage' : next.nextOutcome
  const nextStatus = mapOutcomeToLegacyStatus(next.nextOutcome)

  const stageLabel = getStageRatingLabel(currentState.stage)
  const shouldPersistRating = stageLabel !== null && ratingValidation.ok && input.ratingScore !== undefined

  try {
    db.transaction((tx) => {
      const seqRows = tx
        .select({ maxSequence: max(ideaDecisionEvents.sequence) })
        .from(ideaDecisionEvents)
        .where(eq(ideaDecisionEvents.ideaId, parsed.data.ideaId))
        .all()
      const nextSequence = (seqRows[0]?.maxSequence ?? 0) + 1

      let insertedRatingId: number | null = null
      if (shouldPersistRating) {
        const ratingScore = input.ratingScore as number
        const ratingRows = tx
          .insert(ideaRatings)
          .values({
            ideaId: parsed.data.ideaId,
            stage: currentState.stage as IdeaRatingStage,
            raterId: session.userId,
            score: ratingScore,
            createdAt: now,
            updatedAt: now,
          })
          .returning({ id: ideaRatings.id })
          .all()
        insertedRatingId = ratingRows[0]?.id ?? null
      }

      const updated = tx
        .update(ideas)
        .set({
          currentStage: next.nextStage,
          currentOutcome: next.nextOutcome,
          isTerminal: next.isTerminal,
          status: nextStatus,
          reviewerId: idea.reviewerId ?? session.userId,
          reviewStartedAt: idea.reviewerId ? undefined : now,
          alignmentRating:
            currentState.stage === 'stage_2_department_review' && input.ratingScore !== undefined
              ? input.ratingScore
              : undefined,
          feasibilityRating:
            currentState.stage === 'stage_3_feasibility' && input.ratingScore !== undefined
              ? input.ratingScore
              : undefined,
          impactRating:
            currentState.stage === 'stage_4_final_executive_decision' && input.ratingScore !== undefined
              ? input.ratingScore
              : undefined,
          updatedAt: now,
        })
        .where(
          and(
            eq(ideas.id, parsed.data.ideaId),
            eq(ideas.currentStage, currentState.stage),
            eq(ideas.currentOutcome, currentState.outcome),
            eq(ideas.isTerminal, currentState.isTerminal),
          ),
        )
        .run()

      if (updated.changes === 0) {
        throw new Error('CONFLICT_STALE_STATE')
      }

      tx.insert(ideaDecisionEvents)
        .values({
          ideaId: parsed.data.ideaId,
          stage: currentState.stage,
          decisionType: parsed.data.decision,
          outcome: eventOutcome,
          comment: parsed.data.comment,
          ratingId: insertedRatingId,
          decidedByUserId: session.userId,
          decidedAt: now,
          sequence: nextSequence,
        })
        .run()
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'CONFLICT_STALE_STATE') {
      return { ok: false, error: 'CONFLICT_STALE_STATE' }
    }
    return { ok: false, error: 'Failed to apply decision.' }
  }

  return { ok: true, data: undefined }
}

export async function updateIdeaDecisionEventAction(): Promise<ActionResult<void>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'UNAUTHENTICATED' }
  }

  if (session.role !== 'admin') {
    return { ok: false, error: 'FORBIDDEN' }
  }

  return { ok: false, error: 'FORBIDDEN_APPEND_ONLY' }
}

export async function deleteIdeaDecisionEventAction(): Promise<ActionResult<void>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'UNAUTHENTICATED' }
  }

  if (session.role !== 'admin') {
    return { ok: false, error: 'FORBIDDEN' }
  }

  return { ok: false, error: 'FORBIDDEN_APPEND_ONLY' }
}

// ---------------------------------------------------------------------------
// getIdeaTimelineAction - viewer-aware timeline projection
// ---------------------------------------------------------------------------

export async function getIdeaTimelineAction(
  input: { ideaId: number },
): Promise<ActionResult<IdeaTimelineEntry[]>> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return { ok: false, error: 'UNAUTHENTICATED' }
  }

  const parsed = startReviewSchema.safeParse({ ideaId: input.ideaId })
  if (!parsed.success) {
    return { ok: false, error: 'VALIDATION_ERROR' }
  }

  const ideaRows = await db
    .select({ submitterId: ideas.submitterId })
    .from(ideas)
    .where(eq(ideas.id, parsed.data.ideaId))
    .all()

  if (ideaRows.length === 0) {
    return { ok: false, error: 'IDEA_NOT_FOUND' }
  }

  const canViewPrivilegedFields = session.role === 'admin' || session.userId === ideaRows[0].submitterId
  const ratingByEventId = await getTimelineRatingByDecisionEventId(parsed.data.ideaId)

  const rows = await db
    .select({
      id: ideaDecisionEvents.id,
      sequence: ideaDecisionEvents.sequence,
      stage: ideaDecisionEvents.stage,
      decisionType: ideaDecisionEvents.decisionType,
      outcome: ideaDecisionEvents.outcome,
      decidedAt: ideaDecisionEvents.decidedAt,
      comment: ideaDecisionEvents.comment,
      decidedByUser: users.displayName,
    })
    .from(ideaDecisionEvents)
    .leftJoin(users, eq(ideaDecisionEvents.decidedByUserId, users.id))
    .where(eq(ideaDecisionEvents.ideaId, parsed.data.ideaId))
    .orderBy(asc(ideaDecisionEvents.sequence), asc(ideaDecisionEvents.decidedAt))

  const data = rows.map((row) => {
    const base: IdeaTimelineEntry = {
      sequence: row.sequence,
      stage: row.stage as EvaluationStage,
      decisionType: row.decisionType as IdeaDecisionType,
      outcome: row.outcome as EvaluationOutcome,
      decidedAt: row.decidedAt,
    }

    const rating = ratingByEventId.get(row.id)
    if (rating) {
      base.ratingScore = rating.score
      base.ratingLabel = rating.label
    }

    if (canViewPrivilegedFields) {
      if (row.comment) base.comment = row.comment
      if (row.decidedByUser) base.decidedByUser = row.decidedByUser
    }

    return base
  })

  return { ok: true, data }
}

// ---------------------------------------------------------------------------
// startReviewAction - admin only, Submitted -> UnderReview
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
// evaluateIdeaAction - admin only, UnderReview -> Accepted | Rejected
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
// getAdminIdeasAction - admin only, all ideas with reviewer + evaluation info
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
        currentStage:    ideas.currentStage,
        currentOutcome:  ideas.currentOutcome,
        isTerminal:      ideas.isTerminal,
        submitterName:   users.displayName,
        submitterId:     ideas.submitterId,
        alignmentRating: ideas.alignmentRating,
        feasibilityRating: ideas.feasibilityRating,
        impactRating: ideas.impactRating,
        createdAt:       ideas.createdAt,
        updatedAt:       ideas.updatedAt,
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

    const ideaIds = rows.map((r) => r.id)
    const latestEventRows = ideaIds.length === 0
      ? []
      : await db
        .select({
          ideaId: ideaDecisionEvents.ideaId,
          latestDecisionAt: max(ideaDecisionEvents.decidedAt),
        })
        .from(ideaDecisionEvents)
        .where(inArray(ideaDecisionEvents.ideaId, ideaIds))
        .groupBy(ideaDecisionEvents.ideaId)

    const latestEventAtByIdeaId = new Map<number, number>()
    for (const row of latestEventRows) {
      if (row.latestDecisionAt !== null) {
        latestEventAtByIdeaId.set(row.ideaId, row.latestDecisionAt)
      }
    }

    const eventActorRows = ideaIds.length === 0
      ? []
      : await db
        .select({
          ideaId: ideaDecisionEvents.ideaId,
          decidedAt: ideaDecisionEvents.decidedAt,
          decidedByUserId: ideaDecisionEvents.decidedByUserId,
        })
        .from(ideaDecisionEvents)
        .where(inArray(ideaDecisionEvents.ideaId, ideaIds))

    const latestDecisionByIdeaId = new Map<number, { decidedAt: number; decidedByUserId: number | null }>()
    for (const row of eventActorRows) {
      const expectedLatest = latestEventAtByIdeaId.get(row.ideaId)
      if (expectedLatest === undefined || row.decidedAt !== expectedLatest) continue
      latestDecisionByIdeaId.set(row.ideaId, {
        decidedAt: row.decidedAt,
        decidedByUserId: row.decidedByUserId ?? null,
      })
    }

    // Collect unique reviewer/admin IDs to fetch names
    const adminIds = new Set<number>()
    for (const r of rows) {
      if (r.reviewerId)   adminIds.add(r.reviewerId)
      if (r.evalAdminId) adminIds.add(r.evalAdminId)
      const latestDecision = latestDecisionByIdeaId.get(r.id)
      if (latestDecision?.decidedByUserId) adminIds.add(latestDecision.decidedByUserId)
    }

    const adminMap = new Map<number, string>()
    if (adminIds.size > 0) {
      const adminRows = await db.select({ id: users.id, displayName: users.displayName }).from(users)
      for (const a of adminRows) {
        if (adminIds.has(a.id)) adminMap.set(a.id, a.displayName)
      }
    }

    const data: AdminIdeaListItem[] = rows.reverse().map((r) => {
      const projected = {
        id:              r.id,
        title:           r.title,
        category:        r.category as IdeaCategory,
        status:          r.status as IdeaStatus,
        currentStage:    r.currentStage as EvaluationStage,
        currentOutcome:  r.currentOutcome as EvaluationOutcome,
        isTerminal:      Boolean(r.isTerminal),
        submitterName:   r.submitterName,
        submitterId:     r.submitterId,
        createdAt:       r.createdAt,
        updatedAt:       r.updatedAt,
        hasAttachment:   false,
        attachmentCount: 0,
        alignmentRating: r.alignmentRating ?? null,
        feasibilityRating: r.feasibilityRating ?? null,
        impactRating: r.impactRating ?? null,
        reviewerName:    r.reviewerId ? (adminMap.get(r.reviewerId) ?? null) : null,
        reviewStartedAt: r.reviewStartedAt ?? null,
        latestDecisionAt: latestDecisionByIdeaId.get(r.id)?.decidedAt ?? null,
        latestDecidedByUserName: (() => {
          const decidedByUserId = latestDecisionByIdeaId.get(r.id)?.decidedByUserId
          return decidedByUserId ? (adminMap.get(decidedByUserId) ?? null) : null
        })(),
        evaluation: r.evalStatus !== null && r.evalAdminId !== null && r.evalCreatedAt !== null
          ? {
            adminName: adminMap.get(r.evalAdminId) ?? 'Admin',
            status: r.evalStatus as 'accepted' | 'rejected',
            comment: r.evalComment ?? null,
            createdAt: r.evalCreatedAt,
          }
          : null,
      }

      return applyAdminAnonymization(projected, projected.currentStage, projected.currentOutcome)
    })

    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Failed to load ideas. Please try again.' }
  }
}
