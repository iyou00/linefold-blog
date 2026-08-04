"use client";

import type { AdminWorkSummary } from "./admin-types";

type Props = {
  works: AdminWorkSummary[];
  selectedId: string | null;
  loading: boolean;
  onNew: () => void;
  onSelect: (work: AdminWorkSummary) => void;
};

const shortDateFormatter = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" });

export function AdminWorkList({ works, selectedId, loading, onNew, onSelect }: Props) {
  return (
    <section className="admin-list" aria-label="作品列表" aria-busy={loading}>
      <div className="admin-list-heading">
        <div><strong>作品</strong><span>{works.length} 个</span></div>
        <button className="new-post-button" type="button" onClick={onNew}>＋ 新建</button>
      </div>
      <p className="admin-list-note">作品按发布时间展示，概念构图由作品路径稳定生成。</p>
      <div className="admin-post-items">
        {works.map((work) => (
          <button key={work.id} type="button" className={work.id === selectedId ? "post-selector active" : "post-selector"} onClick={() => onSelect(work)}>
            <span>{work.status === "published" ? "已发布" : "草稿"} · WORK</span>
            <strong>{work.title}</strong>
            <small>{shortDateFormatter.format(new Date(work.updatedAt))} 更新</small>
          </button>
        ))}
        {!works.length && !loading ? <p className="admin-list-empty">还没有作品，先创建第一件作品。</p> : null}
      </div>
    </section>
  );
}
