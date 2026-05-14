import { z } from 'zod'
import { IDEA_CATEGORIES } from '@/lib/db/schema'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
] as const

const MAX_FILE_SIZE = 5_242_880 // 5 MB

const attachmentSchema = z
  .custom<File>((val) => val instanceof File, { message: 'Attachment must be a File.' })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: 'Attachment must be 5 MB or smaller.',
  })
  .refine((file) => (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type), {
    message: 'Only PDF, DOCX, PNG, and JPG files are allowed.',
  })

export const submitIdeaSchema = z.object({
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
  attachment: attachmentSchema.optional(),
})

export const updateIdeaSchema = submitIdeaSchema

export type SubmitIdeaInput = z.infer<typeof submitIdeaSchema>
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>
