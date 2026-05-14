import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { ideaAttachments, ideas, users } from '@/lib/db/schema'
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
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email: `user${Date.now()}${Math.random()}@example.com`,
      displayName: 'Test User',
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
      title: 'Original Title',
      description: 'Original description text here.',
      category: 'workplace_culture',
      submitterId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: ideas.id })
    .all()
  return result[0].id
}

function seedAttachment(ideaId: number, name = 'report.pdf') {
  return testDb.insert(ideaAttachments).values({
    ideaId,
    originalName: name,
    mimeType: 'application/pdf',
    sizeBytes: 4,
    previewEligible: true,
    content: Buffer.from([37, 80, 68, 70]),
    createdAt: Date.now(),
  }).returning({ id: ideaAttachments.id }).all()[0].id
}

function mockAuth(userId: number, role: 'submitter' | 'admin' = 'submitter') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'Test User' }),
  }))
}

function makeFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData()
  fd.set('title', overrides.title ?? 'Updated Title')
  fd.set('description', overrides.description ?? 'Updated description text for the idea.')
  fd.set('category', overrides.category ?? 'technology_innovation')
  return fd
}

describe('updateIdeaAction', () => {
  it('owner can update title, description, and category', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId)
    mockAuth(userId)

    const { updateIdeaAction } = await import('@/actions/ideas')
    const fd = makeFormData({ title: 'New Title', description: 'A much better and longer description.', category: 'cost_reduction' })
    const result = await updateIdeaAction(ideaId, fd)
    expect(result.ok).toBe(true)

    const updated = testDb.select().from(ideas).where(eq(ideas.id, ideaId)).all()
    expect(updated[0].title).toBe('New Title')
    expect(updated[0].category).toBe('cost_reduction')
  })

  it('non-owner receives authorisation error', async () => {
    const ownerId = await seedUser()
    const otherId = await seedUser()
    const ideaId = seedIdea(ownerId)
    mockAuth(otherId)

    const { updateIdeaAction } = await import('@/actions/ideas')
    const result = await updateIdeaAction(ideaId, makeFormData())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/not authorised/i)
  })

  it('returns error when title is too short', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId)
    mockAuth(userId)

    const { updateIdeaAction } = await import('@/actions/ideas')
    const result = await updateIdeaAction(ideaId, makeFormData({ title: 'AB' }))
    expect(result.ok).toBe(false)
  })

  it('returns not-found when idea does not exist', async () => {
    const userId = await seedUser()
    mockAuth(userId)

    const { updateIdeaAction } = await import('@/actions/ideas')
    const result = await updateIdeaAction(99999, makeFormData())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/not found/i)
  })

  it('returns error when unauthenticated', async () => {
    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockRejectedValue(new Error('UNAUTHENTICATED')),
    }))
    const { updateIdeaAction } = await import('@/actions/ideas')
    const result = await updateIdeaAction(1, makeFormData())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/logged in/i)
  })

  it('owner can remove an existing attachment and add a new one', async () => {
    const userId = await seedUser()
    const ideaId = seedIdea(userId)
    const existingAttachmentId = seedAttachment(ideaId)
    mockAuth(userId)

    const { updateIdeaAction } = await import('@/actions/ideas')
    const fd = makeFormData()
    fd.append('removeAttachmentIds', String(existingAttachmentId))
    fd.append('attachments', new File(['fresh'], 'fresh.pdf', { type: 'application/pdf' }))

    const result = await updateIdeaAction(ideaId, fd)
    expect(result.ok).toBe(true)

    const attachments = testDb.select().from(ideaAttachments).where(eq(ideaAttachments.ideaId, ideaId)).all()
    expect(attachments).toHaveLength(1)
    expect(attachments[0].originalName).toBe('fresh.pdf')
  })
})
