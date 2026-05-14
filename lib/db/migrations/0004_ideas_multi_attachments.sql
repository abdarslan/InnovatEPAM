CREATE TABLE `idea_attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idea_id` integer NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`preview_eligible` integer NOT NULL,
	`content` blob NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idea_attachments_idea_id_idx` ON `idea_attachments` (`idea_id`);
--> statement-breakpoint
CREATE INDEX `idea_attachments_created_at_idx` ON `idea_attachments` (`created_at`);
--> statement-breakpoint
INSERT INTO `idea_attachments` (`idea_id`, `original_name`, `mime_type`, `size_bytes`, `preview_eligible`, `content`, `created_at`)
SELECT
	`id`,
	`attachment_name`,
	`attachment_mime_type`,
	`attachment_size`,
	CASE
		WHEN `attachment_mime_type` = 'application/pdf'
			OR `attachment_mime_type` LIKE 'image/%'
			OR `attachment_mime_type` LIKE 'audio/%'
			OR `attachment_mime_type` LIKE 'video/%'
		THEN 1
		ELSE 0
	END,
	`attachment_content`,
	`created_at`
FROM `ideas`
WHERE `attachment_name` IS NOT NULL
	AND `attachment_mime_type` IS NOT NULL
	AND `attachment_size` IS NOT NULL
	AND `attachment_content` IS NOT NULL;