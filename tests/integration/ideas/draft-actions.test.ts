import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { users, ideaDrafts, ideaDraftAttachments, ideaDraftFieldValues } from '@/lib/db/schema'
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

async function seedUser(
  role: 'submitter' | 'admin' = 'submitter',
  displayName = 'Test User',
) {
  const passwordHash = await hashPassword('Password1!')
  const now = Date.now()
  const result = testDb
    .insert(users)
    .values({
      email: `user-${now}-${Math.random()}@example.com`,
      displayName,
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
// T014: upsertIdeaDraftAction — create/update persistence and owner enforcement
// ---------------------------------------------------------------------------
describe('upsertIdeaDraftAction', () => {
  it('creates a new draft when no draftId is provided and returns a draftId', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')
    const result = await upsertIdeaDraftAction(makeFormData({ title: 'My Draft' }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.draftId).toBeGreaterThan(0)
    const draft = testDb.select().from(ideaDrafts).where(eq(ideaDrafts.id, result.data.draftId)).all()[0]
    expect(draft.title).toBe('My Draft')
    expect(draft.submitterId).toBe(submitterId)
  })

  it('creates a draft with all fields empty (no required constraint)', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')
    const result = await upsertIdeaDraftAction(makeFormData({}))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const draft = testDb.select().from(ideaDrafts).where(eq(ideaDrafts.id, result.data.draftId)).all()[0]
    expect(draft.title).toBeNull()
    expect(draft.category).toBeNull()
  })

  it('updates an existing draft when draftId matches the owner', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')

    const create = await upsertIdeaDraftAction(makeFormData({ title: 'Original' }))
    expect(create.ok).toBe(true)
    if (!create.ok) return

    const update = await upsertIdeaDraftAction(
      makeFormData({ draftId: String(create.data.draftId), title: 'Updated Title', category: 'cost_reduction' }),
    )
    expect(update.ok).toBe(true)
    if (!update.ok) return
    expect(update.data.draftId).toBe(create.data.draftId)

    const draft = testDb.select().from(ideaDrafts).where(eq(ideaDrafts.id, create.data.draftId)).all()[0]
    expect(draft.title).toBe('Updated Title')
    expect(draft.category).toBe('cost_reduction')
  })

  it('rejects update when draftId belongs to a different user', async () => {
    const owner = await seedUser()
    const other = await seedUser()
    // Create draft as owner
    mockAuth(owner)
    const { upsertIdeaDraftAction: createAction } = await import('@/actions/idea-drafts')
    const create = await createAction(makeFormData({ title: 'Mine' }))
    expect(create.ok).toBe(true)
    if (!create.ok) return

    // Try to update as other user
    vi.resetModules()
    mockAuth(other)
    const { upsertIdeaDraftAction: updateAction } = await import('@/actions/idea-drafts')
    const update = await updateAction(
      makeFormData({ draftId: String(create.data.draftId), title: 'Stolen' }),
    )
    expect(update.ok).toBe(false)

    // Original title unchanged
    const draft = testDb.select().from(ideaDrafts).where(eq(ideaDrafts.id, create.data.draftId)).all()[0]
    expect(draft.title).toBe('Mine')
  })

  it('getMyIdeaDraftsAction returns only drafts belonging to the current user', async () => {
    const user1 = await seedUser()
    const user2 = await seedUser()

    mockAuth(user1)
    const { upsertIdeaDraftAction: create1, getMyIdeaDraftsAction: list1 } = await import('@/actions/idea-drafts')
    await create1(makeFormData({ title: 'User1 Draft' }))

    vi.resetModules()
    mockAuth(user2)
    const { upsertIdeaDraftAction: create2 } = await import('@/actions/idea-drafts')
    await create2(makeFormData({ title: 'User2 Draft' }))

    vi.resetModules()
    mockAuth(user1)
    const { getMyIdeaDraftsAction } = await import('@/actions/idea-drafts')
    const result = await getMyIdeaDraftsAction()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].title).toBe('User1 Draft')
  })

  it('deleteIdeaDraftAction removes the draft and returns ok', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction, deleteIdeaDraftAction } = await import('@/actions/idea-drafts')

    const create = await upsertIdeaDraftAction(makeFormData({ title: 'To Delete' }))
    expect(create.ok).toBe(true)
    if (!create.ok) return

    const del = await deleteIdeaDraftAction(create.data.draftId)
    expect(del.ok).toBe(true)

    const remaining = testDb.select().from(ideaDrafts).where(eq(ideaDrafts.id, create.data.draftId)).all()
    expect(remaining).toHaveLength(0)
  })

  it('deleteIdeaDraftAction rejects when draft belongs to another user', async () => {
    const owner = await seedUser()
    const other = await seedUser()
    mockAuth(owner)
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')
    const create = await upsertIdeaDraftAction(makeFormData({ title: 'Protected' }))
    expect(create.ok).toBe(true)
    if (!create.ok) return

    vi.resetModules()
    mockAuth(other)
    const { deleteIdeaDraftAction } = await import('@/actions/idea-drafts')
    const del = await deleteIdeaDraftAction(create.data.draftId)
    expect(del.ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// T015: upsertIdeaDraftAction — attachment limits and dynamic field persistence
// ---------------------------------------------------------------------------
describe('upsertIdeaDraftAction — attachments and dynamic field values', () => {
  it('persists draft attachment and dynamic field value', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')

    const file = new File(['hello'], 'note.pdf', { type: 'application/pdf' })
    const result = await upsertIdeaDraftAction(
      makeFormData({
        title: 'With Attachment',
        category: 'event_plan',
        'dynamic_planned_date': '2026-09-01',
        attachments: [file],
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const attachments = testDb
      .select()
      .from(ideaDraftAttachments)
      .where(eq(ideaDraftAttachments.draftId, result.data.draftId))
      .all()
    expect(attachments).toHaveLength(1)
    expect(attachments[0].originalName).toBe('note.pdf')

    const fieldValues = testDb
      .select()
      .from(ideaDraftFieldValues)
      .where(eq(ideaDraftFieldValues.draftId, result.data.draftId))
      .all()
    expect(fieldValues).toHaveLength(1)
    expect(fieldValues[0].fieldKey).toBe('planned_date')
    expect(fieldValues[0].value).toBe('2026-09-01')
  })

  it('upserts dynamic field values on repeat save (no duplicate rows)', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')

    const first = await upsertIdeaDraftAction(
      makeFormData({ title: 'Draft', 'dynamic_planned_date': '2026-01-01' }),
    )
    expect(first.ok).toBe(true)
    if (!first.ok) return

    vi.resetModules()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction: update } = await import('@/actions/idea-drafts')
    const second = await update(
      makeFormData({ draftId: String(first.data.draftId), title: 'Draft', 'dynamic_planned_date': '2026-06-15' }),
    )
    expect(second.ok).toBe(true)

    const fieldValues = testDb
      .select()
      .from(ideaDraftFieldValues)
      .where(eq(ideaDraftFieldValues.draftId, first.data.draftId))
      .all()
    expect(fieldValues).toHaveLength(1)
    expect(fieldValues[0].value).toBe('2026-06-15')
  })

  it('rejects draft with more than 5 attachments', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')

    const files = Array.from({ length: 6 }, (_, i) =>
      new File([`data-${i}`], `file-${i}.pdf`, { type: 'application/pdf' }),
    )
    const result = await upsertIdeaDraftAction(
      makeFormData({ title: 'Too Many', attachments: files }),
    )
    expect(result.ok).toBe(false)
  })

  it('getIdeaDraftDetailAction returns full detail including attachments and field values', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { upsertIdeaDraftAction, getIdeaDraftDetailAction } = await import('@/actions/idea-drafts')

    const file = new File(['pdf content'], 'report.pdf', { type: 'application/pdf' })
    const create = await upsertIdeaDraftAction(
      makeFormData({
        title: 'Detail Draft',
        description: 'Some description',
        category: 'event_plan',
        'dynamic_planned_date': '2026-12-01',
        attachments: [file],
      }),
    )
    expect(create.ok).toBe(true)
    if (!create.ok) return

    const detail = await getIdeaDraftDetailAction(create.data.draftId)
    expect(detail.ok).toBe(true)
    if (!detail.ok) return

    expect(detail.data.title).toBe('Detail Draft')
    expect(detail.data.description).toBe('Some description')
    expect(detail.data.category).toBe('event_plan')
    expect(detail.data.attachments).toHaveLength(1)
    expect(detail.data.attachments[0].originalName).toBe('report.pdf')
    expect(detail.data.fieldValues['planned_date']).toBe('2026-12-01')
  })

  it('getIdeaDraftDetailAction returns error for non-existent draft', async () => {
    const submitterId = await seedUser()
    mockAuth(submitterId)
    const { getIdeaDraftDetailAction } = await import('@/actions/idea-drafts')
    const result = await getIdeaDraftDetailAction(999999)
    expect(result.ok).toBe(false)
  })

  it('getIdeaDraftDetailAction returns error when draft belongs to another user', async () => {
    const owner = await seedUser()
    const other = await seedUser()
    mockAuth(owner)
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')
    const create = await upsertIdeaDraftAction(makeFormData({ title: 'Private' }))
    expect(create.ok).toBe(true)
    if (!create.ok) return

    vi.resetModules()
    mockAuth(other)
    const { getIdeaDraftDetailAction } = await import('@/actions/idea-drafts')
    const result = await getIdeaDraftDetailAction(create.data.draftId)
    expect(result.ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// T038: Admin access denial regression tests
// ---------------------------------------------------------------------------
describe('admin access denial — draft actions', () => {
  it('getMyIdeaDraftsAction returns error for admin role', async () => {
    const adminId = await seedUser('admin')
    mockAuth(adminId, 'admin')
    const { getMyIdeaDraftsAction } = await import('@/actions/idea-drafts')
    const result = await getMyIdeaDraftsAction()
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/admin/i)
  })

  it('upsertIdeaDraftAction returns error for admin role', async () => {
    const adminId = await seedUser('admin')
    mockAuth(adminId, 'admin')
    const { upsertIdeaDraftAction } = await import('@/actions/idea-drafts')
    const result = await upsertIdeaDraftAction(makeFormData({ title: 'Admin Draft' }))
    expect(result.ok).toBe(false)
  })

  it('deleteIdeaDraftAction returns error for admin role', async () => {
    const adminId = await seedUser('admin')
    mockAuth(adminId, 'admin')
    const { deleteIdeaDraftAction } = await import('@/actions/idea-drafts')
    const result = await deleteIdeaDraftAction(1)
    expect(result.ok).toBe(false)
  })

  it('getIdeaDraftDetailAction returns error for admin role', async () => {
    const adminId = await seedUser('admin')
    mockAuth(adminId, 'admin')
    const { getIdeaDraftDetailAction } = await import('@/actions/idea-drafts')
    const result = await getIdeaDraftDetailAction(1)
    expect(result.ok).toBe(false)
  })
})
