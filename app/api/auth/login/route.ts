import { createSessionToken, sessionCookie, verifyPassword } from "@/lib/auth";
import { checkLoginAttempt, clearLoginFailures, loginClientKey, recordLoginFailure } from "@/lib/login-rate-limit";
import { getRuntimeValue } from "@/lib/runtime-env";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 16_384) return Response.json({ error: "请求内容过大" }, { status: 413 });
    const clientKey = loginClientKey(request);
    const rateLimit = checkLoginAttempt(clientKey);
    if (!rateLimit.allowed) return Response.json({ error: "登录尝试过于频繁，请稍后再试" }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfter), "cache-control": "no-store" } });
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim() || "";
    const validUser = username === getRuntimeValue("ADMIN_USERNAME");
    const validPassword = await verifyPassword(body.password || "");
    if (!validUser || !validPassword) {
      recordLoginFailure(clientKey);
      await new Promise((resolve) => setTimeout(resolve, 450));
      return Response.json({ error: "账号或密码不正确" }, { status: 401 });
    }
    clearLoginFailures(clientKey);
    const token = await createSessionToken(username);
    return Response.json(
      { ok: true },
      { headers: { "set-cookie": sessionCookie(token), "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "登录服务暂时不可用" }, { status: 500 });
  }
}
