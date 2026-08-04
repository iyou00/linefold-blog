"use client";
/* eslint-disable @next/next/no-img-element -- External object-storage images are previewed without proxying. */

import { isAllowedHttpsImageUrl } from "@/lib/url-policy";
import type { AdminRelatedPost, DraftWork } from "./admin-types";

type Props = {
  draft: DraftWork;
  postOptions: AdminRelatedPost[];
  isEditing: boolean;
  isExisting: boolean;
  dirty: boolean;
  pending: boolean;
  message: string;
  allowedImageHosts: string[];
  onUpdate: <K extends keyof DraftWork>(key: K, value: DraftWork[K]) => void;
  onSave: (status: DraftWork["status"]) => Promise<void>;
  onDelete: () => Promise<void>;
  onBack: () => void;
};

function localDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AdminWorkEditor({ draft, postOptions, isEditing, isExisting, dirty, pending, message, allowedImageHosts, onUpdate, onSave, onDelete, onBack }: Props) {
  function updateImage(index: number, key: "url" | "caption", value: string) {
    onUpdate("images", draft.images.map((image, imageIndex) => imageIndex === index ? { ...image, [key]: value } : image));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.images.length) return;
    const images = [...draft.images];
    [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
    onUpdate("images", images);
  }

  function toggleRelatedPost(id: string) {
    const selected = draft.relatedPostIds.includes(id);
    if (!selected && draft.relatedPostIds.length >= 3) return;
    onUpdate("relatedPostIds", selected ? draft.relatedPostIds.filter((postId) => postId !== id) : [...draft.relatedPostIds, id]);
  }

  if (!isEditing) {
    return (
      <section className="admin-editor-empty">
        <p className="eyebrow">WORKS SPACE</p>
        <h1>选择一件作品，或建立新的案例。</h1>
        <p>作品信息、图片组和关联记录会在这里展开。</p>
      </section>
    );
  }

  return (
    <form className="admin-editor-shell admin-work-editor" onSubmit={(event) => { event.preventDefault(); void onSave(draft.status); }}>
      <div className="editor-commandbar">
        <div className="editor-state">
          <button className="mobile-editor-back" type="button" onClick={onBack}>← 作品列表</button>
          <span className={dirty ? "unsaved" : "saved"}>{dirty ? "有未保存更改" : isExisting ? "作品已保存" : "新作品"}</span>
        </div>
        <div className="editor-actions">
          <button className="secondary-button" type="button" disabled={pending} onClick={() => void onSave("draft")}>保存草稿</button>
          <button className="primary-button" type="button" disabled={pending} onClick={() => void onSave("published")}>{pending ? "保存中…" : "发布作品"}</button>
        </div>
      </div>

      {message ? <p className="admin-message" role="status">{message}</p> : null}

      <section className="writer-pane work-writer-pane">
        <p className="eyebrow">WORK EDITOR</p>
        <label className="title-field">
          <span className="sr-only">作品名称</span>
          <textarea rows={2} value={draft.title} onChange={(event) => onUpdate("title", event.target.value)} placeholder="写下作品名称" required />
        </label>
        <label className="summary-field">
          <span>作品简介</span>
          <textarea rows={6} maxLength={600} value={draft.summary} onChange={(event) => onUpdate("summary", event.target.value)} placeholder="说明这件作品是什么，以及它解决了什么问题" />
          <small>{draft.summary.length} / 600</small>
        </label>

        <section className="work-editor-section">
          <div className="work-editor-section-head">
            <div><p className="panel-label">IMAGES / 图片组</p><p>图片使用外链，顺序会同步到 CASE 页面。</p></div>
            <button className="secondary-button" type="button" disabled={draft.images.length >= 12} onClick={() => onUpdate("images", [...draft.images, { id: crypto.randomUUID(), url: "", caption: "" }])}>＋ 添加图片</button>
          </div>
          <label className="work-gallery-toggle"><input type="checkbox" checked={draft.showGallery} onChange={(event) => onUpdate("showGallery", event.target.checked)} /><span>在 CASE 页面显示图片组</span></label>
          {draft.showGallery && draft.images.length === 0 ? <p className="concept-fallback-note">发布后会自动展示 2 张 LINEFOLD 内置概念示意图。</p> : null}
          <div className="admin-work-images">
            {draft.images.map((image, index) => {
              const valid = !image.url || isAllowedHttpsImageUrl(image.url, allowedImageHosts);
              return (
                <article className="admin-work-image" key={image.id || String(index)}>
                  <div className="admin-work-image-index"><span>{String(index + 1).padStart(2, "0")}</span><div><button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label={`上移第 ${index + 1} 张图片`}>↑</button><button type="button" disabled={index === draft.images.length - 1} onClick={() => moveImage(index, 1)} aria-label={`下移第 ${index + 1} 张图片`}>↓</button></div></div>
                  <label>图片外链<input type="url" value={image.url} onChange={(event) => updateImage(index, "url", event.target.value)} placeholder="https://你的国内对象存储/work.webp" /></label>
                  <label>图片说明<input value={image.caption} maxLength={120} onChange={(event) => updateImage(index, "caption", event.target.value)} placeholder="例如：首页 / INDEX" /></label>
                  {image.url && valid ? <figure><img src={image.url} alt={image.caption || `作品图片 ${index + 1}`} referrerPolicy="no-referrer" /></figure> : null}
                  {!valid ? <small className="field-error">该图片地址需要使用 HTTPS，并加入图片域名白名单。</small> : null}
                  <button className="remove-image-button" type="button" onClick={() => onUpdate("images", draft.images.filter((_, imageIndex) => imageIndex !== index))}>移除图片</button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="work-editor-section">
          <div className="work-editor-section-head"><div><p className="panel-label">RELATED WRITING / 关联记录</p><p>最多选择 3 篇已发布文章，CASE 页面会自动显示标题和栏目。</p></div><span>{draft.relatedPostIds.length} / 3</span></div>
          <div className="related-post-options">
            {postOptions.map((post) => {
              const checked = draft.relatedPostIds.includes(post.id);
              return <label key={post.id} className={checked ? "selected" : ""}><input type="checkbox" checked={checked} disabled={!checked && draft.relatedPostIds.length >= 3} onChange={() => toggleRelatedPost(post.id)} /><span><strong>{post.title}</strong><small>{post.category === "tutorials" ? "TUTORIAL" : "NOTES"}</small></span></label>;
            })}
            {!postOptions.length ? <p className="admin-list-empty">发布文章后即可建立关联。</p> : null}
          </div>
        </section>
      </section>

      <aside className="publish-panel">
        <section>
          <p className="panel-label">发布</p>
          <label>状态<select value={draft.status} onChange={(event) => onUpdate("status", event.target.value as DraftWork["status"])}><option value="draft">草稿</option><option value="published">已发布</option></select></label>
          <label>发布时间<input type="datetime-local" value={localDateTime(draft.publishedAt)} onChange={(event) => onUpdate("publishedAt", event.target.value)} /></label>
        </section>
        <section>
          <p className="panel-label">整理</p>
          <label>作品路径<input value={draft.slug} onChange={(event) => onUpdate("slug", event.target.value)} placeholder="例如 linefold-blog" /></label>
          <label>标签<input value={draft.tags.join(", ")} onChange={(event) => onUpdate("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="PRODUCT, FULL STACK" /><small>最多 6 个，用逗号分隔。</small></label>
        </section>
        <section>
          <p className="panel-label">项目链接</p>
          <label>链接文字<input value={draft.linkLabel} maxLength={40} onChange={(event) => onUpdate("linkLabel", event.target.value)} placeholder="GitHub / 在线体验 / 查看项目" /></label>
          <label>HTTPS 地址<input type="url" value={draft.linkUrl || ""} onChange={(event) => onUpdate("linkUrl", event.target.value)} placeholder="https://" /><small>地址为空时，CASE 页面隐藏整个链接字段。</small></label>
        </section>
        <div className="seo-preview" aria-label="作品地址预览"><small>/works/{draft.slug || "作品路径"}</small><strong>{draft.title || "作品名称"}</strong><p>{draft.summary || "作品简介会显示在这里。"}</p></div>
        {isExisting ? <button className="danger-button full-width" type="button" onClick={() => void onDelete()}>删除这件作品</button> : null}
      </aside>
    </form>
  );
}
