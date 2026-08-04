import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function request(path, init) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, init),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("首页服务端渲染完整的文字型文章流", async () => {
  const response = await request("/", { headers: { accept: "text/html" } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LINEFOLD/);
  assert.match(html, /记录正在发生的事/);
  assert.match(html, /从零搭建一个安静、可靠的个人网站/);
  assert.match(html, /INDEX/);
  assert.match(html, /WRITING/);
  assert.match(html, /WORKS/);
  assert.match(html, /ARCHIVE/);
  assert.match(html, /ABOUT/);
  assert.doesNotMatch(html, /GUESTBOOK \/ 留言/);
  assert.doesNotMatch(html, /PROJECT LOG/);
  assert.doesNotMatch(html, /TOPICS \/ 主题索引/);
});

test("后台登录页可访问，管理接口默认拒绝匿名请求", async () => {
  const login = await request("/admin/login", { headers: { accept: "text/html" } });
  assert.equal(login.status, 200);
  const html = await login.text();
  assert.match(html, /内容管理/);
  assert.match(html, /name="username"/);
  assert.match(html, /name="password"/);

  const api = await request("/api/admin/posts", { headers: { accept: "application/json" } });
  assert.equal(api.status, 401);
  const worksApi = await request("/api/admin/works", { headers: { accept: "application/json" } });
  assert.equal(worksApi.status, 401);
  const commentsApi = await request("/api/admin/comments", { headers: { accept: "application/json" } });
  assert.equal(commentsApi.status, 401);
  const publicComment = await request("/api/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: "测试留言" }) });
  assert.equal(publicComment.status, 403);
});

test("前台资源保持本地化", async () => {
  const [layout, css] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(layout, /next\/font\/google|fonts\.googleapis/i);
  assert.doesNotMatch(css, /@import\s+url|fonts\.googleapis|jsdelivr|unpkg/i);
  assert.match(css, /Microsoft YaHei/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.site-frame\s*\{[^}]*position:\s*fixed/s);
  assert.match(css, /\.main-column\s*\{[^}]*overflow-y:\s*auto/s);
});

test("ABOUT 信息结构与文章详情互动完整输出", async () => {
  const [aboutResponse, articleResponse] = await Promise.all([
    request("/about", { headers: { accept: "text/html" } }),
    request("/posts/quiet-personal-website", { headers: { accept: "text/html" } }),
  ]);
  assert.equal(aboutResponse.status, 200);
  const about = await aboutResponse.text();
  assert.match(about, /class="site-footer [^"]+"/);
  assert.match(about, /IDENTITY/);
  assert.match(about, /NOW/);
  assert.match(about, /COORDINATES/);
  assert.doesNotMatch(about, /WHAT LIVES HERE|WRITING PRINCIPLES/);
  assert.doesNotMatch(about, /GUESTBOOK \/ 留言/);
  assert.match(about, /data-monogram="M"/);
  assert.equal(articleResponse.status, 200);
  const article = await articleResponse.text();
  assert.match(article, /application\/ld\+json/);
  assert.match(article, /BlogPosting/);
  assert.match(article, /rel="canonical"/);
  assert.match(article, /<h2>为什么重新做一个博客<\/h2>/);
  assert.match(article, /<blockquote>/);
  assert.match(article, /GUESTBOOK \/ 留言/);
  assert.match(article, /LATEST 05/);
  assert.match(article, /placeholder="留下一句话…"/);
  assert.doesNotMatch(article, /留言昵称/);
});

test("旧版默认品牌可平滑升级，同时保留后台自定义能力", async () => {
  const source = await readFile(new URL("../lib/posts.ts", import.meta.url), "utf8");
  assert.match(source, /legacyDefaults/);
  assert.match(source, /settings\.siteName === legacyDefaults\.siteName/);
  assert.match(source, /legacyDefaults\.aboutV2/);
  assert.match(source, /\.includes\(settings\.about\)/);
});

test("Markdown 使用开源标准管线并保持统一安全策略", async () => {
  const [packageSource, articlePage, preview, renderer, imageParser] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/posts/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin-post-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/markdown-content.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/markdown-image-urls.ts", import.meta.url), "utf8"),
  ]);
  assert.match(packageSource, /"react-markdown"/);
  assert.match(packageSource, /"@codemirror\/view"/);
  assert.match(packageSource, /"remark-gfm"/);
  assert.match(articlePage, /<MarkdownContent/);
  assert.doesNotMatch(articlePage, /renderMarkdown\(/);
  assert.match(preview, /<MarkdownEditor/);
  assert.match(preview, /<MarkdownContent/);
  assert.match(renderer, /skipHtml/);
  assert.match(renderer, /allowedImageHosts/);
  assert.match(imageParser, /imageReference/);
});

test("首页、写作与归档使用各自的右栏构图", async () => {
  const paths = [
    ["/", "line-study-home"],
    ["/writing", "line-study-orbit"],
    ["/writing?category=tutorials", "line-study-stacks"],
    ["/archive", "line-study-timeline"],
  ];
  for (const [path, variant] of paths) {
    const response = await request(path, { headers: { accept: "text/html" } });
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(variant));
  }
});

