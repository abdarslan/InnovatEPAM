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
  stage: 'stage_1_triage' | 'stage_2_department_review' | 'stage_3_feasibility' | 'stage_4_final_executive_decision'
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
  it('enforces anonymization for admin list rows across all stages', async () => {
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

    expect(stage1Row?.submitterName).toBe('Anonymous')
    expect(stage2Row?.submitterName).toBe('Anonymous')
  })

  it('anonymizes all staged ideas for admins on the generic ideas feed', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Feed', 'submitter-feed')
    const adminId = await seedUser('admin', 'Feed Admin', 'admin-feed')

    seedIdea({ submitterId, title: 'Feed Stage 1', stage: 'stage_1_triage' })
    seedIdea({ submitterId, title: 'Feed Stage 2', stage: 'stage_2_department_review' })

    mockAuth(adminId, 'admin')
    const { getIdeasAction } = await import('@/actions/ideas')

    const result = await getIdeasAction()
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const stage1 = result.data.find((row) => row.title === 'Feed Stage 1')
    const stage2 = result.data.find((row) => row.title === 'Feed Stage 2')

    expect(stage1?.submitterName).toBe('Anonymous')
    expect(stage2?.submitterName).toBe('Anonymous')
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

  it('requires stage 3 feasibility rating before advancing to stage 4', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Four', 'submitter4')
    const adminId = await seedUser('admin', 'Feasibility Admin', 'admin4')
    const ideaId = seedIdea({ submitterId, title: 'Stage 3 Rating Required', stage: 'stage_3_feasibility' })

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    const result = await decideIdeaStageAction({
      ideaId,
      decision: 'approve_next',
      comment: 'Advancing without feasibility rating should fail',
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('RATING_REQUIRED')
  })

  it('associates stage 3 timeline event with feasibility rating metadata', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Five', 'submitter5')
    const adminId = await seedUser('admin', 'Stage3 Admin', 'admin5')
    const ideaId = seedIdea({ submitterId, title: 'Stage 3 Timeline Rating', stage: 'stage_3_feasibility' })

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction, getIdeaTimelineAction } = await import('@/actions/ideas')

    const decisionResult = await decideIdeaStageAction({
      ideaId,
      decision: 'approve_next',
      comment: 'Ready for final executive decision',
      ratingScore: 4,
    })
    expect(decisionResult.ok).toBe(true)

    const timelineResult = await getIdeaTimelineAction({ ideaId })
    expect(timelineResult.ok).toBe(true)
    if (!timelineResult.ok) return

    const stage3Entry = timelineResult.data.find((entry) => entry.stage === 'stage_3_feasibility')
    expect(stage3Entry?.ratingLabel).toBe('Feasibility')
    expect(stage3Entry?.ratingScore).toBe(4)
  })

  it('requires stage 4 impact rating before final decision', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Six', 'submitter6')
    const adminId = await seedUser('admin', 'Final Stage Admin', 'admin6')
    const ideaId = seedIdea({ submitterId, title: 'Stage 4 Rating Required', stage: 'stage_4_final_executive_decision' })

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction } = await import('@/actions/ideas')

    const result = await decideIdeaStageAction({
      ideaId,
      decision: 'final_approve',
      comment: 'Final decision without impact score should fail',
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('RATING_REQUIRED')
  })

  it('keeps approved and rejected ideas anonymous after finalization for admins', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Seven', 'submitter7')
    const adminId = await seedUser('admin', 'Finalizer Admin', 'admin7')

    const approvedIdeaId = seedIdea({
      submitterId,
      title: 'Approved Finalized Idea',
      stage: 'stage_4_final_executive_decision',
    })
    const rejectedIdeaId = seedIdea({
      submitterId,
      title: 'Rejected Finalized Idea',
      stage: 'stage_4_final_executive_decision',
    })

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction, getAdminIdeasAction } = await import('@/actions/ideas')

    const approved = await decideIdeaStageAction({
      ideaId: approvedIdeaId,
      decision: 'final_approve',
      comment: 'Approve with high impact.',
      ratingScore: 5,
    })
    expect(approved.ok).toBe(true)

    const rejected = await decideIdeaStageAction({
      ideaId: rejectedIdeaId,
      decision: 'final_reject',
      comment: 'Reject with low impact.',
      ratingScore: 1,
    })
    expect(rejected.ok).toBe(true)

    const listResult = await getAdminIdeasAction()
    expect(listResult.ok).toBe(true)
    if (!listResult.ok) return

    const approvedRow = listResult.data.find((row) => row.id === approvedIdeaId)
    const rejectedRow = listResult.data.find((row) => row.id === rejectedIdeaId)

    expect(approvedRow?.submitterName).toBe('Anonymous')
    expect(rejectedRow?.submitterName).toBe('Anonymous')
  })

  it('returns completed idea scores in list and detail projections', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Eight', 'submitter8')
    const adminId = await seedUser('admin', 'Projection Admin', 'admin8')
    const ideaId = seedIdea({ submitterId, title: 'Completed Score Projection', stage: 'stage_4_final_executive_decision' })

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction, getIdeasAction, getIdeaDetailAction } = await import('@/actions/ideas')

    const finalize = await decideIdeaStageAction({
      ideaId,
      decision: 'final_approve',
      comment: 'Completing with impact score.',
      ratingScore: 4,
    })
    expect(finalize.ok).toBe(true)

    const listResult = await getIdeasAction()
    expect(listResult.ok).toBe(true)
    if (!listResult.ok) return
    const listIdea = listResult.data.find((row) => row.id === ideaId)
    expect(listIdea?.impactRating).toBe(4)

    const detailResult = await getIdeaDetailAction(ideaId)
    expect(detailResult.ok).toBe(true)
    if (!detailResult.ok) return
    expect(detailResult.data.impactRating).toBe(4)
  })

  it('formats stage-specific timeline rating labels for stage 2/3/4 approvals', async () => {
    const submitterId = await seedUser('submitter', 'Submitter Nine', 'submitter9')
    const adminId = await seedUser('admin', 'Timeline Labels Admin', 'admin9')
    const ideaId = seedIdea({ submitterId, title: 'Timeline Label Flow', stage: 'stage_1_triage' })

    mockAuth(adminId, 'admin')
    const { decideIdeaStageAction, getIdeaTimelineAction } = await import('@/actions/ideas')

    await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'Stage 1 to 2' })
    await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'Stage 2 to 3', ratingScore: 3 })
    await decideIdeaStageAction({ ideaId, decision: 'approve_next', comment: 'Stage 3 to 4', ratingScore: 4 })
    await decideIdeaStageAction({ ideaId, decision: 'final_approve', comment: 'Finalize', ratingScore: 5 })

    const timelineResult = await getIdeaTimelineAction({ ideaId })
    expect(timelineResult.ok).toBe(true)
    if (!timelineResult.ok) return

    const labels = timelineResult.data
      .map((entry) => entry.ratingLabel)
      .filter((value): value is NonNullable<typeof value> => value !== undefined)

    expect(labels).toEqual(['Alignment', 'Feasibility', 'Impact'])
  })
})
