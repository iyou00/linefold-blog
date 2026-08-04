import { constants, accessSync, chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function hasPlaceholder(value) {
  return /替换|你的|example\.com/i.test(value);
}

export function loadNodeEnv(file = process.env.NODE_ENV_FILE || path.join(projectRoot, ".env.node.local")) {
  if (!existsSync(file)) throw new Error(`缺少环境文件：${file}`);
  const source = readFileSync(file, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    // The env file is the deployment source of truth. Linux commonly provides
    // HOSTNAME as the machine name, which must not override the bind address.
    process.env[key] = value;
  }
  return path.resolve(file);
}

export function resolveDatabasePath() {
  const configured = process.env.BLOG_DB_PATH || "./data/field-notes.sqlite";
  return path.isAbsolute(configured) ? configured : path.resolve(projectRoot, configured);
}

export function inspectNodeDeployment({ strictProduction = false, checkDatabase = true, envFile } = {}) {
  const errors = [];
  const warnings = [];
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) errors.push(`Node.js 版本过低：当前 ${process.versions.node}，需要 22.13.0 或更高版本`);

  if (process.env.STORAGE_DRIVER !== "sqlite") errors.push("Node 部署需要 STORAGE_DRIVER=sqlite");
  const databasePath = resolveDatabasePath();
  if (strictProduction && !path.isAbsolute(process.env.BLOG_DB_PATH || "")) errors.push("宝塔生产环境的 BLOG_DB_PATH 必须使用绝对路径");

  const hostname = process.env.HOSTNAME || "";
  if (!hostname) errors.push("缺少 HOSTNAME");
  if (strictProduction && hostname !== "127.0.0.1") errors.push("宝塔生产环境需要 HOSTNAME=127.0.0.1，避免 Node 端口直接暴露到公网");

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push("PORT 必须是 1 到 65535 之间的整数");
  if (!process.env.ADMIN_USERNAME?.trim()) errors.push("缺少 ADMIN_USERNAME");

  const passwordMatch = process.env.ADMIN_PASSWORD_HASH?.match(/^pbkdf2\$(\d+)\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/);
  if (!passwordMatch || Number(passwordMatch[1]) < 100000 || hasPlaceholder(process.env.ADMIN_PASSWORD_HASH || "")) {
    errors.push("ADMIN_PASSWORD_HASH 格式无效，请运行 node scripts/hash-password.mjs 重新生成");
  }

  const sessionSecret = process.env.SESSION_SECRET || "";
  if (sessionSecret.length < 32 || hasPlaceholder(sessionSecret)) errors.push("SESSION_SECRET 至少需要 32 位，且不能使用示例占位值");

  try {
    const siteUrl = new URL(process.env.SITE_URL || "");
    if (strictProduction && siteUrl.protocol !== "https:") errors.push("宝塔生产环境的 SITE_URL 必须使用 HTTPS");
    if (siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) errors.push("SITE_URL 只填写协议和域名，不包含路径、查询参数或锚点");
    if (hasPlaceholder(siteUrl.hostname)) errors.push("SITE_URL 仍包含示例域名");
  } catch {
    errors.push("SITE_URL 不是有效网址");
  }

  for (const host of (process.env.IMAGE_HOST_ALLOWLIST || "").split(",").map((item) => item.trim()).filter(Boolean)) {
    if (host.includes("://") || host.includes("/") || hasPlaceholder(host)) errors.push(`图片白名单格式无效：${host}；这里只填写主机名`);
  }

  if (envFile && process.platform !== "win32") {
    const mode = statSync(envFile).mode & 0o777;
    if ((mode & 0o077) !== 0) warnings.push(`环境文件权限为 ${mode.toString(8)}，建议执行 chmod 600 .env.node.local`);
  }

  if (checkDatabase) {
    try {
      mkdirSync(path.dirname(databasePath), { recursive: true });
      accessSync(path.dirname(databasePath), constants.R_OK | constants.W_OK);
      if (existsSync(databasePath)) {
        const database = new DatabaseSync(databasePath);
        const result = database.prepare("PRAGMA quick_check").get();
        database.close();
        if (!result || Object.values(result)[0] !== "ok") errors.push("SQLite 完整性检查未通过，请先停止升级并恢复备份");
      } else {
        warnings.push(`数据库尚未创建，首次启动时会生成：${databasePath}`);
      }
    } catch (error) {
      errors.push(`SQLite 路径不可用：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { errors, warnings, databasePath, hostname, port };
}

export function printInspection(report) {
  console.log(`Node.js: ${process.versions.node}`);
  console.log(`SQLite: ${report.databasePath}`);
  console.log(`监听地址: ${report.hostname}:${report.port}`);
  for (const warning of report.warnings) console.warn(`警告：${warning}`);
  for (const error of report.errors) console.error(`错误：${error}`);
}

export function backupNodeData(envFile) {
  const databasePath = resolveDatabasePath();
  const backupDirectory = path.join(path.dirname(databasePath), "backups");
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  mkdirSync(backupDirectory, { recursive: true });

  let databaseBackup = null;
  if (existsSync(databasePath)) {
    const extension = path.extname(databasePath) || ".sqlite";
    const databaseName = path.basename(databasePath, path.extname(databasePath));
    databaseBackup = path.join(backupDirectory, `${databaseName}-${timestamp}${extension}`);
    const database = new DatabaseSync(databasePath);
    const check = database.prepare("PRAGMA quick_check").get();
    if (!check || Object.values(check)[0] !== "ok") {
      database.close();
      throw new Error("SQLite 完整性检查未通过，已取消备份和升级");
    }
    database.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    database.exec(`VACUUM INTO '${databaseBackup.replaceAll("'", "''")}'`);
    database.close();
    if (process.platform !== "win32") chmodSync(databaseBackup, 0o600);
  }

  const envBackup = path.join(backupDirectory, `env-node-local-${timestamp}.backup`);
  copyFileSync(envFile, envBackup);
  if (process.platform !== "win32") chmodSync(envBackup, 0o600);
  return { databaseBackup, envBackup, backupDirectory };
}

export function isPortOpen(hostname, port, timeout = 700) {
  const host = !hostname || hostname === "0.0.0.0" ? "127.0.0.1" : hostname;
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    function finish(open) {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    }
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(timeout, () => finish(false));
  });
}

export function verifyStandaloneOutput() {
  const required = [
    ".next/standalone/server.js",
    ".next/standalone/.next/static",
    ".next/standalone/public",
  ];
  const missing = required.filter((item) => !existsSync(path.join(projectRoot, item)));
  if (missing.length) throw new Error(`构建产物不完整：${missing.join("、")}`);
}
