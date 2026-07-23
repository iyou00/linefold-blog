# 宝塔部署 Field Notes Blog：Node.js / Next.js 10 分钟部署教程

本文适用于使用宝塔面板部署 Field Notes Blog 的 Node.js 独立运行版本。流程基于一次完整的实际部署与排错，包含依赖安装、SQLite、Node 项目、域名、SSL、反向代理及常见故障处理。

> 示例项目目录：`/www/wwwroot/example.com`
>
> 示例域名：`example.com`
>
> 示例数据库目录：`/www/wwwdata/field-notes`
> 示例应用端口：`3100`
>
> 使用其他域名或目录时，请将示例值替换为自己的实际值。

## 1. 部署前检查

准备以下环境：

- 宝塔面板及 Nginx
- Node.js 22 或更高版本
- npm
- 已解析到服务器公网 IP 的域名
- 已上传到服务器的完整项目文件

进入项目目录：

```bash
cd /www/wwwroot/example.com
pwd
ls -la
```

`pwd` 应显示：

```text
/www/wwwroot/example.com
```

项目目录中应包含 `package.json`、`.env.node.example`、`scripts` 等文件。

## 2. 安装依赖并判断 npm 输出

执行：

```bash
npm ci
```

看到类似下面的结果，且命令返回终端提示符，表示安装成功：

```text
added 623 packages in 22s
```

也可以立即检查退出状态：

```bash
echo $?
```

返回 `0` 表示上一条命令成功。

以下内容通常属于警告，当前部署可以继续：

```text
npm warn Unknown global config "--init.module"
deprecated ...
allow-scripts ...
```

出现 `npm error`、`npm ERR!` 或非零退出状态时，再按错误内容排查。`deprecated` 表示某个直接或间接依赖已经过时，服务器部署阶段请保留锁定依赖，避免随意删除单个依赖包。

可选：清理旧的全局 npm 配置警告：

```bash
npm config delete init.module --location=global
```

## 3. 创建并填写 Node 环境配置

复制示例配置：

```bash
cp .env.node.example .env.node.local
```

这条命令成功时通常没有输出。随后生成后台密码哈希和会话密钥：

```bash
node scripts/hash-password.mjs
```

按提示输入至少 12 位、自己能够保存和记住的后台登录密码。脚本会输出：

```text
ADMIN_PASSWORD_HASH=...
SESSION_SECRET=...
```

保存这两个完整值。`ADMIN_PASSWORD_HASH` 是登录密码的哈希值，后台登录时仍使用刚才亲自输入的原始密码。

编辑配置文件：

```bash
vi .env.node.local
```

参考配置：

```dotenv
STORAGE_DRIVER=sqlite
BLOG_DB_PATH=/www/wwwdata/field-notes/field-notes.sqlite

HOSTNAME=127.0.0.1
PORT=3100

ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=粘贴脚本生成的完整哈希值
SESSION_SECRET=粘贴脚本生成的完整会话密钥

IMAGE_HOST_ALLOWLIST=
SITE_URL=https://example.com
```

配置注意事项：

- `IMAGE_HOST_ALLOWLIST=` 可以留空，本地图片照常使用。接入 OSS、COS 或独立图床后，再填写图片主机名。
- 多个图片主机名使用英文逗号分隔，例如 `img.example.com,example.oss-cn-shenzhen.aliyuncs.com`。
- 图片白名单只填写主机名，省略 `https://`、端口和图片路径。
- `SITE_URL` 必须与浏览器最终访问地址完全一致，包括 `http/https` 和 `www`。
- `SITE_URL` 末尾省略 `/`，并清除行尾空格。
- `HOSTNAME=127.0.0.1` 让应用只接受本机 Nginx 转发，`PORT=3100` 与宝塔项目端口保持一致。

确认关键配置：

```bash
grep -E '^(STORAGE_DRIVER|BLOG_DB_PATH|HOSTNAME|PORT|ADMIN_USERNAME|IMAGE_HOST_ALLOWLIST|SITE_URL)=' .env.node.local
```

该命令不会显示密码哈希和会话密钥。

## 4. 创建 SQLite 数据库目录并设置权限

创建数据库目录：

```bash
mkdir -p /www/wwwdata/field-notes
```

将目录交给宝塔常用的 `www` 运行用户：

```bash
chown -R www:www /www/wwwdata/field-notes
chmod 755 /www/wwwdata/field-notes
```

检查结果：

```bash
ls -ld /www/wwwdata/field-notes
```

输出中的所有者和用户组应为：

```text
www www
```

SQLite 文件由应用首次运行时自动创建，文件路径为：

```text
/www/wwwdata/field-notes/field-notes.sqlite
```

## 5. 构建 Node 生产版本

确认当前位于项目目录：

