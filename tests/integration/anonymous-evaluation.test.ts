import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

async function seedUser(role: 'submitter' | 'admin', displayName: string, emailPrefix: string) {
  const passwordHash = await hashPassword('Password1!')
  const createdAt = Date.now()

  const row = testDb
    .insert(users)
    .values({
      email: `${emailPrefix}-${Date.now()}@example.com`,
      displayName,
      passwordHash,
      role,
      status: 'active',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt,
    })
    .returning({ id: users.id })
    .all()[0]

  return row.id
}

function seedIdea(input: {
  submitterId: number
  title: string
  stage: 'stage_1_triage' | 'stage_2_department_review'
  outcome?: 'in_progress' | 'approved_to_next_stage'
}) {
  const now = Date.now()
  return testDb
    .insert(ideas)
    .values({
      title: input.title,
      description: `${input.title} description`,
      category: 'technology_innovation',
      submitterId: input.submitterId,
      status: 'under_review',
      currentStage: input.stage,
      currentOutcome: input.outcome ?? 'in_progress',
      isTerminal: false,
      reviewerId: null,
      reviewStartedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: ideas.id })
    .all()[0].id
}

function mockAuth(userId: number, role: 'submitter' | 'admin') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'Mock' }),
  }))
}

describe('anonymous evaluation integration', () => {
  it('enforces anonymization for stage 2+ admin list rows while keeping stage 1 visible', async () => {
    const submitterId = await seedUser('submitter', 'Submitter One', 'submitter')
    const adminId = await seedUser('admin', 'Admin One', 'admin')

    seedIdea({ submitterId, title: 'Stage 1 Idea', stage: 'stage_1_triage' })
    seedIdea({ submitterId, title: 'Stage 2 Idea', stage: 'stage_2_department_review' })

    mockAuth(adminId, 'admin')
    const { getAdminIdeasAction } = await import('@/actions/ideas')

    const result = await getAdminIdeasAction()
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const stage1Row = result.data.find((row) => row.title === 'Stage 1 Idea')
    const stage2Row = result.data.find((row) => row.title === 'Stage 2 Idea')

    expect(stage1Row?.submitterName).toBe('Submitter One')
    expect(stage2Row?.submitterName).toBe('Anonymous')
  })

  it('keeps evaluator attribution visible in timeline entries for admins', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Two', 'submitter2')
    const adminId = await seedUser('admin', 'Timeline Admin', 'admin2')
    const ideaId = seedIdea({ submitterId, title: 'Timeline Idea', stage: 'stage_2_department_review' })

    const now = Date.now()
    testDb.insert(ideaDecisionEvents).values({
      ideaId,
      stage: 'stage_1_triage',
      decisionType: 'submitted',
      outcome: 'in_progress',
      comment: null,
      ratingId: null,
      decidedByUserId: submitterId,
      decidedAt: now - 1000,
      sequence: 1,
    }).run()

    testDb.insert(ideaDecisionEvents).values({
      ideaId,
      stage: 'stage_2_department_review',
      decisionType: 'approve_next',
      outcome: 'approved_to_next_stage',
      comment: 'Looks strong',
      ratingId: null,
      decidedByUserId: adminId,
      decidedAt: now,
      sequence: 2,
    }).run()

    mockAuth(adminId, 'admin')
    const { getIdeaTimelineAction } = await import('@/actions/ideas')

    const result = await getIdeaTimelineAction({ ideaId })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const stage2Entry = result.data.find((entry) => entry.sequence === 2)
    expect(stage2Entry?.decidedByUser).toBe('Timeline Admin')
  })

  it('requires stage 2 alignment rating before advancing to stage 3', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Three', 'submitter3')
    const adminId = await seedUser('admin', 'Rating Admin', 'admin3')
    const ideaId = seedIdea({ submitterId, title: 'Stage 2 Rating Required', stage: 'stage_2_department_review' })

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    const result = await decideIdeaStageAction({
      ideaId,
      decision: 'approve_next',
      comment: 'Advancing without rating should fail',
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('RATING_REQUIRED')
  })
})
