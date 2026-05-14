import { z } from 'zod'
import { IDEA_CATEGORIES } from '@/lib/db/schema'

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
  attachments: z.array(attachmentFileSchema).optional().default([]),
})

export const updateIdeaSchema = ideaFieldsSchema.extend({
  attachments: z.array(attachmentFileSchema).optional().default([]),
  removeAttachmentIds: z.array(z.number().int().positive()).optional().default([]),
})

export type SubmitIdeaInput = z.infer<typeof submitIdeaSchema>
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>
