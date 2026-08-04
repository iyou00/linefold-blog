import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdminPage } from "@/lib/auth";
import { getAllowedImageHosts } from "@/lib/image-policy";
import { getAdminComments } from "@/lib/comments";
import { getAdminPostSummaries, getSiteSettings } from "@/lib/posts";
import { getAdminWorks, getRelatedPostOptions } from "@/lib/works";

export const dynamic = "force-dynamic";
export const metadata = { title: "内容管理", robots: { index: false, follow: false } };

export default async function AdminPage() {
  await requireAdminPage();
  const [postPage, works, comments, relatedPostOptions, settings] = await Promise.all([getAdminPostSummaries(), getAdminWorks(), getAdminComments(), getRelatedPostOptions(), getSiteSettings()]);
  return <AdminDashboard initialPosts={postPage.posts} initialTotal={postPage.total} initialNextCursor={postPage.nextCursor} initialWorks={works} initialComments={comments} relatedPostOptions={relatedPostOptions} initialSettings={settings} allowedImageHosts={getAllowedImageHosts()} />;
}
