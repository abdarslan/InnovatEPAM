import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '@/lib/db/schema'
import { ideas, users } from '@/lib/db/schema'
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

async function seedUser() {
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email: 'test@example.com',
      displayName: 'Test User',
      passwordHash: hash,
      role: 'submitter' as const,
      status: 'active' as const,
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: Date.now(),
    })
    .returning({ id: users.id })
    .all()
  return result[0].id
}

function seedIdeaWithAttachment(submitterId: number) {
  const content = Buffer.from([37, 80, 68, 70, 45]) // %PDF-
  const now = Date.now()
  const result = testDb
    .insert(ideas)
    .values({
      title: 'Idea With File',
      description: 'Has an attachment.',
      category: 'technology_innovation',
      submitterId,
      attachmentName: 'report.pdf',
      attachmentSize: content.byteLength,
      attachmentMimeType: 'application/pdf',
      attachmentContent: content,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: ideas.id })
    .all()
  return result[0].id
}

function seedIdeaWithoutAttachment(submitterId: number) {
  const now = Date.now()
  const result = testDb
    .insert(ideas)
    .values({
      title: 'Idea Without File',
      description: 'No attachment here.',
      category: 'cost_reduction',
      submitterId,
      attachmentName: null,
      attachmentSize: null,
      attachmentMimeType: null,
      attachmentContent: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: ideas.id })
    .all()
  return result[0].id
}

describe('deleteIdeaAction (auth behaviour)', () => {
  it('non-owner non-admin receives auth error', async () => {
    const ownerId = await seedUser()
    const otherResult = testDb.insert(users).values({
      email: 'other@example.com',
      displayName: 'Other',
      passwordHash: await hashPassword('Password1!'),
      role: 'submitter' as const,
      status: 'active' as const,
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: Date.now(),
    }).returning({ id: users.id }).all()
    const otherId = otherResult[0].id
    const ideaId = seedIdeaWithAttachment(ownerId)

    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: otherId, role: 'submitter', email: 'other@example.com', displayName: 'Other' }),
    }))
    const { deleteIdeaAction } = await import('@/actions/ideas')
    const result = await deleteIdeaAction(ideaId)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/not authorised/i)
  })
})

describe('Attachment download (route handler logic)', () => {
  it('returns 401 for unauthenticated requests', async () => {
    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockRejectedValue(new Error('UNAUTHENTICATED')),
    }))
    const { GET } = await import('@/app/api/ideas/[id]/attachment/route')
    const req = new Request('http://localhost/api/ideas/1/attachment')
    const res = await GET(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 for non-integer id', async () => {
    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: 1, role: 'submitter', email: 'a@b.com', displayName: 'A' }),
    }))
    const { GET } = await import('@/app/api/ideas/[id]/attachment/route')
    const req = new Request('http://localhost/api/ideas/abc/attachment')
    const res = await GET(req as never, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when idea has no attachment', async () => {
    const userId = await seedUser()
    const ideaId = seedIdeaWithoutAttachment(userId)
    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId, role: 'submitter', email: 'test@example.com', displayName: 'Test' }),
    }))
    const { GET } = await import('@/app/api/ideas/[id]/attachment/route')
    const req = new Request(`http://localhost/api/ideas/${ideaId}/attachment`)
    const res = await GET(req as never, { params: Promise.resolve({ id: String(ideaId) }) })
    expect(res.status).toBe(404)
  })

  it('returns binary content with correct headers for authenticated request', async () => {
    const userId = await seedUser()
    const ideaId = seedIdeaWithAttachment(userId)
    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId, role: 'submitter', email: 'test@example.com', displayName: 'Test' }),
    }))
    const { GET } = await import('@/app/api/ideas/[id]/attachment/route')
    const req = new Request(`http://localhost/api/ideas/${ideaId}/attachment`)
    const res = await GET(req as never, { params: Promise.resolve({ id: String(ideaId) }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('report.pdf')
  })
})
