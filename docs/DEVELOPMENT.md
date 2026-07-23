# 本地开发

## 环境要求

- Node.js 22.13 或更高版本
- npm 10 或更高版本

## Node + SQLite 模式

1. 复制 `.env.node.example` 为 `.env.node.local`。
2. 设置后台哈希、会话密钥和图片域名白名单。
3. 运行 `npm ci`。
4. 运行 `npm run dev:node`。

SQLite 文件首次启动自动创建在 `data/field-notes.sqlite`。

## D1 模式

1. 复制 `.dev.vars.example` 为 `.dev.vars`。
2. 运行 `npm ci`。
3. 运行 `npm run db:generate` 生成迁移。
4. 使用 Wrangler 将 `drizzle` 目录中的 SQL 应用到本地 D1。
5. 运行 `npm run dev`。

## 修改密码

运行：

```bash
node scripts/hash-password.mjs
```

将输出分别写入环境变量 `ADMIN_PASSWORD_HASH` 与 `SESSION_SECRET`。明文密码由本人保管。

## 常用验证

```bash
npm run build
npm run build:node
npm run lint
npm test
```
