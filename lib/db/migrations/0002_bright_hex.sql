CREATE TABLE `idea_evaluations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idea_id` integer NOT NULL,
	`admin_id` integer NOT NULL,
	`status` text NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idea_evaluations_idea_id_unique` ON `idea_evaluations` (`idea_id`);--> statement-breakpoint
ALTER TABLE `ideas` ADD `status` text DEFAULT 'submitted' NOT NULL;--> statement-breakpoint
ALTER TABLE `ideas` ADD `reviewer_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `ideas` ADD `review_started_at` integer;