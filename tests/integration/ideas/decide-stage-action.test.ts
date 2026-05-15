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
      title: 'Test Stage Pipeline Idea',
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

describe('decideIdeaStageAction valid transitions', () => {
  it('progresses linearly from stage 1 to stage 4 final approved', async () => {
    const submitterId = await seedUser('submitter')
    const adminId = await seedUser('admin')
    const ideaId = seedIdea(submitterId)

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    const r1 = await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'Triage passed.' })
    expect(r1.ok).toBe(true)

    const r2 = await decideIdeaStageAction({
      ideaId,
      decision: 'approve_next',
      comment: 'Department approved.',
      ratingScore: 4,
    })
    expect(r2.ok).toBe(true)

    const r3 = await decideIdeaStageAction({
      ideaId,
      decision: 'approve_next',
      comment: 'Feasibility approved.',
      ratingScore: 3,
    })
    expect(r3.ok).toBe(true)

    const r4 = await decideIdeaStageAction({
      ideaId,
      decision: 'final_approve',
      comment: 'Executive approval granted.',
      ratingScore: 5,
    })
    expect(r4.ok).toBe(true)

    const ideaRow = testDb
      .select({ currentStage: ideas.currentStage, currentOutcome: ideas.currentOutcome, isTerminal: ideas.isTerminal, status: ideas.status })
      .from(ideas)
      .where(eq(ideas.id, ideaId))
      .all()[0]

    expect(ideaRow.currentStage).toBe('stage_4_final_executive_decision')
    expect(ideaRow.currentOutcome).toBe('final_approved')
    expect(ideaRow.isTerminal).toBe(true)
    expect(ideaRow.status).toBe('accepted')

    const events = testDb
      .select({ sequence: ideaDecisionEvents.sequence, decisionType: ideaDecisionEvents.decisionType })
      .from(ideaDecisionEvents)
      .where(eq(ideaDecisionEvents.ideaId, ideaId))
      .all()

    expect(events).toHaveLength(5)
    expect(events.map((e) => e.sequence)).toEqual([1, 2, 3, 4, 5])
    expect(events.map((e) => e.decisionType)).toEqual([
      'submitted',
      'approve_next',
      'approve_next',
      'approve_next',
      'final_approve',
    ])
  })

  it('allows rejection at an intermediate stage and terminates the idea', async () => {
    const submitterId = await seedUser('submitter')
    const adminId = await seedUser('admin')
    const ideaId = seedIdea(submitterId)

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    const toStage2 = await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'Move to dept review.' })
    expect(toStage2.ok).toBe(true)

    const reject = await decideIdeaStageAction({ ideaId, decision: 'reject', comment: 'Rejected at stage 2.' })
    expect(reject.ok).toBe(true)

    const ideaRow = testDb
      .select({ currentStage: ideas.currentStage, currentOutcome: ideas.currentOutcome, isTerminal: ideas.isTerminal, status: ideas.status })
      .from(ideas)
      .where(eq(ideas.id, ideaId))
      .all()[0]

    expect(ideaRow.currentStage).toBe('stage_2_department_review')
    expect(ideaRow.currentOutcome).toBe('rejected')
    expect(ideaRow.isTerminal).toBe(true)
    expect(ideaRow.status).toBe('rejected')
  })
})
