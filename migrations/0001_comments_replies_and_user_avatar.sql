ALTER TABLE `users` ADD COLUMN `avatar_url` text;

ALTER TABLE `comments` ADD COLUMN `parent_comment_id` integer REFERENCES `comments`(`id`) ON DELETE cascade;
CREATE INDEX `comments_parent_comment_id_idx` ON `comments` (`parent_comment_id`);
