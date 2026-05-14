import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { ideas, users } from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/password'

// ---------------------------------------------------------------------------
// In-memory DB setup
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedUser(role: 'submitter' | 'admin' = 'submitter') {
  const hash = await hashPassword('Password1!')
  const result = testDb
    .insert(users)
    .values({
      email: 'test@example.com',
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

function makeFormData(fields: Record<string, string | File>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

// Mock the db module to use the in-memory testDb, and requireAuth to return a session
function mockDeps(userId: number, role: 'submitter' | 'admin' = 'submitter') {
  vi.doMock('@/lib/db', () => ({ db: testDb }))
  vi.doMock('@/lib/auth/session', () => ({
    requireAuth: vi.fn().mockResolvedValue({ userId, role, email: 'test@example.com', displayName: 'Test User' }),
  }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('submitIdeaAction', () => {
  it('inserts a valid idea and returns id', async () => {
    const userId = await seedUser()
    mockDeps(userId)
    const { submitIdeaAction } = await import('@/actions/ideas')

    const fd = makeFormData({
      title: 'My Innovation',
      description: 'This is a detailed description of my innovation idea.',
      category: 'technology_innovation',
    })
    const result = await submitIdeaAction(fd)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.id).toBeGreaterThan(0)

    const rows = testDb.select().from(ideas).where(eq(ideas.id, result.data.id)).all()
    expect(rows).toHaveLength(1)
    expect(rows[0].title).toBe('My Innovation')
    expect(rows[0].submitterId).toBe(userId)
  })

  it('returns error for title shorter than 3 characters', async () => {
    const userId = await seedUser()
    mockDeps(userId)
    const { submitIdeaAction } = await import('@/actions/ideas')

    const fd = makeFormData({
      title: 'ab',
      description: 'Long enough description here.',
      category: 'cost_reduction',
    })
    const result = await submitIdeaAction(fd)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/at least 3/i)
  })

  it('returns error for description shorter than 10 characters', async () => {
    const userId = await seedUser()
    mockDeps(userId)
    const { submitIdeaAction } = await import('@/actions/ideas')

    const fd = makeFormData({
      title: 'Valid Title',
      description: 'Short',
      category: 'cost_reduction',
    })
    const result = await submitIdeaAction(fd)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/at least 10/i)
  })

  it('returns error when not authenticated', async () => {
    vi.doMock('@/lib/db', () => ({ db: testDb }))
    vi.doMock('@/lib/auth/session', () => ({
      requireAuth: vi.fn().mockRejectedValue(new Error('UNAUTHENTICATED')),
    }))
    const { submitIdeaAction } = await import('@/actions/ideas')

    const fd = makeFormData({
      title: 'Valid Title',
      description: 'Valid description here.',
      category: 'workplace_culture',
    })
    const result = await submitIdeaAction(fd)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/logged in/i)
  })

  it('stores attachment fields when file is provided', async () => {
    const userId = await seedUser()
    mockDeps(userId)
    const { submitIdeaAction } = await import('@/actions/ideas')

    const content = new Uint8Array([37, 80, 68, 70]) // %PDF
    const file = new File([content], 'test.pdf', { type: 'application/pdf' })
    const fd = makeFormData({
      title: 'Idea With File',
      description: 'This idea has a supporting document attached.',
      category: 'process_improvement',
    })
    fd.set('attachment', file)

    const result = await submitIdeaAction(fd)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const rows = testDb.select().from(ideas).where(eq(ideas.id, result.data.id)).all()
    expect(rows[0].attachmentName).toBe('test.pdf')
    expect(rows[0].attachmentMimeType).toBe('application/pdf')
    expect(rows[0].attachmentContent).toBeDefined()
  })
})
