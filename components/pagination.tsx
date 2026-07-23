import Link from "next/link";

type Props = { currentPage: number; totalPages: number; basePath: string };

function pageHref(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="文章分页">
      {currentPage > 1 ? <Link rel="prev" href={pageHref(basePath, currentPage - 1)}>← 上一页</Link> : <span aria-disabled="true">← 上一页</span>}
      <span>第 {currentPage} / {totalPages} 页</span>
      {currentPage < totalPages ? <Link rel="next" href={pageHref(basePath, currentPage + 1)}>下一页 →</Link> : <span aria-disabled="true">下一页 →</span>}
    </nav>
  );
}
