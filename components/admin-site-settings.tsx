"use client";

import type { AdminSettings } from "./admin-types";

type Props = {
  settings: AdminSettings;
  activeSection: SettingsSectionId;
  dirty: boolean;
  pending: boolean;
  message: string;
  onUpdate: <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => void;
  onSave: (event: React.FormEvent) => Promise<void>;
};

export type SettingsSectionId = "identity" | "content" | "rail" | "social" | "compliance";

export const settingsSections: { id: SettingsSectionId; label: string; description: string }[] = [
  { id: "identity", label: "品牌信息", description: "名称、作者与站点描述" },
  { id: "content", label: "首页与 About", description: "首页主标题与个人介绍" },
  { id: "rail", label: "右栏与联系", description: "邮箱与版权信息" },
  { id: "social", label: "社交入口", description: "左栏外部平台链接" },
  { id: "compliance", label: "备案与合规", description: "ICP 与公安备案" },
];

const socialSlots = [
  { platform: "social1Platform", url: "social1Url" },
  { platform: "social2Platform", url: "social2Url" },
  { platform: "social3Platform", url: "social3Url" },
  { platform: "social4Platform", url: "social4Url" },
] as const;

const socialPlatforms = [
  ["", "不显示"], ["douyin", "抖音"], ["xiaohongshu", "小红书"], ["x", "X"],
  ["bilibili", "哔哩哔哩"], ["weibo", "微博"], ["github", "GitHub"], ["website", "其他网站"],
] as const;

export function AdminSiteSettings({ settings, activeSection, dirty, pending, message, onUpdate, onSave }: Props) {
  const currentSection = settingsSections.find((section) => section.id === activeSection) ?? settingsSections[0];
  return (
    <form className="settings-form" onSubmit={(event) => void onSave(event)}>
      <div className="settings-commandbar">
        <div><p className="eyebrow">SITE SETTINGS</p><h1>{currentSection.label}</h1><span className={dirty ? "settings-unsaved" : "settings-saved"}>{dirty ? "有未保存更改" : "设置已保存"}</span></div>
        <button className="primary-button" type="submit" disabled={pending}>{pending ? "保存中…" : "保存设置"}</button>
      </div>
      {message ? <p className="admin-message" role="status">{message}</p> : null}
      {activeSection === "identity" ? <section className="settings-section">
        <div className="settings-section-intro"><p className="panel-label">品牌与身份</p><p>控制左栏标题、页面标题和作者信息。</p></div>
        <div className="settings-fields">
          <label>网站名称<input value={settings.siteName} onChange={(event) => onUpdate("siteName", event.target.value)} required /></label>
          <label>左栏简称<input value={settings.shortName} onChange={(event) => onUpdate("shortName", event.target.value)} required /></label>
          <label>作者称呼<input value={settings.author} onChange={(event) => onUpdate("author", event.target.value)} /></label>
          <label>开始记录年份<input inputMode="numeric" maxLength={4} value={settings.startedYear} onChange={(event) => onUpdate("startedYear", event.target.value)} /></label>
          <label className="span-2">网站描述<textarea rows={3} value={settings.description} onChange={(event) => onUpdate("description", event.target.value)} /></label>
        </div>
      </section> : null}
      {activeSection === "rail" ? <section className="settings-section">
        <div className="settings-section-intro"><p className="panel-label">右栏信息</p><p>控制右侧底部的联系与版权信息。</p></div>
        <div className="settings-fields">
          <label>联系邮箱<input type="email" value={settings.contactEmail} onChange={(event) => onUpdate("contactEmail", event.target.value)} placeholder="hello@example.com" /></label>
          <label>版权文字<input value={settings.footerCopyright} onChange={(event) => onUpdate("footerCopyright", event.target.value)} placeholder={`留空使用 © ${new Date().getFullYear()} ${settings.shortName}`} /></label>
          <label className="settings-toggle"><input type="checkbox" checked={settings.showEmail === "true"} onChange={(event) => onUpdate("showEmail", String(event.target.checked))} /><span>在右栏显示 EMAIL</span></label>
        </div>
      </section> : null}
      {activeSection === "content" ? <section className="settings-section">
        <div className="settings-section-intro"><p className="panel-label">首页与关于</p><p>控制访客第一次看到的自我介绍和首页主标题。</p></div>
        <div className="settings-fields">
          <label>首页标题第一行<input value={settings.heroLine1} onChange={(event) => onUpdate("heroLine1", event.target.value)} /></label>
          <label>首页标题第二行<input value={settings.heroLine2} onChange={(event) => onUpdate("heroLine2", event.target.value)} /></label>
          <label className="span-2">首页介绍<textarea rows={4} value={settings.intro} onChange={(event) => onUpdate("intro", event.target.value)} /></label>
          <label className="span-2">IDENTITY / 个人介绍<textarea rows={7} maxLength={2000} value={settings.about} onChange={(event) => onUpdate("about", event.target.value)} /></label>
          <label className="span-2">NOW / 当前关注<textarea rows={4} maxLength={600} value={settings.aboutNow} onChange={(event) => onUpdate("aboutNow", event.target.value)} placeholder="每行一条，最多四条" /></label>
          <label className="span-2">COORDINATES / 所在地<input maxLength={80} value={settings.aboutLocation} onChange={(event) => onUpdate("aboutLocation", event.target.value)} placeholder="选填，例如 Shanghai / 上海" /></label>
        </div>
      </section> : null}
      {activeSection === "social" ? <section className="settings-section">
        <div className="settings-section-intro"><p className="panel-label">外部入口</p><p>左栏最多显示四个轻量图标。未填写的入口会自动隐藏。</p></div>
        <div className="settings-fields social-settings">
          {socialSlots.map((slot, index) => (
            <div className="social-setting-row span-2" key={slot.platform}>
              <label>入口 {index + 1}<select value={settings[slot.platform]} onChange={(event) => onUpdate(slot.platform, event.target.value)}>{socialPlatforms.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>跳转链接<input type="url" value={settings[slot.url]} onChange={(event) => onUpdate(slot.url, event.target.value)} placeholder="https://" /></label>
            </div>
          ))}
        </div>
      </section> : null}
      {activeSection === "compliance" ? <section className="settings-section">
        <div className="settings-section-intro"><p className="panel-label">备案信息</p><p>备案号显示在每个页面的内容页脚，保持低对比度和完整可访问性。</p></div>
        <div className="settings-fields">
          <label>ICP备案号<input value={settings.icpNumber} onChange={(event) => onUpdate("icpNumber", event.target.value)} placeholder="例如：京ICP备XXXXXXXX号" /></label>
          <label>公安备案号<input value={settings.publicSecurityNumber} onChange={(event) => onUpdate("publicSecurityNumber", event.target.value)} placeholder="选填" /></label>
          <label className="span-2">公安备案查询链接<input type="url" value={settings.publicSecurityUrl} onChange={(event) => onUpdate("publicSecurityUrl", event.target.value)} placeholder="https://www.beian.gov.cn/portal/registerSystemInfo?..." /></label>
        </div>
      </section> : null}
    </form>
  );
}
