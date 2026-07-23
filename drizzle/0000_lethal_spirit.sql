CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'notes' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`cover_image_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text NOT NULL,
	`seo_title` text DEFAULT '' NOT NULL,
	`seo_description` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `posts_status_published_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `posts_category_published_idx` ON `posts` (`category`,`published_at`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `posts` (`id`,`slug`,`title`,`summary`,`content`,`category`,`tags`,`cover_image_url`,`status`,`published_at`,`seo_title`,`seo_description`,`created_at`,`updated_at`) VALUES
('seed-1','quiet-personal-website','从零搭建一个安静、可靠的个人网站','从内容结构、部署方式到长期维护，记录一次个人网站的完整搭建过程。','## 为什么重新做一个博客\n\n一个长期使用的个人网站，需要稳定的结构、清楚的内容和足够低的维护成本。\n\n> 记录本身，就是整理思考的过程。','tutorials','["BLOG","DESIGN"]',NULL,'published','2026-07-12T08:00:00.000Z','从零搭建一个安静、可靠的个人网站','个人博客的内容结构、部署方式与长期维护实践。','2026-07-12T08:00:00.000Z','2026-07-12T08:00:00.000Z'),
('seed-2','rain-books-slow-work','雨天，旧书，以及缓慢完成的事情','最近生活里留下来的几段小记。','雨下了一整天。桌边放着一本读到一半的旧书，很多事情也在缓慢推进。','notes','["DAILY"]',NULL,'published','2026-07-03T08:00:00.000Z','','','2026-07-03T08:00:00.000Z','2026-07-03T08:00:00.000Z'),
('seed-3','minimal-reading-tool','一个只保存重要信息的阅读工具','设计过程、技术取舍与最后的成品。','## 项目缘起\n\n我想做一个更安静的阅读工具，让摘录和回顾都保持简单。','notes','["PROJECT"]',NULL,'published','2026-06-18T08:00:00.000Z','','','2026-06-18T08:00:00.000Z','2026-06-18T08:00:00.000Z'),
('seed-4','long-term-note-system','如何整理一套可以长期使用的笔记系统','从收集、筛选到归档的个人方法。','## 收集\n\n先让记录足够轻，再定期整理。','tutorials','["NOTES"]',NULL,'published','2026-06-02T08:00:00.000Z','','','2026-06-02T08:00:00.000Z','2026-06-02T08:00:00.000Z'),
('seed-5','focus-walking-restart','关于专注、散步和重新开始','五月份的一些零散想法。','散步给思考留下了没有安排的时间。重新开始，也常常发生在这些空白里。','notes','["DAILY"]',NULL,'published','2026-05-21T08:00:00.000Z','','','2026-05-21T08:00:00.000Z','2026-05-21T08:00:00.000Z');
