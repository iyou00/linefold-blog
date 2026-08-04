# 宝塔面板安全升级

这套流程适合已经在宝塔运行 LINEFOLD、并希望保留文章、作品、评论和站点设置的用户。正常升级只需要停止项目、上传新代码、执行一条升级命令、重新启动。

## 升级前只确认三件事

1. 宝塔 Node 版本为 `22.13.0` 或更高。
2. `.env.node.local` 仍位于项目根目录。
3. `BLOG_DB_PATH` 使用网站目录之外的绝对路径，例如 `/www/wwwdata/field-notes/field-notes.sqlite`。

数据库放在 `/www/wwwdata` 后，覆盖网站代码不会覆盖内容数据。

## 标准升级：四步完成

### 1. 在宝塔停止 Node 项目

进入“网站 → Node 项目”，点击当前项目的“停止”。升级脚本会再次检查端口；检测到旧进程仍在监听时会主动中止，避免运行中的 `.next` 被覆盖。

### 2. 使用新目录替换代码

压缩包升级推荐使用“旧目录保留、新目录接管”的方式。它可以清理已经删除的旧文件，也能在构建失败时快速回滚。

假设当前项目目录为 `/www/wwwroot/example.com`，在宝塔文件管理器中：

1. 将旧目录移动到 `/www/backup/linefold/example.com-before-upgrade`。
2. 将新版完整代码解压到新的 `/www/wwwroot/example.com`。
3. 从旧目录复制 `.env.node.local` 到新目录根部。

最终的新项目目录仍然是：

```text
/www/wwwroot/example.com
```

数据库位于 `/www/wwwdata`，无需移动。旧项目目录保留到新版本验收完成，再按自己的备份周期清理。

通过 Git 管理服务器代码时，可以在停止项目后使用 `git pull --ff-only`；Git 会正确处理新版已经删除的文件，`.env.node.local` 处于忽略列表中并会继续保留。

### 3. 执行一条升级命令

在宝塔终端执行：

```bash
cd /www/wwwroot/example.com
npm run upgrade:baota
```

这条命令会依次完成：

1. 检查 Node 版本、监听地址、端口、HTTPS 域名、密码哈希和数据库权限。
2. 执行 SQLite 完整性检查。
3. 将 SQLite 和 `.env.node.local` 备份到数据库同级的 `backups` 目录。
4. 严格按照 `package-lock.json` 安装依赖。
5. 生成 Next.js 独立运行版本。
6. 检查服务端入口、静态资源和 `public` 目录是否完整。

任何一步失败都会停止后续操作，并保留已经生成的备份。

### 4. 启动并验收

回到宝塔启动 Node 项目，然后执行：

```bash
cd /www/wwwroot/example.com
npm run healthcheck:node
```

看到以下两行即表示 Node 服务和静态资源正常：

```text
✓ 健康检查通过
✓ 首页、静态资源和后台登录页均可访问
```

最后在浏览器完成四项检查：

- 首页可以打开。
- 后台可以登录。
- 文章和 WORKS 内容仍然存在。
- 提交一条留言后，可以在后台审核并在详情页看到。

## 仅执行升级前检查

准备上传前，可以先运行：

```bash
npm run deploy:check
```

该命令只读取和检查环境，不安装依赖、不构建、不修改数据库。

## 单独备份

停止 Node 项目后执行：

```bash
npm run backup:node
```

备份默认保存在：

```text
/www/wwwdata/field-notes/backups/
```

数据库使用 SQLite `VACUUM INTO` 生成一致性副本，环境文件备份权限会设置为 `600`。

## 升级失败时回滚

1. 保持宝塔 Node 项目为停止状态。
2. 将构建失败的新目录移动到 `example.com-failed`。
3. 将 `/www/backup/linefold/example.com-before-upgrade` 移回 `/www/wwwroot/example.com`。
4. 在宝塔重新启动项目并运行 `npm run healthcheck:node`。

本次版本的数据库升级只新增表和设置键。旧代码可以忽略这些新增结构。只有日志明确显示 SQLite 结构或完整性错误时，才需要把 `backups` 中对应的 `.sqlite` 文件恢复到 `BLOG_DB_PATH`；恢复数据库会回到备份时刻的数据状态。

## 常见阻断信息

### “端口仍在监听”

宝塔项目或手动启动的 Node 进程仍在运行。停止项目后检查：

```bash
ss -lntp | grep ':3100'
```

无输出后重新执行升级。

### “BLOG_DB_PATH 必须使用绝对路径”

将 `.env.node.local` 修改为：

```dotenv
BLOG_DB_PATH=/www/wwwdata/field-notes/field-notes.sqlite
```

创建目录并授权：

```bash
mkdir -p /www/wwwdata/field-notes
chown -R www:www /www/wwwdata/field-notes
chmod 755 /www/wwwdata/field-notes
```

### “SQLite 路径不可用”

确认宝塔项目运行用户与目录所有者一致。常见运行用户为 `www`：

```bash
ls -ld /www/wwwdata/field-notes
```

### “环境文件权限”警告

执行：

```bash
chmod 600 .env.node.local
```

### “监听地址”显示为服务器名称

Linux 会预置一个表示服务器名称的 `HOSTNAME`。当前升级脚本以 `.env.node.local` 为部署配置来源，并读取其中的：

```dotenv
HOSTNAME=127.0.0.1
```

使用早期升级包时，可以通过下面的命令完成本次升级：

```bash
HOSTNAME=127.0.0.1 npm run upgrade:baota
```

### 构建失败

升级脚本已经保留数据库和环境备份。查看错误上方第一段 `Error`，修正后重新执行 `npm run upgrade:baota`。脚本会生成一个新的升级前备份。
