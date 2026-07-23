import { isAdminRequest, isSameOrigin } from "@/lib/auth";
import { getSiteSettings, saveSiteSettings, type SiteSettings } from "@/lib/posts";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  return Response.json({ settings: await getSiteSettings() }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  try {
    await saveSiteSettings((await request.json()) as SiteSettings);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}
