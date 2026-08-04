import { isAdminRequest, isSameOrigin } from "@/lib/auth";
import { createWork, getAdminWorks, type WorkInput } from "@/lib/works";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  try {
    return Response.json({ works: await getAdminWorks() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  try {
    const work = await createWork((await request.json()) as WorkInput);
    return Response.json({ work }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}
