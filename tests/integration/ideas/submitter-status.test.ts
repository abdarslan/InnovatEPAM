import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
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

function seedEvaluation(ideaId: number, adminId: number, status: 'accepted' | 'rejected', comment?: string) {
  testDb.insert(ideaEvaluations).values({
    ideaId,
    adminId,
    status,
    comment: comment ?? null,
    createdAt: Date.now(),
  }).run()
}

function mockAuth(userId: number, role: 'submitter' | 'admin' = 'submitter') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'Test User' }),
  }))
}

describe('submitter status visibility', () => {
  it('getIdeasAction includes status field', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId, { status: 'under_review' })
    mockAuth(userId)
    const { getIdeasAction } = await import('@/actions/ideas')
    const result = await getIdeasAction()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const idea = result.data.find((i) => i.id === ideaId)
    expect(idea?.status).toBe('under_review')
  })

  it('getIdeaDetailAction returns evaluation for submitter when evaluated', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const userId  = await seedUser()
    const ideaId  = seedIdea(userId, { status: 'accepted' })
    seedEvaluation(ideaId, adminId, 'accepted', 'Great idea!')
    mockAuth(userId, 'submitter')
    const { getIdeaDetailAction } = await import('@/actions/ideas')
    const result = await getIdeaDetailAction(ideaId)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe('accepted')
    expect(result.data.evaluation).not.toBeNull()
    expect(result.data.evaluation?.status).toBe('accepted')
    expect(result.data.evaluation?.comment).toBe('Great idea!')
  })

  it('getIdeaDetailAction returns null evaluation when not evaluated', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId)
    mockAuth(userId)
    const { getIdeaDetailAction } = await import('@/actions/ideas')
    const result = await getIdeaDetailAction(ideaId)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.evaluation).toBeNull()
  })
})
