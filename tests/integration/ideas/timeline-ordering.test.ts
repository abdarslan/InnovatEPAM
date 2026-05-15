import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
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
      title: 'Timeline Ordering Idea',
      description: 'Ordering test description.',
      category: 'process_improvement',
      submitterId,
      status: 'under_review',
      currentStage: 'stage_3_feasibility',
      currentOutcome: 'in_progress',
      isTerminal: false,
      reviewerId: null,
      reviewStartedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: ideas.id })
    .all()

  return result[0].id
}

function seedOutOfOrderTimestamps(ideaId: number, submitterId: number, adminId: number) {
  const now = Date.now()

  testDb.insert(ideaDecisionEvents).values([
    {
      ideaId,
      stage: 'stage_2_department_review',
      decisionType: 'approve_next',
      outcome: 'approved_to_next_stage',
      comment: 'Second approval.',
      decidedByUserId: adminId,
      decidedAt: now + 300,
      sequence: 3,
    },
    {
      ideaId,
      stage: 'stage_1_triage',
      decisionType: 'submitted',
      outcome: 'in_progress',
      comment: null,
      decidedByUserId: submitterId,
      decidedAt: now + 500,
      sequence: 1,
    },
    {
      ideaId,
      stage: 'stage_1_triage',
      decisionType: 'approve_next',
      outcome: 'approved_to_next_stage',
      comment: 'First approval.',
      decidedByUserId: adminId,
      decidedAt: now + 400,
      sequence: 2,
    },
  ]).run()
}

function mockAuth(userId: number, role: 'submitter' | 'admin') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'Viewer' }),
  }))
}

describe('getIdeaTimelineAction ordering', () => {
  it('returns timeline ordered by sequence with submission first', async () => {
    const submitterId = await seedUser('submitter', 'Submitter User')
    const adminId = await seedUser('admin', 'Admin User')
    const ideaId = seedIdea(submitterId)

    seedOutOfOrderTimestamps(ideaId, submitterId, adminId)

    mockAuth(submitterId, 'submitter')
    const { getIdeaTimelineAction } = await import('@/actions/ideas')

    const result = await getIdeaTimelineAction({ ideaId })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data.map((entry) => entry.sequence)).toEqual([1, 2, 3])
    expect(result.data.map((entry) => entry.decisionType)).toEqual(['submitted', 'approve_next', 'approve_next'])
    expect(result.data[0].stage).toBe('stage_1_triage')
    expect(result.data[0].outcome).toBe('in_progress')
    expect(result.data[0].decisionType).toBe('submitted')
  })
})
