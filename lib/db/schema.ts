import { blob, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  email:          text('email').notNull().unique(),
  displayName:    text('display_name').notNull(),
  passwordHash:   text('password_hash').notNull(),
  role:           text('role', { enum: ['submitter', 'admin'] }).notNull().default('submitter'),
  status:         text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil:    integer('locked_until'),
  createdAt:      integer('created_at').notNull(),
})

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// ---------------------------------------------------------------------------
// Ideas
// ---------------------------------------------------------------------------

export const IDEA_CATEGORIES = [
  'process_improvement',
  'technology_innovation',
  'customer_experience',
  'workplace_culture',
  'cost_reduction',
] as const

export type IdeaCategory = typeof IDEA_CATEGORIES[number]

export const ideas = sqliteTable('ideas', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  category:    text('category', { enum: IDEA_CATEGORIES }).notNull(),
  submitterId: integer('submitter_id').notNull().references(() => users.id),
  createdAt:   integer('created_at').notNull(),
  updatedAt:   integer('updated_at').notNull(),
})

export type Idea    = typeof ideas.$inferSelect
export type NewIdea = typeof ideas.$inferInsert

export const ideaAttachments = sqliteTable(
  'idea_attachments',
  {
    id:              integer('id').primaryKey({ autoIncrement: true }),
    ideaId:          integer('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
    originalName:    text('original_name').notNull(),
    mimeType:        text('mime_type').notNull(),
    sizeBytes:       integer('size_bytes').notNull(),
    previewEligible: integer('preview_eligible', { mode: 'boolean' }).notNull(),
    content:         blob('content', { mode: 'buffer' }).notNull(),
    createdAt:       integer('created_at').notNull(),
  },
  (table) => ({
    ideaIdIdx: index('idea_attachments_idea_id_idx').on(table.ideaId),
    createdAtIdx: index('idea_attachments_created_at_idx').on(table.createdAt),
  }),
)

export type IdeaAttachment = typeof ideaAttachments.$inferSelect
export type NewIdeaAttachment = typeof ideaAttachments.$inferInsert
