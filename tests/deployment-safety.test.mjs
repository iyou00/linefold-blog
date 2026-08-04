import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import net from "node:net";
import path from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { backupNodeData, inspectNodeDeployment, isPortOpen, loadNodeEnv } from "../scripts/node-deploy-utils.mjs";

const environmentKeys = [
  "STORAGE_DRIVER", "BLOG_DB_PATH", "HOSTNAME", "PORT", "ADMIN_USERNAME",
  "ADMIN_PASSWORD_HASH", "SESSION_SECRET", "IMAGE_HOST_ALLOWLIST", "SITE_URL",
];

function withEnvironment(values, callback) {
  const previous = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    return callback();
  } finally {
    for (const key of environmentKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function safeEnvironment(databasePath) {
  return {
    STORAGE_DRIVER: "sqlite",
    BLOG_DB_PATH: databasePath,
    HOSTNAME: "127.0.0.1",
    PORT: "3100",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD_HASH: "pbkdf2$210000$c2FsdC1mb3ItdGVzdA$dGVzdC1oYXNoLXZhbHVl",
    SESSION_SECRET: "0123456789abcdef0123456789abcdef",
    IMAGE_HOST_ALLOWLIST: "img.example.cn",
    SITE_URL: "https://blog.example.cn",
  };
}

test("宝塔生产预检接受回环监听、绝对数据库路径和 HTTPS 域名", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "linefold-deploy-check-"));
  try {
    withEnvironment(safeEnvironment(path.join(directory, "field-notes.sqlite")), () => {
      const report = inspectNodeDeployment({ strictProduction: true, checkDatabase: true });
      assert.deepEqual(report.errors, []);
      assert.match(report.warnings.join("\n"), /首次启动时会生成/);
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("环境文件覆盖 Linux 预置的服务器 HOSTNAME", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "linefold-env-check-"));
  const envFile = path.join(directory, ".env.node.local");
  const previousHostname = process.env.HOSTNAME;
  try {
    process.env.HOSTNAME = "VM-20-14-opencloudos";
    writeFileSync(envFile, "HOSTNAME=127.0.0.1\n", "utf8");
    loadNodeEnv(envFile);
    assert.equal(process.env.HOSTNAME, "127.0.0.1");
  } finally {
    if (previousHostname === undefined) delete process.env.HOSTNAME;
    else process.env.HOSTNAME = previousHostname;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("宝塔生产预检阻止公网监听、相对数据库路径和 HTTP 域名", () => {
  withEnvironment({ ...safeEnvironment("./data/site.sqlite"), HOSTNAME: "0.0.0.0", SITE_URL: "http://example.com" }, () => {
    const report = inspectNodeDeployment({ strictProduction: true, checkDatabase: false });
    const errors = report.errors.join("\n");
    assert.match(errors, /BLOG_DB_PATH 必须使用绝对路径/);
    assert.match(errors, /HOSTNAME=127\.0\.0\.1/);
    assert.match(errors, /SITE_URL 必须使用 HTTPS/);
  });
});

test("SQLite 升级备份包含完整数据和独立环境文件", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "linefold-backup-check-"));
  const databasePath = path.join(directory, "field-notes.sqlite");
  const envFile = path.join(directory, ".env.node.local");
  try {
    const database = new DatabaseSync(databasePath);
    database.exec("CREATE TABLE sample (value TEXT NOT NULL); INSERT INTO sample VALUES ('kept')");
    database.close();
    writeFileSync(envFile, "SESSION_SECRET=test-secret\n", "utf8");

    withEnvironment(safeEnvironment(databasePath), () => {
      const backup = backupNodeData(envFile);
      assert.ok(backup.databaseBackup);
      const copied = new DatabaseSync(backup.databaseBackup, { readOnly: true });
      assert.equal(copied.prepare("SELECT value FROM sample").get().value, "kept");
      copied.close();
      assert.equal(readFileSync(backup.envBackup, "utf8"), "SESSION_SECRET=test-secret\n");
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("升级端口保护可以识别仍在运行的旧服务", async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    assert.equal(await isPortOpen("127.0.0.1", address.port), true);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("启动包装器转发停止信号，宝塔升级文档使用统一命令", () => {
  const runner = readFileSync(new URL("../scripts/run-next.mjs", import.meta.url), "utf8");
  const guide = readFileSync(new URL("../docs/UPGRADE-BAOTA.md", import.meta.url), "utf8");
  const example = readFileSync(new URL("../.env.node.example", import.meta.url), "utf8");
  assert.match(runner, /process\.once\("SIGTERM"/);
  assert.match(runner, /child\.kill\(signal\)/);
  assert.match(guide, /npm run upgrade:baota/);
  assert.match(guide, /npm run healthcheck:node/);
  assert.match(example, /^HOSTNAME=127\.0\.0\.1$/m);
});
