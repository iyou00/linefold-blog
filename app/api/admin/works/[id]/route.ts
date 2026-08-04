import { isAdminRequest, isSameOrigin } from "@/lib/auth";
import { deleteWork, getAdminWorkById, updateWork, type WorkInput } from "@/lib/works";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  const work = await getAdminWorkById(id);
  return work
    ? Response.json({ work }, { headers: { "cache-control": "no-store" } })
    : Response.json({ error: "作品不存在" }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  try {
    const { id } = await params;
    const work = await updateWork(id, (await request.json()) as WorkInput);
    return Response.json({ work });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  try {
    const { id } = await params;
    await deleteWork(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除失败" }, { status: 400 });
  }
}
