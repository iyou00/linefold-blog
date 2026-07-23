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
  assert.match(html, /NOTES/);
  assert.match(html, /TUTORIALS/);
  assert.match(html, /ARCHIVE/);
  assert.match(html, /ABOUT/);
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

test("全站页脚与文章结构化数据完整输出", async () => {
  const [aboutResponse, articleResponse] = await Promise.all([
    request("/about", { headers: { accept: "text/html" } }),
    request("/posts/quiet-personal-website", { headers: { accept: "text/html" } }),
  ]);
  assert.equal(aboutResponse.status, 200);
  const about = await aboutResponse.text();
  assert.match(about, /class="site-footer [^"]+"/);
  assert.match(about, /一份持续生长的个人档案/);
  assert.match(about, /WRITING PRINCIPLES/);
  assert.match(about, /data-monogram="M"/);
  assert.equal(articleResponse.status, 200);
  const article = await articleResponse.text();
  assert.match(article, /application\/ld\+json/);
  assert.match(article, /BlogPosting/);
  assert.match(article, /rel="canonical"/);
  assert.match(article, /<h2>为什么重新做一个博客<\/h2>/);
  assert.match(article, /<blockquote>/);
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

test("首页、随笔、教程与归档使用各自的右栏构图", async () => {
  const paths = [
    ["/", "line-study-home"],
    ["/notes", "line-study-orbit"],
    ["/tutorials", "line-study-stacks"],
    ["/archive", "line-study-timeline"],
  ];
  for (const [path, variant] of paths) {
    const response = await request(path, { headers: { accept: "text/html" } });
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(variant));
  }
});

test("RSS 已移除且分页边界返回 404", async () => {
  const [rss, invalidNotesPage, invalidArchivePage] = await Promise.all([
    request("/rss.xml", { headers: { accept: "application/rss+xml" } }),
    request("/notes?page=2", { headers: { accept: "text/html" } }),
    request("/archive?page=0", { headers: { accept: "text/html" } }),
  ]);
  assert.equal(rss.status, 404);
  assert.equal(invalidNotesPage.status, 404);
  assert.equal(invalidArchivePage.status, 404);
});
