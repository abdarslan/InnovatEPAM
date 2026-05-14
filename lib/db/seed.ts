import 'dotenv/config'
import { db } from './index'
import { ideaAttachments, ideas, users } from './schema'
import { hashPassword } from '../auth/password'
import { eq } from 'drizzle-orm'

async function seed() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const displayName = process.env.ADMIN_DISPLAY_NAME

  if (!email || !password || !displayName) {
    console.error('Missing ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_DISPLAY_NAME env vars')
    process.exit(1)
  }

  const normalizedEmail = email.toLowerCase()
  const passwordHash = await hashPassword(password)
  const now = Date.now()

  const existing = db.select().from(users).where(eq(users.email, normalizedEmail)).get()

  if (existing) {
    db.update(users)
      .set({ passwordHash, displayName, role: 'admin', status: 'active' })
      .where(eq(users.email, normalizedEmail))
      .run()
    console.log(`Admin account updated: ${normalizedEmail}`)
  } else {
    db.insert(users).values({
      email: normalizedEmail,
      displayName,
      passwordHash,
      role: 'admin',
      status: 'active',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: now,
    }).run()
    console.log(`Admin account created: ${normalizedEmail}`)
  }

  const admin = db.select().from(users).where(eq(users.email, normalizedEmail)).get()
  if (!admin) {
    return
  }

  const existingIdeas = db.select({ id: ideas.id }).from(ideas).where(eq(ideas.submitterId, admin.id)).all()
  if (existingIdeas.length > 0) {
    return
  }

  const insertedIdeas = db.insert(ideas).values([
    {
      title: 'Automate repetitive release notes prep',
      description: 'Generate draft release notes from merged work items to reduce manual coordination time.',
      category: 'process_improvement',
      submitterId: admin.id,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Create a lightweight demo media gallery',
      description: 'Allow idea submissions to include example screenshots and short media clips for reviewers.',
      category: 'technology_innovation',
      submitterId: admin.id,
      createdAt: now,
      updatedAt: now,
    },
  ]).returning({ id: ideas.id }).all()

  db.insert(ideaAttachments).values([
    {
      ideaId: insertedIdeas[0].id,
      originalName: 'release-notes-outline.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4,
      previewEligible: true,
      content: Buffer.from([37, 80, 68, 70]),
      createdAt: now,
    },
    {
      ideaId: insertedIdeas[1].id,
      originalName: 'gallery-preview.png',
      mimeType: 'image/png',
      sizeBytes: 4,
      previewEligible: true,
      content: Buffer.from([137, 80, 78, 71]),
      createdAt: now,
    },
    {
      ideaId: insertedIdeas[1].id,
      originalName: 'walkthrough.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 4,
      previewEligible: true,
      content: Buffer.from([0, 0, 0, 24]),
      createdAt: now,
    },
  ]).run()

  console.log('Sample ideas with attachments created for the admin account')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
