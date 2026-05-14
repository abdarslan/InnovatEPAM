import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { ideas, users, ideaEvaluations } from '@/lib/db/schema'
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

describe('evaluateIdeaAction', () => {
  it('accepts an under_review idea and creates evaluation record', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const ideaId  = seedIdea(adminId, { status: 'under_review' })
    mockAuth(adminId, 'admin')
    const { evaluateIdeaAction } = await import('@/actions/ideas')
    const result = await evaluateIdeaAction({ status: 'accepted', ideaId })
    expect(result.ok).toBe(true)
    const ideaRow = testDb.select({ status: ideas.status }).from(ideas).where(eq(ideas.id, ideaId)).all()
    expect(ideaRow[0].status).toBe('accepted')
    const evalRows = testDb.select().from(ideaEvaluations).where(eq(ideaEvaluations.ideaId, ideaId)).all()
    expect(evalRows).toHaveLength(1)
    expect(evalRows[0].status).toBe('accepted')
    expect(evalRows[0].adminId).toBe(adminId)
  })

  it('rejects an under_review idea with required comment', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const ideaId  = seedIdea(adminId, { status: 'under_review' })
    mockAuth(adminId, 'admin')
    const { evaluateIdeaAction } = await import('@/actions/ideas')
    const result = await evaluateIdeaAction({ status: 'rejected', ideaId, comment: 'Not feasible at this time.' })
    expect(result.ok).toBe(true)
    const ideaRow = testDb.select({ status: ideas.status }).from(ideas).where(eq(ideas.id, ideaId)).all()
    expect(ideaRow[0].status).toBe('rejected')
    const evalRows = testDb.select().from(ideaEvaluations).where(eq(ideaEvaluations.ideaId, ideaId)).all()
    expect(evalRows[0].comment).toBe('Not feasible at this time.')
  })

  it('returns validation error when rejecting without comment', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const ideaId  = seedIdea(adminId, { status: 'under_review' })
    mockAuth(adminId, 'admin')
    const { evaluateIdeaAction } = await import('@/actions/ideas')
    const result = await evaluateIdeaAction({ status: 'rejected', ideaId, comment: '' })
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/rejection reason/i)
  })

  it('rejects invalid transition from submitted', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const ideaId  = seedIdea(adminId, { status: 'submitted' })
    mockAuth(adminId, 'admin')
    const { evaluateIdeaAction } = await import('@/actions/ideas')
    const result = await evaluateIdeaAction({ status: 'accepted', ideaId })
    expect(result.ok).toBe(false)
  })

  it('rejects if not admin', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId, { status: 'under_review' })
    mockAuth(userId, 'submitter')
    const { evaluateIdeaAction } = await import('@/actions/ideas')
    const result = await evaluateIdeaAction({ status: 'accepted', ideaId })
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/admin/i)
  })
})
