"use client";
/* eslint-disable @next/next/no-img-element -- External object-storage images are previewed without proxying. */

import { lazy, Suspense, useRef, useState } from "react";
import type { MarkdownEditorHandle } from "./markdown-editor";
import { isAllowedHttpsImageUrl } from "@/lib/url-policy";
import type { DraftPost } from "./admin-types";

type EditorMode = "write" | "preview" | "split";
const MarkdownEditor = lazy(() => import("./markdown-editor").then((module) => ({ default: module.MarkdownEditor })));
const MarkdownContent = lazy(() => import("./markdown-content").then((module) => ({ default: module.MarkdownContent })));
type Props = {
  draft: DraftPost;
  isEditing: boolean;
  isExisting: boolean;
  dirty: boolean;
  pending: boolean;
  message: string;
  allowedImageHosts: string[];
  onUpdate: <K extends keyof DraftPost>(key: K, value: DraftPost[K]) => void;
  onSave: (status: DraftPost["status"]) => Promise<void>;
  onDelete: () => Promise<void>;
  onBack: () => void;
};

function localDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AdminPostEditor({ draft, isEditing, isExisting, dirty, pending, message, allowedImageHosts, onUpdate, onSave, onDelete, onBack }: Props) {
  const [mode, setMode] = useState<EditorMode>("split");
  const [inlineImageUrl, setInlineImageUrl] = useState("");
  const [inlineImageAlt, setInlineImageAlt] = useState("");
  const contentInput = useRef<MarkdownEditorHandle>(null);
  const characterCount = draft.content.replace(/\s/g, "").length;
  const estimatedMinutes = Math.max(1, Math.ceil(characterCount / 500));
  const inlineImageValid = !inlineImageUrl.trim() || isAllowedHttpsImageUrl(inlineImageUrl.trim(), allowedImageHosts);
  const coverImageValid = !draft.coverImageUrl || isAllowedHttpsImageUrl(draft.coverImageUrl, allowedImageHosts);

  function insertMarkdown(prefix: string, suffix: string, placeholder: string) {
    if (mode === "preview") setMode("split");
    contentInput.current?.wrapSelection(prefix, suffix, placeholder);
  }

  function insertInlineImage() {
    const url = inlineImageUrl.trim();
    if (!url || !inlineImageValid) return;
    const imageMarkdown = `![${inlineImageAlt.trim() || "图片说明"}](${url})`;
    if (mode === "preview") setMode("split");
    contentInput.current?.insertBlock(imageMarkdown);
    setInlineImageUrl("");
    setInlineImageAlt("");
  }

  if (!isEditing) {
    return (
      <section className="admin-editor-empty">
        <p className="eyebrow">WRITING SPACE</p>
        <h1>选择一篇文章，或开始新的记录。</h1>
        <p>标题、正文与发布设置会在这里展开。</p>
      </section>
    );
  }

  return (
    <form className="admin-editor-shell" onSubmit={(event) => { event.preventDefault(); void onSave(draft.status); }}>
      <div className="editor-commandbar">
        <div className="editor-state">
          <button className="mobile-editor-back" type="button" onClick={onBack}>← 文章列表</button>
          <span className={dirty ? "unsaved" : "saved"}>{dirty ? "有未保存更改" : isExisting ? "内容已保存" : "新文章"}</span>
        </div>
        <div className="editor-actions">
          <button className="secondary-button" type="button" disabled={pending} onClick={() => void onSave("draft")}>保存草稿</button>
          <button className="primary-button" type="button" disabled={pending} onClick={() => void onSave("published")}>{pending ? "保存中…" : "发布文章"}</button>
        </div>
      </div>

      {message ? <p className="admin-message" role="status">{message}</p> : null}

      <section className="writer-pane">
        <p className="eyebrow">ARTICLE EDITOR</p>
        <label className="title-field">
          <span className="sr-only">文章标题</span>
          <textarea rows={2} value={draft.title} onChange={(event) => onUpdate("title", event.target.value)} placeholder="写下文章标题" required />
        </label>
        <label className="summary-field">
          <span>摘要</span>
          <textarea rows={3} value={draft.summary} onChange={(event) => onUpdate("summary", event.target.value)} placeholder="用一两句话说明这篇文章的内容" />
        </label>
        <div className="editor-modebar">
          <div className="format-actions" role="toolbar" aria-label="Markdown 格式工具">
            <button type="button" onClick={() => insertMarkdown("## ", "", "小标题")} aria-label="插入二级标题">H2</button>
            <button type="button" onClick={() => insertMarkdown("### ", "", "三级标题")} aria-label="插入三级标题">H3</button>
            <button type="button" onClick={() => insertMarkdown("**", "**", "加粗文字")} aria-label="插入加粗">B</button>
            <button type="button" onClick={() => insertMarkdown("~~", "~~", "删除文字")} aria-label="插入删除线">S</button>
            <button type="button" onClick={() => insertMarkdown("- ", "", "列表项目")} aria-label="插入无序列表">•</button>
            <button type="button" onClick={() => insertMarkdown("1. ", "", "列表项目")} aria-label="插入有序列表">1.</button>
            <button type="button" onClick={() => insertMarkdown("> ", "", "引用内容")} aria-label="插入引用">“</button>
            <button type="button" onClick={() => insertMarkdown("```\n", "\n```", "代码")} aria-label="插入代码块">&lt;/&gt;</button>
            <button type="button" onClick={() => insertMarkdown("[", "](https://)", "链接文字")} aria-label="插入链接">LINK</button>
          </div>
          <div className="view-actions" role="tablist" aria-label="正文显示方式">
            {(["write", "preview", "split"] as const).map((value) => (
              <button key={value} type="button" role="tab" aria-selected={mode === value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>
                {value === "write" ? "仅编辑" : value === "preview" ? "仅预览" : "左右分栏"}
              </button>
            ))}
          </div>
          <span className="editor-count">{characterCount} 字 · 约 {estimatedMinutes} 分钟</span>
        </div>
        <div className={`markdown-workspace mode-${mode}`}>
          <div className="markdown-input">
            <Suspense fallback={<div className="editor-loading" role="status">正在载入编辑器…</div>}>
              <MarkdownEditor ref={contentInput} value={draft.content} onChange={(value) => onUpdate("content", value)} />
            </Suspense>
          </div>
          <article className="markdown-preview article-body" aria-label="文章预览">
            <Suspense fallback={<p className="editor-loading" role="status">正在生成预览…</p>}>
              <MarkdownContent markdown={draft.content} allowedImageHosts={allowedImageHosts} emptyText="预览会显示在这里。" />
            </Suspense>
          </article>
        </div>
      </section>

      <aside className="publish-panel">
        <section>
          <p className="panel-label">发布</p>
          <label>状态<select value={draft.status} onChange={(event) => onUpdate("status", event.target.value as DraftPost["status"])}><option value="draft">草稿</option><option value="published">已发布</option></select></label>
          <label>分类<select value={draft.category} onChange={(event) => onUpdate("category", event.target.value as DraftPost["category"])}><option value="notes">随笔 NOTES</option><option value="tutorials">教程 TUTORIALS</option></select></label>
          <label>发布时间<input type="datetime-local" value={localDateTime(draft.publishedAt)} onChange={(event) => onUpdate("publishedAt", event.target.value)} /></label>
        </section>
        <section>
          <p className="panel-label">整理</p>
          <label>文章路径<input value={draft.slug} onChange={(event) => onUpdate("slug", event.target.value)} placeholder="留空时自动生成" /></label>
          <label>标签<input value={draft.tags.join(", ")} onChange={(event) => onUpdate("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="PROJECT, DESIGN" /></label>
        </section>
        <details>
          <summary>图片与展示</summary>
          <label>封面图片外链<input type="url" value={draft.coverImageUrl || ""} onChange={(event) => onUpdate("coverImageUrl", event.target.value)} placeholder="https://你的国内对象存储/cover.jpg" /><small>用于文章标题下方的大图和社交分享卡片；每篇文章最多一张。</small></label>
          {draft.coverImageUrl && coverImageValid ? <figure className="image-preview"><img src={draft.coverImageUrl} alt="外链图片预览" referrerPolicy="no-referrer" /></figure> : null}
          {!coverImageValid ? <small className="field-error">该图片地址需要使用 HTTPS，并加入国内图片域名白名单。</small> : null}
          <div className="inline-image-tool">
            <span>插入正文图片</span>
            <input type="url" value={inlineImageUrl} onChange={(event) => setInlineImageUrl(event.target.value)} placeholder="https://你的国内对象存储/image.jpg" aria-label="正文图片外链" />
            <input value={inlineImageAlt} onChange={(event) => setInlineImageAlt(event.target.value)} placeholder="图片说明，用于无障碍与搜索" aria-label="正文图片说明" />
            <button type="button" disabled={!inlineImageUrl.trim() || !inlineImageValid} onClick={insertInlineImage}>插入到当前正文位置</button>
            {!inlineImageValid ? <small className="field-error">该图片地址未通过当前站点的图片白名单。</small> : null}
            <small>可以重复插入任意数量，系统会生成 Markdown 图片语法并逐张校验域名。</small>
          </div>
        </details>
        <details>
          <summary>搜索与分享</summary>
          <label><span className="field-heading"><span>SEO 标题</span><small>{draft.seoTitle.length} 字，建议 20–30</small></span><input value={draft.seoTitle} onChange={(event) => onUpdate("seoTitle", event.target.value)} placeholder="留空时使用文章标题" /></label>
          <label><span className="field-heading"><span>SEO 描述</span><small>{draft.seoDescription.length} 字，建议 60–80</small></span><textarea rows={4} value={draft.seoDescription} onChange={(event) => onUpdate("seoDescription", event.target.value)} placeholder="留空时使用文章摘要" /></label>
          <div className="seo-preview" aria-label="搜索结果预览">
            <small>/posts/{draft.slug || "文章路径"}</small>
            <strong>{draft.seoTitle || draft.title || "文章标题"}</strong>
            <p>{draft.seoDescription || draft.summary || "文章摘要会显示在这里。"}</p>
          </div>
        </details>
        {isExisting ? <button className="danger-button full-width" type="button" onClick={() => void onDelete()}>删除这篇文章</button> : null}
      </aside>
    </form>
  );
}
