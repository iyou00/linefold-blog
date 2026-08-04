import { spawn } from "node:child_process";
import { cp } from "node:fs/promises";
import { resolve } from "node:path";
import { inspectNodeDeployment, loadNodeEnv, printInspection } from "./node-deploy-utils.mjs";

let envFile;
try {
  envFile = loadNodeEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("请从 .env.node.example 复制并配置 .env.node.local。");
  process.exit(1);
}
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

if (mode === "start") {
  const report = inspectNodeDeployment({ strictProduction: false, checkDatabase: true, envFile });
  printInspection(report);
  if (report.errors.length) process.exit(1);
}

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: mode === "dev" ? "development" : "production" },
});
let shutdownTimer;
function forwardSignal(signal) {
  if (child.exitCode !== null || child.signalCode) return;
  child.kill(signal);
  shutdownTimer ??= setTimeout(() => child.kill("SIGKILL"), 10000);
  shutdownTimer.unref();
}
const stopOnInterrupt = () => forwardSignal("SIGINT");
const stopOnTerminate = () => forwardSignal("SIGTERM");
process.once("SIGINT", stopOnInterrupt);
process.once("SIGTERM", stopOnTerminate);

const result = await new Promise((resolveExit, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => resolveExit({ code: code ?? (signal ? 0 : 1), signal }));
});
if (shutdownTimer) clearTimeout(shutdownTimer);
process.removeListener("SIGINT", stopOnInterrupt);
process.removeListener("SIGTERM", stopOnTerminate);

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
