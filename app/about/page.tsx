import { SiteShell } from "@/components/site-shell";
import { getSiteSettings } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata = { title: "关于" };

export default async function AboutPage() {
  const settings = await getSiteSettings();
  return (
    <SiteShell active="ABOUT" artVariant="about">
      <article className="about-page">
        <p className="eyebrow">ABOUT / 关于</p>
        <h1>你好，我是 {settings.author}。</h1>
        <p>{settings.about}</p>
        <hr />
        <dl>
          <div><dt>内容</dt><dd>随笔、教程与项目过程</dd></div>
          <div><dt>更新</dt><dd>保持自己的节奏</dd></div>
          <div><dt>开始</dt><dd>{settings.startedYear} 年</dd></div>
          <div><dt>联系</dt><dd><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></dd></div>
        </dl>
      </article>
    </SiteShell>
  );
}
