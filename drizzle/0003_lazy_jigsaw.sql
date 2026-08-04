CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text DEFAULT 'ANON' NOT NULL,
	`content` text NOT NULL,
	`source_path` text DEFAULT '/' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `comments_status_created_idx` ON `comments` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `comments_ip_created_idx` ON `comments` (`ip_hash`,`created_at`);