```bash
cd /www/wwwroot/example.com
npm run build:node
```

构建成功时会看到类似：

```text
Compiled successfully
```

### 处理 `.openai/hosting.json` 缺失

若 TypeScript 检查出现：

```text
./vite.config.ts:3:27
Type error: Cannot find module './.openai/hosting.json'
```

这份 `vite.config.ts` 用于另一套 Vite/OpenAI Hosting 构建，宝塔的 Next.js Node 构建会在类型检查阶段读取它。将文件保留为备份名称：

```bash
cd /www/wwwroot/example.com
mv vite.config.ts vite.config.ts.openai-hosting
npm run build:node
```

需要恢复该配置时执行：

```bash
mv vite.config.ts.openai-hosting vite.config.ts
```

后续每次重新上传项目代码后，请确认 `vite.config.ts` 是否再次出现，并在 Node 构建前按同样方式处理。

## 6. 固定应用监听地址与端口

部分环境中，启动脚本可能监听 IPv6 回环地址 `::1:3100`。将 Linux 生产环境使用的监听参数固定到 `start:node` 脚本。

先备份：

```bash
cd /www/wwwroot/example.com
cp package.json package.json.bak
```

执行：

```bash
node - <<'NODE'
const fs = require('fs');

const file = 'package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

pkg.scripts['start:node'] =
  'HOSTNAME=127.0.0.1 PORT=3100 NODE_ENV=production node scripts/run-next.mjs start';

fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
console.log(pkg.scripts['start:node']);
NODE
```

确认启动脚本：

```bash
node -p "require('./package.json').scripts['start:node']"
```

预期输出：

```text
HOSTNAME=127.0.0.1 PORT=3100 NODE_ENV=production node scripts/run-next.mjs start
```

宝塔中的启动命令仍填写：

```text
npm run start:node
```

`start:node` 中的冒号使用英文半角符号。

## 7. 在宝塔添加 Node 项目

进入：

```text
宝塔面板 → 网站 → Node 项目 → 添加 Node 项目
```

填写：

```text
项目目录：/www/wwwroot/example.com
Node 版本：22 或更高版本
启动方式：npm
启动命令：npm run start:node
项目端口：3100
运行用户：www
```

保存并启动项目。项目状态应显示“运行中”。

## 8. 验证 Node 服务

以下系统检查命令可在任意目录执行：

```bash
ss -lntp | grep ':3100'
curl -I http://127.0.0.1:3100
```

正常监听结果包含：

```text
LISTEN ... 127.0.0.1:3100
```

正常 HTTP 结果包含：

```text
HTTP/1.1 200 OK
```

这两个结果说明 Node 进程已经运行，应用也能正常响应。

## 9. 绑定域名并开启外网映射

进入当前 Node 项目的：

```text
设置 → 域名管理
```

添加主域名：

```text
example.com
```

需要 `www` 地址时，再添加：

```text
www.example.com
```

随后进入：

```text
设置 → 外网映射
```

开启外网映射，让宝塔通过 Nginx 将 80/443 请求转发到 `127.0.0.1:3100`。

### 域名绑定规则

同一个域名只保留一个宝塔网站绑定。采用 Node 项目的“域名管理”和“外网映射”后，HTML 项目应释放该域名，避免两个 Nginx 站点争用相同的 `server_name`。

删除临时 HTML 项目时，保留项目目录：

```text
/www/wwwroot/example.com
```

宝塔删除确认框中取消“删除网站根目录”或“删除项目文件”，仅移除临时 HTML 网站记录与对应配置。

## 10. 检查反向代理请求头

进入 Node 项目的 Nginx 配置文件，检查 `location /`。推荐配置：

```nginx
location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Port $server_port;

    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_connect_timeout 30s;
    proxy_read_timeout 86400s;
    proxy_send_timeout 30s;
    proxy_redirect off;
}
```

`Host` 应使用：

```nginx
proxy_set_header Host $host;
```

请避免以下写法：

```nginx
proxy_set_header Host $host:$server_port;
```

后一种写法会在 HTTPS 下向应用传递 `example.com:443`，可能与浏览器的 `Origin: https://example.com` 不一致，进而触发后台的来源校验。

修改配置后检查语法并重新加载 Nginx：

```bash
nginx -t
nginx -s reload
```

语法检查应显示：

```text
syntax is ok
test is successful
```

随后在宝塔中重启 Node 项目。

## 11. 申请 SSL 并启用 HTTPS

进入当前 Node 项目设置中的 SSL 页面：

1. 为已绑定的域名申请证书。
2. 部署证书。
3. 开启强制 HTTPS。
4. 使用最终地址访问网站，例如 `https://example.com`。

再次核对 `.env.node.local`：

```dotenv
SITE_URL=https://example.com
```

