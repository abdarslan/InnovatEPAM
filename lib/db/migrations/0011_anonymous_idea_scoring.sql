-- Migration: 0011_anonymous_idea_scoring
-- Adds immutable per-stage ratings and timeline linkage for anonymous evaluation scoring

ALTER TABLE `ideas` ADD `alignment_rating` integer;
--> statement-breakpoint
ALTER TABLE `ideas` ADD `feasibility_rating` integer;
--> statement-breakpoint
ALTER TABLE `ideas` ADD `impact_rating` integer;
--> statement-breakpoint

CREATE TABLE `idea_ratings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `idea_id` integer NOT NULL REFERENCES `ideas`(`id`) ON DELETE CASCADE,
  `stage` text NOT NULL,
  `rater_id` integer NOT NULL REFERENCES `users`(`id`),
  `score` integer NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  CONSTRAINT `idea_ratings_score_check` CHECK (`score` >= 1 AND `score` <= 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idea_ratings_idea_id_stage_unique`
  ON `idea_ratings` (`idea_id`, `stage`);
--> statement-breakpoint
CREATE INDEX `idea_ratings_idea_id_stage_idx`
  ON `idea_ratings` (`idea_id`, `stage`);
--> statement-breakpoint
CREATE INDEX `idea_ratings_rater_id_idx`
  ON `idea_ratings` (`rater_id`);
--> statement-breakpoint

ALTER TABLE `idea_decision_events` ADD `rating_id` integer REFERENCES `idea_ratings`(`id`);
