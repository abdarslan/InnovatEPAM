import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .refine(
      (val) => val.toLowerCase().endsWith('@epam.com'),
      'Only @epam.com email addresses are permitted.'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters and include one uppercase letter and one number.')
    .regex(/[A-Z]/, 'Password must be at least 8 characters and include one uppercase letter and one number.')
    .regex(/[0-9]/, 'Password must be at least 8 characters and include one uppercase letter and one number.'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be at most 100 characters')
    .transform((val) => val.trim()),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
