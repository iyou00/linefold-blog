CREATE TABLE `work_images` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`url` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `work_images_work_order_idx` ON `work_images` (`work_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `work_related_posts` (
	`work_id` text NOT NULL,
	`post_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`work_id`, `post_id`),
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `work_related_posts_order_idx` ON `work_related_posts` (`work_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`link_label` text DEFAULT '' NOT NULL,
	`link_url` text,
	`show_gallery` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `works_slug_unique` ON `works` (`slug`);--> statement-breakpoint
CREATE INDEX `works_status_published_idx` ON `works` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `works_updated_idx` ON `works` (`updated_at`,`id`);