import "server-only";
import { getDatabase } from "@/db";
import { getRuntimeValue } from "./runtime-env";

export type CommentStatus = "pending" | "approved" | "hidden";

export type PublicComment = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
};

export type AdminComment = PublicComment & {
  sourcePath: string;
  status: CommentStatus;
  updatedAt: string;
};

export type CommentInput = {
  nickname?: string;
  content?: string;
  sourcePath?: string;
};

type RawComment = {
  id: string;
  nickname: string;
  content: string;
  source_path: string;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
};

function toPublicComment(row: Pick<RawComment, "id" | "nickname" | "content" | "created_at">): PublicComment {
  return { id: row.id, nickname: row.nickname, content: row.content, createdAt: row.created_at };
}

function toAdminComment(row: RawComment): AdminComment {
  return {
    ...toPublicComment(row),
    sourcePath: row.source_path,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function normalizeSourcePath(value: string | undefined) {
  const sourcePath = value?.trim() || "/";
  return sourcePath.startsWith("/") && sourcePath.length <= 200 ? sourcePath : "/";
}

function containsLink(value: string) {
  return /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|cn|net|org|io|me)\b)/i.test(value);
}

export async function getPublicComments(): Promise<PublicComment[]> {
  try {
    const db = await getDatabase();
    const rows = await db.all<Pick<RawComment, "id" | "nickname" | "content" | "created_at">>(
      "SELECT id, nickname, content, created_at FROM comments WHERE status = 'approved' ORDER BY created_at DESC, id DESC LIMIT 6",
    );
    return rows.map(toPublicComment);
  } catch {
    return [];
  }
}

export async function getAdminComments(): Promise<AdminComment[]> {
  const db = await getDatabase();
  const rows = await db.all<RawComment>(
    "SELECT id, nickname, content, source_path, status, created_at, updated_at FROM comments ORDER BY created_at DESC, id DESC LIMIT 200",
  );
  return rows.map(toAdminComment);
}

export async function createComment(input: CommentInput, ipHash: string) {
  const nickname = input.nickname?.trim() || "ANON";
  const content = input.content?.trim() || "";
  if (nickname.length > 20) throw new Error("署名最多 20 个字");
  if (content.length < 2) throw new Error("请至少写 2 个字");
  if (content.length > 160) throw new Error("留言最多 160 个字");
  if (containsLink(content) || containsLink(nickname)) throw new Error("留言暂不支持链接");

  const db = await getDatabase();
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const [rate] = await db.all<{ total: number }>(
    "SELECT COUNT(*) AS total FROM comments WHERE ip_hash = ? AND created_at >= ?",
    [ipHash, since],
  );
  if (Number(rate?.total || 0) >= 3) throw new Error("提交得有点快，请稍后再试");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.run(
    "INSERT INTO comments (id, nickname, content, source_path, status, ip_hash, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)",
    [id, nickname, content, normalizeSourcePath(input.sourcePath), ipHash, now, now],
  );
  return { id, status: "pending" as const };
}

export async function updateCommentStatus(id: string, status: CommentStatus) {
  if (!id) throw new Error("留言不存在");
  if (!(["pending", "approved", "hidden"] as CommentStatus[]).includes(status)) throw new Error("留言状态无效");
  const db = await getDatabase();
  await db.run("UPDATE comments SET status = ?, updated_at = ? WHERE id = ?", [status, new Date().toISOString(), id]);
}

export async function deleteComment(id: string) {
  const db = await getDatabase();
  await db.run("DELETE FROM comments WHERE id = ?", [id]);
}

export async function getCommentIpHash(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const salt = getRuntimeValue("SESSION_SECRET") || "linefold-comment-rate-limit";
  const bytes = new TextEncoder().encode(`${salt}:${forwarded}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
