import process from "node:process";
import { loadNodeEnv } from "./node-deploy-utils.mjs";

loadNodeEnv();
const hostname = process.env.HOSTNAME === "0.0.0.0" ? "127.0.0.1" : process.env.HOSTNAME || "127.0.0.1";
const port = process.env.PORT || "3100";
const baseUrl = `http://${hostname}:${port}`;

async function request(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { signal: AbortSignal.timeout(8000), redirect: "manual" });
  if (!response.ok) throw new Error(`${pathname} 返回 HTTP ${response.status}`);
  return response;
}

try {
  const home = await request("/");
  const html = await home.text();
  if (!html.includes("<html") || !html.includes("LINEFOLD")) throw new Error("首页响应内容不完整");

  const assetPath = html.match(/\/_next\/static\/[^"']+\.(?:css|js)/)?.[0];
  if (!assetPath) throw new Error("首页没有找到 Next.js 静态资源地址");
  await request(assetPath);

  const login = await request("/admin/login");
  const loginHtml = await login.text();
  if (!loginHtml.includes("内容管理")) throw new Error("后台登录页响应内容不完整");

  console.log(`✓ 健康检查通过：${baseUrl}`);
  console.log("✓ 首页、静态资源和后台登录页均可访问");
} catch (error) {
  console.error(`健康检查失败：${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
