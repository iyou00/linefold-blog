import { isAdminRequest, isSameOrigin } from "@/lib/auth";
import { deleteComment, updateCommentStatus, type CommentStatus } from "@/lib/comments";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  try {
    const { id } = await params;
    const { status } = (await request.json()) as { status: CommentStatus };
    await updateCommentStatus(id, status);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新失败" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "未登录" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  const { id } = await params;
  await deleteComment(id);
  return Response.json({ ok: true });
}
