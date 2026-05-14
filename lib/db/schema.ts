import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
