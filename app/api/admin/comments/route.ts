import { isAdminRequest } from "@/lib/auth";
import { getAdminComments } from "@/lib/comments";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  return Response.json({ comments: await getAdminComments() }, { headers: { "cache-control": "no-store" } });
}
