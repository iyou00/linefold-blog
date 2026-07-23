"use client";

import { useEffect, useState } from "react";
import { AdminPostEditor } from "./admin-post-editor";
import { AdminPostList } from "./admin-post-list";
import { AdminSiteSettings, settingsSections, type SettingsSectionId } from "./admin-site-settings";
import { createEmptyPost, type AdminPost, type AdminPostSummary, type AdminSettings, type DraftPost } from "./admin-types";

type Props = { initialPosts: AdminPostSummary[]; initialTotal: number; initialNextCursor: string | null; initialSettings: AdminSettings; allowedImageHosts: string[] };

export function AdminDashboard({ initialPosts, initialTotal, initialNextCursor, initialSettings, allowedImageHosts }: Props) {
  const [tab, setTab] = useState<"posts" | "settings">("posts");
  const [settingsSection, setSettingsSection] = useState<SettingsSectionId>("identity");
  const [posts, setPosts] = useState<AdminPostSummary[]>(initialPosts);
  const [postTotal, setPostTotal] = useState(initialTotal);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [listQuery, setListQuery] = useState("");
  const [listFilter, setListFilter] = useState<"all" | AdminPost["status"]>("all");
  const [listPending, setListPending] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPost>(createEmptyPost);
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    function warnBeforeLeave(event: BeforeUnloadEvent) {
      if (!dirty && !settingsDirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [dirty, settingsDirty]);

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

  function changeTab(nextTab: "posts" | "settings") {
    if (nextTab === tab) return;
    if (tab === "posts" && !canLeaveDraft()) return;
    if (tab === "settings" && settingsDirty && !window.confirm("站点设置有未保存的更改，确认离开吗？")) return;
    setTab(nextTab);
    setMessage("");
  }

  async function logout() {
    if (tab === "posts" && !canLeaveDraft()) return;
    if (tab === "settings" && settingsDirty && !window.confirm("站点设置有未保存的更改，确认退出吗？")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/admin/login");
  }

  return (
    <div className={`admin-shell admin-${tab}${tab === "posts" && isEditing ? " has-editor" : ""}`}>
      <aside className="admin-sidebar">
        <header className="admin-sidebar-brand"><p>{settings.shortName}</p><span>内容管理后台</span></header>
        <nav className="admin-primary-nav" aria-label="后台主导航">
          <button type="button" aria-current={tab === "posts" ? "page" : undefined} className={tab === "posts" ? "active" : ""} onClick={() => changeTab("posts")}><span>01</span>文章管理</button>
          <button type="button" aria-current={tab === "settings" ? "page" : undefined} className={tab === "settings" ? "active" : ""} onClick={() => changeTab("settings")}><span>02</span>站点设置</button>
        </nav>
        <div className="admin-context-panel">
          {tab === "posts" ? <AdminPostList posts={posts} total={postTotal} selectedId={selectedId} query={listQuery} filter={listFilter} loading={listPending} hasMore={Boolean(nextCursor)} onNew={newPost} onSelect={(post) => void selectPost(post)} onQueryChange={setListQuery} onSearch={() => void loadPosts({ query: listQuery, status: listFilter })} onFilter={(status) => { setListFilter(status); void loadPosts({ query: listQuery, status }); }} onLoadMore={() => void loadPosts({ append: true, cursor: nextCursor })} /> : (
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
        ) : (
          <AdminSiteSettings settings={settings} activeSection={settingsSection} dirty={settingsDirty} pending={pending} message={message} onUpdate={updateSettings} onSave={saveSettings} />
        )}
      </main>
    </div>
  );
}
