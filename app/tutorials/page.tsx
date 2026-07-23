import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { PostList } from "@/components/post-list";
import { SiteShell } from "@/components/site-shell";
import { getPublishedPostPage } from "@/lib/posts";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "教程" };

export default async function TutorialsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const requestedPage = Number((await searchParams).page || "1");
  if (!Number.isInteger(requestedPage) || requestedPage < 1) notFound();
  const result = await getPublishedPostPage({ category: "tutorials", page: requestedPage });
  if (requestedPage > result.totalPages) notFound();
  return (
    <SiteShell active="TUTORIALS" artVariant="stacks">
      <PageIntro eyebrow="TUTORIALS / 教程" title="可以再次使用的方法。" description="技术实践、工具方法，以及被整理清楚的解决过程。" />
      <PostList posts={result.posts} />
      <Pagination currentPage={result.page} totalPages={result.totalPages} basePath="/tutorials" />
    </SiteShell>
  );
}
