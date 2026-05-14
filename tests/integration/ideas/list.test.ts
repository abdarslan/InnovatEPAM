import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
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

async function seedUser(opts: { role?: 'submitter' | 'admin' } = {}) {
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email: `user${Date.now()}@example.com`,
      displayName: 'Test User',
      passwordHash: hash,
      role: opts.role ?? 'submitter',
      status: 'active',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: Date.now(),
    })
    .returning({ id: users.id })
    .all()
  return result[0].id
}

function seedIdea(submitterId: number, overrides: Partial<schema.NewIdea> = {}) {
  const now = Date.now()
  const result = testDb
    .insert(ideas)
    .values({
      title: 'Test Idea',
      description: 'A detailed description of this test idea.',
      category: 'workplace_culture',
      submitterId,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning({ id: ideas.id })
    .all()
  return result[0].id
}

function seedAttachment(ideaId: number, name = 'report.pdf', mimeType = 'application/pdf') {
  testDb.insert(ideaAttachments).values({
    ideaId,
    originalName: name,
    mimeType,
    sizeBytes: 4,
    previewEligible: true,
    content: Buffer.from([37, 80, 68, 70]),
    createdAt: Date.now(),
  }).run()
}

function mockAuth(userId: number, role: 'submitter' | 'admin' = 'submitter') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'Test User' }),
  }))
}

describe('getIdeasAction', () => {
  it('returns all ideas newest first', async () => {
    const userId = await seedUser()
    mockAuth(userId)
    const id1 = seedIdea(userId, { createdAt: 1000, updatedAt: 1000, title: 'Old Idea' })
    const id2 = seedIdea(userId, { createdAt: 2000, updatedAt: 2000, title: 'New Idea' })
    seedAttachment(id2)
    const { getIdeasAction } = await import('@/actions/ideas')
    const result = await getIdeasAction()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data[0].id).toBe(id2)
    expect(result.data[1].id).toBe(id1)
    expect(result.data[0].attachmentCount).toBe(1)
    expect(result.data[0].hasAttachment).toBe(true)
  })

  it('returns empty array when no ideas exist', async () => {
    const userId = await seedUser()
    mockAuth(userId)
    const { getIdeasAction } = await import('@/actions/ideas')
    const result = await getIdeasAction()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(0)
  })

  it('returns error when not authenticated', async () => {
    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockRejectedValue(new Error('UNAUTHENTICATED')),
    }))
    const { getIdeasAction } = await import('@/actions/ideas')
    const result = await getIdeasAction()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/logged in/i)
  })
})

describe('getIdeaDetailAction', () => {
  it('returns full detail for a valid id', async () => {
    const userId = await seedUser()
    mockAuth(userId)
    const ideaId = seedIdea(userId, { title: 'Detail Test', description: 'Full detail description text.' })
    seedAttachment(ideaId, 'detail.pdf')
    const { getIdeaDetailAction } = await import('@/actions/ideas')
    const result = await getIdeaDetailAction(ideaId)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.title).toBe('Detail Test')
    expect(result.data.description).toBe('Full detail description text.')
    expect(result.data.attachments).toHaveLength(1)
    expect(result.data.attachments[0].originalName).toBe('detail.pdf')
  })

  it('returns not-found error for missing idea', async () => {
    const userId = await seedUser()
    mockAuth(userId)
    const { getIdeaDetailAction } = await import('@/actions/ideas')
    const result = await getIdeaDetailAction(99999)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/not found/i)
  })
})
