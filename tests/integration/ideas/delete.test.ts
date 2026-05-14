import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { ideas, users } from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/password'

let testDbFile: Database.Database
let testDb: ReturnType<typeof drizzle>

beforeEach(() => {
  vi.resetModules()
  testDbFile = new Database(':memory:')
  testDbFile.pragma('journal_mode = WAL')
  testDb = drizzle(testDbFile, { schema })
  migrate(testDb, { migrationsFolder: './lib/db/migrations' })
})

afterEach(() => {
  testDbFile.close()
  vi.restoreAllMocks()
})

async function seedUser(role: 'submitter' | 'admin' = 'submitter') {
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email: `user${Date.now()}${Math.random()}@example.com`,
      displayName: 'Test User',
      passwordHash: hash,
      role,
      status: 'active',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: Date.now(),
    })
    .returning({ id: users.id })
    .all()
  return result[0].id
}

function seedIdea(submitterId: number) {
  const now = Date.now()
  const result = testDb
    .insert(ideas)
    .values({
      title: 'Idea To Delete',
      description: 'This idea will be deleted.',
      category: 'workplace_culture',
      submitterId,
      attachmentName: null,
      attachmentSize: null,
      attachmentMimeType: null,
      attachmentContent: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: ideas.id })
    .all()
  return result[0].id
}

function mockAuth(userId: number, role: 'submitter' | 'admin' = 'submitter') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'Test User' }),
  }))
}

describe('deleteIdeaAction', () => {
  it('owner can delete their own idea', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId)
    mockAuth(userId)

    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(ideaId)
    expect(result.ok).toBe(true)

    const remaining = testDb.select().from(ideas).where(eq(ideas.id, ideaId)).all()
    expect(remaining).toHaveLength(0)
  })

  it('admin can delete any idea', async () => {
    const ownerId = await seedUser()
    const adminId = await seedUser('admin')
    const ideaId = seedIdea(ownerId)
    mockAuth(adminId, 'admin')

    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(ideaId)
    expect(result.ok).toBe(true)

    const remaining = testDb.select().from(ideas).where(eq(ideas.id, ideaId)).all()
    expect(remaining).toHaveLength(0)
  })

  it('non-owner non-admin receives authorisation error', async () => {
    const ownerId = await seedUser()
    const otherId = await seedUser()
    const ideaId = seedIdea(ownerId)
    mockAuth(otherId)

    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(ideaId)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/not authorised/i)
  })

  it('returns not-found when idea does not exist', async () => {
    const userId = await seedUser()
    mockAuth(userId)

    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(99999)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/not found/i)
  })

  it('returns error when unauthenticated', async () => {
    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockRejectedValue(new Error('UNAUTHENTICATED')),
    }))

    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(1)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/logged in/i)
  })
})
