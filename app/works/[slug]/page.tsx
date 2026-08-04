import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell, selectArticleArt } from "@/components/site-shell";
import { WorkGallery } from "@/components/work-gallery";
import { formatDate, getSiteSettings } from "@/lib/posts";
import { getPublishedWorkBySlug } from "@/lib/works";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getPublishedWorkBySlug(slug);
  if (!work) return {};
  return {
    title: work.title,
    description: work.summary,
    alternates: { canonical: `/works/${work.slug}` },
    openGraph: { type: "website", title: work.title, description: work.summary, url: `/works/${work.slug}`, images: [work.images[0]?.url || "/og-linefold.png"] },
    twitter: { card: "summary_large_image", title: work.title, description: work.summary, images: [work.images[0]?.url || "/og-linefold.png"] },
  };
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [work, settings] = await Promise.all([getPublishedWorkBySlug(slug), getSiteSettings()]);
  if (!work) notFound();
  const baseUrl = new URL(process.env.SITE_URL || "http://localhost:3100");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: work.title,
    description: work.summary,
    url: new URL(`/works/${work.slug}`, baseUrl).toString(),
    datePublished: work.publishedAt,
    dateModified: work.updatedAt,
    creator: { "@type": "Person", name: settings.author },
    keywords: work.tags.join(", "),
  };

  return (
    <SiteShell active="WORKS" artVariant={selectArticleArt(work.slug)} showComments>
      <article className="case-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
        <header className="case-hero">
          <Link className="back-link" href="/works">← BACK TO WORKS</Link>
          <p className="case-kicker">CASE / {work.slug.toUpperCase()}</p>
          <h1>{work.title}</h1>
          <p className="case-summary">{work.summary}</p>
          <dl className="case-facts">
            <div><dt>PUBLISHED</dt><dd><time dateTime={work.publishedAt}>{formatDate(work.publishedAt)}</time></dd></div>
            {work.linkUrl ? <div><dt>LINK</dt><dd><a href={work.linkUrl} target="_blank" rel="noreferrer">{work.linkLabel || "查看项目"} ↗</a></dd></div> : null}
          </dl>
        </header>

        {work.showGallery ? <WorkGallery title={work.title} slug={work.slug} images={work.images} /> : null}

        {work.relatedPosts.length ? <section className="case-related" aria-label="关联记录">
          <header className="case-related-head"><p>RELATED WRITING / 关联记录</p><span>{String(work.relatedPosts.length).padStart(2, "0")} NOTES</span></header>
          <div className="case-related-list">{work.relatedPosts.map((post, index) => <Link className="related-link" href={`/posts/${post.slug}`} key={post.id}><span className="related-number">{String(index + 1).padStart(2, "0")}</span><span className="related-title">{post.title}</span><span className="related-kind">{post.category === "tutorials" ? "TUTORIAL" : "NOTES"} ↗</span></Link>)}</div>
        </section> : null}
        <footer className="case-end"><Link href="/works">← BACK TO WORKS</Link></footer>
      </article>
    </SiteShell>
  );
}
