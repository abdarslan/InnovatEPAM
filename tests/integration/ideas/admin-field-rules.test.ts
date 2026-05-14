import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/password'
import { ideaCategoryFieldRules, users } from '@/lib/db/schema'

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

function mockAuth(userId: number, role: 'submitter' | 'admin') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: `${role}@example.com`, displayName: role }),
  }))
}

async function seedEventPlanRule(adminId: number) {
  const now = Date.now()
  const inserted = testDb
    .insert(ideaCategoryFieldRules)
    .values({
      category: 'event_plan',
      fieldKey: 'planned_date',
      label: 'Planned Date',
      fieldType: 'date',
      required: false,
      minValue: null,
      maxValue: null,
      minLength: null,
      maxLength: null,
      helpText: 'Optional event date',
      sortOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      updatedByAdminId: adminId,
    })
    .returning({ id: ideaCategoryFieldRules.id })
    .all()

  return inserted[0].id
}

describe('admin field rules - setup helpers', () => {
  it('blocks non-admin users from list/upsert/delete actions', async () => {
    const submitterId = await seedUser('submitter')
    mockAuth(submitterId, 'submitter')

    const actions = await import('@/actions/idea-field-rules')

    const listResult = await actions.getAdminCategoryFieldRulesAction()
    expect(listResult.ok).toBe(false)
    if (!listResult.ok) expect(listResult.error).toBe('FORBIDDEN')

    const upsertResult = await actions.upsertCategoryFieldRuleAction({
      category: 'event_plan',
      fieldKey: 'venue_name',
      label: 'Venue Name',
      fieldType: 'text',
      required: true,
      sortOrder: 3,
      isActive: true,
    })
    expect(upsertResult.ok).toBe(false)
    if (!upsertResult.ok) expect(upsertResult.error).toBe('FORBIDDEN')

    const deleteResult = await actions.deleteCategoryFieldRuleAction(1)
    expect(deleteResult.ok).toBe(false)
    if (!deleteResult.ok) expect(deleteResult.error).toBe('FORBIDDEN')
  })

  it('allows admin to create, update, list, and disable category field rules', async () => {
    const adminId = await seedUser('admin')
    mockAuth(adminId, 'admin')

    const actions = await import('@/actions/idea-field-rules')

    const createResult = await actions.upsertCategoryFieldRuleAction({
      category: 'event_plan',
      fieldKey: 'venue_name',
      label: 'Venue Name',
      fieldType: 'text',
      required: true,
      minLength: 3,
      maxLength: 120,
      helpText: 'Required event venue name.',
      sortOrder: 3,
      isActive: true,
    })
    expect(createResult.ok).toBe(true)
    if (!createResult.ok) return

    const createdId = createResult.data.id

    const updateResult = await actions.upsertCategoryFieldRuleAction({
      id: createdId,
      category: 'event_plan',
      fieldKey: 'venue_name',
      label: 'Venue Name Updated',
      fieldType: 'text',
      required: false,
      minLength: 2,
      maxLength: 100,
      helpText: 'Optional event venue name.',
      sortOrder: 4,
      isActive: true,
    })
    expect(updateResult.ok).toBe(true)

    const listResult = await actions.getAdminCategoryFieldRulesAction()
    expect(listResult.ok).toBe(true)
    if (!listResult.ok) return

    const createdRule = listResult.data.find((rule) => rule.id === createdId)
    expect(createdRule).toBeDefined()
    expect(createdRule?.label).toBe('Venue Name Updated')
    expect(createdRule?.required).toBe(false)

    const disableResult = await actions.deleteCategoryFieldRuleAction(createdId)
    expect(disableResult.ok).toBe(true)

    const rows = testDb
      .select({ id: ideaCategoryFieldRules.id, isActive: ideaCategoryFieldRules.isActive })
      .from(ideaCategoryFieldRules)
      .where(eq(ideaCategoryFieldRules.id, createdId))
      .all()

    expect(rows).toHaveLength(1)
    expect(rows[0].isActive).toBe(false)
  })

  it('rejects duplicate field keys in same category for admins', async () => {
    const adminId = await seedUser('admin')
    mockAuth(adminId, 'admin')
    await seedEventPlanRule(adminId)

    const actions = await import('@/actions/idea-field-rules')
    const duplicateResult = await actions.upsertCategoryFieldRuleAction({
      category: 'event_plan',
      fieldKey: 'planned_date',
      label: 'Duplicate Planned Date',
      fieldType: 'date',
      required: false,
      sortOrder: 2,
      isActive: true,
    })

    expect(duplicateResult.ok).toBe(false)
    if (!duplicateResult.ok) {
      expect(duplicateResult.error).toMatch(/unique/i)
    }
  })
})

describe('admin authorization boundary regression', () => {
  it('non-admin cannot list rules', async () => {
    const submitterId = await seedUser('submitter')
    mockAuth(submitterId, 'submitter')
    const actions = await import('@/actions/idea-field-rules')
    const result = await actions.getAdminCategoryFieldRulesAction()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('FORBIDDEN')
  })

  it('non-admin cannot create a rule', async () => {
    const submitterId = await seedUser('submitter')
    mockAuth(submitterId, 'submitter')
    const actions = await import('@/actions/idea-field-rules')
    const result = await actions.upsertCategoryFieldRuleAction({
      category: 'event_plan',
      fieldKey: 'budget',
      label: 'Budget',
      fieldType: 'number',
      required: false,
      sortOrder: 10,
      isActive: true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('FORBIDDEN')

    const rows = testDb
      .select({ id: ideaCategoryFieldRules.id })
      .from(ideaCategoryFieldRules)
      .all()
    expect(rows).toHaveLength(0)
  })

  it('non-admin cannot disable a rule', async () => {
    const adminId = await seedUser('admin')
    const ruleId = await seedEventPlanRule(adminId)

    const submitterId = await seedUser('submitter')
    mockAuth(submitterId, 'submitter')

    const actions = await import('@/actions/idea-field-rules')
    const result = await actions.deleteCategoryFieldRuleAction(ruleId)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('FORBIDDEN')

    const row = testDb
      .select({ isActive: ideaCategoryFieldRules.isActive })
      .from(ideaCategoryFieldRules)
      .where(eq(ideaCategoryFieldRules.id, ruleId))
      .all()
    expect(row[0].isActive).toBe(true)
  })

  it('admin can list rules even when no rules exist', async () => {
    const adminId = await seedUser('admin')
    mockAuth(adminId, 'admin')
    const actions = await import('@/actions/idea-field-rules')
    const result = await actions.getAdminCategoryFieldRulesAction()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual([])
  })
})
