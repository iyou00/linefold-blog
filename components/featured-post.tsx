import Link from "next/link";
import type { PublicPost } from "@/lib/posts";
import { formatDate, readingMinutes } from "@/lib/posts";

type FeaturedPostProps = { post: PublicPost };

export function FeaturedPost({ post }: FeaturedPostProps) {
  return (
    <article className="featured-post">
      <p className="post-meta">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        <span>{post.category === "tutorials" ? "TUTORIAL" : "NOTES"}</span>
        <span>约 {readingMinutes(post.content)} 分钟</span>
      </p>
      <h2><Link href={`/posts/${post.slug}`}>{post.title}</Link></h2>
      <p className="post-summary">{post.summary}</p>
      <Link className="text-link" href={`/posts/${post.slug}`}>继续阅读 →</Link>
    </article>
  );
}
