"use client";

import { useMemo, useState } from "react";
import type { AdminComment, CommentStatus } from "@/lib/comments";

type Props = {
  comments: AdminComment[];
  pending: boolean;
  message: string;
  onStatus: (id: string, status: CommentStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const statusLabels: Record<CommentStatus, string> = { pending: "待审核", approved: "已通过", hidden: "已隐藏" };
const dateFormatter = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" });

export function AdminComments({ comments, pending, message, onStatus, onDelete }: Props) {
  const [filter, setFilter] = useState<"all" | CommentStatus>("pending");
  const visible = useMemo(() => filter === "all" ? comments : comments.filter((comment) => comment.status === filter), [comments, filter]);

  return (
    <section className="comment-moderation" aria-busy={pending}>
      <header className="comment-moderation-head">
        <div><p className="eyebrow">GLOBAL GUESTBOOK</p><h1>评论审核</h1><p>通过后的留言会进入全站最新评论流。</p></div>
        <div className="comment-filter" aria-label="评论状态筛选">
          {(["pending", "approved", "hidden", "all"] as const).map((status) => <button type="button" className={filter === status ? "active" : ""} key={status} onClick={() => setFilter(status)}>{status === "all" ? "全部" : statusLabels[status]}</button>)}
        </div>
      </header>
      {message ? <p className="admin-message" role="status">{message}</p> : null}
      <div className="comment-moderation-list">
        {visible.map((comment) => (
          <article className="comment-moderation-item" key={comment.id}>
            <div className="comment-moderation-meta">
              <span className={`comment-status status-${comment.status}`}>{statusLabels[comment.status]}</span>
              <strong>{comment.nickname}</strong>
              <time dateTime={comment.createdAt}>{dateFormatter.format(new Date(comment.createdAt))}</time>
              <a href={comment.sourcePath} target="_blank" rel="noreferrer">{comment.sourcePath} ↗</a>
            </div>
            <p>{comment.content}</p>
            <div className="comment-moderation-actions">
              {comment.status !== "approved" ? <button className="primary-button" type="button" disabled={pending} onClick={() => void onStatus(comment.id, "approved")}>通过</button> : null}
              {comment.status !== "hidden" ? <button className="secondary-button" type="button" disabled={pending} onClick={() => void onStatus(comment.id, "hidden")}>隐藏</button> : null}
              {comment.status !== "pending" ? <button className="secondary-button" type="button" disabled={pending} onClick={() => void onStatus(comment.id, "pending")}>转待审</button> : null}
              <button className="comment-delete-button" type="button" disabled={pending} onClick={() => void onDelete(comment.id)}>删除</button>
            </div>
          </article>
        ))}
        {!visible.length ? <p className="comment-moderation-empty">当前分类没有留言。</p> : null}
      </div>
    </section>
  );
}
