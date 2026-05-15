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
      title:              overrides.title ?? 'Test Idea',
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

function mockAuth(userId: number, role: 'submitter' | 'admin' = 'admin') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'admin@example.com', displayName: 'Admin' }),
  }))
}

describe('getAdminIdeasAction', () => {
  it('returns all ideas for admin', async () => {
    const adminId     = await seedUser({ role: 'admin' })
    const submitterId = await seedUser()
    seedIdea(submitterId, { title: 'Idea A' })
    seedIdea(submitterId, { title: 'Idea B', status: 'accepted' })
    mockAuth(adminId, 'admin')
    const { getAdminIdeasAction } = await import('@/actions/ideas')
    const result = await getAdminIdeasAction()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(2)
  })

  it('returns error for non-admin user', async () => {
    const userId = await seedUser()
    mockAuth(userId, 'submitter')
    const { getAdminIdeasAction } = await import('@/actions/ideas')
    const result = await getAdminIdeasAction()
    expect(result.ok).toBe(false)
  })

  it('includes evaluation data when idea is evaluated', async () => {
    const adminId     = await seedUser({ role: 'admin', displayName: 'Admin User' })
    const submitterId = await seedUser()
    const ideaId      = seedIdea(submitterId, { status: 'accepted' })
    seedEvaluation(ideaId, adminId, 'accepted')
    mockAuth(adminId, 'admin')
    const { getAdminIdeasAction } = await import('@/actions/ideas')
    const result = await getAdminIdeasAction()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const idea = result.data.find((i) => i.id === ideaId)
    expect(idea?.evaluation).not.toBeNull()
    expect(idea?.evaluation?.status).toBe('accepted')
  })

  it('filters by status when statusFilter is provided', async () => {
    const adminId     = await seedUser({ role: 'admin' })
    const submitterId = await seedUser()
    seedIdea(submitterId, { status: 'submitted' })
    seedIdea(submitterId, { status: 'accepted' })
    seedIdea(submitterId, { status: 'rejected' })
    mockAuth(adminId, 'admin')
    const { getAdminIdeasAction } = await import('@/actions/ideas')
    const result = await getAdminIdeasAction('submitted')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.every((i) => i.status === 'submitted')).toBe(true)
    expect(result.data).toHaveLength(1)
  })

  it('returns error for invalid status filter', async () => {
    const adminId = await seedUser({ role: 'admin' })
    mockAuth(adminId, 'admin')
    const { getAdminIdeasAction } = await import('@/actions/ideas')
    const result = await getAdminIdeasAction('invalid_status' as never)
    expect(result.ok).toBe(false)
  })
})
