import { createPost, getAdminPostSummaries, type PostInput, type PublicPost } from "@/lib/posts";
import { isAdminRequest, isSameOrigin } from "@/lib/auth";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    const status: "all" | PublicPost["status"] = rawStatus === "draft" || rawStatus === "published" ? rawStatus : "all";
    const page = await getAdminPostSummaries({ query: url.searchParams.get("q") || "", status, cursor: url.searchParams.get("cursor") });
    return Response.json(page, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  try {
    const post = await createPost((await request.json()) as PostInput);
    return Response.json({ post }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}
