import Link from "next/link";
import { FeaturedPost } from "@/components/featured-post";
import { PostList } from "@/components/post-list";
import { SiteShell } from "@/components/site-shell";
import { getPublishedPosts, getSiteSettings } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, settings] = await Promise.all([getPublishedPosts(10), getSiteSettings()]);
  const [featured, ...rest] = posts;

  return (
    <SiteShell active="INDEX">
      <section className="home-hero">
        <p className="eyebrow">PERSONAL ARCHIVE / {settings.startedYear}</p>
        <h1>{settings.heroLine1}<br />{settings.heroLine2}</h1>
        <p className="hero-intro">{settings.intro}</p>
        <Link className="text-link" href="/about">阅读关于我 →</Link>
      </section>

      <section className="latest-section">
        <p className="section-label">LATEST / 最近更新</p>
        {featured ? <FeaturedPost post={featured} /> : <p className="empty-state">第一篇记录正在路上。</p>}
        <PostList posts={rest} />
        {posts.length > 0 ? <Link className="text-link all-posts" href="/archive">查看全部文章 →</Link> : null}
      </section>
    </SiteShell>
  );
}
