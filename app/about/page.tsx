import { SiteShell } from "@/components/site-shell";
import { getSiteSettings } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata = { title: "关于", description: "关于我、此刻关注的事情，以及联系坐标。" };

function splitParagraphs(value: string) {
  return value.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 4);
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const identity = splitParagraphs(settings.about);
  const nowItems = splitLines(settings.aboutNow);
  const coordinates = [
    settings.aboutLocation ? { label: "BASE", value: settings.aboutLocation } : null,
    { label: "SINCE", value: settings.startedYear },
    settings.showEmail === "true" && settings.contactEmail
      ? { label: "CONTACT", value: settings.contactEmail, href: `mailto:${settings.contactEmail}` }
      : null,
  ].filter((item): item is { label: string; value: string; href?: string } => Boolean(item));

  return (
    <SiteShell active="ABOUT" artVariant="about">
      <article className="about-profile-page">
        <div className="about-spine" aria-hidden="true"><span /></div>

        <header className="about-chapter about-identity-chapter">
          <div className="about-chapter-index"><span>01</span><strong>IDENTITY</strong></div>
          <div className="about-chapter-body">
            <p className="eyebrow">ABOUT / PERSONAL INDEX</p>
            <h1>你好，我是 {settings.author}。<br /><span>我记录判断，也保留判断被修正的过程。</span></h1>
            <div className="about-identity-copy">
              {identity.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </header>

        <section className="about-chapter about-now-chapter" aria-labelledby="about-now-title">
          <div className="about-chapter-index"><span>02</span><strong>NOW</strong></div>
          <div className="about-chapter-body">
            <div className="about-chapter-heading"><p>CURRENT FOCUS / 此刻</p><h2 id="about-now-title">正在发生的事。</h2></div>
            <ol className="about-now-list">
              {nowItems.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="about-chapter about-coordinates-chapter" aria-labelledby="about-coordinates-title">
          <div className="about-chapter-index"><span>03</span><strong>COORDINATES</strong></div>
          <div className="about-chapter-body">
            <div className="about-chapter-heading"><p>COORDINATES / 坐标</p><h2 id="about-coordinates-title">保持连接。</h2></div>
            <dl className="about-coordinate-grid">
              {coordinates.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.href ? <a href={item.href}>{item.value} ↗</a> : item.value}</dd></div>)}
            </dl>
          </div>
        </section>

        <footer className="about-profile-end"><span>{settings.shortName} / ABOUT</span><span>STILL IN MOTION</span></footer>
      </article>
    </SiteShell>
  );
}
