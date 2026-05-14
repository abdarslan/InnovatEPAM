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

async function seedUser(opts: { role?: 'submitter' | 'admin'; displayName?: string } = {}) {
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email:         `user${Date.now()}@example.com`,
      displayName:   opts.displayName ?? 'Test User',
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

describe('startReviewAction', () => {
  it('transitions idea from submitted to under_review', async () => {
    const adminId  = await seedUser({ role: 'admin' })
    const ideaId   = seedIdea(adminId)
    mockAuth(adminId, 'admin')
    const { startReviewAction } = await import('@/actions/ideas')
    const result = await startReviewAction(ideaId)
    expect(result.ok).toBe(true)
    const row = testDb.select({ status: ideas.status, reviewerId: ideas.reviewerId }).from(ideas).where(eq(ideas.id, ideaId)).all()
    expect(row[0].status).toBe('under_review')
    expect(row[0].reviewerId).toBe(adminId)
  })

  it('rejects if not admin', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId)
    mockAuth(userId, 'submitter')
    const { startReviewAction } = await import('@/actions/ideas')
    const result = await startReviewAction(ideaId)
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/admin/i)
  })

  it('rejects invalid transition from under_review', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const ideaId  = seedIdea(adminId, { status: 'under_review' })
    mockAuth(adminId, 'admin')
    const { startReviewAction } = await import('@/actions/ideas')
    const result = await startReviewAction(ideaId)
    expect(result.ok).toBe(false)
  })

  it('returns error for non-existent idea', async () => {
    const adminId = await seedUser({ role: 'admin' })
    mockAuth(adminId, 'admin')
    const { startReviewAction } = await import('@/actions/ideas')
    const result = await startReviewAction(9999)
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/not found/i)
  })
})
