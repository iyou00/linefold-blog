import "server-only";
import { getDatabase } from "@/db";
import { isAllowedImageUrl } from "./image-policy";
import { getMarkdownImageUrls } from "./markdown-image-urls";
import { siteConfig } from "./site-config";

export type Category = "notes" | "tutorials";
export type PostInput = {
  slug?: string;
  title: string;
  summary: string;
  content: string;
  category: Category;
  tags: string[];
  coverImageUrl?: string;
  status: "draft" | "published";
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type PublicPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: Category;
  tags: string[];
  coverImageUrl: string | null;
  status: "draft" | "published";
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminPostSummary = Pick<PublicPost, "id" | "slug" | "title" | "category" | "tags" | "status" | "updatedAt">;
export type PublicPostListItem = Pick<PublicPost, "id" | "slug" | "title" | "summary" | "category" | "publishedAt">;
export type PaginatedPosts = { posts: PublicPostListItem[]; total: number; page: number; totalPages: number };
export type AdminPostPage = { posts: AdminPostSummary[]; total: number; nextCursor: string | null };

export const PUBLIC_PAGE_SIZE = 20;
export const ARCHIVE_PAGE_SIZE = 50;
export const ADMIN_PAGE_SIZE = 30;

type RawPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: Category;
  tags: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
};

const seedPosts: PublicPost[] = [
  { id: "seed-1", slug: "quiet-personal-website", title: "从零搭建一个安静、可靠的个人网站", summary: "从内容结构、部署方式到长期维护，记录一次个人网站的完整搭建过程。", content: "## 为什么重新做一个博客\n\n一个长期使用的个人网站，需要稳定的结构、清楚的内容和足够低的维护成本。\n\n> 记录本身，就是整理思考的过程。\n\n## 这次采用的原则\n\n- 文字优先\n- 响应式阅读\n- 资源本地化\n- 图片使用国内对象存储外链", category: "tutorials", tags: ["BLOG", "DESIGN"], coverImageUrl: null, status: "published", publishedAt: "2026-07-12T08:00:00.000Z", seoTitle: "从零搭建一个安静、可靠的个人网站", seoDescription: "个人博客的内容结构、部署方式与长期维护实践。", createdAt: "2026-07-12T08:00:00.000Z", updatedAt: "2026-07-12T08:00:00.000Z" },
  { id: "seed-2", slug: "rain-books-slow-work", title: "雨天，旧书，以及缓慢完成的事情", summary: "最近生活里留下来的几段小记。", content: "雨下了一整天。桌边放着一本读到一半的旧书，很多事情也在缓慢推进。\n\n速度放慢以后，细节开始变得清楚。", category: "notes", tags: ["DAILY"], coverImageUrl: null, status: "published", publishedAt: "2026-07-03T08:00:00.000Z", seoTitle: "", seoDescription: "", createdAt: "2026-07-03T08:00:00.000Z", updatedAt: "2026-07-03T08:00:00.000Z" },
  { id: "seed-3", slug: "minimal-reading-tool", title: "一个只保存重要信息的阅读工具", summary: "设计过程、技术取舍与最后的成品。", content: "## 项目缘起\n\n我想做一个更安静的阅读工具，让摘录和回顾都保持简单。\n\n## 过程\n\n项目从一个极小的原型开始，逐步补充搜索、标签和导出。", category: "notes", tags: ["PROJECT"], coverImageUrl: null, status: "published", publishedAt: "2026-06-18T08:00:00.000Z", seoTitle: "", seoDescription: "", createdAt: "2026-06-18T08:00:00.000Z", updatedAt: "2026-06-18T08:00:00.000Z" },
  { id: "seed-4", slug: "long-term-note-system", title: "如何整理一套可以长期使用的笔记系统", summary: "从收集、筛选到归档的个人方法。", content: "## 收集\n\n先让记录足够轻，再定期整理。\n\n## 筛选\n\n保留会再次使用、会改变判断、会推动行动的信息。", category: "tutorials", tags: ["NOTES"], coverImageUrl: null, status: "published", publishedAt: "2026-06-02T08:00:00.000Z", seoTitle: "", seoDescription: "", createdAt: "2026-06-02T08:00:00.000Z", updatedAt: "2026-06-02T08:00:00.000Z" },
  { id: "seed-5", slug: "focus-walking-restart", title: "关于专注、散步和重新开始", summary: "五月份的一些零散想法。", content: "散步给思考留下了没有安排的时间。重新开始，也常常发生在这些空白里。", category: "notes", tags: ["DAILY"], coverImageUrl: null, status: "published", publishedAt: "2026-05-21T08:00:00.000Z", seoTitle: "", seoDescription: "", createdAt: "2026-05-21T08:00:00.000Z", updatedAt: "2026-05-21T08:00:00.000Z" },
];

