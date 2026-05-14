import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { users, ideaDrafts, ideas } from '@/lib/db/schema'
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

async function seedUser(role: 'submitter' | 'admin' = 'submitter') {
  const passwordHash = await hashPassword('Password1!')
  const now = Date.now()
  const result = testDb
    .insert(users)
    .values({
      email: `user-${now}-${Math.random()}@example.com`,
      displayName: role === 'admin' ? 'Admin' : 'Submitter',
      passwordHash,
      role,
      status: 'active',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: now,
    })
    .returning({ id: users.id })
    .all()
  return result[0].id
}

function mockAuth(userId: number, role: 'submitter' | 'admin' = 'submitter') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({
      userId,
      role,
      email: 'user@example.com',
      displayName: 'Test User',
    }),
  }))
}

function makeFormData(fields: Record<string, string | File | File[]>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const v of value) formData.append(key, v)
    } else {
      formData.set(key, value)
    }
  }
  return formData
}

// ---------------------------------------------------------------------------
// T030: submitIdeaAction with draftId — atomic draft deletion on submit
// ---------------------------------------------------------------------------
describe('submitIdeaAction — draft conversion', () => {
  it('creates an idea and deletes the source draft atomically when draftId is valid', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)

    // First create a draft
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')
    const draftResult = await upsertIdeaDraftAction(
      makeFormData({ title: 'Draft Title', description: 'A draft description for later.' }),
    )
    expect(draftResult.ok).toBe(true)
    if (!draftResult.ok) return

    // Now submit the idea with the draftId
    vi.resetModules()
    mockAuth(submitterId)
    const { submitIdeaAction } = await import('@/actions/ideas')
    const submitResult = await submitIdeaAction(
      makeFormData({
        title: 'Final Title',
        description: 'A description that meets the minimum length requirement.',
        category: 'workplace_culture',
        draftId: String(draftResult.data.draftId),
      }),
    )
    expect(submitResult.ok).toBe(true)
    if (!submitResult.ok) return
    expect(submitResult.data.id).toBeGreaterThan(0)

    // Draft must be gone
    const remainingDrafts = testDb
      .select()
      .from(ideaDrafts)
      .where(eq(ideaDrafts.id, draftResult.data.draftId))
      .all()
    expect(remainingDrafts).toHaveLength(0)

    // Idea exists
    const createdIdea = testDb
      .select()
      .from(ideas)
      .where(eq(ideas.id, submitResult.data.id))
      .all()
    expect(createdIdea).toHaveLength(1)
    expect(createdIdea[0].title).toBe('Final Title')
  })

  it('creates an idea without deleting anything when no draftId is provided', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)

    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')
    const draftResult = await upsertIdeaDraftAction(makeFormData({ title: 'Unrelated draft' }))
    expect(draftResult.ok).toBe(true)
    if (!draftResult.ok) return

    vi.resetModules()
    mockAuth(submitterId)
    const { submitIdeaAction } = await import('@/actions/ideas')
    const submitResult = await submitIdeaAction(
      makeFormData({
        title: 'Direct Submit',
        description: 'Submitted directly without going through a draft.',
        category: 'process_improvement',
      }),
    )
    expect(submitResult.ok).toBe(true)

    // Unrelated draft is still there
    const remainingDrafts = testDb
      .select()
      .from(ideaDrafts)
      .where(eq(ideaDrafts.id, draftResult.data.draftId))
      .all()
    expect(remainingDrafts).toHaveLength(1)
  })

  it('rejects submission when draftId belongs to another user', async () => {
    const owner = await seedUser()
    const other = await seedUser()
    mockAuth(owner)

    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')
    const draftResult = await upsertIdeaDraftAction(makeFormData({ title: 'Protected Draft' }))
    expect(draftResult.ok).toBe(true)
    if (!draftResult.ok) return

    vi.resetModules()
    mockAuth(other)
    const { submitIdeaAction } = await import('@/actions/ideas')
    const submitResult = await submitIdeaAction(
      makeFormData({
        title: 'Stolen Submit',
        description: 'Trying to submit using another user draft id.',
        category: 'cost_reduction',
        draftId: String(draftResult.data.draftId),
      }),
    )
    expect(submitResult.ok).toBe(false)

    // Owner's draft must remain intact
    const remainingDrafts = testDb
      .select()
      .from(ideaDrafts)
      .where(eq(ideaDrafts.id, draftResult.data.draftId))
      .all()
    expect(remainingDrafts).toHaveLength(1)
  })

  it('fails the full submit when required fields are missing (full validation still applied)', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)

    const { submitIdeaAction } = await import('@/actions/ideas')
    const result = await submitIdeaAction(
      makeFormData({
        // title and description missing
        category: 'event_plan',
      }),
    )
    expect(result.ok).toBe(false)
  })
})

