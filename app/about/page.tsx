import { SiteShell } from "@/components/site-shell";
import { getSiteSettings } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata = { title: "关于" };

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const profileItems = [
    { label: "SITE", value: settings.siteName },
    { label: "AUTHOR", value: settings.author },
    { label: "SINCE", value: settings.startedYear },
  ];

  return (
    <SiteShell active="ABOUT" artVariant="about">
      <article className="about-page">
        <header className="about-intro">
          <p className="eyebrow">ABOUT / 关于</p>
          <h1>你好，我是 {settings.author}。<br />我在这里留下长期有效的记录。</h1>
          <p className="about-lede">{settings.about}</p>
        </header>

        <blockquote className="about-statement">
          <p>项目留下过程，日常留下感受，教程留下可以再次使用的方法。</p>
        </blockquote>

        <section className="about-section" aria-labelledby="about-content-title">
          <div className="about-section-heading">
            <p className="section-label">WHAT LIVES HERE / 这里有什么</p>
            <h2 id="about-content-title">一份持续生长的个人档案。</h2>
          </div>
          <ol className="about-index">
            <li><span>01</span><div><h3>Projects / 项目</h3><p>记录从想法、取舍到完成的过程，也保留途中出现的问题与答案。</p></div></li>
            <li><span>02</span><div><h3>Notes / 随笔</h3><p>收纳生活、阅读和工作中的观察，让尚未成形的想法有地方停留。</p></div></li>
            <li><span>03</span><div><h3>Tutorials / 教程</h3><p>整理已经验证的方法与步骤，让一次解决问题的经历能够再次复用。</p></div></li>
          </ol>
        </section>

        <section className="about-section about-principles" aria-labelledby="about-principles-title">
          <div className="about-section-heading">
            <p className="section-label">WRITING PRINCIPLES / 写作原则</p>
            <h2 id="about-principles-title">清楚、诚实、耐读。</h2>
          </div>
          <div className="about-principle-grid">
            <p><span>01</span>先保存真实经过，再整理自己的结论。</p>
            <p><span>02</span>写给今天的读者，也写给多年后的自己。</p>
            <p><span>03</span>让设计服务阅读，让内容保持安静。</p>
          </div>
        </section>

        <footer className="about-profile">
          <dl>
            {profileItems.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            {settings.showEmail === "true" && settings.contactEmail ? <div><dt>CONTACT</dt><dd><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></dd></div> : null}
          </dl>
        </footer>
      </article>
    </SiteShell>
  );
}
