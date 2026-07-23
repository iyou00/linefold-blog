import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element -- External object-storage images have unknown dimensions and are intentionally not proxied. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import { selectArticleArt, SiteShell } from "@/components/site-shell";
import { getAllowedImageHosts } from "@/lib/image-policy";
import { formatDate, getPostBySlug, getSiteSettings, readingMinutes } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);
  if (!post) return {};
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.summary;
  const images = [post.coverImageUrl || "/og-linefold.png"];
  return {
    title,
    description,
    alternates: { canonical: `/posts/${post.slug}` },
    authors: [{ name: settings.author }],
    openGraph: {
      type: "article", locale: "zh_CN", siteName: settings.siteName,
      title, description, url: `/posts/${post.slug}`, images,
      publishedTime: post.publishedAt, modifiedTime: post.updatedAt,
      authors: [settings.author], tags: post.tags,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);
  if (!post) notFound();
  const baseUrl = new URL(process.env.SITE_URL || "http://localhost:3100");
  const articleUrl = new URL(`/posts/${post.slug}`, baseUrl).toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.summary,
    mainEntityOfPage: articleUrl,
    url: articleUrl,
    image: new URL(post.coverImageUrl || "/og-linefold.png", baseUrl).toString(),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: settings.author },
    publisher: { "@type": "Person", name: settings.author },
    keywords: post.tags.join(", "),
  };
  return (
    <SiteShell
      active={post.category === "tutorials" ? "TUTORIALS" : "NOTES"}
      artVariant={selectArticleArt(post.slug)}
    >
      <article className="article-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
        <header>
          <Link className="back-link" href={post.category === "tutorials" ? "/tutorials" : "/notes"}>← 返回列表</Link>
          <p className="post-meta">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span>{post.category === "tutorials" ? "TUTORIAL" : "NOTES"}</span>
            <span>约 {readingMinutes(post.content)} 分钟</span>
          </p>
          <h1>{post.title}</h1>
          <p className="article-deck">{post.summary}</p>
          {post.tags.length ? <div className="tag-row">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
        </header>
        {post.coverImageUrl ? <figure className="article-cover"><img src={post.coverImageUrl} alt={`${post.title} 配图`} referrerPolicy="no-referrer" /></figure> : null}
        <div className="article-body"><MarkdownContent markdown={post.content} allowedImageHosts={getAllowedImageHosts()} /></div>
      </article>
    </SiteShell>
  );
}
