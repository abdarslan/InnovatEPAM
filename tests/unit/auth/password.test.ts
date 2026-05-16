import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('Password helpers', () => {
  describe('hashPassword', () => {
    it('produces a hash for a given password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      expect(hash).toBeTruthy()
      expect(hash.length).toBeGreaterThan(20) // bcrypt hashes are typically 60 chars
    })

    it('produces different hashes for the same password (salt randomness)', async () => {
      const password = 'TestPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      // Hashes should be different due to salt
      expect(hash1).not.toBe(hash2)
    })

    it('produces bcrypt format hashes (starting with $2)', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      // bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/)
    })

    it('uses work factor 12', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      // The work factor is the part after the algorithm identifier
      // Format: $2b$12$...
      expect(hash).toMatch(/^\$2[aby]\$12\$/)
    })

    it('handles special characters in passwords', async () => {
      const password = 'P@$$w0rd!#%&*'
      const hash = await hashPassword(password)
      expect(hash).toBeTruthy()
    })

    it('handles unicode characters in passwords', async () => {
      const password = 'Pässwörd123'
      const hash = await hashPassword(password)
      expect(hash).toBeTruthy()
    })
  })

  describe('verifyPassword', () => {
    it('returns true for matching password', async () => {
      const password = 'CorrectPassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('returns false for non-matching password', async () => {
      const password = 'CorrectPassword123'
      const wrongPassword = 'WrongPassword456'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('handles case-sensitive comparison', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      const isValidLowercase = await verifyPassword('testpassword123', hash)
      expect(isValidLowercase).toBe(false)
    })

    it('returns false for empty password against hash', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('', hash)
      expect(isValid).toBe(false)
    })

    it('returns false for null-like password strings', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('undefined', hash)
      expect(isValid).toBe(false)
    })

    it('returns true for same password across different hashes', async () => {
      const password = 'TestPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      // Each hash is different, but both should verify the same password
      const verify1 = await verifyPassword(password, hash1)
      const verify2 = await verifyPassword(password, hash2)

      expect(verify1).toBe(true)
      expect(verify2).toBe(true)
    })
  })
})
