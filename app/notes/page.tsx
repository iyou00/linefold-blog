import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { PostList } from "@/components/post-list";
import { SiteShell } from "@/components/site-shell";
import { getPublishedPostPage } from "@/lib/posts";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "随笔" };

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const requestedPage = Number((await searchParams).page || "1");
  if (!Number.isInteger(requestedPage) || requestedPage < 1) notFound();
  const result = await getPublishedPostPage({ category: "notes", page: requestedPage });
  if (requestedPage > result.totalPages) notFound();
  return (
    <SiteShell active="NOTES" artVariant="orbit">
      <PageIntro eyebrow="NOTES / 随笔" title="日常留下来的文字。" description="关于生活、阅读、项目过程和正在形成的想法。" />
      <PostList posts={result.posts} />
      <Pagination currentPage={result.page} totalPages={result.totalPages} basePath="/notes" />
    </SiteShell>
  );
}
