import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { and, eq, ne } from 'drizzle-orm'
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
      title: 'Attribution Idea',
      description: 'Attribution test description.',
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

describe('decision event attribution completeness', () => {
  it('records actor, timestamp, and mandatory comment for non-submission decisions', async () => {
    const submitterId = await seedUser('submitter', 'Submitter')
    const adminId = await seedUser('admin', 'Admin')
    const ideaId = seedIdea(submitterId)

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'First pass.' })
    await decideIdeaStageAction({ ideaId, decision: 'reject', comment: 'Insufficient details.' })

    const decisionRows = testDb
      .select({
        decisionType: ideaDecisionEvents.decisionType,
        decidedByUserId: ideaDecisionEvents.decidedByUserId,
        decidedAt: ideaDecisionEvents.decidedAt,
        comment: ideaDecisionEvents.comment,
      })
      .from(ideaDecisionEvents)
      .where(
        and(
          eq(ideaDecisionEvents.ideaId, ideaId),
          ne(ideaDecisionEvents.decisionType, 'submitted'),
        ),
      )
      .all()

    expect(decisionRows.length).toBeGreaterThan(0)

    for (const row of decisionRows) {
      expect(row.decisionType).not.toBe('submitted')
      expect(row.decidedByUserId).not.toBeNull()
      expect(row.decidedAt).toBeGreaterThan(0)
      expect((row.comment ?? '').trim().length).toBeGreaterThan(0)
    }
  })
})
