import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { PostList } from "@/components/post-list";
import { SiteShell } from "@/components/site-shell";
import { getPublishedPostPage, type Category } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata = { title: "写作" };

const filters = [
  { value: "all", label: "ALL / 全部" },
  { value: "notes", label: "NOTES / 随笔" },
  { value: "tutorials", label: "TUTORIALS / 教程" },
] as const;

export default async function WritingPage({ searchParams }: { searchParams: Promise<{ page?: string; category?: string }> }) {
  const parameters = await searchParams;
  const requestedPage = Number(parameters.page || "1");
  const filter = parameters.category || "all";
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || !filters.some((item) => item.value === filter)) notFound();
  const category = filter === "all" ? undefined : filter as Category;
  const result = await getPublishedPostPage({ category, page: requestedPage });
  if (requestedPage > result.totalPages) notFound();

  return (
    <SiteShell active="WRITING" artVariant={category === "tutorials" ? "stacks" : "orbit"}>
      <PageIntro eyebrow="WRITING / 文字记录" title="日常、项目与可复用的方法。" description="随笔保存正在形成的想法，教程整理能够再次使用的实践。" />
      <nav className="writing-filter" aria-label="文章分类">
        {filters.map((item) => <Link key={item.value} href={item.value === "all" ? "/writing" : `/writing?category=${item.value}`} aria-current={filter === item.value ? "page" : undefined}>{item.label}</Link>)}
      </nav>
      <PostList posts={result.posts} />
      <Pagination currentPage={result.page} totalPages={result.totalPages} basePath="/writing" query={category ? { category } : {}} />
    </SiteShell>
  );
}
