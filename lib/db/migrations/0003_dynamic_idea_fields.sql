CREATE TABLE `idea_category_field_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`field_key` text NOT NULL,
	`label` text NOT NULL,
	`field_type` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`min_value` real,
	`max_value` real,
	`min_length` integer,
	`max_length` integer,
	`help_text` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by_admin_id` integer NOT NULL,
	FOREIGN KEY (`updated_by_admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idea_category_field_rules_category_field_key_unique` ON `idea_category_field_rules` (`category`,`field_key`);--> statement-breakpoint
CREATE INDEX `idea_category_field_rules_category_sort_order_idx` ON `idea_category_field_rules` (`category`,`sort_order`);--> statement-breakpoint

CREATE TABLE `idea_field_values` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idea_id` integer NOT NULL,
	`rule_id` integer NOT NULL,
	`field_key` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rule_id`) REFERENCES `idea_category_field_rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idea_field_values_idea_id_field_key_unique` ON `idea_field_values` (`idea_id`,`field_key`);--> statement-breakpoint
CREATE INDEX `idea_field_values_idea_id_idx` ON `idea_field_values` (`idea_id`);
