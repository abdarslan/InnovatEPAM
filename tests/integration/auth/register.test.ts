import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/password'
import { registerSchema } from '@/lib/auth/validation'

// Test database setup
let testDb: ReturnType<typeof drizzle>
let testDbFile: Database.Database

beforeEach(() => {
  // Use in-memory SQLite for isolation
  testDbFile = new Database(':memory:')
  testDbFile.pragma('journal_mode = WAL')
  testDb = drizzle(testDbFile, { schema })
  migrate(testDb, { migrationsFolder: './lib/db/migrations' })
})

afterEach(() => {
  testDbFile.close()
})

// Test helper that mimics registerAction logic (for integration testing against real DB)
async function registerWithTestDb(
  email: string,
  password: string,
  displayName: string
) {
  const parsed = registerSchema.safeParse({ email, password, displayName })
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { ok: false as const, error: firstError?.message ?? 'Invalid input.' }
  }

  const { email: validEmail, password: validPassword, displayName: validDisplayName } = parsed.data
  const normalizedEmail = validEmail.toLowerCase()

  try {
    const existing = testDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .get()

    if (existing) {
      return { ok: false as const, error: 'An account with this email address already exists.' }
    }

    const passwordHash = await hashPassword(validPassword)
    const now = Date.now()

    const result = testDb
      .insert(users)
      .values({
        email: normalizedEmail,
        displayName: validDisplayName,
        passwordHash,
        role: 'submitter',
        status: 'active',
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: now,
      })
      .returning({ id: users.id })
      .get()

    if (!result) {
      return { ok: false as const, error: 'Registration failed. Please try again.' }
    }

    return { ok: true as const, data: { userId: result.id } }
  } catch {
    return { ok: false as const, error: 'Registration failed. Please try again.' }
  }
}

describe('registerAction (integration)', () => {
  it('creates user with submitter role on success', async () => {
    const result = await registerWithTestDb('newuser@epam.com', 'Password1', 'New User')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.userId).toBeTypeOf('number')
    }

    const created = testDb
      .select()
      .from(users)
      .where(eq(users.email, 'newuser@epam.com'))
      .get()

    expect(created).toBeDefined()
    expect(created!.role).toBe('submitter')
    expect(created!.status).toBe('active')
  })

  it('returns ok: true with userId on success', async () => {
    const result = await registerWithTestDb('test@epam.com', 'Password123', 'Test User')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toHaveProperty('userId')
      expect(typeof result.data.userId).toBe('number')
    }
  })

  it('creates user with hashed password (not plain text)', async () => {
    const plainPassword = 'MyPassword123'
    await registerWithTestDb('hash@epam.com', plainPassword, 'Hash Test')

    const created = testDb
      .select()
      .from(users)
      .where(eq(users.email, 'hash@epam.com'))
      .get()

    expect(created).toBeDefined()
    expect(created!.passwordHash).not.toBe(plainPassword)
    expect(created!.passwordHash.length).toBeGreaterThan(20) // bcrypt hashes are long
  })

  it('stores email in lowercase', async () => {
    const result = await registerWithTestDb('User@EPAM.COM', 'Password1', 'Test User')
    expect(result.ok).toBe(true)

    const created = testDb
      .select()
      .from(users)
      .where(eq(users.email, 'user@epam.com'))
      .get()

    expect(created).toBeDefined()
    expect(created!.email).toBe('user@epam.com')
  })

  it('rejects duplicate email', async () => {
    await registerWithTestDb('dup@epam.com', 'Password1', 'User One')
    const result = await registerWithTestDb('dup@epam.com', 'Password1', 'User Two')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/already exists/i)
    }
  })

  it('rejects duplicate email case-insensitively', async () => {
    await registerWithTestDb('Case@epam.com', 'Password1', 'User One')
    const result = await registerWithTestDb('case@epam.com', 'Password1', 'User Two')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/already exists/i)
    }
  })

  it('rejects non-EPAM domain', async () => {
    const result = await registerWithTestDb('user@gmail.com', 'Password1', 'User')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/only @epam\.com/i)
    }
  })

  it('rejects multiple non-EPAM domains', async () => {
    const domains = ['yahoo.com', 'hotmail.com', 'test.org']
    for (const domain of domains) {
      const result = await registerWithTestDb(`user@${domain}`, 'Password1', 'User')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/only @epam\.com/i)
      }
    }
  })

  it('rejects password that is too short (< 8 chars)', async () => {
    const result = await registerWithTestDb('user@epam.com', 'Short1', 'User')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/at least 8/i)
    }
  })

  it('rejects password with no uppercase letter', async () => {
    const result = await registerWithTestDb('user@epam.com', 'password1', 'User')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/uppercase/i)
    }
  })

  it('rejects password with no digit', async () => {
    const result = await registerWithTestDb('user@epam.com', 'PasswordA', 'User')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/number/i)
    }
  })

  it('rejects missing email', async () => {
    const result = await registerWithTestDb('', 'Password1', 'User')
    expect(result.ok).toBe(false)
  })

  it('rejects missing password', async () => {
    const result = await registerWithTestDb('user@epam.com', '', 'User')
    expect(result.ok).toBe(false)
  })

  it('rejects missing displayName', async () => {
    const result = await registerWithTestDb('user@epam.com', 'Password1', '')
    expect(result.ok).toBe(false)
  })
})
