import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { ideaDecisionEvents, ideas, users } from '@/lib/db/schema'
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

async function seedUser(role: 'submitter' | 'admin') {
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email: `user${Date.now()}@example.com`,
      displayName: role === 'admin' ? 'Admin User' : 'Submitter User',
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
      title: 'Test Invalid Stage Idea',
      description: 'Detailed description for workflow testing.',
      category: 'technology_innovation',
      submitterId,
      status: 'submitted',
      currentStage: 'stage_1_triage',
      currentOutcome: 'in_progress',
      isTerminal: false,
      reviewerId: null,
      reviewStartedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: ideas.id })
    .all()

  testDb
    .insert(ideaDecisionEvents)
    .values({
      ideaId: result[0].id,
      stage: 'stage_1_triage',
      decisionType: 'submitted',
      outcome: 'in_progress',
      comment: null,
      decidedByUserId: submitterId,
      decidedAt: now,
      sequence: 1,
    })
    .run()

  return result[0].id
}

function mockAuth(userId: number, role: 'submitter' | 'admin') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'Test User' }),
  }))
}

describe('decideIdeaStageAction invalid transitions and guards', () => {
  it('rejects final decision before stage 4', async () => {
    const submitterId = await seedUser('submitter')
    const adminId = await seedUser('admin')
    const ideaId = seedIdea(submitterId)

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    const result = await decideIdeaStageAction({ ideaId, decision: 'final_approve', comment: 'Too early.' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('INVALID_TRANSITION')
  })

  it('rejects non-admin attempts', async () => {
    const submitterId = await seedUser('submitter')
    const ideaId = seedIdea(submitterId)

    mockAuth(submitterId, 'submitter')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    const result = await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'Attempt.' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('FORBIDDEN')
  })

  it('rejects additional decisions after terminal outcome', async () => {
    const submitterId = await seedUser('submitter')
    const adminId = await seedUser('admin')
    const ideaId = seedIdea(submitterId)

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    const rejected = await decideIdeaStageAction({ ideaId, decision: 'reject', comment: 'Terminal reject.' })
    expect(rejected.ok).toBe(true)

    const secondDecision = await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'Should fail.' })
    expect(secondDecision.ok).toBe(false)
    if (secondDecision.ok) return
    expect(secondDecision.error).toBe('INVALID_TRANSITION')

    const row = testDb
      .select({ currentStage: ideas.currentStage, currentOutcome: ideas.currentOutcome, isTerminal: ideas.isTerminal })
      .from(ideas)
      .where(eq(ideas.id, ideaId))
      .all()[0]

    expect(row.currentOutcome).toBe('rejected')
    expect(row.isTerminal).toBe(true)
  })

  it('rejects invalid decision type for stage 4 (approve_next)', async () => {
    const submitterId = await seedUser('submitter')
    const adminId = await seedUser('admin')
    const ideaId = seedIdea(submitterId)

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'to stage 2' })
    await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'to stage 3', ratingScore: 4 })
    await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'to stage 4', ratingScore: 3 })

    const result = await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'invalid at final stage' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('INVALID_TRANSITION')
  })
})