test("旧栏目跳转到 WRITING，RSS 已移除且分页边界返回 404", async () => {
  const [rss, oldNotes, oldTutorials, invalidWritingPage, invalidArchivePage] = await Promise.all([
    request("/rss.xml", { headers: { accept: "application/rss+xml" } }),
    request("/notes", { headers: { accept: "text/html" }, redirect: "manual" }),
    request("/tutorials?page=2", { headers: { accept: "text/html" }, redirect: "manual" }),
    request("/writing?page=2", { headers: { accept: "text/html" } }),
    request("/archive?page=0", { headers: { accept: "text/html" } }),
  ]);
  assert.equal(rss.status, 404);
  assert.ok([307, 308].includes(oldNotes.status));
  assert.match(oldNotes.headers.get("location") || "", /\/writing\?category=notes/);
  assert.ok([307, 308].includes(oldTutorials.status));
  assert.match(oldTutorials.headers.get("location") || "", /\/writing\?category=tutorials/);
  assert.equal(invalidWritingPage.status, 404);
  assert.equal(invalidArchivePage.status, 404);
});

test("WORKS 页面、数据模型和 CASE 交互结构完整", async () => {
  const response = await request("/works", { headers: { accept: "text/html" } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /WORKS \/ SELECTED OUTPUT/);
  assert.match(html, /第一件作品正在整理中/);
  assert.match(html, /work-concept/);
  assert.match(html, /work-preview-site-footer/);
  assert.doesNotMatch(html, /GUESTBOOK \/ 留言/);

  const [schema, worksLibrary, gallery, dashboard] = await Promise.all([
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/works.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/work-gallery.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin-dashboard.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /workImages/);
  assert.match(schema, /workRelatedPosts/);
  assert.match(worksLibrary, /最多关联 3 篇文章/);
  assert.match(worksLibrary, /isAllowedImageUrl/);
  assert.match(gallery, /CONCEPT PREVIEW \/ 内置示意图/);
  assert.match(gallery, /ArrowLeft/);
  assert.match(dashboard, /作品管理/);
});

test("详情页评论使用持久化审核流并统一展示最新内容", async () => {
  const [schema, commentsLibrary, shell, commentsView, dashboard, css, migration] = await Promise.all([
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/comments.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/global-comments.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_lazy_jigsaw.sql", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /comments_status_created_idx/);
  assert.match(commentsLibrary, /status = 'approved'.*LIMIT 6/s);
  assert.match(commentsLibrary, /10 \* 60 \* 1000/);
  assert.match(shell, /<GlobalComments/);
  assert.match(shell, /showComments \? getPublicComments\(\)/);
  assert.ok(commentsView.indexOf("global-comment-list") < commentsView.indexOf("comment-form"));
  assert.doesNotMatch(commentsView, /comment\.nickname/);
  assert.match(css, /\.comment-note\s*\{[^}]*linear-gradient/s);
  assert.match(css, /\.admin-primary-nav\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(dashboard, /评论审核/);
  assert.match(migration, /CREATE TABLE `comments`/);
});
