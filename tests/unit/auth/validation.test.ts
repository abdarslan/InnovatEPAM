import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from '@/lib/auth/validation'

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid EPAM email + compliant password + displayName', async () => {
      const valid = registerSchema.safeParse({
        email: 'user@epam.com',
        password: 'ValidPassword123',
        displayName: 'Test User',
      })
      expect(valid.success).toBe(true)
    })

    it('accepts uppercase EPAM email', async () => {
      const valid = registerSchema.safeParse({
        email: 'USER@EPAM.COM',
        password: 'ValidPassword123',
        displayName: 'Test User',
      })
      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.email).toBe('USER@EPAM.COM') // schema preserves case, lowercasing happens in action
      }
    })

    it('rejects non-EPAM email domain', async () => {
      const invalid = registerSchema.safeParse({
        email: 'user@gmail.com',
        password: 'ValidPassword123',
        displayName: 'Test User',
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toMatch(/only @epam\.com/i)
      }
    })

    it('rejects multiple non-EPAM domains', async () => {
      const domains = ['yahoo.com', 'hotmail.com', 'test.org']
      for (const domain of domains) {
        const invalid = registerSchema.safeParse({
          email: `user@${domain}`,
          password: 'ValidPassword123',
          displayName: 'Test User',
        })
        expect(invalid.success).toBe(false)
        if (!invalid.success) {
          expect(invalid.error.issues[0]?.message).toMatch(/only @epam\.com/i)
        }
      }
    })

    it('rejects empty email', async () => {
      const invalid = registerSchema.safeParse({
        email: '',
        password: 'ValidPassword123',
        displayName: 'Test User',
      })
      expect(invalid.success).toBe(false)
    })

    it('rejects password shorter than 8 characters', async () => {
      const invalid = registerSchema.safeParse({
        email: 'user@epam.com',
        password: 'Short1',
        displayName: 'Test User',
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toMatch(/at least 8/i)
      }
    })

    it('rejects password with no uppercase letter', async () => {
      const invalid = registerSchema.safeParse({
        email: 'user@epam.com',
        password: 'lowercase1',
        displayName: 'Test User',
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toMatch(/uppercase/i)
      }
    })

    it('rejects password with no number', async () => {
      const invalid = registerSchema.safeParse({
        email: 'user@epam.com',
        password: 'NoNumbers',
        displayName: 'Test User',
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toMatch(/number|digit/i)
      }
    })

    it('requires displayName', async () => {
      const invalid = registerSchema.safeParse({
        email: 'user@epam.com',
        password: 'ValidPassword123',
        displayName: '',
      })
      expect(invalid.success).toBe(false)
    })

    it('accepts various valid passwords', async () => {
      const validPasswords = [
        'Password1',
        'ValidPass123',
        'ComplexP@ssw0rd',
        'A1bcdefgh',
        'MyP@ssw0rd!',
      ]

      for (const password of validPasswords) {
        const valid = registerSchema.safeParse({
          email: 'user@epam.com',
          password,
          displayName: 'Test User',
        })
        expect(valid.success).toBe(true)
      }
    })
  })

  describe('loginSchema', () => {
    it('accepts valid email + password', async () => {
      const valid = loginSchema.safeParse({
        email: 'user@epam.com',
        password: 'Password123',
      })
      expect(valid.success).toBe(true)
    })

    it('accepts non-EPAM domain (login is domain-agnostic)', async () => {
      // Login schema doesn't enforce domain, that's checked against stored user
      const valid = loginSchema.safeParse({
        email: 'user@gmail.com',
        password: 'Password123',
      })
      expect(valid.success).toBe(true)
    })

    it('rejects empty email', async () => {
      const invalid = loginSchema.safeParse({
        email: '',
        password: 'Password123',
      })
      expect(invalid.success).toBe(false)
    })

    it('rejects empty password', async () => {
      const invalid = loginSchema.safeParse({
        email: 'user@epam.com',
        password: '',
      })
      expect(invalid.success).toBe(false)
    })

    it('rejects missing email field', async () => {
      const invalid = loginSchema.safeParse({
        password: 'Password123',
      })
      expect(invalid.success).toBe(false)
    })

    it('rejects missing password field', async () => {
      const invalid = loginSchema.safeParse({
        email: 'user@epam.com',
      })
      expect(invalid.success).toBe(false)
    })

    it('accepts various email formats', async () => {
      const validEmails = [
        'user@epam.com',
        'test.user@epam.com',
        'test+tag@epam.com',
        'TEST@EPAM.COM',
      ]

      for (const email of validEmails) {
        const valid = loginSchema.safeParse({
          email,
          password: 'Password123',
        })
        expect(valid.success).toBe(true)
      }
    })

    it('accepts any non-empty password string', async () => {
      const validPasswords = [
        'a',
        '123',
        'not-complex-at-all',
        'Special@Chars!#%',
      ]

      for (const password of validPasswords) {
        const valid = loginSchema.safeParse({
          email: 'user@epam.com',
          password,
        })
        expect(valid.success).toBe(true)
      }
    })
  })
})
