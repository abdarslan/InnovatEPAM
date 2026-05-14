import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { and, eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/password'
import { ideaCategoryFieldRules, ideaFieldValues, ideas, users } from '@/lib/db/schema'

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
      email: `${role}-${now}@example.com`,
      displayName: role === 'admin' ? 'Admin User' : 'Submitter User',
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

function makeFormData(fields: Record<string, string | File>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value)
  }
  return formData
}

function mockDeps(userId: number) {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({
      userId,
      role: 'submitter',
      email: 'submitter@example.com',
      displayName: 'Submitter User',
    }),
  }))
}

async function seedEventPlanRules(adminId: number) {
  const now = Date.now()
  testDb
    .insert(ideaCategoryFieldRules)
    .values([
      {
        category: 'event_plan',
        fieldKey: 'planned_date',
        label: 'Planned Date',
        fieldType: 'date',
        required: false,
        minValue: null,
        maxValue: null,
        minLength: null,
        maxLength: null,
        helpText: null,
        sortOrder: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        updatedByAdminId: adminId,
      },
      {
        category: 'event_plan',
        fieldKey: 'planned_attendees',
        label: 'Planned Number of Attendees',
        fieldType: 'number',
        required: false,
        minValue: 1,
        maxValue: null,
        minLength: null,
        maxLength: null,
        helpText: null,
        sortOrder: 2,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        updatedByAdminId: adminId,
      },
    ])
    .run()
}

describe('submit dynamic fields', () => {
  it('persists applicable dynamic values for event_plan', async () => {
    const adminId = await seedUser('admin')
    await seedEventPlanRules(adminId)

    const submitterId = await seedUser('submitter')
    mockDeps(submitterId)

    const { submitIdeaAction } = await import('@/actions/ideas')
    const formData = makeFormData({
      title: 'Event Idea',
      description: 'This is a sufficiently descriptive event plan idea.',
      category: 'event_plan',
      dynamic_planned_date: '2026-11-20',
      dynamic_planned_attendees: '50',
    })

    const result = await submitIdeaAction(formData)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const insertedIdea = testDb
      .select({ id: ideas.id })
      .from(ideas)
      .where(eq(ideas.id, result.data.id))
      .all()
    expect(insertedIdea).toHaveLength(1)

    const insertedFields = testDb
      .select({ fieldKey: ideaFieldValues.fieldKey, value: ideaFieldValues.value })
      .from(ideaFieldValues)
      .where(eq(ideaFieldValues.ideaId, result.data.id))
      .all()

    expect(insertedFields).toEqual([
      { fieldKey: 'planned_date', value: '2026-11-20' },
      { fieldKey: 'planned_attendees', value: '50' },
    ])
  })

  it('rejects stale dynamic fields that do not belong to selected category', async () => {
    const adminId = await seedUser('admin')
    await seedEventPlanRules(adminId)

    const submitterId = await seedUser('submitter')
    mockDeps(submitterId)

    const { submitIdeaAction } = await import('@/actions/ideas')
    const formData = makeFormData({
      title: 'Process Idea',
      description: 'This is a sufficiently descriptive process improvement idea.',
      category: 'process_improvement',
      dynamic_planned_attendees: '20',
    })

    const result = await submitIdeaAction(formData)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/not valid for the selected category/i)

    const dynamicRows = testDb
      .select({ id: ideaFieldValues.id })
      .from(ideaFieldValues)
      .where(
        and(
          eq(ideaFieldValues.fieldKey, 'planned_attendees'),
        ),
      )
      .all()
    expect(dynamicRows).toHaveLength(0)
  })

  it('returns dynamic fields in idea detail payload', async () => {
    const adminId = await seedUser('admin')
    await seedEventPlanRules(adminId)

    const submitterId = await seedUser('submitter')
    mockDeps(submitterId)

    const { submitIdeaAction, getIdeaDetailAction } = await import('@/actions/ideas')
    const formData = makeFormData({
      title: 'Event Idea With Detail',
      description: 'This event idea should expose dynamic fields in detail payload.',
      category: 'event_plan',
      dynamic_planned_date: '2026-12-05',
      dynamic_planned_attendees: '120',
    })

    const submitResult = await submitIdeaAction(formData)
    expect(submitResult.ok).toBe(true)
    if (!submitResult.ok) return

    const detailResult = await getIdeaDetailAction(submitResult.data.id)
    expect(detailResult.ok).toBe(true)
    if (!detailResult.ok) return

    expect(detailResult.data.dynamicFields).toEqual([
      { fieldKey: 'planned_date', value: '2026-12-05' },
      { fieldKey: 'planned_attendees', value: '120' },
    ])
  })
})

describe('event_plan optionality regression', () => {
  it('accepts event_plan submission with all dynamic fields omitted', async () => {
    const adminId = await seedUser('admin')
    await seedEventPlanRules(adminId)

    const submitterId = await seedUser('submitter')
    mockDeps(submitterId)

    const { submitIdeaAction } = await import('@/actions/ideas')
    const formData = makeFormData({
      title: 'Minimal Event Plan',
      description: 'An event plan with no optional dynamic fields provided.',
      category: 'event_plan',
    })

    const result = await submitIdeaAction(formData)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const fields = testDb
      .select({ id: ideaFieldValues.id })
      .from(ideaFieldValues)
      .where(eq(ideaFieldValues.ideaId, result.data.id))
      .all()

    expect(fields).toHaveLength(0)
  })

  it('accepts event_plan submission with only one of the optional fields provided', async () => {
    const adminId = await seedUser('admin')
    await seedEventPlanRules(adminId)

    const submitterId = await seedUser('submitter')
    mockDeps(submitterId)

    const { submitIdeaAction } = await import('@/actions/ideas')
    const formData = makeFormData({
      title: 'Partial Event Plan',
      description: 'An event plan that only sets the attendee count.',
      category: 'event_plan',
      dynamic_planned_attendees: '75',
    })

    const result = await submitIdeaAction(formData)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const fields = testDb
      .select({ fieldKey: ideaFieldValues.fieldKey, value: ideaFieldValues.value })
      .from(ideaFieldValues)
      .where(eq(ideaFieldValues.ideaId, result.data.id))
      .all()

    expect(fields).toEqual([{ fieldKey: 'planned_attendees', value: '75' }])
  })

  it('rejects event_plan if number field violates minValue constraint', async () => {
    const adminId = await seedUser('admin')
    await seedEventPlanRules(adminId)

    const submitterId = await seedUser('submitter')
    mockDeps(submitterId)

    const { submitIdeaAction } = await import('@/actions/ideas')
    const formData = makeFormData({
      title: 'Invalid Attendee Count',
      description: 'An event plan with attendee count below minimum allowed value.',
      category: 'event_plan',
      dynamic_planned_attendees: '0',
    })

    const result = await submitIdeaAction(formData)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/at least 1/i)
  })
})
