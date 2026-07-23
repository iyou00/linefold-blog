import { spawn } from "node:child_process";
import { cp, readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function loadEnv() {
  try {
    const source = await readFile(resolve(".env.node.local"), "utf8");
    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index < 1) continue;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      process.env[key] ??= value;
    }
  } catch {
    console.error("缺少 .env.node.local，请从 .env.node.example 复制并配置。");
    process.exit(1);
  }
}

await loadEnv();
const mode = process.argv[2];
const commands = {
  dev: [resolve("node_modules/next/dist/bin/next"), "dev", "-p", process.env.PORT || "3100"],
  build: [resolve("node_modules/next/dist/bin/next"), "build"],
  start: [resolve(".next/standalone/server.js")],
};
const args = commands[mode];
if (!args) {
  console.error("用法：node scripts/run-next.mjs dev|build|start");
  process.exit(1);
}

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: mode === "dev" ? "development" : "production" },
});
const result = await new Promise((resolveExit) => {
  child.on("exit", (code, signal) => resolveExit({ code: code ?? 1, signal }));
});

if (result.signal) process.kill(process.pid, result.signal);

if (mode === "build" && result.code === 0) {
  await cp(resolve(".next/static"), resolve(".next/standalone/.next/static"), {
    recursive: true,
    force: true,
  });
  await cp(resolve("public"), resolve(".next/standalone/public"), {
    recursive: true,
    force: true,
  });
  console.log("✓ 已将静态资源与 public 目录写入独立运行包");
}

process.exit(result.code);
