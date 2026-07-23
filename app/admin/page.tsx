import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdminPage } from "@/lib/auth";
import { getAllowedImageHosts } from "@/lib/image-policy";
import { getAdminPostSummaries, getSiteSettings } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata = { title: "内容管理", robots: { index: false, follow: false } };

export default async function AdminPage() {
  await requireAdminPage();
  const [postPage, settings] = await Promise.all([getAdminPostSummaries(), getSiteSettings()]);
  return <AdminDashboard initialPosts={postPage.posts} initialTotal={postPage.total} initialNextCursor={postPage.nextCursor} initialSettings={settings} allowedImageHosts={getAllowedImageHosts()} />;
}
