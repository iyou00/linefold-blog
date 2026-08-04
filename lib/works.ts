import "server-only";
import { getDatabase, type DatabaseStatement } from "@/db";
import { isAllowedImageUrl } from "./image-policy";
import type { Category } from "./posts";

export type WorkStatus = "draft" | "published";
export type WorkImageInput = { url: string; caption: string };
export type WorkInput = {
  slug?: string;
  title: string;
  summary: string;
  tags: string[];
  linkLabel?: string;
  linkUrl?: string;
  showGallery: boolean;
  images: WorkImageInput[];
  relatedPostIds: string[];
  status: WorkStatus;
  publishedAt: string;
};

export type WorkImage = WorkImageInput & { id: string; sortOrder: number };
export type RelatedPost = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  publishedAt: string;
};
export type PublicWork = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  linkLabel: string;
  linkUrl: string | null;
  showGallery: boolean;
  status: WorkStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  images: WorkImage[];
  relatedPosts: RelatedPost[];
};
export type PublicWorkListItem = Pick<PublicWork, "id" | "slug" | "title" | "summary" | "tags" | "publishedAt">;
export type AdminWorkSummary = Pick<PublicWork, "id" | "slug" | "title" | "status" | "updatedAt">;
export type RelatedPostOption = Pick<RelatedPost, "id" | "slug" | "title" | "category">;

type RawWork = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string;
  link_label: string;
  link_url: string | null;
  show_gallery: number;
  status: WorkStatus;
  published_at: string;
  created_at: string;
  updated_at: string;
};

type RawImage = { id: string; url: string; caption: string; sort_order: number };
type RawRelatedPost = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  published_at: string;
};

