CREATE TABLE `ideas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`submitter_id` integer NOT NULL,
	`attachment_name` text,
	`attachment_size` integer,
	`attachment_mime_type` text,
	`attachment_content` blob,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`submitter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