function parsePost(row: RawPost): PublicPost {
  let tags: string[] = [];
  try {
    const value = JSON.parse(row.tags);
    if (Array.isArray(value)) tags = value.map(String);
  } catch { tags = []; }
  return {
    id: row.id, slug: row.slug, title: row.title, summary: row.summary,
    content: row.content, category: row.category, tags,
    coverImageUrl: row.cover_image_url, status: row.status,
    publishedAt: row.published_at, seoTitle: row.seo_title,
    seoDescription: row.seo_description, createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)).replaceAll("/", ".");
}

export function readingMinutes(content: string) {
  return Math.max(1, Math.ceil(content.replace(/\s/g, "").length / 500));
}

export async function getPublishedPosts(limit?: number) {
  try {
    const db = await getDatabase();
    const rows = await db.all<RawPost>(`SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC, id DESC${limit ? " LIMIT ?" : ""}`, limit ? [limit] : []);
    return rows.length ? rows.map(parsePost) : seedPosts.slice(0, limit ?? seedPosts.length);
  } catch { return seedPosts.slice(0, limit ?? seedPosts.length); }
}

export async function getPublishedPostPage({ category, page, pageSize = PUBLIC_PAGE_SIZE }: { category?: Category; page: number; pageSize?: number }): Promise<PaginatedPosts> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  try {
    const db = await getDatabase();
    const where = category ? "WHERE status = 'published' AND category = ?" : "WHERE status = 'published'";
    const baseValues = category ? [category] : [];
    const [countRow] = await db.all<{ total: number }>(`SELECT COUNT(*) AS total FROM posts ${where}`, baseValues);
    const total = Number(countRow?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    if (safePage > totalPages) return { posts: [], total, page: safePage, totalPages };
    const rows = await db.all<{ id: string; slug: string; title: string; summary: string; category: Category; published_at: string }>(`SELECT id, slug, title, summary, category, published_at FROM posts ${where} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`, [...baseValues, safePageSize, (safePage - 1) * safePageSize]);
    return { posts: rows.map((row) => ({ id: row.id, slug: row.slug, title: row.title, summary: row.summary, category: row.category, publishedAt: row.published_at })), total, page: safePage, totalPages };
  } catch {
    const filtered = category ? seedPosts.filter((post) => post.category === category) : seedPosts;
    const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));
    return { posts: filtered.slice((safePage - 1) * safePageSize, safePage * safePageSize).map(({ id, slug, title, summary, category: postCategory, publishedAt }) => ({ id, slug, title, summary, category: postCategory, publishedAt })), total: filtered.length, page: safePage, totalPages };
  }
}

export async function getPublishedPostIndex() {
  try {
    const db = await getDatabase();
    return db.all<{ slug: string; updatedAt: string }>("SELECT slug, updated_at AS updatedAt FROM posts WHERE status = 'published' ORDER BY published_at DESC, id DESC");
  } catch { return seedPosts.map(({ slug, updatedAt }) => ({ slug, updatedAt })); }
}

export async function getPostsByCategory(category: Category) {
  try {
    const db = await getDatabase();
    const rows = await db.all<RawPost>("SELECT * FROM posts WHERE status = 'published' AND category = ? ORDER BY published_at DESC", [category]);
    return rows.length ? rows.map(parsePost) : seedPosts.filter((post) => post.category === category);
  } catch { return seedPosts.filter((post) => post.category === category); }
}

export async function getPostBySlug(slug: string) {
  try {
    const db = await getDatabase();
    const [row] = await db.all<RawPost>("SELECT * FROM posts WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    return row ? parsePost(row) : seedPosts.find((post) => post.slug === slug);
  } catch { return seedPosts.find((post) => post.slug === slug); }
}

function encodeAdminCursor(updatedAt: string, id: string) {
  return btoa(JSON.stringify([updatedAt, id])).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeAdminCursor(cursor?: string | null) {
  if (!cursor || cursor.length > 300) return null;
  try {
    const normalized = cursor.replaceAll("-", "+").replaceAll("_", "/");
    const [updatedAt, id] = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))) as unknown[];
    return typeof updatedAt === "string" && typeof id === "string" ? { updatedAt, id } : null;
  } catch { return null; }
}

