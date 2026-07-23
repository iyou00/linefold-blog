import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/posts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${settings.siteName}｜个人记录`;
  return {
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    title: { default: title, template: `%s｜${settings.siteName}` },
    description: settings.description,
    openGraph: {
      type: "website", locale: "zh_CN", title, description: settings.description,
      images: [{ url: "/og-linefold.png", width: 1732, height: 909, alt: `${settings.siteName} — ${settings.heroLine1}${settings.heroLine2}` }],
    },
    twitter: { card: "summary_large_image", title, description: settings.description, images: ["/og-linefold.png"] },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
