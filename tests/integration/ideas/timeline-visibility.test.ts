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
      title: 'Timeline Visibility Idea',
      description: 'Visibility test description.',
      category: 'customer_experience',
      submitterId,
      status: 'under_review',
      currentStage: 'stage_2_department_review',
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

function seedEvents(ideaId: number, submitterId: number, adminId: number) {
  const now = Date.now()

  testDb.insert(ideaDecisionEvents).values([
    {
      ideaId,
      stage: 'stage_1_triage',
      decisionType: 'submitted',
      outcome: 'in_progress',
      comment: null,
      decidedByUserId: submitterId,
      decidedAt: now,
      sequence: 1,
    },
    {
      ideaId,
      stage: 'stage_1_triage',
      decisionType: 'approve_next',
      outcome: 'approved_to_next_stage',
      comment: 'Initial triage approved.',
      decidedByUserId: adminId,
      decidedAt: now + 1,
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

describe('getIdeaTimelineAction visibility projection', () => {
  it('shows comments and deciding user to submitter and admin, but hides comments for other viewers', async () => {
    const submitterId = await seedUser('submitter', 'Submitter User')
    const adminId = await seedUser('admin', 'Admin User')
    const otherViewerId = await seedUser('submitter', 'Other Viewer')

    const ideaId = seedIdea(submitterId)
    seedEvents(ideaId, submitterId, adminId)

    mockAuth(submitterId, 'submitter')
    const { getIdeaTimelineAction: asSubmitter } = await import('@/actions/ideas')
    const submitterResult = await asSubmitter({ ideaId })
    expect(submitterResult.ok).toBe(true)
    if (!submitterResult.ok) return
    expect(submitterResult.data[1].comment).toBe('Initial triage approved.')
    expect(submitterResult.data[1].decidedByUser).toBe('Admin User')

    vi.resetModules()
    mockAuth(adminId, 'admin')
    const { getIdeaTimelineAction: asAdmin } = await import('@/actions/ideas')
    const adminResult = await asAdmin({ ideaId })
    expect(adminResult.ok).toBe(true)
    if (!adminResult.ok) return
    expect(adminResult.data[1].comment).toBe('Initial triage approved.')
    expect(adminResult.data[1].decidedByUser).toBe('Admin User')

    vi.resetModules()
    mockAuth(otherViewerId, 'submitter')
    const { getIdeaTimelineAction: asOtherViewer } = await import('@/actions/ideas')
    const viewerResult = await asOtherViewer({ ideaId })
    expect(viewerResult.ok).toBe(true)
    if (!viewerResult.ok) return
    expect(viewerResult.data[1].comment).toBeUndefined()
    expect(viewerResult.data[1].decidedByUser).toBeUndefined()
  })
})