SSL 生效的直观判断：浏览器能够正常打开 `https://` 地址，且证书对应当前域名。终端也可以检查响应：

```bash
curl -I https://example.com
```

## 12. 最终验收

依次验证：

```bash
ss -lntp | grep ':3100'
curl -I http://127.0.0.1:3100
curl -I https://example.com
```

再通过浏览器检查：

- 博客首页能够打开。
- 后台登录页能够打开。
- 后台能够登录。
- 品牌信息能够保存。
- Node 项目在关闭终端后仍保持“运行中”。

后台登录地址通常为：

```text
https://example.com/admin/login
```

## 13. 常见故障

### 13.1 `curl: (7) Failed to connect`

错误示例：

```text
curl: (7) Failed to connect to 127.0.0.1 port 3100: Connection refused
```

检查监听状态：

```bash
ss -lntp | grep ':3100'
```

处理方向：

- 无输出：Node 项目已经退出，查看宝塔 Node 项目日志。
- 出现 `[::1]:3100`：应用监听了 IPv6 回环地址，按第 6 节固定 `HOSTNAME=127.0.0.1`。
- 出现 `127.0.0.1:3100`：继续检查 `curl`、Nginx 配置和应用日志。

手动启动可直接看到真实错误：

```bash
cd /www/wwwroot/example.com
npm run start:node
```

手动启动会占用当前终端。测试完成后按 `Ctrl+C` 结束，再由宝塔启动并守护项目。

### 13.2 `EADDRINUSE: address already in use`

该错误表示 3100 端口已有进程监听：

```bash
ss -lntp | grep ':3100'
```

常见场景是宝塔项目已经运行，同时又在终端手动启动了一次。保留一个运行实例：先在宝塔停止项目，或在手动启动的终端按 `Ctrl+C`，确认端口释放后再启动宝塔项目。

### 13.3 npm 查找 `/root/package.json`

错误示例：

```text
npm error path /root/package.json
npm error enoent Could not read package.json
```

原因是命令在 `/root` 目录执行。涉及 `npm`、`package.json`、项目脚本或项目配置时，先进入项目目录：

```bash
cd /www/wwwroot/example.com
pwd
ls -l package.json
npm run start:node
```

`ss` 和 `curl` 属于系统检查命令，可以在任意目录运行。

### 13.4 忘记后台账号或密码

查看后台账号：

```bash
grep '^ADMIN_USERNAME=' /www/wwwroot/example.com/.env.node.local
```

`ADMIN_PASSWORD_HASH` 无法作为登录密码使用，也无法还原原始密码。忘记密码时重新生成：

```bash
cd /www/wwwroot/example.com
node scripts/hash-password.mjs
```

将新生成的完整值写回 `.env.node.local`：

```dotenv
ADMIN_PASSWORD_HASH=新的完整哈希值
SESSION_SECRET=新的完整会话密钥
```

保存后重启宝塔 Node 项目，并使用刚才输入的新密码登录。更新 `SESSION_SECRET` 会使已有登录会话失效，需要重新登录。

### 13.5 后台保存提示“请求来源无效”

按以下顺序检查：

1. 浏览器地址与 `SITE_URL` 完全一致，例如两者均为 `https://example.com`。
2. Nginx 使用 `proxy_set_header Host $host;`。
3. Nginx 已传递 `X-Forwarded-Host`、`X-Forwarded-Proto` 和 `X-Forwarded-Port`。
4. 同一个域名只绑定到当前 Node 项目。
5. 修改后已执行 `nginx -t`、`nginx -s reload`，并重启 Node 项目。
6. 退出后台后重新登录，再测试保存。

重点请求头如下：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Port $server_port;
```

### 13.6 宝塔启动后项目立即停止

打开宝塔 Node 项目的项目日志，检查最后几十行，重点关注：

```text
EACCES
ENOENT
MODULE_NOT_FOUND
EADDRINUSE
```

同时检查：

```bash
cd /www/wwwroot/example.com
ls -la .env.node.local package.json
ls -ld /www/wwwdata/field-notes
```

确认 `.env.node.local` 和 `package.json` 存在，数据库目录所有者为 `www:www`。

## 14. 上线后的关键规则

- Node 项目由宝塔启动并守护，终端关闭后服务继续运行。
- 同一域名只绑定一个宝塔项目。
- 最终域名、协议和 `SITE_URL` 保持完全一致。
- Node 仅监听 `127.0.0.1:3100`，公网访问统一经过 Nginx 的 80/443 端口。
- 每次修改 `.env.node.local` 后重启 Node 项目。
- 每次修改 Nginx 配置后先执行 `nginx -t`，通过后再重新加载。
- 重新上传代码或重新安装依赖后，再执行 `npm run build:node` 并重启项目。
