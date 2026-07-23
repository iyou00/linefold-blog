"use client";

import type { AdminPost, AdminPostSummary } from "./admin-types";

type Props = {
  posts: AdminPostSummary[];
  total: number;
  selectedId: string | null;
  query: string;
  filter: "all" | AdminPost["status"];
  loading: boolean;
  hasMore: boolean;
  onNew: () => void;
  onSelect: (post: AdminPostSummary) => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onFilter: (value: "all" | AdminPost["status"]) => void;
  onLoadMore: () => void;
};

const shortDateFormatter = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" });

export function AdminPostList({ posts, total, selectedId, query, filter, loading, hasMore, onNew, onSelect, onQueryChange, onSearch, onFilter, onLoadMore }: Props) {
  return (
    <section className="admin-list" aria-label="文章列表" aria-busy={loading}>
      <div className="admin-list-heading">
        <div><strong>文章</strong><span>{total} 篇</span></div>
        <button className="new-post-button" type="button" onClick={onNew}>＋ 新建</button>
      </div>
      <form className="admin-search" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
        <label><span className="sr-only">搜索文章</span><input value={query} maxLength={100} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题、路径或标签" /></label>
        <button type="submit" aria-label="搜索">⌕</button>
      </form>
      <div className="admin-filter" aria-label="文章状态筛选">
        {(["all", "published", "draft"] as const).map((value) => (
          <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => onFilter(value)}>
            {value === "all" ? "全部" : value === "published" ? "已发布" : "草稿"}
          </button>
        ))}
      </div>
      <div className="admin-post-items">
        {posts.map((post) => (
          <button key={post.id} type="button" className={post.id === selectedId ? "post-selector active" : "post-selector"} onClick={() => onSelect(post)}>
            <span>{post.status === "published" ? "已发布" : "草稿"} · {post.category === "tutorials" ? "教程" : "随笔"}</span>
            <strong>{post.title}</strong>
            <small>{shortDateFormatter.format(new Date(post.updatedAt))} 更新</small>
          </button>
        ))}
        {!posts.length && !loading ? <p className="admin-list-empty">没有符合条件的文章。</p> : null}
        {hasMore ? <button className="load-more-button" type="button" disabled={loading} onClick={onLoadMore}>{loading ? "加载中…" : "加载更多"}</button> : null}
      </div>
    </section>
  );
}
