# Security Policy

## Supported version

安全修复应用于 `main` 分支的最新版本。

## Reporting a vulnerability

请使用 GitHub 仓库的 **Security → Report a vulnerability** 私下报告安全问题。报告中请包含受影响页面、复现步骤、影响范围和建议修复方式。

请勿在公开 Issue、Discussion 或社交平台中披露可利用细节、后台地址、真实凭据、会话信息或用户数据。

## Deployment secrets

以下文件和数据只应存在于本地或生产服务器：

- `.env.node.local`
- `.dev.vars`
- `CREDENTIALS.local.md`
- `*.sqlite`、`*.sqlite-wal`、`*.sqlite-shm`
- Nginx、对象存储和边缘安全平台的真实密钥

怀疑凭据泄露时，应立即更换后台密码哈希、`SESSION_SECRET`、对象存储密钥和相关平台令牌，并使现有会话失效。
