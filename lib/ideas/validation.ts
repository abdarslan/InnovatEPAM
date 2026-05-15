import { z } from 'zod'
import { IDEA_CATEGORIES, IDEA_RATING_STAGES, type IdeaEvaluationStage, type IdeaDecisionType } from '@/lib/db/schema'

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/gif',
  'image/png',
  'image/jpeg',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'video/mp4',
  'video/webm',
] as const

export const MAX_ATTACHMENTS_PER_IDEA = 5
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_TOTAL_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024

const previewEligibleMimeTypes = [/^image\//, /^audio\//, /^video\//]

export function isPreviewEligibleMimeType(mimeType: string) {
  return mimeType === 'application/pdf' || previewEligibleMimeTypes.some((pattern) => pattern.test(mimeType))
}

export const attachmentFileSchema = z
  .custom<File>((val) => val instanceof File, { message: 'Attachment must be a File.' })
  .refine((file) => file.size <= MAX_ATTACHMENT_SIZE_BYTES, {
    message: 'Each attachment must be 10 MB or smaller.',
  })
  .refine((file) => (ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(file.type), {
    message: 'Only supported document, image, audio, and video files are allowed.',
  })

export function validateAttachmentFiles(files: File[]) {
  const parsed = z.array(attachmentFileSchema)
    .max(MAX_ATTACHMENTS_PER_IDEA, { message: 'You can upload up to 5 attachments.' })
    .safeParse(files)

  if (!parsed.success) {
    return parsed
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
  if (totalBytes > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
    return {
      success: false as const,
      error: {
        issues: [{ message: 'Attachments must total 25 MB or less.' }],
      },
    }
  }

  return parsed
}

const ideaFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: 'Title must be at least 3 characters.' })
    .max(255, { message: 'Title must be 255 characters or fewer.' }),
  description: z
    .string()
    .trim()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(5000, { message: 'Description must be 5000 characters or fewer.' }),
  category: z.enum(IDEA_CATEGORIES, {
    error: () => ({ message: 'Please select a valid category.' }),
  }),
})

export const submitIdeaSchema = ideaFieldsSchema.extend({
  attachments: z.array(attachmentFileSchema).default([]),
})

export const updateIdeaSchema = ideaFieldsSchema.extend({
  attachments: z.array(attachmentFileSchema).default([]),
  removeAttachmentIds: z.array(z.number().int().positive()).default([]),
})

export type SubmitIdeaInput = z.output<typeof submitIdeaSchema>
export type SubmitIdeaFormValues = z.input<typeof submitIdeaSchema>
export type UpdateIdeaInput = z.output<typeof updateIdeaSchema>
export type UpdateIdeaFormValues = z.input<typeof updateIdeaSchema>

// ---------------------------------------------------------------------------
// Evaluation workflow
// ---------------------------------------------------------------------------

export const startReviewSchema = z.object({
  ideaId: z.number().int().positive(),
})

export const evaluateIdeaSchema = z.discriminatedUnion('status', [
  z.object({
    status:  z.literal('accepted'),
    ideaId:  z.number().int().positive(),
    comment: z.string().max(1000).optional(),
  }),
  z.object({
    status:  z.literal('rejected'),
    ideaId:  z.number().int().positive(),
    comment: z
      .string()
      .min(1, { message: 'Rejection reason is required.' })
      .max(1000, { message: 'Comment must be 1000 characters or fewer.' }),
  }),
])

export type StartReviewInput  = z.infer<typeof startReviewSchema>
export type EvaluateIdeaInput = z.infer<typeof evaluateIdeaSchema>

export const decideIdeaStageSchema = z.object({
  ideaId: z.number().int().positive(),
  decision: z.enum(['approve_next', 'reject', 'final_approve', 'final_reject']),
  comment: z
    .string()
    .trim()
    .min(1, { message: 'A decision comment is required.' })
    .max(1000, { message: 'Comment must be 1000 characters or fewer.' }),
})

export type DecideIdeaStageInput = z.infer<typeof decideIdeaStageSchema>

export const stageRatingInputSchema = z.object({
  stage: z.enum(IDEA_RATING_STAGES),
  score: z.number().int().min(1).max(5),
})

export type StageRatingInput = z.infer<typeof stageRatingInputSchema>

export function isRatingRequiredForDecision(
  stage: IdeaEvaluationStage,
  decision: Exclude<IdeaDecisionType, 'submitted'>,
): boolean {
  if (stage === 'stage_2_department_review' || stage === 'stage_3_feasibility') {
    return decision === 'approve_next'
  }

  if (stage === 'stage_4_final_executive_decision') {
    return decision === 'final_approve' || decision === 'final_reject'
  }

  return false
}

