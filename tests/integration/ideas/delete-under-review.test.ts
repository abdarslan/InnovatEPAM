import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
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

async function seedUser(opts: { role?: 'submitter' | 'admin' } = {}) {
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email:         `user${Date.now()}@example.com`,
      displayName:   'Test User',
      passwordHash:  hash,
      role:          opts.role ?? 'submitter',
      status:        'active',
      failedAttempts: 0,
      lockedUntil:   null,
      createdAt:     Date.now(),
    })
    .returning({ id: users.id })
    .all()
  return result[0].id
}

function seedIdea(submitterId: number, overrides: Partial<schema.NewIdea> = {}) {
  const now = Date.now()
  const result = testDb
    .insert(ideas)
    .values({
      title:              'Test Idea',
      description:        'A detailed description.',
      category:           'workplace_culture',
      submitterId,
      attachmentName:     null,
      attachmentSize:     null,
      attachmentMimeType: null,
      attachmentContent:  null,
      status:             'submitted',
      reviewerId:         null,
      reviewStartedAt:    null,
      createdAt:          now,
      updatedAt:          now,
      ...overrides,
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

describe('deleteIdeaAction — under_review guard', () => {
  it('prevents deleting an idea that is under review', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId, { status: 'under_review' })
    mockAuth(userId)
    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(ideaId)
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/under review/i)
  })

  it('allows deleting a submitted idea', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId, { status: 'submitted' })
    mockAuth(userId)
    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(ideaId)
    expect(result.ok).toBe(true)
  })

  it('allows admin to delete a submitted idea', async () => {
    const adminId     = await seedUser({ role: 'admin' })
    const submitterId = await seedUser()
    const ideaId      = seedIdea(submitterId, { status: 'submitted' })
    mockAuth(adminId, 'admin')
    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(ideaId)
    expect(result.ok).toBe(true)
  })

  it('prevents admin from deleting an under_review idea', async () => {
    const adminId     = await seedUser({ role: 'admin' })
    const submitterId = await seedUser()
    const ideaId      = seedIdea(submitterId, { status: 'under_review' })
    mockAuth(adminId, 'admin')
    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(ideaId)
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/under review/i)
  })
})
