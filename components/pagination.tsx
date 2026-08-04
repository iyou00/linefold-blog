import Link from "next/link";

type Props = { currentPage: number; totalPages: number; basePath: string; query?: Record<string, string> };

function pageHref(basePath: string, page: number, query: Record<string, string>) {
  const parameters = new URLSearchParams(query);
  if (page > 1) parameters.set("page", String(page));
  const suffix = parameters.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function Pagination({ currentPage, totalPages, basePath, query = {} }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="文章分页">
      {currentPage > 1 ? <Link rel="prev" href={pageHref(basePath, currentPage - 1, query)}>← 上一页</Link> : <span aria-disabled="true">← 上一页</span>}
      <span>第 {currentPage} / {totalPages} 页</span>
      {currentPage < totalPages ? <Link rel="next" href={pageHref(basePath, currentPage + 1, query)}>下一页 →</Link> : <span aria-disabled="true">下一页 →</span>}
    </nav>
  );
}