export async function getAdminPostSummaries({ query = "", status = "all", cursor }: { query?: string; status?: "all" | PublicPost["status"]; cursor?: string | null } = {}): Promise<AdminPostPage> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const values: (string | number | null)[] = [];
  if (status !== "all") { conditions.push("status = ?"); values.push(status); }
  const safeQuery = query.trim().slice(0, 100);
  if (safeQuery) {
    conditions.push("(title LIKE ? OR slug LIKE ? OR tags LIKE ?)");
    const pattern = `%${safeQuery}%`;
    values.push(pattern, pattern, pattern);
  }
  const baseWhere = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRow] = await db.all<{ total: number }>(`SELECT COUNT(*) AS total FROM posts ${baseWhere}`, values);
  const cursorValue = decodeAdminCursor(cursor);
  const pageConditions = [...conditions];
  const pageValues = [...values];
  if (cursorValue) {
    pageConditions.push("(updated_at < ? OR (updated_at = ? AND id < ?))");
    pageValues.push(cursorValue.updatedAt, cursorValue.updatedAt, cursorValue.id);
  }
  const where = pageConditions.length ? `WHERE ${pageConditions.join(" AND ")}` : "";
  const rows = await db.all<Pick<RawPost, "id" | "slug" | "title" | "category" | "tags" | "status" | "updated_at">>(
    `SELECT id, slug, title, category, tags, status, updated_at FROM posts ${where} ORDER BY updated_at DESC, id DESC LIMIT ?`,
    [...pageValues, ADMIN_PAGE_SIZE + 1],
  );
  const hasMore = rows.length > ADMIN_PAGE_SIZE;
  const pageRows = rows.slice(0, ADMIN_PAGE_SIZE);
  const posts = pageRows.map((row) => {
    let tags: string[] = [];
    try { const parsed = JSON.parse(row.tags); if (Array.isArray(parsed)) tags = parsed.map(String); } catch { tags = []; }
    return { id: row.id, slug: row.slug, title: row.title, category: row.category, tags, status: row.status, updatedAt: row.updated_at };
  });
  const last = pageRows.at(-1);
  return { posts, total: Number(countRow?.total || 0), nextCursor: hasMore && last ? encodeAdminCursor(last.updated_at, last.id) : null };
}

export async function getAdminPostById(id: string) {
  const db = await getDatabase();
  const [row] = await db.all<RawPost>("SELECT * FROM posts WHERE id = ? LIMIT 1", [id]);
  return row ? parsePost(row) : null;
}

function normalizeInput(input: PostInput, existing?: PublicPost): PublicPost {
  const now = new Date().toISOString();
  const slug = (input.slug || `article-${Date.now()}`).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!input.title.trim()) throw new Error("标题不能为空");
  if (!slug) throw new Error("文章路径不能为空");
  if (input.coverImageUrl && !isAllowedImageUrl(input.coverImageUrl)) throw new Error("图片地址未包含在国内资源白名单中");
  const contentImageUrls = getMarkdownImageUrls(input.content);
  if (contentImageUrls.some((url) => !isAllowedImageUrl(url))) throw new Error("正文图片包含未加入国内资源白名单的地址");
  return {
    id: existing?.id ?? crypto.randomUUID(), slug, title: input.title.trim(),
    summary: input.summary.trim(), content: input.content.trim(), category: input.category,
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean), coverImageUrl: input.coverImageUrl?.trim() || null,
    status: input.status, publishedAt: new Date(input.publishedAt || now).toISOString(),
    seoTitle: input.seoTitle?.trim() || "", seoDescription: input.seoDescription?.trim() || "",
    createdAt: existing?.createdAt ?? now, updatedAt: now,
  };
}

function postValues(post: PublicPost) {
  return [post.id, post.slug, post.title, post.summary, post.content, post.category, JSON.stringify(post.tags), post.coverImageUrl, post.status, post.publishedAt, post.seoTitle, post.seoDescription, post.createdAt, post.updatedAt];
}

export async function createPost(input: PostInput) {
  const post = normalizeInput(input);
  const db = await getDatabase();
  await db.run("INSERT INTO posts (id, slug, title, summary, content, category, tags, cover_image_url, status, published_at, seo_title, seo_description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", postValues(post));
  return post;
}

