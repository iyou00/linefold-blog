# 宝塔面板部署

本项目适合宝塔面板的 Node 项目管理器或 Docker 管理器。个人博客推荐使用 Node 项目管理器、Nginx 反向代理和 SQLite 持久化目录，资源占用更低，备份路径也更直观。

## 一、服务器准备

在宝塔软件商店安装：

- Nginx
- Node.js 版本管理器或 Node 项目管理器
- Node.js `22.13` 或更高版本
- PM2 管理器（使用 PM2 配置时）

项目目录建议使用：

```text
/www/wwwroot/你的域名/
```

数据库固定放在：

```text
/www/wwwdata/field-notes/field-notes.sqlite
```

创建数据目录，并让宝塔运行 Node 项目的用户拥有读写权限。

## 二、上传与构建

上传交付包并解压到网站目录，保留 `.env.node.local`、`public`、`scripts`、`package.json` 和源码目录，然后在宝塔终端执行：

```bash
cd /www/wwwroot/你的域名
npm ci
npm run build:node
```

`.env.node.local` 使用以下生产配置：

```dotenv
STORAGE_DRIVER=sqlite
BLOG_DB_PATH=/www/wwwdata/field-notes/field-notes.sqlite
HOSTNAME=127.0.0.1
PORT=3100
ADMIN_USERNAME=你的后台账号
ADMIN_PASSWORD_HASH=你的密码哈希
SESSION_SECRET=至少32位随机字符串
IMAGE_HOST_ALLOWLIST=你的OSS域名,aliyuncs.com,myqcloud.com,qiniucdn.com,clouddn.com
SITE_URL=https://你的域名
```

## 三、添加 Node 项目

在宝塔的 Node 项目管理器中新建项目：

- 项目目录：`/www/wwwroot/你的域名`
- 启动方式：`npm`
- 启动命令：`npm run start:node`
- 运行端口：`3100`
- Node 版本：`22.13` 或更高
- 运行用户：拥有数据库目录写权限的普通用户
- 开机启动：开启

使用 PM2 时，也可以在项目目录运行：

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## 四、网站与反向代理

在宝塔“网站”中添加域名，进入“反向代理”，目标 URL 填写：

```text
http://127.0.0.1:3100
```

Nginx 需要传递以下请求头：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

在宝塔 SSL 页面申请证书并开启强制 HTTPS。`SITE_URL` 必须与最终 HTTPS 域名一致。

## 五、数据库与备份

文章、草稿与站点设置都保存在 `BLOG_DB_PATH` 指定的 SQLite 文件中。建议在宝塔计划任务中每天备份 `/www/wwwdata/field-notes/`，保留至少 14 份。

执行文件级备份前，可以短暂停止 Node 项目，备份完成后重新启动。这样 SQLite 主文件、WAL 与 SHM 文件能够保持一致。

代码更新流程：

1. 备份数据库目录和 `.env.node.local`。
2. 上传并覆盖代码文件，保留数据目录。
3. 执行 `npm ci` 和 `npm run build:node`。
4. 在宝塔 Node 项目管理器中重启项目。
5. 检查首页、文章详情和后台登录。

## 六、安全建议

- 数据库目录放在网站根目录之外。
- `.env.node.local` 禁止通过 Nginx 访问。
- 后台密码上线前重新生成。
- Node 端口只监听 `127.0.0.1`，公网入口统一经过 Nginx。
- 图片外链只允许已确认可在中国大陆访问的 HTTPS 域名。
- 宝塔面板开启安全入口、双重验证和 IP 限制。

项目提供两份可直接用于宝塔的安全模板：

- `deploy/nginx-http-security.conf`：放入 Nginx 主配置的 `http {}`。
- `deploy/nginx-site-security.conf`：放入当前网站的 `server {}`，替换原有的通用反向代理 `location /`。

保存前执行 `nginx -t`。配置生效后，公开页面、后台接口和登录接口拥有独立速率限制，Node 端同时保留登录失败限流。

正式运营推荐在域名前接入国内 EdgeOne、ESA 或 WAF，并在云安全组只放行边缘平台回源 IP。该层负责流量型 DDoS、CC 和高级 Bot；Nginx 与应用层负责源站兜底。
