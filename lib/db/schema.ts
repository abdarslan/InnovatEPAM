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

export const IDEA_EVALUATION_STAGES = [
  'stage_1_triage',
  'stage_2_department_review',
  'stage_3_feasibility',
  'stage_4_final_executive_decision',
] as const

export type IdeaEvaluationStage = typeof IDEA_EVALUATION_STAGES[number]

export const IDEA_EVALUATION_OUTCOMES = [
  'in_progress',
  'approved_to_next_stage',
  'rejected',
  'final_approved',
  'final_rejected',
] as const

export type IdeaEvaluationOutcome = typeof IDEA_EVALUATION_OUTCOMES[number]

export const IDEA_DECISION_TYPES = [
  'submitted',
  'approve_next',
  'reject',
  'final_approve',
  'final_reject',
] as const

export type IdeaDecisionType = typeof IDEA_DECISION_TYPES[number]

export const ideas = sqliteTable('ideas', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  title:          text('title').notNull(),
  description:    text('description').notNull(),
  category:       text('category', { enum: IDEA_CATEGORIES }).notNull(),
  submitterId:    integer('submitter_id').notNull().references(() => users.id),
  status:         text('status', { enum: IDEA_STATUSES }).notNull().default('submitted'),
  currentStage:   text('current_stage', { enum: IDEA_EVALUATION_STAGES }).notNull().default('stage_1_triage'),
  currentOutcome: text('current_outcome', { enum: IDEA_EVALUATION_OUTCOMES }).notNull().default('in_progress'),
  isTerminal:     integer('is_terminal', { mode: 'boolean' }).notNull().default(false),
  reviewerId:     integer('reviewer_id').references(() => users.id),
  reviewStartedAt: integer('review_started_at'),
  alignmentRating: integer('alignment_rating'),
  feasibilityRating: integer('feasibility_rating'),
  impactRating: integer('impact_rating'),
  createdAt:      integer('created_at').notNull(),
  updatedAt:      integer('updated_at').notNull(),
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

export const IDEA_RATING_STAGES = [
  'stage_2_department_review',
  'stage_3_feasibility',
  'stage_4_final_executive_decision',
] as const

export type IdeaRatingStage = typeof IDEA_RATING_STAGES[number]

export const ideaRatings = sqliteTable(
  'idea_ratings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ideaId: integer('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
    stage: text('stage', { enum: IDEA_RATING_STAGES }).notNull(),
    raterId: integer('rater_id').notNull().references(() => users.id),
    score: integer('score').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    ideaStageUnique: uniqueIndex('idea_ratings_idea_id_stage_unique').on(table.ideaId, table.stage),
    ideaStageIdx: index('idea_ratings_idea_id_stage_idx').on(table.ideaId, table.stage),
    raterIdx: index('idea_ratings_rater_id_idx').on(table.raterId),
  }),
)

export type IdeaRating = typeof ideaRatings.$inferSelect
export type NewIdeaRating = typeof ideaRatings.$inferInsert

export const ideaDecisionEvents = sqliteTable(
  'idea_decision_events',
  {
    id:              integer('id').primaryKey({ autoIncrement: true }),
    ideaId:          integer('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
    stage:           text('stage', { enum: IDEA_EVALUATION_STAGES }).notNull(),
    decisionType:    text('decision_type', { enum: IDEA_DECISION_TYPES }).notNull(),
    outcome:         text('outcome', { enum: IDEA_EVALUATION_OUTCOMES }).notNull(),
    comment:         text('comment'),
    ratingId:        integer('rating_id').references(() => ideaRatings.id),
    decidedByUserId: integer('decided_by_user_id').references(() => users.id),
    decidedAt:       integer('decided_at').notNull(),
    sequence:        integer('sequence').notNull(),
  },
  (table) => ({
    ideaSequenceUnique: uniqueIndex('idea_decision_events_idea_id_sequence_unique')
      .on(table.ideaId, table.sequence),
    ideaTimelineIdx: index('idea_decision_events_idea_id_decided_at_idx')
      .on(table.ideaId, table.decidedAt),
  }),
)

export type IdeaDecisionEvent = typeof ideaDecisionEvents.$inferSelect
export type NewIdeaDecisionEvent = typeof ideaDecisionEvents.$inferInsert

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

// ---------------------------------------------------------------------------
// Idea Attachments
// ---------------------------------------------------------------------------

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
    ideaIdIdx:    index('idea_attachments_idea_id_idx').on(table.ideaId),
    createdAtIdx: index('idea_attachments_created_at_idx').on(table.createdAt),
  }),
)

export type IdeaAttachment = typeof ideaAttachments.$inferSelect
export type NewIdeaAttachment = typeof ideaAttachments.$inferInsert

// ---------------------------------------------------------------------------
// Idea Drafts
// ---------------------------------------------------------------------------

export const ideaDrafts = sqliteTable(
  'idea_drafts',
  {
    id:          integer('id').primaryKey({ autoIncrement: true }),
    submitterId: integer('submitter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title:       text('title'),
    description: text('description'),
    category:    text('category', { enum: IDEA_CATEGORIES }),
    createdAt:   integer('created_at').notNull(),
    updatedAt:   integer('updated_at').notNull(),
  },
  (table) => ({
    submitterIdx: index('idea_drafts_submitter_id_idx').on(table.submitterId),
  }),
)

export type IdeaDraft    = typeof ideaDrafts.$inferSelect
export type NewIdeaDraft = typeof ideaDrafts.$inferInsert

export const ideaDraftAttachments = sqliteTable(
  'idea_draft_attachments',
  {
    id:              integer('id').primaryKey({ autoIncrement: true }),
    draftId:         integer('draft_id').notNull().references(() => ideaDrafts.id, { onDelete: 'cascade' }),
    originalName:    text('original_name').notNull(),
    mimeType:        text('mime_type').notNull(),
    sizeBytes:       integer('size_bytes').notNull(),
    previewEligible: integer('preview_eligible', { mode: 'boolean' }).notNull(),
    content:         blob('content', { mode: 'buffer' }).notNull(),
    createdAt:       integer('created_at').notNull(),
  },
  (table) => ({
    draftIdIdx: index('idea_draft_attachments_draft_id_idx').on(table.draftId),
  }),
)

export type IdeaDraftAttachment    = typeof ideaDraftAttachments.$inferSelect
export type NewIdeaDraftAttachment = typeof ideaDraftAttachments.$inferInsert

export const ideaDraftFieldValues = sqliteTable(
  'idea_draft_field_values',
  {
    id:        integer('id').primaryKey({ autoIncrement: true }),
    draftId:   integer('draft_id').notNull().references(() => ideaDrafts.id, { onDelete: 'cascade' }),
    fieldKey:  text('field_key').notNull(),
    value:     text('value').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    draftFieldKeyUnique: uniqueIndex('idea_draft_field_values_draft_id_field_key_unique')
      .on(table.draftId, table.fieldKey),
    draftLookupIdx: index('idea_draft_field_values_draft_id_idx').on(table.draftId),
  }),
)

export type IdeaDraftFieldValue    = typeof ideaDraftFieldValues.$inferSelect
export type NewIdeaDraftFieldValue = typeof ideaDraftFieldValues.$inferInsert
