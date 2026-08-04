import { isSameOrigin } from "@/lib/auth";
import { createComment, getCommentIpHash, type CommentInput } from "@/lib/comments";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2048) return Response.json({ error: "留言内容过长" }, { status: 413 });
  try {
    const input = (await request.json()) as CommentInput & { website?: string };
    if (input.website) return Response.json({ ok: true }, { status: 201 });
    await createComment(input, await getCommentIpHash(request));
    return Response.json({ ok: true, message: "已收到，审核后会显示在全站右栏" }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "提交失败" }, { status: 400 });
  }
}
