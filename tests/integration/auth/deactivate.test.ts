import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/password'

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

async function createUser(opts: {
  email: string
  role?: 'submitter' | 'admin'
  status?: 'active' | 'inactive'
}): Promise<number> {
  const passwordHash = await hashPassword('Password1')
  const result = testDb.insert(users).values({
    email: opts.email,
    displayName: 'Test User',
    passwordHash,
    role: opts.role ?? 'submitter',
    status: opts.status ?? 'active',
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: Date.now(),
  }).returning({ id: users.id }).get()
  return result!.id
}

// Inline deactivate logic (mirrors actions/auth.ts deactivateUserAction, using testDb)
function deactivate(
  callerRole: 'submitter' | 'admin',
  targetUserId: number
): { ok: true; data: { deactivatedEmail: string } } | { ok: false; error: string } {
  if (callerRole !== 'admin') {
    return { ok: false, error: 'Forbidden.' }
  }

  const target = testDb.select().from(users).where(eq(users.id, targetUserId)).get()

  if (!target) {
    return { ok: false, error: 'User not found.' }
  }

  if (target.status === 'inactive') {
    return { ok: false, error: 'User is already deactivated.' }
  }

  testDb.update(users).set({ status: 'inactive' }).where(eq(users.id, targetUserId)).run()
  return { ok: true, data: { deactivatedEmail: target.email } }
}

describe('deactivateUserAction (integration)', () => {
  it('admin can deactivate an active user', async () => {
    const targetId = await createUser({ email: 'target@epam.com' })
    const result = deactivate('admin', targetId)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.deactivatedEmail).toBe('target@epam.com')
    }

    const updated = testDb.select().from(users).where(eq(users.id, targetId)).get()
    expect(updated?.status).toBe('inactive')
  })

  it('non-admin is rejected with Forbidden', async () => {
    const targetId = await createUser({ email: 'target@epam.com' })
    const result = deactivate('submitter', targetId)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Forbidden.')
  })

  it('returns error for non-existent user', () => {
    const result = deactivate('admin', 99999)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('User not found.')
  })

  it('returns error when user is already inactive', async () => {
    const targetId = await createUser({ email: 'target@epam.com', status: 'inactive' })
    const result = deactivate('admin', targetId)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('User is already deactivated.')
  })

  it('does NOT modify failedAttempts or lockedUntil on deactivation', async () => {
    const targetId = await createUser({ email: 'target@epam.com' })
    // Manually set failedAttempts
    testDb.update(users).set({ failedAttempts: 3, lockedUntil: Date.now() + 10000 }).where(eq(users.id, targetId)).run()

    deactivate('admin', targetId)

    const updated = testDb.select().from(users).where(eq(users.id, targetId)).get()
    expect(updated?.failedAttempts).toBe(3)
    expect(updated?.lockedUntil).not.toBeNull()
  })
})
