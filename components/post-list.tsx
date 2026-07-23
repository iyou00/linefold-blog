import Link from "next/link";
import type { PublicPostListItem } from "@/lib/posts";
import { formatDate } from "@/lib/posts";

type PostListProps = { posts: PublicPostListItem[] };

export function PostList({ posts }: PostListProps) {
  return (
    <div className="post-list">
      {posts.map((post) => (
        <article className="post-row" key={post.id}>
          <p className="post-meta compact">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span>{post.category === "tutorials" ? "TUTORIAL" : "NOTES"}</span>
          </p>
          <div>
            <h2><Link href={`/posts/${post.slug}`}>{post.title}</Link></h2>
            <p className="post-summary">{post.summary}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
