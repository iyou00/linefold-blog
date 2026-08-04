import assert from "node:assert/strict";

const base = process.env.E2E_BASE_URL || "http://localhost:3100";
const username = process.env.E2E_ADMIN_USERNAME || "admin";
const password = process.env.E2E_ADMIN_PASSWORD;

if (!password) throw new Error("E2E_ADMIN_PASSWORD is required");

const login = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ username, password }),
});
if (login.status !== 200) throw new Error(`login failed: ${login.status} ${await login.text()}`);
const cookie = login.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "login should return a session cookie");

const admin = await fetch(`${base}/admin`, { headers: { cookie } });
assert.equal(admin.status, 200);
assert.match(await admin.text(), /内容管理后台/);

const payload = {
  slug: `e2e-validation-${Date.now()}`,
  title: "后台端到端验证草稿",
  summary: "自动化验证文章管理流程。",
  content: "## 验证内容\n\n这是一篇验证完成后会删除的草稿。",
  category: "notes",
  tags: ["TEST"],
  coverImageUrl: "",
  status: "draft",
  publishedAt: new Date().toISOString(),
  seoTitle: "",
  seoDescription: "",
};

const create = await fetch(`${base}/api/admin/posts`, {
  method: "POST",
  headers: { cookie, origin: base, "content-type": "application/json" },
  body: JSON.stringify(payload),
});
if (create.status !== 201) throw new Error(`create failed: ${create.status} ${await create.text()}`);
const { post } = await create.json();
assert.ok(post.id);

const rejectedImage = await fetch(`${base}/api/admin/posts`, {
  method: "POST",
  headers: { cookie, origin: base, "content-type": "application/json" },
  body: JSON.stringify({
    ...payload,
    slug: `${payload.slug}-blocked-image`,
    coverImageUrl: "https://images.unsplash.com/example.jpg",
  }),
});
assert.equal(rejectedImage.status, 400);

const list = await fetch(`${base}/api/admin/posts`, { headers: { cookie } });
assert.equal(list.status, 200);
const listed = await list.json();
assert.ok(listed.posts.some((item) => item.id === post.id));

const settingsResponse = await fetch(`${base}/api/admin/settings`, { headers: { cookie } });
assert.equal(settingsResponse.status, 200);
const { settings } = await settingsResponse.json();
assert.ok(settings.siteName && settings.shortName && settings.author);
const saveSettings = await fetch(`${base}/api/admin/settings`, {
  method: "PUT",
  headers: { cookie, origin: base, "content-type": "application/json" },
  body: JSON.stringify(settings),
});
assert.equal(saveSettings.status, 200);

const remove = await fetch(`${base}/api/admin/posts/${post.id}`, {
  method: "DELETE",
  headers: { cookie, origin: base },
});
if (remove.status !== 200) throw new Error(`delete failed: ${remove.status} ${await remove.text()}`);

const workPayload = {
  slug: `e2e-work-${Date.now()}`,
  title: "后台端到端验证作品",
  summary: "验证作品、图片开关与关联文章保存流程。",
  tags: ["TEST", "PRODUCT"],
  linkLabel: "GitHub",
  linkUrl: "https://github.com/example/linefold",
  showGallery: true,
  images: [],
  relatedPostIds: [],
  status: "draft",
  publishedAt: new Date().toISOString(),
};
const createWork = await fetch(`${base}/api/admin/works`, {
  method: "POST",
  headers: { cookie, origin: base, "content-type": "application/json" },
  body: JSON.stringify(workPayload),
});
if (createWork.status !== 201) throw new Error(`create work failed: ${createWork.status} ${await createWork.text()}`);
const { work } = await createWork.json();
assert.ok(work.id);
assert.equal(work.showGallery, true);

const rejectedWorkImage = await fetch(`${base}/api/admin/works/${work.id}`, {
  method: "PUT",
  headers: { cookie, origin: base, "content-type": "application/json" },
  body: JSON.stringify({ ...workPayload, images: [{ url: "https://images.unsplash.com/blocked.jpg", caption: "blocked" }] }),
});
assert.equal(rejectedWorkImage.status, 400);

const removeWork = await fetch(`${base}/api/admin/works/${work.id}`, {
  method: "DELETE",
  headers: { cookie, origin: base },
});
if (removeWork.status !== 200) throw new Error(`delete work failed: ${removeWork.status} ${await removeWork.text()}`);

console.log(JSON.stringify({ login: true, admin: true, create: true, list: true, delete: true, imagePolicy: true, siteSettings: true, works: true }));
