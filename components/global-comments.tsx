"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import type { PublicComment } from "@/lib/comments";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "2-digit",
  day: "2-digit",
});

export function GlobalComments({ comments }: { comments: PublicComment[] }) {
  const pathname = usePathname();
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content,
          sourcePath: pathname,
          website: String(form.get("website") || ""),
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      setMessage(response.ok ? data.message || "留言已收到" : data.error || "提交失败");
      if (response.ok) {
        setContent("");
      }
    } catch {
      setMessage("提交失败，请检查网络后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="global-comments" aria-label="全站留言">
      <header className="global-comments-head">
        <span>GUESTBOOK / 留言</span>
        <span>LATEST 05</span>
      </header>
      <div className="global-comment-list" aria-live="polite">
        {comments.map((comment, index) => (
          <article className={index === 5 ? "comment-note comment-note-fade" : "comment-note"} key={comment.id}>
            <time dateTime={comment.createdAt}>{dateFormatter.format(new Date(comment.createdAt))}</time>
            <p>{comment.content}</p>
          </article>
        ))}
        {!comments.length ? <p className="comment-empty">这里还很安静，贴上第一张留言。</p> : null}
      </div>
      <form className="comment-form" onSubmit={(event) => void submit(event)}>
        <label className="comment-content-field">
          <span className="sr-only">留言内容</span>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} minLength={2} maxLength={160} rows={1} placeholder="留下一句话…" required />
        </label>
        <button type="submit" aria-label="发送留言" disabled={pending}>{pending ? "…" : "发送 ↗"}</button>
        <label className="comment-honeypot" aria-hidden="true">网站<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </form>
      {message ? <p className="comment-message" role="status">{message}</p> : null}
    </section>
  );
}
