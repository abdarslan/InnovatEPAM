-- Migration: 0005_idea_drafts
-- Draft storage tables for feature 005-idea-draft-management

CREATE TABLE `idea_drafts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `submitter_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `title` text,
  `description` text,
  `category` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idea_drafts_submitter_id_idx` ON `idea_drafts` (`submitter_id`);
--> statement-breakpoint
CREATE TABLE `idea_draft_attachments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `draft_id` integer NOT NULL REFERENCES `idea_drafts`(`id`) ON DELETE CASCADE,
  `original_name` text NOT NULL,
  `mime_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `preview_eligible` integer NOT NULL,
  `content` blob NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idea_draft_attachments_draft_id_idx` ON `idea_draft_attachments` (`draft_id`);
--> statement-breakpoint
CREATE TABLE `idea_draft_field_values` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `draft_id` integer NOT NULL REFERENCES `idea_drafts`(`id`) ON DELETE CASCADE,
  `field_key` text NOT NULL,
  `value` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idea_draft_field_values_draft_id_field_key_unique`
  ON `idea_draft_field_values` (`draft_id`, `field_key`);
--> statement-breakpoint
CREATE INDEX `idea_draft_field_values_draft_id_idx`
  ON `idea_draft_field_values` (`draft_id`);
