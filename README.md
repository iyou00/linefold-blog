# LINEFOLD 个人博客

一个文字优先、双端适配、带轻量后台的个人博客。前台包含首页、随笔、教程、归档、关于和文章详情；后台包含登录、文章管理、Markdown 编辑、草稿/发布、站点介绍与国内图片外链校验。

`LINEFOLD` 由 Line 与 Fold 组成：线条构成视觉，折叠承载记录。项目采用纸张色、黑色文字和淡紫几何线稿，让内容始终处在页面中心。

## 已实现功能

- 响应式三栏桌面布局与单栏手机布局
- 最新文章自动放大，其余文章按时间列表排列
- `NOTES`、`TUTORIALS`、`ARCHIVE` 与文章详情
- CodeMirror 6 Markdown 写作、CommonMark/GFM 渲染、安全链接与外链图片
- 后台账号密码登录、签名 Cookie 与服务端权限校验
- 文章新增、编辑、删除、草稿、发布、标签和 SEO 字段
- 网站名称、左栏简称、作者、首页标题、介绍与关于页面管理
- 三栏写作工作台、Markdown 语法高亮/实时预览、搜索筛选与发布设置
- 前台分页、后台游标加载、站点地图与 robots 配置
- 登录双层限速、安全响应头与宝塔 Nginx 防护模板
- 中国大陆资源白名单与零外部字体/CDN依赖
- D1 预览模式与 Node.js + SQLite 国内服务器模式

## 快速开始

### 国内服务器兼容模式

```bash
npm ci
npm run dev:node
```

访问：

- 博客：`http://localhost:3100`
- 后台：`http://localhost:3100/admin/login`

初始账号密码保存在本地文件 `CREDENTIALS.local.md`。该文件已加入忽略列表。

### Sites / D1 预览模式

```bash
npm ci
npm run dev
```

第一次使用前需要执行本地 D1 迁移，详情见 `docs/DEVELOPMENT.md`。

## 文档目录

- [产品与信息架构](docs/PRODUCT.md)
- [视觉与响应式规范](docs/DESIGN-SYSTEM.md)
- [技术架构](docs/ARCHITECTURE.md)
- [本地开发](docs/DEVELOPMENT.md)
- [中国大陆部署](docs/DEPLOYMENT-CN.md)
- [宝塔 10 分钟上线](docs/DEPLOYMENT-QUICK.md)
- [宝塔面板部署](docs/DEPLOYMENT-BAOTA.md)
- [后台使用](docs/ADMIN-GUIDE.md)
- [安全与运维](docs/SECURITY-OPERATIONS.md)

## 测试

`tests/` 是开源维护的一部分。`npm test` 会先完成生产构建，再验证服务端渲染、后台匿名访问保护、本地资源策略、Markdown 安全管线、分页边界与各栏目构图；GitHub Actions 会在每次提交和 Pull Request 中执行同一套检查。

## 关键原则

1. 记录完整性优先。
2. 阅读体验贯穿桌面端与手机端。
3. 字体、脚本、样式与图标随站点部署。
4. 图片只保存外链，服务器保存文字与链接。
5. 生产环境凭据只通过环境变量提供。

## 公开仓库安全

- `.env.node.local`、`.dev.vars`、`CREDENTIALS.local.md` 和 SQLite 数据库均被 Git 忽略。
- 仓库只提供带占位符的 `.env.node.example` 与 `.dev.vars.example`。
- 生产密码通过 `node scripts/hash-password.mjs` 生成，明文密码和输出值都只保存在部署环境。
- 安全问题请按 [SECURITY.md](SECURITY.md) 中的方式私下报告。

## 开源许可

项目采用 [MIT License](LICENSE)。
