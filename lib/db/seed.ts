import 'dotenv/config'
import { db } from './index'
import { users } from './schema'
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
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
