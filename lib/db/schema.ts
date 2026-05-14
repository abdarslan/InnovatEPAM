import {
  blob,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

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
  'event_plan',
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

// ---------------------------------------------------------------------------
// Dynamic Category Field Rules
// ---------------------------------------------------------------------------

export const DYNAMIC_FIELD_TYPES = ['text', 'number', 'date'] as const

export type DynamicFieldType = typeof DYNAMIC_FIELD_TYPES[number]

export const ideaCategoryFieldRules = sqliteTable(
  'idea_category_field_rules',
  {
    id:               integer('id').primaryKey({ autoIncrement: true }),
    category:         text('category', { enum: IDEA_CATEGORIES }).notNull(),
    fieldKey:         text('field_key').notNull(),
    label:            text('label').notNull(),
    fieldType:        text('field_type', { enum: DYNAMIC_FIELD_TYPES }).notNull(),
    required:         integer('required', { mode: 'boolean' }).notNull().default(false),
    minValue:         real('min_value'),
    maxValue:         real('max_value'),
    minLength:        integer('min_length'),
    maxLength:        integer('max_length'),
    helpText:         text('help_text'),
    sortOrder:        integer('sort_order').notNull().default(0),
    isActive:         integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt:        integer('created_at').notNull(),
    updatedAt:        integer('updated_at').notNull(),
    updatedByAdminId: integer('updated_by_admin_id').notNull().references(() => users.id),
  },
  (table) => ({
    categoryFieldKeyUnique: uniqueIndex('idea_category_field_rules_category_field_key_unique')
      .on(table.category, table.fieldKey),
    categorySortOrderIndex: index('idea_category_field_rules_category_sort_order_idx')
      .on(table.category, table.sortOrder),
  }),
)

export type IdeaCategoryFieldRule = typeof ideaCategoryFieldRules.$inferSelect
export type NewIdeaCategoryFieldRule = typeof ideaCategoryFieldRules.$inferInsert

// ---------------------------------------------------------------------------
// Dynamic Category Field Values
// ---------------------------------------------------------------------------

export const ideaFieldValues = sqliteTable(
  'idea_field_values',
  {
    id:        integer('id').primaryKey({ autoIncrement: true }),
    ideaId:    integer('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
    ruleId:    integer('rule_id').notNull().references(() => ideaCategoryFieldRules.id),
    fieldKey:  text('field_key').notNull(),
    value:     text('value').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    ideaFieldKeyUnique: uniqueIndex('idea_field_values_idea_id_field_key_unique')
      .on(table.ideaId, table.fieldKey),
    ideaLookupIndex: index('idea_field_values_idea_id_idx').on(table.ideaId),
  }),
)

export type IdeaFieldValue = typeof ideaFieldValues.$inferSelect
export type NewIdeaFieldValue = typeof ideaFieldValues.$inferInsert
