import { spawn } from "node:child_process";
import process from "node:process";
import {
  backupNodeData,
  inspectNodeDeployment,
  isPortOpen,
  loadNodeEnv,
  printInspection,
  projectRoot,
  verifyStandaloneOutput,
} from "./node-deploy-utils.mjs";

process.chdir(projectRoot);
const options = new Set(process.argv.slice(2));
const checkOnly = options.has("--check");
const backupOnly = options.has("--backup-only");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`${command} 被信号 ${signal} 终止`));
      else if (code !== 0) reject(new Error(`${command} 执行失败，退出码 ${code}`));
      else resolve();
    });
  });
}

try {
  const envFile = loadNodeEnv();
  const report = inspectNodeDeployment({ strictProduction: true, checkDatabase: true, envFile });
  printInspection(report);
  if (report.errors.length) process.exit(1);
  console.log("✓ 生产环境预检通过");
  if (checkOnly) process.exit(0);

  if (await isPortOpen(report.hostname, report.port)) {
    throw new Error(`检测到 ${report.hostname}:${report.port} 仍在监听。请先在宝塔停止 Node 项目，再重新执行升级命令`);
  }

  const backup = backupNodeData(envFile);
  console.log(`✓ 环境配置已备份：${backup.envBackup}`);
  console.log(backup.databaseBackup ? `✓ SQLite 已一致性备份：${backup.databaseBackup}` : "✓ 首次部署暂无 SQLite 文件，已跳过数据库备份");
  if (backupOnly) process.exit(0);

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  await run(npmCommand, ["ci", "--include=dev", "--no-audit", "--no-fund"]);
  await run(npmCommand, ["run", "build:node"]);
  verifyStandaloneOutput();

  console.log("✓ 依赖、生产构建与静态资源检查全部通过");
  console.log("下一步：在宝塔启动 Node 项目，然后执行 npm run healthcheck:node");
} catch (error) {
  console.error(`升级已停止：${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
