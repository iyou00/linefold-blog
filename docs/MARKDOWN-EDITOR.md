# Markdown 编辑与渲染

## 组件

- `components/markdown-editor.tsx`：CodeMirror 6 编辑器，只进入后台路由；选择文章后按需加载独立代码分块。
- `components/markdown-content.tsx`：前台文章和后台预览共用的 React Markdown 渲染组件。
- `lib/markdown-image-urls.ts`：保存文章时从 Markdown AST 提取普通图片和引用式图片。
- `lib/url-policy.ts`：共享链接协议与图片域名规则。

正文仍以纯 Markdown 字符串存入 SQLite/D1，编辑器升级不改变表结构，也不需要迁移已有文章。

## 语法策略

- CommonMark 作为基础语法。
- GFM 提供表格、任务列表、删除线与自动链接。
- 单换行按可见换行处理，更符合中文后台的输入习惯。
- 原始 HTML 不参与渲染。
- 站内链接接受 `/path` 与 `#anchor`，外部链接只接受 HTTPS。
- 正文图片只接受 HTTPS 和 `IMAGE_HOST_ALLOWLIST` 配置的域名或其子域名。

## 安全边界

预览和前台接收相同的图片域名数组。保存接口再次解析 Markdown AST 并执行服务端校验，因此客户端显示、公开渲染和持久化三个环节保持一致。外部链接自动在新标签页打开并携带 `noreferrer noopener`；图片启用延迟加载、异步解码和无来源请求策略。

## 扩展原则

新增 Markdown 插件时先确认其输出节点和安全影响。需要支持文章内 HTML 时，将 `rehype-sanitize` 放在最后一个可能产生 HTML 的插件之后，并通过白名单开放必要标签与属性。代码高亮优先采用构建时或服务端方案，避免向公开页面发送完整高亮运行库。
