# 安全与运维

## 上线前

1. 更换后台密码哈希和会话密钥。
2. 配置 HTTPS。
3. 将后台路径纳入访问日志与告警。
4. 为 `/api/auth/login` 配置反向代理限速。
5. 确认图片域名白名单只包含自有或可信国内域名。
6. 备份 SQLite 数据文件并验证恢复。

## 已实现的应用防护

- 登录接口按来源 IP 记录失败次数，15 分钟内达到 8 次后暂停 15 分钟。
- 登录请求体限制为 16 KiB，失败响应保持统一文案。
- 后台写接口校验签名 Cookie 与同源 Origin。
- 全站发送 CSP、禁止嵌入、MIME 嗅探保护、权限策略和严格来源策略。
- `robots.txt` 阻止守规矩的爬虫访问 `/admin/` 与 `/api/`。

## 宝塔与 Nginx

1. 将 `deploy/nginx-http-security.conf` 内容放入 Nginx 的 `http {}`。
2. 将 `deploy/nginx-site-security.conf` 内容放入博客网站的 `server {}`。
3. 接入 CDN/WAF 时，按平台文档配置 Nginx `set_real_ip_from` 与 `real_ip_header`，让限速键使用访客真实 IP。
4. 执行 `nginx -t`，确认通过后重载 Nginx。

模板为公开页面配置每 IP 8 请求/秒和 20 个并发连接，为后台接口配置每 IP 10 请求/秒，为登录配置每 IP 5 请求/分钟。超限统一返回 `429`，便于正常搜索引擎正确降低抓取速率。

## DDoS 与恶意爬虫

单台服务器适合处理应用层滥用，流量型 DDoS 需要在流量到达服务器前清洗。正式域名完成备案后，推荐接入一个中国内地边缘安全产品：

- 腾讯云 EdgeOne：启用速率限制、Bot 管理和支持回源 IP 白名单的源站防护套餐。
- 阿里云 ESA/WAF：启用 CC 防护、IP/会话限速和浏览器防爬策略。

完成边缘接入后，在云安全组中只放行边缘平台的回源 IP 和运维 IP，隐藏真实源站地址。同步配置平台提供的真实 IP 请求头与可信回源 IP 段，避免所有访问共用边缘节点 IP 触发限速。先以观察模式运行防爬规则，再切换到验证或拦截，降低正常搜索引擎和读者被误判的概率。

参考：[Nginx 请求限速](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)、[Nginx 连接限制](https://nginx.org/en/docs/http/ngx_http_limit_conn_module.html)、[腾讯云 EdgeOne 源站防护](https://cloud.tencent.com/document/product/1552/76086/)、[阿里云 WAF 防爬规则](https://help.aliyun.com/zh/waf/web-application-firewall-2-0/user-guide/configure-anti-crawler-rules-for-websites)。

## 更新流程

1. 备份数据库。
2. 拉取或上传新代码。
3. 执行 `npm ci` 与构建。
4. 重启服务。
5. 检查首页、文章详情、后台登录和保存流程。

## 故障处理

- 页面可读、后台写入失败：检查 SQLite 目录权限或 D1 迁移。
- 登录持续失败：检查用户名、密码哈希格式与会话密钥长度。
- 外链图片不显示：检查 HTTPS、域名白名单和对象存储防盗链策略。
- 手机排版异常：确认浏览器没有缓存旧版 CSS。
- 正常读者收到 429：适当提高 Nginx `burst`，并检查反向代理是否传递真实 IP。
- 突发流量绕过边缘节点：检查 DNS 历史记录、源站安全组和 EdgeOne/ESA 回源 IP 白名单。
