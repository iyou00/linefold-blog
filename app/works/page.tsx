import { SiteFooter, SiteShell } from "@/components/site-shell";
import { WorksBrowser } from "@/components/works-browser";
import { getSiteSettings } from "@/lib/posts";
import { getPublishedWorks } from "@/lib/works";

export const dynamic = "force-dynamic";
export const metadata = { title: "作品", description: "LINEFOLD 的项目与作品案例。" };

export default async function WorksPage() {
  const [works, settings] = await Promise.all([getPublishedWorks(), getSiteSettings()]);
  const footer = <SiteFooter settings={settings} className="work-preview-site-footer" />;
  return <SiteShell active="WORKS" showArt={false} wide><WorksBrowser works={works} footer={footer} /></SiteShell>;
}
