import Link from "next/link";
import { navigation } from "@/lib/site-config";
import { getSiteSettings, type SiteSettings } from "@/lib/posts";

type Props = {
  active: (typeof navigation)[number]["label"];
  children: React.ReactNode;
  showArt?: boolean;
  artVariant?: ArtVariant;
};

export type ArtVariant = "home" | "orbit" | "stacks" | "timeline" | "fold" | "signal" | "about";

const articleArtVariants: ArtVariant[] = ["orbit", "stacks", "timeline", "fold", "signal"];

const socialMeta: Record<string, { label: string; mark: string }> = {
  douyin: { label: "抖音", mark: "抖" },
  xiaohongshu: { label: "小红书", mark: "红" },
  x: { label: "X", mark: "X" },
  bilibili: { label: "哔哩哔哩", mark: "B" },
  weibo: { label: "微博", mark: "微" },
  github: { label: "GitHub", mark: "GH" },
  website: { label: "个人主页", mark: "↗" },
};

export function selectArticleArt(seed: string): ArtVariant {
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return articleArtVariants[hash % articleArtVariants.length];
}

function Navigation({ active }: Pick<Props, "active">) {
  return (
    <nav aria-label="主导航">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={item.label === active ? "nav-link active" : "nav-link"}
          aria-current={item.label === active ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function LineStudy({ variant, caption, monogram }: { variant: ArtVariant; caption: string; monogram: string }) {
  return (
    <div className={`line-study line-study-${variant}`} data-monogram={monogram} aria-hidden="true">
      <span className="study-box box-a iso-block" />
      <span className="study-box box-b" />
      <span className="study-box box-c" />
      <span className="study-box box-d" />
      <span className="study-circle circle-a" />
      <span className="study-circle circle-b" />
      <span className="study-path path-a" />
      <span className="study-path path-b" />
      <span className="study-axis" />
      <span className="study-rule rule-a" />
      <span className="study-rule rule-b" />
      <span className="study-rule rule-c" />
      <span className="study-dot" />
      <span className="study-caption">{caption}</span>
    </div>
  );
}

function SiteMeta({ settings, className }: { settings: SiteSettings; className: string }) {
  return (
    <footer className={`site-footer ${className}`}>
      <span>{settings.footerCopyright || `© ${new Date().getFullYear()} ${settings.shortName}`}</span>
      <span className="footer-links">
        {settings.showEmail === "true" && settings.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>EMAIL</a> : null}
        {settings.icpNumber ? <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">{settings.icpNumber}</a> : null}
        {settings.publicSecurityNumber ? (settings.publicSecurityUrl ? <a href={settings.publicSecurityUrl} target="_blank" rel="noreferrer">{settings.publicSecurityNumber}</a> : <span>{settings.publicSecurityNumber}</span>) : null}
      </span>
    </footer>
  );
}

export async function SiteShell({ active, children, showArt = true, artVariant = "home" }: Props) {
  const settings = await getSiteSettings();
  const monogram = settings.author.trim().slice(0, 2).toUpperCase() || "ME";
  const socialLinks = ([1, 2, 3, 4] as const).flatMap((index) => {
    const platform = settings[`social${index}Platform`];
    const url = settings[`social${index}Url`];
    const meta = socialMeta[platform];
    return meta && url ? [{ ...meta, platform, url }] : [];
  });
  return (
    <div className="site-frame">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label={`${settings.siteName} 首页`}>
          {settings.shortName}
        </Link>
        <Navigation active={active} />
        <div className="sidebar-foot">
          <span>SINCE {settings.startedYear}</span>
          {socialLinks.length ? <div className="social-links">{socialLinks.map((item) => <a className={`social-${item.platform}`} key={`${item.label}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" aria-label={item.label} title={item.label}>{item.mark}</a>)}</div> : null}
        </div>
      </aside>

      <header className="mobile-header">
        <Link className="brand" href="/">{settings.shortName}</Link>
        <details className="mobile-menu">
          <summary>MENU</summary>
          <div className="mobile-menu-panel"><Navigation active={active} /></div>
        </details>
      </header>

      <main className="main-column">
        {children}
        <SiteMeta settings={settings} className="compact-site-footer" />
      </main>
      {showArt ? <aside className="art-column"><LineStudy variant={artVariant} caption={`${settings.author} / ${settings.shortName}`} monogram={monogram} /><SiteMeta settings={settings} className="art-site-footer" /></aside> : null}
    </div>
  );
}
