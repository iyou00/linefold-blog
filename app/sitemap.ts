import type { MetadataRoute } from "next";
import { getPublishedPostIndex } from "@/lib/posts";
import { getRuntimeValue } from "@/lib/runtime-env";
import { getPublishedWorkIndex } from "@/lib/works";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getRuntimeValue("SITE_URL") || "https://example.com";
  const [posts, works] = await Promise.all([getPublishedPostIndex(), getPublishedWorkIndex()]);
  const pages = ["", "/writing", "/works", "/archive", "/about"].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
  return [...pages, ...posts.map((post) => ({ url: `${base}/posts/${post.slug}`, lastModified: new Date(post.updatedAt) })), ...works.map((work) => ({ url: `${base}/works/${work.slug}`, lastModified: new Date(work.updatedAt) }))];
}
