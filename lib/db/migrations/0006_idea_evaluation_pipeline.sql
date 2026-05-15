-- Migration: 0006_idea_evaluation_pipeline
-- Stage-based idea evaluation summary + append-only decision events

ALTER TABLE `ideas` ADD `current_stage` text NOT NULL DEFAULT 'stage_1_triage';
--> statement-breakpoint
ALTER TABLE `ideas` ADD `current_outcome` text NOT NULL DEFAULT 'in_progress';
--> statement-breakpoint
ALTER TABLE `ideas` ADD `is_terminal` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

CREATE TABLE `idea_decision_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `idea_id` integer NOT NULL REFERENCES `ideas`(`id`) ON DELETE CASCADE,
  `stage` text NOT NULL,
  `decision_type` text NOT NULL,
  `outcome` text NOT NULL,
  `comment` text,
  `decided_by_user_id` integer REFERENCES `users`(`id`),
  `decided_at` integer NOT NULL,
  `sequence` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idea_decision_events_idea_id_sequence_unique`
  ON `idea_decision_events` (`idea_id`, `sequence`);
--> statement-breakpoint
CREATE INDEX `idea_decision_events_idea_id_decided_at_idx`
  ON `idea_decision_events` (`idea_id`, `decided_at`);
--> statement-breakpoint

INSERT INTO `idea_decision_events` (
  `idea_id`, `stage`, `decision_type`, `outcome`, `comment`, `decided_by_user_id`, `decided_at`, `sequence`
)
SELECT
  `id`,
  'stage_1_triage',
  'submitted',
  'in_progress',
  NULL,
  NULL,
  `created_at`,
  1
FROM `ideas`;
