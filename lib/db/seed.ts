import 'dotenv/config'
import { db } from './index'
import { ideaAttachments, ideaCategoryFieldRules, ideas, users } from './schema'
import { hashPassword } from '../auth/password'
import { and, eq } from 'drizzle-orm'

async function seed() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@epam.com'
  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!'
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? 'Admin User'

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

  const admin = db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).get()
  if (!admin) {
    console.error('Failed to resolve admin account for rule seeding')
    process.exit(1)
  }

  const ruleNow = Date.now()
  const eventPlanRules = [
    {
      category: 'event_plan' as const,
      fieldKey: 'planned_date',
      label: 'Planned Date',
      fieldType: 'date' as const,
      required: false,
      minValue: null,
      maxValue: null,
      minLength: null,
      maxLength: null,
      helpText: 'Optional event date (YYYY-MM-DD).',
      sortOrder: 1,
      isActive: true,
    },
    {
      category: 'event_plan' as const,
      fieldKey: 'planned_attendees',
      label: 'Planned Number of Attendees',
      fieldType: 'number' as const,
      required: false,
      minValue: 1,
      maxValue: null,
      minLength: null,
      maxLength: null,
      helpText: 'Optional expected attendee count.',
      sortOrder: 2,
      isActive: true,
    },
  ]

  for (const rule of eventPlanRules) {
    const existingRule = db
      .select({ id: ideaCategoryFieldRules.id })
      .from(ideaCategoryFieldRules)
      .where(
        and(
          eq(ideaCategoryFieldRules.category, rule.category),
          eq(ideaCategoryFieldRules.fieldKey, rule.fieldKey),
        ),
      )
      .get()

    if (existingRule) {
      db.update(ideaCategoryFieldRules)
        .set({
          label: rule.label,
          fieldType: rule.fieldType,
          required: rule.required,
          minValue: rule.minValue,
          maxValue: rule.maxValue,
          minLength: rule.minLength,
          maxLength: rule.maxLength,
          helpText: rule.helpText,
          sortOrder: rule.sortOrder,
          isActive: rule.isActive,
          updatedAt: ruleNow,
          updatedByAdminId: admin.id,
        })
        .where(eq(ideaCategoryFieldRules.id, existingRule.id))
        .run()
    } else {
      db.insert(ideaCategoryFieldRules)
        .values({
          category: rule.category,
          fieldKey: rule.fieldKey,
          label: rule.label,
          fieldType: rule.fieldType,
          required: rule.required,
          minValue: rule.minValue,
          maxValue: rule.maxValue,
          minLength: rule.minLength,
          maxLength: rule.maxLength,
          helpText: rule.helpText,
          sortOrder: rule.sortOrder,
          isActive: rule.isActive,
          createdAt: ruleNow,
          updatedAt: ruleNow,
          updatedByAdminId: admin.id,
        })
        .run()
    }
  }

  console.log('Event Plan dynamic field rules seeded.')

  // -----------------------------------------------------------------------
  // Sample ideas with attachments
  // -----------------------------------------------------------------------
  const existingIdeas = db.select({ id: ideas.id }).from(ideas).where(eq(ideas.submitterId, admin.id)).all()
  if (existingIdeas.length === 0) {
    const now2 = Date.now()
    const insertedIdeas = db.insert(ideas).values([
      {
        title: 'Automate repetitive release notes prep',
        description: 'Generate draft release notes from merged work items to reduce manual coordination time.',
        category: 'process_improvement',
        submitterId: admin.id,
        createdAt: now2,
        updatedAt: now2,
      },
      {
        title: 'Create a lightweight demo media gallery',
        description: 'Allow idea submissions to include example screenshots and short media clips for reviewers.',
        category: 'technology_innovation',
        submitterId: admin.id,
        createdAt: now2,
        updatedAt: now2,
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
        createdAt: now2,
      },
      {
        ideaId: insertedIdeas[1].id,
        originalName: 'gallery-preview.png',
        mimeType: 'image/png',
        sizeBytes: 4,
        previewEligible: true,
        content: Buffer.from([137, 80, 78, 71]),
        createdAt: now2,
      },
      {
        ideaId: insertedIdeas[1].id,
        originalName: 'walkthrough.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 4,
        previewEligible: true,
        content: Buffer.from([0, 0, 0, 24]),
        createdAt: now2,
      },
    ]).run()

    console.log('Sample ideas with attachments created for the admin account')
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