function parseTags(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseWork(row: RawWork): Omit<PublicWork, "images" | "relatedPosts"> {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    tags: parseTags(row.tags),
    linkLabel: row.link_label,
    linkUrl: row.link_url,
    showGallery: Boolean(row.show_gallery),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSlug(value: string | undefined) {
  return (value || `work-${Date.now()}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeInput(input: WorkInput, existing?: PublicWork): PublicWork {
  const now = new Date().toISOString();
  const title = input.title?.trim();
  const slug = normalizeSlug(input.slug);
  const summary = input.summary?.trim() || "";
  if (!title) throw new Error("作品名称不能为空");
  if (title.length > 100) throw new Error("作品名称不能超过 100 个字");
  if (!slug) throw new Error("作品路径不能为空");
  if (summary.length > 600) throw new Error("作品简介不能超过 600 个字");
  if (input.status !== "draft" && input.status !== "published") throw new Error("作品状态无效");

  const publishedAt = new Date(input.publishedAt || now);
  if (Number.isNaN(publishedAt.getTime())) throw new Error("发布时间无效");

  const tags = [...new Set((Array.isArray(input.tags) ? input.tags : []).filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim().toUpperCase()).filter(Boolean))];
  if (tags.length > 6) throw new Error("每个作品最多配置 6 个标签");
  if (tags.some((tag) => tag.length > 24)) throw new Error("每个作品标签不能超过 24 个字符");

  const linkUrl = input.linkUrl?.trim() || null;
  const linkLabel = linkUrl ? input.linkLabel?.trim() || "查看项目" : "";
  if (linkUrl && !isHttpsUrl(linkUrl)) throw new Error("项目链接需要使用 HTTPS");
  if (linkLabel.length > 40) throw new Error("链接文字不能超过 40 个字");

  const images = (Array.isArray(input.images) ? input.images : [])
    .filter((image): image is WorkImageInput => Boolean(image) && typeof image.url === "string" && typeof image.caption === "string")
    .map((image) => ({ url: image.url.trim(), caption: image.caption.trim() }))
    .filter((image) => image.url);
  if (images.length > 12) throw new Error("每个作品最多配置 12 张图片");
  if (images.some((image) => !isAllowedImageUrl(image.url))) throw new Error("作品图片地址未包含在国内资源白名单中");
  if (images.some((image) => image.caption.length > 120)) throw new Error("图片说明不能超过 120 个字");

  const relatedPostIds = [...new Set((Array.isArray(input.relatedPostIds) ? input.relatedPostIds : []).filter((id): id is string => typeof id === "string" && Boolean(id)))];
  if (relatedPostIds.length > 3) throw new Error("每个作品最多关联 3 篇文章");

  return {
    id: existing?.id || crypto.randomUUID(),
    slug,
    title,
    summary,
    tags,
    linkLabel,
    linkUrl,
    showGallery: input.showGallery === true,
    status: input.status,
    publishedAt: publishedAt.toISOString(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    images: images.map((image, sortOrder) => ({ id: crypto.randomUUID(), ...image, sortOrder })),
    relatedPosts: relatedPostIds.map((id) => ({ id, slug: "", title: "", category: "notes", publishedAt: "" })),
  };
}

async function assertRelatedPostsExist(ids: string[]) {
  if (!ids.length) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await db.all<{ id: string }>(`SELECT id FROM posts WHERE id IN (${placeholders}) AND status = 'published'`, ids);
  if (rows.length !== ids.length) throw new Error("关联文章不存在或尚未发布");
}

async function assertSlugAvailable(slug: string, existingId?: string) {
  const db = await getDatabase();
  const [row] = await db.all<{ id: string }>("SELECT id FROM works WHERE slug = ? LIMIT 1", [slug]);
  if (row && row.id !== existingId) throw new Error("作品路径已存在，请更换后再保存");
}

async function hydrateWork(row: RawWork): Promise<PublicWork> {
  const db = await getDatabase();
  const [images, relatedRows] = await Promise.all([
    db.all<RawImage>("SELECT id, url, caption, sort_order FROM work_images WHERE work_id = ? ORDER BY sort_order, id", [row.id]),
    db.all<RawRelatedPost>(
      "SELECT p.id, p.slug, p.title, p.category, p.published_at FROM work_related_posts wrp JOIN posts p ON p.id = wrp.post_id WHERE wrp.work_id = ? AND p.status = 'published' ORDER BY wrp.sort_order, p.id LIMIT 3",
      [row.id],
    ),
  ]);
  return {
    ...parseWork(row),
    images: images.map((image) => ({ id: image.id, url: image.url, caption: image.caption, sortOrder: image.sort_order })),
    relatedPosts: relatedRows.map((post) => ({ id: post.id, slug: post.slug, title: post.title, category: post.category, publishedAt: post.published_at })),
  };
}

export async function getPublishedWorks(): Promise<PublicWorkListItem[]> {
  try {
    const db = await getDatabase();
    const rows = await db.all<Pick<RawWork, "id" | "slug" | "title" | "summary" | "tags" | "published_at">>(
      "SELECT id, slug, title, summary, tags, published_at FROM works WHERE status = 'published' ORDER BY published_at DESC, id DESC",
    );
    return rows.map((row) => ({ id: row.id, slug: row.slug, title: row.title, summary: row.summary, tags: parseTags(row.tags), publishedAt: row.published_at }));
  } catch {
    return [];
  }
}

export async function getPublishedWorkIndex() {
  try {
    const db = await getDatabase();
    return db.all<{ slug: string; updatedAt: string }>("SELECT slug, updated_at AS updatedAt FROM works WHERE status = 'published' ORDER BY published_at DESC, id DESC");
  } catch {
    return [];
  }
}

export async function getPublishedWorkBySlug(slug: string) {
  try {
    const db = await getDatabase();
    const [row] = await db.all<RawWork>("SELECT * FROM works WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    return row ? hydrateWork(row) : null;
  } catch {
    return null;
  }
}

export async function getAdminWorks() {
  const db = await getDatabase();
  const rows = await db.all<Pick<RawWork, "id" | "slug" | "title" | "status" | "updated_at">>(
    "SELECT id, slug, title, status, updated_at FROM works ORDER BY updated_at DESC, id DESC",
  );
  return rows.map((row) => ({ id: row.id, slug: row.slug, title: row.title, status: row.status, updatedAt: row.updated_at }));
}

export async function getAdminWorkById(id: string) {
  const db = await getDatabase();
  const [row] = await db.all<RawWork>("SELECT * FROM works WHERE id = ? LIMIT 1", [id]);
  return row ? hydrateWork(row) : null;
}

export async function getRelatedPostOptions(): Promise<RelatedPostOption[]> {
  const db = await getDatabase();
  const rows = await db.all<RelatedPostOption>(
    "SELECT id, slug, title, category FROM posts WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 200",
  );
  return rows.map((post) => ({ id: post.id, slug: post.slug, title: post.title, category: post.category }));
}

function writeStatements(work: PublicWork, mode: "create" | "update"): DatabaseStatement[] {
  const statements: DatabaseStatement[] = mode === "create"
    ? [{
        sql: "INSERT INTO works (id, slug, title, summary, tags, link_label, link_url, show_gallery, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        values: [work.id, work.slug, work.title, work.summary, JSON.stringify(work.tags), work.linkLabel, work.linkUrl, Number(work.showGallery), work.status, work.publishedAt, work.createdAt, work.updatedAt],
      }]
    : [{
        sql: "UPDATE works SET slug = ?, title = ?, summary = ?, tags = ?, link_label = ?, link_url = ?, show_gallery = ?, status = ?, published_at = ?, updated_at = ? WHERE id = ?",
        values: [work.slug, work.title, work.summary, JSON.stringify(work.tags), work.linkLabel, work.linkUrl, Number(work.showGallery), work.status, work.publishedAt, work.updatedAt, work.id],
      }, { sql: "DELETE FROM work_images WHERE work_id = ?", values: [work.id] }, { sql: "DELETE FROM work_related_posts WHERE work_id = ?", values: [work.id] }];

  for (const image of work.images) {
    statements.push({
      sql: "INSERT INTO work_images (id, work_id, url, caption, sort_order) VALUES (?, ?, ?, ?, ?)",
      values: [image.id, work.id, image.url, image.caption, image.sortOrder],
    });
  }
  for (const [sortOrder, post] of work.relatedPosts.entries()) {
    statements.push({
      sql: "INSERT INTO work_related_posts (work_id, post_id, sort_order) VALUES (?, ?, ?)",
      values: [work.id, post.id, sortOrder],
    });
  }
  return statements;
}

export async function createWork(input: WorkInput) {
  const work = normalizeInput(input);
  await assertSlugAvailable(work.slug);
  await assertRelatedPostsExist(work.relatedPosts.map((post) => post.id));
  const db = await getDatabase();
  await db.batch(writeStatements(work, "create"));
  return getAdminWorkById(work.id);
}

export async function updateWork(id: string, input: WorkInput) {
  const existing = await getAdminWorkById(id);
  if (!existing) throw new Error("作品不存在");
  const work = normalizeInput(input, existing);
  await assertSlugAvailable(work.slug, id);
  await assertRelatedPostsExist(work.relatedPosts.map((post) => post.id));
  const db = await getDatabase();
  await db.batch(writeStatements(work, "update"));
  return getAdminWorkById(id);
}

export async function deleteWork(id: string) {
  const db = await getDatabase();
  await db.run("DELETE FROM works WHERE id = ?", [id]);
}
