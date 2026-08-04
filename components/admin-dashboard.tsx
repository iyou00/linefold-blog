"use client";

import { useEffect, useState } from "react";
import { AdminComments } from "./admin-comments";
import { AdminPostEditor } from "./admin-post-editor";
import { AdminPostList } from "./admin-post-list";
import { AdminSiteSettings, settingsSections, type SettingsSectionId } from "./admin-site-settings";
import { AdminWorkEditor } from "./admin-work-editor";
import { AdminWorkList } from "./admin-work-list";
import { createEmptyPost, createEmptyWork, type AdminPost, type AdminPostSummary, type AdminRelatedPost, type AdminSettings, type AdminWork, type AdminWorkSummary, type DraftPost, type DraftWork } from "./admin-types";
import type { AdminComment, CommentStatus } from "@/lib/comments";

type AdminTab = "posts" | "works" | "comments" | "settings";
type Props = { initialPosts: AdminPostSummary[]; initialTotal: number; initialNextCursor: string | null; initialWorks: AdminWorkSummary[]; initialComments: AdminComment[]; relatedPostOptions: AdminRelatedPost[]; initialSettings: AdminSettings; allowedImageHosts: string[] };

export function AdminDashboard({ initialPosts, initialTotal, initialNextCursor, initialWorks, initialComments, relatedPostOptions, initialSettings, allowedImageHosts }: Props) {
  const [tab, setTab] = useState<AdminTab>("posts");
  const [settingsSection, setSettingsSection] = useState<SettingsSectionId>("identity");
  const [posts, setPosts] = useState<AdminPostSummary[]>(initialPosts);
  const [postTotal, setPostTotal] = useState(initialTotal);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [listQuery, setListQuery] = useState("");
  const [listFilter, setListFilter] = useState<"all" | AdminPost["status"]>("all");
  const [listPending, setListPending] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPost>(createEmptyPost);
  const [works, setWorks] = useState<AdminWorkSummary[]>(initialWorks);
  const [comments, setComments] = useState<AdminComment[]>(initialComments);
  const [commentPending, setCommentPending] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [workDraft, setWorkDraft] = useState<DraftWork>(createEmptyWork);
  const [workDirty, setWorkDirty] = useState(false);
  const [isEditingWork, setIsEditingWork] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    function warnBeforeLeave(event: BeforeUnloadEvent) {
      if (!dirty && !workDirty && !settingsDirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [dirty, workDirty, settingsDirty]);

  async function loadPosts({ append = false, cursor = null, query = listQuery, status = listFilter }: { append?: boolean; cursor?: string | null; query?: string; status?: "all" | AdminPost["status"] } = {}) {
    setListPending(true);
    try {
      const parameters = new URLSearchParams();
      if (query.trim()) parameters.set("q", query.trim());
      if (status !== "all") parameters.set("status", status);
      if (cursor) parameters.set("cursor", cursor);
      const response = await fetch(`/api/admin/posts?${parameters}`, { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const data = (await response.json()) as { posts?: AdminPostSummary[]; total?: number; nextCursor?: string | null; error?: string };
      if (data.posts) setPosts((current) => append ? [...current, ...data.posts!] : data.posts!);
      if (typeof data.total === "number") setPostTotal(data.total);
      setNextCursor(data.nextCursor || null);
      if (data.error) setMessage(data.error);
    } catch {
      setMessage("文章列表加载失败，请检查网络后重试");
    } finally {
      setListPending(false);
    }
  }

  function canLeaveDraft() {
    return !dirty || window.confirm("当前文章有未保存的更改，确认离开吗？");
  }

  function canLeaveWork() {
    return !workDirty || window.confirm("当前作品有未保存的更改，确认离开吗？");
  }

  function newPost() {
    if (!canLeaveDraft()) return;
    setSelectedId(null);
    setDraft(createEmptyPost());
    setMessage("");
    setDirty(false);
    setIsEditing(true);
  }

  async function selectPost(post: AdminPostSummary) {
    if (post.id === selectedId || !canLeaveDraft()) return;
    setPending(true);
    const response = await fetch(`/api/admin/posts/${post.id}`, { cache: "no-store" });
    const data = (await response.json()) as { post?: AdminPost; error?: string };
    if (response.ok && data.post) {
      const { id, updatedAt, ...value } = data.post;
      void updatedAt;
      setSelectedId(id); setDraft(value); setMessage(""); setDirty(false); setIsEditing(true);
    } else setMessage(data.error || "读取文章失败");
    setPending(false);
  }

  function updateDraft<K extends keyof DraftPost>(key: K, value: DraftPost[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setMessage("");
  }

  async function savePost(status: DraftPost["status"]) {
    setPending(true);
    setMessage("");
    const payload = { ...draft, status, publishedAt: new Date(draft.publishedAt).toISOString() };
    const response = await fetch(selectedId ? `/api/admin/posts/${selectedId}` : "/api/admin/posts", {
      method: selectedId ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { post?: AdminPost; error?: string };
    if (response.ok && data.post) {
      const { id, updatedAt, ...savedDraft } = data.post;
      void updatedAt;
      setSelectedId(id);
      setDraft(savedDraft);
      setDirty(false);
      setMessage(status === "published" ? "文章已发布" : "草稿已保存");
      await loadPosts();
    } else {
      setMessage(data.error || "保存失败");
    }
    setPending(false);
  }

  async function removePost() {
    if (!selectedId || !window.confirm("确认永久删除这篇文章？")) return;
    setPending(true);
    const response = await fetch(`/api/admin/posts/${selectedId}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (response.ok) {
      setSelectedId(null);
      setDraft(createEmptyPost());
      setDirty(false);
      setIsEditing(false);
      setMessage("");
      await loadPosts();
    } else {
      setMessage(data.error || "删除失败");
    }
    setPending(false);
  }

  async function loadWorks() {
    try {
      const response = await fetch("/api/admin/works", { cache: "no-store" });
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      const data = (await response.json()) as { works?: AdminWorkSummary[]; error?: string };
      if (response.ok && data.works) setWorks(data.works);
      else setMessage(data.error || "作品列表加载失败");
    } catch {
      setMessage("作品列表加载失败，请检查网络后重试");
    }
  }

  function newWork() {
    if (!canLeaveWork()) return;
    setSelectedWorkId(null);
    setWorkDraft(createEmptyWork());
    setMessage("");
    setWorkDirty(false);
    setIsEditingWork(true);
  }

  async function selectWork(work: AdminWorkSummary) {
    if (work.id === selectedWorkId || !canLeaveWork()) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/works/${work.id}`, { cache: "no-store" });
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      const data = (await response.json()) as { work?: AdminWork; error?: string };
      if (response.ok && data.work) {
        const { id, updatedAt, relatedPosts, ...value } = data.work;
        void updatedAt;
        setSelectedWorkId(id);
        setWorkDraft({ ...value, relatedPostIds: relatedPosts.map((post) => post.id) });
        setMessage("");
        setWorkDirty(false);
        setIsEditingWork(true);
      } else setMessage(data.error || "读取作品失败");
    } catch {
      setMessage("作品读取失败，请检查网络后重试");
    } finally {
      setPending(false);
    }
  }

  function updateWorkDraft<K extends keyof DraftWork>(key: K, value: DraftWork[K]) {
    setWorkDraft((current) => ({ ...current, [key]: value }));
    setWorkDirty(true);
    setMessage("");
  }

  async function saveWork(status: DraftWork["status"]) {
    setPending(true);
    setMessage("");
    try {
      const payload = { ...workDraft, status, publishedAt: new Date(workDraft.publishedAt).toISOString() };
      const response = await fetch(selectedWorkId ? `/api/admin/works/${selectedWorkId}` : "/api/admin/works", {
        method: selectedWorkId ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      const data = (await response.json()) as { work?: AdminWork; error?: string };
      if (response.ok && data.work) {
        const { id, updatedAt, relatedPosts, ...savedDraft } = data.work;
        void updatedAt;
        setSelectedWorkId(id);
        setWorkDraft({ ...savedDraft, relatedPostIds: relatedPosts.map((post) => post.id) });
        setWorkDirty(false);
        setMessage(status === "published" ? "作品已发布" : "作品草稿已保存");
        await loadWorks();
      } else setMessage(data.error || "保存失败");
    } catch {
      setMessage("作品保存失败，请检查填写内容和网络后重试");
    } finally {
      setPending(false);
    }
  }

  async function removeWork() {
    if (!selectedWorkId || !window.confirm("确认永久删除这件作品？")) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/works/${selectedWorkId}`, { method: "DELETE" });
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      const data = (await response.json()) as { error?: string };
      if (response.ok) {
        setSelectedWorkId(null);
        setWorkDraft(createEmptyWork());
        setWorkDirty(false);
        setIsEditingWork(false);
        setMessage("");
        await loadWorks();
      } else setMessage(data.error || "删除失败");
    } catch {
      setMessage("作品删除失败，请检查网络后重试");
    } finally {
      setPending(false);
    }
  }

  async function loadComments() {
    const response = await fetch("/api/admin/comments", { cache: "no-store" });
    if (response.status === 401) { window.location.assign("/admin/login"); return; }
    const data = (await response.json()) as { comments?: AdminComment[]; error?: string };
    if (response.ok && data.comments) setComments(data.comments);
    else setMessage(data.error || "评论列表加载失败");
  }

  async function changeCommentStatus(id: string, status: CommentStatus) {
    setCommentPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      const data = (await response.json()) as { error?: string };
      if (response.ok) {
        setMessage(status === "approved" ? "留言已通过并进入全站评论流" : status === "hidden" ? "留言已隐藏" : "留言已转为待审核");
        await loadComments();
      } else setMessage(data.error || "评论状态更新失败");
    } catch {
      setMessage("评论状态更新失败，请检查网络后重试");
    } finally {
      setCommentPending(false);
    }
  }

  async function removeComment(id: string) {
    if (!window.confirm("确认永久删除这条留言？")) return;
    setCommentPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      const data = (await response.json()) as { error?: string };
      if (response.ok) {
        setMessage("留言已删除");
        await loadComments();
      } else setMessage(data.error || "评论删除失败");
    } catch {
      setMessage("评论删除失败，请检查网络后重试");
    } finally {
      setCommentPending(false);
    }
  }

  function updateSettings<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSettingsDirty(true);
    setMessage("");
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = (await response.json()) as { error?: string };
    setMessage(response.ok ? "站点设置已保存，前台刷新后生效" : data.error || "保存失败");
    if (response.ok) setSettingsDirty(false);
    setPending(false);
  }

  function changeTab(nextTab: AdminTab) {
    if (nextTab === tab) return;
    if (tab === "posts" && !canLeaveDraft()) return;
    if (tab === "works" && !canLeaveWork()) return;
    if (tab === "settings" && settingsDirty && !window.confirm("站点设置有未保存的更改，确认离开吗？")) return;
    setTab(nextTab);
    setMessage("");
  }

  async function logout() {
    if (tab === "posts" && !canLeaveDraft()) return;
    if (tab === "works" && !canLeaveWork()) return;
    if (tab === "settings" && settingsDirty && !window.confirm("站点设置有未保存的更改，确认退出吗？")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/admin/login");
  }

  return (
    <div className={`admin-shell admin-${tab}${(tab === "posts" && isEditing) || (tab === "works" && isEditingWork) ? " has-editor" : ""}`}>
      <aside className="admin-sidebar">
        <header className="admin-sidebar-brand"><p>{settings.shortName}</p><span>内容管理后台</span></header>
        <nav className="admin-primary-nav" aria-label="后台主导航">
          <button type="button" aria-current={tab === "posts" ? "page" : undefined} className={tab === "posts" ? "active" : ""} onClick={() => changeTab("posts")}><span>01</span>文章管理</button>
          <button type="button" aria-current={tab === "works" ? "page" : undefined} className={tab === "works" ? "active" : ""} onClick={() => changeTab("works")}><span>02</span>作品管理</button>
          <button type="button" aria-current={tab === "comments" ? "page" : undefined} className={tab === "comments" ? "active" : ""} onClick={() => changeTab("comments")}><span>03</span>评论审核</button>
          <button type="button" aria-current={tab === "settings" ? "page" : undefined} className={tab === "settings" ? "active" : ""} onClick={() => changeTab("settings")}><span>04</span>站点设置</button>
        </nav>
        <div className="admin-context-panel">
          {tab === "posts" ? <AdminPostList posts={posts} total={postTotal} selectedId={selectedId} query={listQuery} filter={listFilter} loading={listPending} hasMore={Boolean(nextCursor)} onNew={newPost} onSelect={(post) => void selectPost(post)} onQueryChange={setListQuery} onSearch={() => void loadPosts({ query: listQuery, status: listFilter })} onFilter={(status) => { setListFilter(status); void loadPosts({ query: listQuery, status }); }} onLoadMore={() => void loadPosts({ append: true, cursor: nextCursor })} /> : tab === "works" ? <AdminWorkList works={works} selectedId={selectedWorkId} loading={pending} onNew={newWork} onSelect={(work) => void selectWork(work)} /> : tab === "comments" ? (
            <div className="admin-comment-summary"><p>评论状态</p><strong>{comments.filter((comment) => comment.status === "pending").length}</strong><span>条待审核留言</span><dl><div><dt>已通过</dt><dd>{comments.filter((comment) => comment.status === "approved").length}</dd></div><div><dt>已隐藏</dt><dd>{comments.filter((comment) => comment.status === "hidden").length}</dd></div></dl></div>
          ) : (
            <nav className="admin-settings-nav" aria-label="站点设置分类">
              <p>设置分类</p>
              {settingsSections.map((section) => (
                <button key={section.id} type="button" className={settingsSection === section.id ? "active" : ""} aria-current={settingsSection === section.id ? "page" : undefined} onClick={() => { setSettingsSection(section.id); setMessage(""); }}>
                  <strong>{section.label}</strong><span>{section.description}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
        <footer className="admin-sidebar-footer"><a href="/" target="_blank" rel="noreferrer">查看网站 ↗</a><button type="button" onClick={() => void logout()}>退出</button></footer>
      </aside>

      <main className="admin-main">
        {tab === "posts" ? (
          <AdminPostEditor
            draft={draft}
            isEditing={isEditing}
            isExisting={Boolean(selectedId)}
            dirty={dirty}
            pending={pending}
            message={message}
            allowedImageHosts={allowedImageHosts}
            onUpdate={updateDraft}
            onSave={savePost}
            onDelete={removePost}
            onBack={() => { if (canLeaveDraft()) setIsEditing(false); }}
          />
        ) : tab === "works" ? (
          <AdminWorkEditor
            draft={workDraft}
            postOptions={relatedPostOptions}
            isEditing={isEditingWork}
            isExisting={Boolean(selectedWorkId)}
            dirty={workDirty}
            pending={pending}
            message={message}
            allowedImageHosts={allowedImageHosts}
            onUpdate={updateWorkDraft}
            onSave={saveWork}
            onDelete={removeWork}
            onBack={() => { if (canLeaveWork()) setIsEditingWork(false); }}
          />
        ) : tab === "comments" ? (
          <AdminComments comments={comments} pending={commentPending} message={message} onStatus={changeCommentStatus} onDelete={removeComment} />
        ) : (
          <AdminSiteSettings settings={settings} activeSection={settingsSection} dirty={settingsDirty} pending={pending} message={message} onUpdate={updateSettings} onSave={saveSettings} />
        )}
      </main>
    </div>
  );
}
