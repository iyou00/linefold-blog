import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { SiteShell } from "@/components/site-shell";
import { ARCHIVE_PAGE_SIZE, formatDate, getPublishedPostPage } from "@/lib/posts";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "归档" };

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const requestedPage = Number((await searchParams).page || "1");
  if (!Number.isInteger(requestedPage) || requestedPage < 1) notFound();
  const pageResult = await getPublishedPostPage({ page: requestedPage, pageSize: ARCHIVE_PAGE_SIZE });
  if (requestedPage > pageResult.totalPages) notFound();
  const years = pageResult.posts.reduce<Record<string, typeof pageResult.posts>>((result, post) => {
    const year = new Date(post.publishedAt).getFullYear().toString();
    (result[year] ??= []).push(post);
    return result;
  }, {});
  return (
    <SiteShell active="ARCHIVE" artVariant="timeline">
      <PageIntro eyebrow="ARCHIVE / 归档" title="所有记录，按时间排列。" description={`目前共 ${pageResult.total} 篇文章。`} />
      <div className="archive-list">
        {Object.entries(years).map(([year, items]) => (
          <section key={year} className="archive-year">
            <h2>{year}</h2>
            <div>
              {items.map((post) => (
                <article key={post.id}>
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt).slice(5)}</time>
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  <span>{post.category === "tutorials" ? "TUTORIAL" : "NOTES"}</span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Pagination currentPage={pageResult.page} totalPages={pageResult.totalPages} basePath="/archive" />
    </SiteShell>
  );
}
