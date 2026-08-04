# 技术架构

```mermaid
flowchart LR
  Reader[读者浏览器] --> Public[Next.js 公开页面]
  Admin[作者浏览器] --> Login[后台登录]
  Login --> Session[签名 HttpOnly Cookie]
  Session --> API[后台管理接口]
  Public --> Repository[统一数据访问层]
  Public --> CommentAPI[匿名留言接口]
  CommentAPI --> Repository
  API --> Repository
  Repository --> D1[D1 预览数据库]
  Repository --> SQLite[国内服务器 SQLite]
  Public --> Image[国内对象存储图片外链]
```

## 技术选择

- Next.js App Router + React Server Components
- TypeScript 严格模式
- D1 / SQLite 双存储适配
- PBKDF2-SHA256 密码哈希
- HMAC-SHA256 会话签名
- 原生 CSS 响应式布局
- CodeMirror 6 后台编辑器
- react-markdown + remark-gfm + remark-breaks 统一渲染管线

## 数据安全

- 管理页面和每个写接口都在服务端校验会话。
- 写接口校验同源 `Origin`。
- Cookie 使用 `HttpOnly` 和 `SameSite=Lax`，HTTPS 环境启用 `Secure`。
- Markdown 原始 HTML 默认丢弃，前台正文不执行文章内 HTML。
- 链接只接受站内路径、页内锚点和 HTTPS 地址。
- 预览、前台和保存接口共用图片 HTTPS 与域名白名单。
- 作品外链只接受 HTTPS，作品图片复用文章图片域名白名单。
- 匿名留言使用同源校验、蜜罐、纯文本长度限制、链接过滤和 IP 哈希限流，默认进入待审核状态。
- 保存接口通过 Markdown AST 提取普通图片与引用式图片，逐项验证地址。

## 存储模式

`STORAGE_DRIVER=sqlite` 使用服务器本地 SQLite，适合单机小型博客。省略该变量时使用绑定名为 `DB` 的 D1，适合 Sites 预览和托管版本。

## 十年数据策略

- 首页固定读取最近 10 篇。
- 随笔与教程每页 20 篇，归档每页 50 篇。
- 前台页码经过整数、下限和越界校验。
- 后台每次读取 30 条列表元数据，正文按文章 ID 单独加载。
- 后台深翻页使用 `updated_at + id` 游标，避免大偏移量查询。
- SQLite 使用 WAL，并为发布顺序、分类顺序和后台更新时间建立索引。

## 作品数据

- `works` 保存作品主体、发布状态、外部链接与图片显示开关。
- `work_images` 保存有序外链图片，删除作品时级联删除。
- `work_related_posts` 连接作品和已发布文章，每个作品最多关联三篇。
- 作品保存使用数据库批处理；SQLite 通过事务提交，D1 通过 `batch` 原子提交。
- WORKS 列表只读取展示元数据，CASE 页面再按需读取图片和关联文章。

## 评论数据

- `comments` 保存匿名署名、纯文本内容、来源页面、审核状态、IP 哈希与时间。
- 文章详情与 CASE 详情查询 `approved`，按照 `created_at + id` 倒序读取六条；前五条完整展示，第六条渐隐。
- `comments_status_created_idx` 服务全站最新评论查询，`comments_ip_created_idx` 服务提交频率限制。
- 后台最多读取最近 200 条用于轻量审核，隐藏记录继续保留，删除操作永久移除记录。
