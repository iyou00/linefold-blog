# 中国大陆部署

## 推荐形态

一台中国大陆地区的轻量云服务器运行 Node.js 22，Nginx 提供 HTTPS 与反向代理，SQLite 数据文件放在持久化磁盘，图片放在阿里云 OSS、腾讯云 COS、七牛云或自有对象存储域名。

使用宝塔面板时，直接参考 [宝塔面板部署](DEPLOYMENT-BAOTA.md)。

## 资源策略

- CSS、JavaScript、图标和字体全部随站点发布。
- 页面运行时不请求 Google Fonts、jsDelivr、unpkg、Cloudflare CDN 或海外统计脚本。
- `IMAGE_HOST_ALLOWLIST` 只填写已经验证的国内图片域名。
- 外链图片使用 HTTPS、自定义域名和合理缓存策略。

## 原生 Node 部署

```bash
npm ci
npm run build:node
```

上传以下内容到服务器：

- `.next/standalone`
- `.next/static`
- `public`
- 生产环境变量文件

进入 `.next/standalone` 后使用 `node server.js` 启动。设置 `HOSTNAME=127.0.0.1`、`PORT=3100`、`STORAGE_DRIVER=sqlite` 和 `BLOG_DB_PATH=/你的持久化目录/field-notes.sqlite`，公网访问统一经过 Nginx。

## Docker 部署

`compose.yaml` 已把服务限制在本机 `127.0.0.1:3100`，由 Nginx 统一对外。构建服务器可通过 `NODE_IMAGE` 指定企业内部镜像或国内镜像仓库中的 Node 22 基础镜像。

## Nginx 核心配置

```nginx
server {
  listen 443 ssl http2;
  server_name 你的域名;

  location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /_next/static/ {
    proxy_pass http://127.0.0.1:3100;
    expires 365d;
    add_header Cache-Control "public, immutable";
  }
}
```

正式启用域名前，根据服务器地域和主体情况完成所需的域名备案与安全配置。生产环境的 `SITE_URL` 使用最终 HTTPS 域名。
