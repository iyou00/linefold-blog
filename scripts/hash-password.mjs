import { pbkdf2Sync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const terminal = createInterface({ input, output });
const password = await terminal.question("输入新的后台密码：", { hideEchoBack: true });
terminal.close();

if (password.length < 12) {
  console.error("密码至少需要 12 个字符。");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, 210000, 32, "sha256");
console.log(`ADMIN_PASSWORD_HASH=pbkdf2$210000$${salt.toString("base64url")}$${hash.toString("base64url")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