export function validateDecisionRatingRequirement(input: {
  stage: IdeaEvaluationStage
  decision: Exclude<IdeaDecisionType, 'submitted'>
  ratingScore?: number
}): { ok: true } | { ok: false; error: string } {
  if (!isRatingRequiredForDecision(input.stage, input.decision)) {
    return { ok: true }
  }

  if (input.ratingScore === undefined || input.ratingScore === null) {
    return { ok: false, error: 'RATING_REQUIRED' }
  }

  const parsed = stageRatingInputSchema.safeParse({ stage: input.stage, score: input.ratingScore })
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_RATING_SCORE' }
  }

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Dynamic category field rules
// ---------------------------------------------------------------------------

export const upsertCategoryFieldRuleSchema = z.object({
  id: z.number().int().positive().optional(),
  category: z.enum(IDEA_CATEGORIES, {
    error: () => ({ message: 'Please select a valid category.' }),
  }),
  fieldKey: z
    .string()
    .trim()
    .min(2, { message: 'Field key must be at least 2 characters.' })
    .max(64, { message: 'Field key must be 64 characters or fewer.' })
    .regex(/^[a-z0-9_]+$/, { message: 'Field key must use lowercase letters, numbers, and underscores only.' }),
  label: z
    .string()
    .trim()
    .min(2, { message: 'Label must be at least 2 characters.' })
    .max(120, { message: 'Label must be 120 characters or fewer.' }),
  fieldType: z.enum(['text', 'number', 'date']),
  required: z.boolean(),
  minValue: z.number().finite().optional(),
  maxValue: z.number().finite().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  helpText: z.string().trim().max(255, { message: 'Help text must be 255 characters or fewer.' }).optional(),
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
}).superRefine((payload, ctx) => {
  if (payload.fieldType === 'number') {
    if (payload.minValue !== undefined && payload.maxValue !== undefined && payload.minValue > payload.maxValue) {
      ctx.addIssue({
        code: 'custom',
        path: ['minValue'],
        message: 'Minimum value cannot be greater than maximum value.',
      })
    }
  }

  if (payload.fieldType === 'text') {
    if (payload.minLength !== undefined && payload.maxLength !== undefined && payload.minLength > payload.maxLength) {
      ctx.addIssue({
        code: 'custom',
        path: ['minLength'],
        message: 'Minimum length cannot be greater than maximum length.',
      })
    }
  }
})

export function collectDynamicFieldEntries(
  formData: FormData,
  prefix = 'dynamic_',
): Record<string, FormDataEntryValue | null> {
  const values: Record<string, FormDataEntryValue | null> = {}
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(prefix)) continue
    values[key.slice(prefix.length)] = value
  }
  return values
}

export type UpsertCategoryFieldRuleInput = z.infer<typeof upsertCategoryFieldRuleSchema>

// ---------------------------------------------------------------------------
// Draft validation (all fields optional — no required constraints)
// ---------------------------------------------------------------------------

/** Relaxed schema for draft save. All fields nullable/optional. */
export const saveDraftSchema = z.object({
  draftId: z.coerce.number().int().positive().optional(),
  title: z
    .string()
    .trim()
    .max(255, { message: 'Title must be 255 characters or fewer.' })
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .max(5000, { message: 'Description must be 5000 characters or fewer.' })
    .optional()
    .nullable(),
  category: z
    .enum(IDEA_CATEGORIES, {
      error: () => ({ message: 'Please select a valid category.' }),
    })
    .optional()
    .nullable(),
  attachments: z.array(attachmentFileSchema).optional().default([]),
  removeAttachmentIds: z.array(z.coerce.number().int().positive()).optional().default([]),
})

export type SaveDraftInput = z.infer<typeof saveDraftSchema>

/**
 * Parse a FormData payload using `saveDraftSchema`.
 * Returns a Zod SafeParseReturnType so callers can inspect `.error.issues`.
 */
export function parseDraftFormData(formData: FormData) {
  return saveDraftSchema.safeParse({
    draftId:     formData.get('draftId') ?? undefined,
    title:       formData.get('title') ?? undefined,
    description: formData.get('description') ?? undefined,
    category:    formData.get('category') ?? undefined,
    attachments: formData.getAll('attachments').filter((f): f is File => f instanceof File && f.size > 0),
    removeAttachmentIds: formData.getAll('removeAttachmentIds').map(Number).filter(Boolean),
  })
}