export async function updatePost(id: string, input: PostInput) {
  const db = await getDatabase();
  const [row] = await db.all<RawPost>("SELECT * FROM posts WHERE id = ? LIMIT 1", [id]);
  if (!row) throw new Error("文章不存在");
  const post = normalizeInput(input, parsePost(row));
  await db.run("UPDATE posts SET slug = ?, title = ?, summary = ?, content = ?, category = ?, tags = ?, cover_image_url = ?, status = ?, published_at = ?, seo_title = ?, seo_description = ?, updated_at = ? WHERE id = ?", [post.slug, post.title, post.summary, post.content, post.category, JSON.stringify(post.tags), post.coverImageUrl, post.status, post.publishedAt, post.seoTitle, post.seoDescription, post.updatedAt, id]);
  return post;
}

export async function deletePost(id: string) {
  const db = await getDatabase();
  await db.run("DELETE FROM posts WHERE id = ?", [id]);
}

export type SiteSettings = {
  siteName: string;
  shortName: string;
  author: string;
  description: string;
  contactEmail: string;
  showEmail: string;
  footerCopyright: string;
  startedYear: string;
  heroLine1: string;
  heroLine2: string;
  intro: string;
  about: string;
  icpNumber: string;
  publicSecurityNumber: string;
  publicSecurityUrl: string;
  social1Platform: string;
  social1Url: string;
  social2Platform: string;
  social2Url: string;
  social3Platform: string;
  social3Url: string;
  social4Platform: string;
  social4Url: string;
};
const defaultSettings: SiteSettings = {
  siteName: siteConfig.name,
  shortName: siteConfig.name,
  author: siteConfig.author,
  description: siteConfig.description,
  contactEmail: "hello@example.com",
  showEmail: "true",
  footerCopyright: "",
  startedYear: "2026",
  heroLine1: siteConfig.hero[0], heroLine2: siteConfig.hero[1], intro: siteConfig.intro,
  about: "这里是 M 的长期个人记录。我写做过的项目，也写日常里值得留下的感受；遇到能够反复使用的方法，就把它整理成一篇教程。\n\n写作帮助我看清一件事怎样发生，也让零散经验拥有可以再次抵达的路径。这里追求清楚、诚实和耐读，更新遵循自己的节奏。",
  icpNumber: "",
  publicSecurityNumber: "",
  publicSecurityUrl: "",
  social1Platform: "", social1Url: "",
  social2Platform: "", social2Url: "",
  social3Platform: "", social3Url: "",
  social4Platform: "", social4Url: "",
};

const socialPlatforms = new Set(["", "douyin", "xiaohongshu", "x", "bilibili", "weibo", "github", "website"]);

export async function getSiteSettings() {
  try {
    const db = await getDatabase();
    const rows = await db.all<{ key: string; value: string }>("SELECT key, value FROM site_settings ORDER BY key");
    return { ...defaultSettings, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) } as SiteSettings;
  } catch { return defaultSettings; }
}

export async function saveSiteSettings(input: SiteSettings) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const values = { ...defaultSettings };
  for (const key of Object.keys(defaultSettings) as (keyof SiteSettings)[]) {
    if (typeof input[key] === "string") values[key] = input[key];
  }
  if (!values.siteName.trim() || !values.shortName.trim()) throw new Error("网站名称不能为空");
  if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) throw new Error("联系邮箱格式不正确");
  if (!["true", "false"].includes(values.showEmail)) throw new Error("右栏显示设置无效");
  if (!/^\d{4}$/.test(values.startedYear)) throw new Error("开始记录年份需要填写四位年份");
  if (values.publicSecurityUrl && !isHttpsUrl(values.publicSecurityUrl)) throw new Error("公安备案链接需要使用 HTTPS");
  for (const index of [1, 2, 3, 4] as const) {
    const platform = values[`social${index}Platform`].trim();
    const url = values[`social${index}Url`].trim();
    if (!socialPlatforms.has(platform)) throw new Error(`社交入口 ${index} 的平台无效`);
    if ((platform && !url) || (!platform && url)) throw new Error(`社交入口 ${index} 需要同时选择平台并填写链接`);
    if (url && !isHttpsUrl(url)) throw new Error(`社交入口 ${index} 需要使用 HTTPS`);
  }
  for (const [key, value] of Object.entries(values)) {
    await db.run("INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at", [key, value.trim(), now]);
  }
}

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
