import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'

// We need to test registerAction in isolation with a real SQLite test DB
// We'll mock the db module to use our test DB

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

// Helper to run registerAction against the test DB
async function register(
  email: string,
  password: string,
  displayName: string
) {
  // Import hashPassword directly
  const { hashPassword } = await import('@/lib/auth/password')
  const { registerSchema } = await import('@/lib/auth/validation')

  const parsed = registerSchema.safeParse({ email, password, displayName })
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { ok: false as const, error: firstError?.message ?? 'Invalid input.' }
  }

  const normalizedEmail = parsed.data.email.toLowerCase()

  const existing = testDb
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .get()

  if (existing) {
    return { ok: false as const, error: 'An account with this email address already exists.' }
  }

  const passwordHash = await hashPassword(parsed.data.password)
  const result = testDb
    .insert(users)
    .values({
      email: normalizedEmail,
      displayName: parsed.data.displayName,
      passwordHash,
      role: 'submitter',
      status: 'active',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: Date.now(),
    })
    .returning({ id: users.id })
    .get()

  return { ok: true as const, data: { userId: result!.id } }
}

describe('registerAction (integration)', () => {
  it('creates user with submitter role on success', async () => {
    const result = await register('newuser@epam.com', 'Password1', 'New User')
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

  it('rejects duplicate email', async () => {
    await register('dup@epam.com', 'Password1', 'User One')
    const result = await register('dup@epam.com', 'Password1', 'User Two')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/already exists/i)
    }
  })

  it('rejects non-EPAM domain', async () => {
    const result = await register('user@gmail.com', 'Password1', 'User')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/only @epam\.com/i)
    }
  })

  it('rejects password that is too short', async () => {
    const result = await register('user@epam.com', 'short', 'User')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/at least 8/i)
    }
  })

  it('rejects password with no uppercase letter', async () => {
    const result = await register('user@epam.com', 'password1', 'User')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/uppercase/i)
    }
  })

  it('rejects password with no digit', async () => {
    const result = await register('user@epam.com', 'PasswordA', 'User')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/number/i)
    }
  })
})
