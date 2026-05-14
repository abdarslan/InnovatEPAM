import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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

export const IDEA_STATUSES = [
  'submitted',
  'under_review',
  'accepted',
  'rejected',
] as const

export type IdeaStatus = typeof IDEA_STATUSES[number]

export const ideas = sqliteTable('ideas', {
  id:                 integer('id').primaryKey({ autoIncrement: true }),
  title:              text('title').notNull(),
  description:        text('description').notNull(),
  category:           text('category', { enum: IDEA_CATEGORIES }).notNull(),
  submitterId:        integer('submitter_id').notNull().references(() => users.id),
  attachmentName:     text('attachment_name'),
  attachmentSize:     integer('attachment_size'),
  attachmentMimeType: text('attachment_mime_type'),
  attachmentContent:  blob('attachment_content', { mode: 'buffer' }),
  status:             text('status', { enum: IDEA_STATUSES }).notNull().default('submitted'),
  reviewerId:         integer('reviewer_id').references(() => users.id),
  reviewStartedAt:    integer('review_started_at'),
  createdAt:          integer('created_at').notNull(),
  updatedAt:          integer('updated_at').notNull(),
})

export type Idea    = typeof ideas.$inferSelect
export type NewIdea = typeof ideas.$inferInsert

// ---------------------------------------------------------------------------
// Idea Evaluations
// ---------------------------------------------------------------------------

export const EVALUATION_STATUSES = ['accepted', 'rejected'] as const

export type EvaluationStatus = typeof EVALUATION_STATUSES[number]

export const ideaEvaluations = sqliteTable('idea_evaluations', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  ideaId:    integer('idea_id').notNull().unique().references(() => ideas.id),
  adminId:   integer('admin_id').notNull().references(() => users.id),
  status:    text('status', { enum: EVALUATION_STATUSES }).notNull(),
  comment:   text('comment'),
  createdAt: integer('created_at').notNull(),
})

export type IdeaEvaluation    = typeof ideaEvaluations.$inferSelect
export type NewIdeaEvaluation = typeof ideaEvaluations.$inferInsert
