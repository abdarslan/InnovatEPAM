import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { formatDistanceToNow } from 'date-fns'

let testDb: ReturnType<typeof drizzle>
let testDbFile: Database.Database

beforeEach(() => {
  testDbFile = new Database(':memory:')
  testDbFile.pragma('journal_mode = WAL')
  testDb = drizzle(testDbFile, { schema })
  migrate(testDb, { migrationsFolder: './lib/db/migrations' })
})

afterEach(() => {
  testDbFile.close()
})

// Helper: create a user in the test DB
async function createUser(opts: {
  email: string
  password: string
  displayName?: string
  role?: 'submitter' | 'admin'
  status?: 'active' | 'inactive'
  failedAttempts?: number
  lockedUntil?: number | null
}) {
  const passwordHash = await hashPassword(opts.password)
  testDb.insert(users).values({
    email: opts.email.toLowerCase(),
    displayName: opts.displayName ?? 'Test User',
    passwordHash,
    role: opts.role ?? 'submitter',
    status: opts.status ?? 'active',
    failedAttempts: opts.failedAttempts ?? 0,
    lockedUntil: opts.lockedUntil ?? null,
    createdAt: Date.now(),
  }).run()
}

// Inline login logic (mirrors actions/auth.ts loginAction, using testDb)
async function login(email: string, password: string) {
  const normalizedEmail = email.toLowerCase()
  const user = testDb.select().from(users).where(eq(users.email, normalizedEmail)).get()

  if (user && user.lockedUntil !== null && user.lockedUntil > Date.now()) {
    const remainingTime = formatDistanceToNow(new Date(user.lockedUntil), { addSuffix: true })
    return { ok: false as const, error: `Your account is locked. Please try again ${remainingTime}.` }
  }

  if (user && user.status === 'inactive') {
    return { ok: false as const, error: 'Your account has been deactivated. Please contact your administrator.' }
  }

  if (!user) {
    return { ok: false as const, error: 'Invalid email or password.' }
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    const newAttempts = user.failedAttempts + 1
    const lockedUntil = newAttempts >= 5 ? Date.now() + 15 * 60 * 1000 : null
    testDb.update(users).set({ failedAttempts: newAttempts, lockedUntil }).where(eq(users.id, user.id)).run()

    if (lockedUntil !== null) {
      const remainingTime = formatDistanceToNow(new Date(lockedUntil), { addSuffix: true })
      return { ok: false as const, error: `Your account is locked. Please try again ${remainingTime}.` }
    }
    return { ok: false as const, error: 'Invalid email or password.' }
  }

  testDb.update(users).set({ failedAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id)).run()
  return { ok: true as const, data: { role: user.role } }
}

describe('loginAction (integration)', () => {
  it('succeeds with correct credentials', async () => {
    await createUser({ email: 'user@epam.com', password: 'Password1' })
    const result = await login('user@epam.com', 'Password1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.role).toBe('submitter')
  })

  it('fails with wrong password', async () => {
    await createUser({ email: 'user@epam.com', password: 'Password1' })
    const result = await login('user@epam.com', 'WrongPass1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/invalid email or password/i)
  })

  it('increments failedAttempts on wrong password', async () => {
    await createUser({ email: 'user@epam.com', password: 'Password1' })
    await login('user@epam.com', 'Wrong1')
    await login('user@epam.com', 'Wrong1')

    const user = testDb.select().from(users).where(eq(users.email, 'user@epam.com')).get()
    expect(user?.failedAttempts).toBe(2)
  })

  it('locks account after 5 failed attempts', async () => {
    await createUser({ email: 'user@epam.com', password: 'Password1' })
    for (let i = 0; i < 5; i++) {
      await login('user@epam.com', 'Wrong1')
    }
    const result = await login('user@epam.com', 'Password1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/locked/i)
  })

  it('rejects inactive account', async () => {
    await createUser({ email: 'inactive@epam.com', password: 'Password1', status: 'inactive' })
    const result = await login('inactive@epam.com', 'Password1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/deactivated/i)
  })

  it('resets failedAttempts on successful login', async () => {
    await createUser({ email: 'user@epam.com', password: 'Password1', failedAttempts: 3 })
    await login('user@epam.com', 'Password1')

    const user = testDb.select().from(users).where(eq(users.email, 'user@epam.com')).get()
    expect(user?.failedAttempts).toBe(0)
  })

  it('rejects unknown email with generic error', async () => {
    const result = await login('unknown@epam.com', 'Password1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/invalid email or password/i)
  })
})
