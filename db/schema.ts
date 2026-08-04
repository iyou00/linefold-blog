import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    content: text("content").notNull().default(""),
    category: text("category", { enum: ["notes", "tutorials"] })
      .notNull()
      .default("notes"),
    tags: text("tags").notNull().default("[]"),
    coverImageUrl: text("cover_image_url"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    publishedAt: text("published_at").notNull(),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("posts_status_published_idx").on(table.status, table.publishedAt),
    index("posts_category_published_idx").on(
      table.category,
      table.publishedAt,
    ),
    index("posts_updated_idx").on(table.updatedAt, table.id),
  ],
);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const works = sqliteTable(
  "works",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    tags: text("tags").notNull().default("[]"),
    linkLabel: text("link_label").notNull().default(""),
    linkUrl: text("link_url"),
    showGallery: integer("show_gallery", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    publishedAt: text("published_at").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("works_status_published_idx").on(table.status, table.publishedAt),
    index("works_updated_idx").on(table.updatedAt, table.id),
  ],
);

export const workImages = sqliteTable(
  "work_images",
  {
    id: text("id").primaryKey(),
    workId: text("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: text("caption").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("work_images_work_order_idx").on(table.workId, table.sortOrder)],
);

export const workRelatedPosts = sqliteTable(
  "work_related_posts",
  {
    workId: text("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.workId, table.postId] }),
    index("work_related_posts_order_idx").on(table.workId, table.sortOrder),
  ],
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    nickname: text("nickname").notNull().default("ANON"),
    content: text("content").notNull(),
    sourcePath: text("source_path").notNull().default("/"),
    status: text("status", { enum: ["pending", "approved", "hidden"] })
      .notNull()
      .default("pending"),
    ipHash: text("ip_hash").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("comments_status_created_idx").on(table.status, table.createdAt),
    index("comments_ip_created_idx").on(table.ipHash, table.createdAt),
  ],
);

export type PostRow = typeof posts.$inferSelect;
export type NewPostRow = typeof posts.$inferInsert;
