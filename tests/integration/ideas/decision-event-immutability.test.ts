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

async function seedUser(role: 'submitter' | 'admin', displayName: string) {
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email: `${role}-${Date.now()}@example.com`,
      displayName,
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
      title: 'Immutability Idea',
      description: 'Immutability test description.',
      category: 'workplace_culture',
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

  testDb.insert(ideaDecisionEvents).values({
    ideaId: result[0].id,
    stage: 'stage_1_triage',
    decisionType: 'submitted',
    outcome: 'in_progress',
    comment: null,
    decidedByUserId: submitterId,
    decidedAt: now,
    sequence: 1,
  }).run()

  return result[0].id
}

function mockAuth(userId: number, role: 'submitter' | 'admin') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'User' }),
  }))
}

describe('decision events immutability', () => {
  it('keeps previously written decision events unchanged as new events are appended', async () => {
    const submitterId = await seedUser('submitter', 'Submitter')
    const adminId = await seedUser('admin', 'Admin')
    const ideaId = seedIdea(submitterId)

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'Approved from stage 1.' })

    const firstDecision = testDb
      .select()
      .from(ideaDecisionEvents)
      .where(eq(ideaDecisionEvents.sequence, 2))
      .all()[0]

    await decideIdeaStageAction({
      ideaId,
      decision: 'approve_next',
      comment: 'Approved from stage 2.',
      ratingScore: 4,
    })

    const sameDecision = testDb
      .select()
      .from(ideaDecisionEvents)
      .where(eq(ideaDecisionEvents.sequence, 2))
      .all()[0]

    expect(sameDecision.id).toBe(firstDecision.id)
    expect(sameDecision.comment).toBe(firstDecision.comment)
    expect(sameDecision.decisionType).toBe(firstDecision.decisionType)
    expect(sameDecision.decidedByUserId).toBe(firstDecision.decidedByUserId)

    const allEvents = testDb
      .select({ sequence: ideaDecisionEvents.sequence })
      .from(ideaDecisionEvents)
      .where(eq(ideaDecisionEvents.ideaId, ideaId))
      .all()

    expect(allEvents.map((e) => e.sequence)).toEqual([1, 2, 3])
  })

  it('blocks explicit update/delete paths for decision events', async () => {
    const submitterId = await seedUser('submitter', 'Submitter')
    const adminId = await seedUser('admin', 'Admin')
    seedIdea(submitterId)

    mockAuth(adminId, 'admin')
    const { updateIdeaDecisionEventAction, deleteIdeaDecisionEventAction } = await import('@/actions/ideas')

    const updateResult = await updateIdeaDecisionEventAction()
    const deleteResult = await deleteIdeaDecisionEventAction()

    expect(updateResult.ok).toBe(false)
    expect(deleteResult.ok).toBe(false)
    if (updateResult.ok || deleteResult.ok) return
    expect(updateResult.error).toBe('FORBIDDEN_APPEND_ONLY')
    expect(deleteResult.error).toBe('FORBIDDEN_APPEND_ONLY')
  })
})
