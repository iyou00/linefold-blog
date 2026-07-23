import "server-only";

type SqlValue = string | number | null;
type DatabaseAdapter = {
  all<T>(sql: string, values?: SqlValue[]): Promise<T[]>;
  run(sql: string, values?: SqlValue[]): Promise<void>;
};

type D1Like = {
  prepare(sql: string): {
    bind(...values: SqlValue[]): {
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  };
};

let nodeAdapter: DatabaseAdapter | undefined;

async function getNodeAdapter(): Promise<DatabaseAdapter> {
  if (nodeAdapter) return nodeAdapter;

  const sqliteModuleName = "node:sqlite";
  const fsModuleName = "node:fs";
  const pathModuleName = "node:path";
  const [{ DatabaseSync }, fs, path] = await Promise.all([
    import(/* @vite-ignore */ sqliteModuleName) as Promise<typeof import("node:sqlite")>,
    import(/* @vite-ignore */ fsModuleName) as Promise<typeof import("node:fs")>,
    import(/* @vite-ignore */ pathModuleName) as Promise<typeof import("node:path")>,
  ]);

  const databasePath = process.env.BLOG_DB_PATH || path.resolve(process.cwd(), "data", "field-notes.sqlite");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'notes',
      tags TEXT NOT NULL DEFAULT '[]',
      cover_image_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at TEXT NOT NULL,
      seo_title TEXT NOT NULL DEFAULT '',
      seo_description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS posts_status_published_idx ON posts(status, published_at);
    CREATE INDEX IF NOT EXISTS posts_category_published_idx ON posts(category, published_at);
    CREATE INDEX IF NOT EXISTS posts_updated_idx ON posts(updated_at, id);
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const count = database.prepare("SELECT COUNT(*) AS total FROM posts").get() as { total: number };
  if (count.total === 0) {
    const insert = database.prepare("INSERT INTO posts (id, slug, title, summary, content, category, tags, cover_image_url, status, published_at, seo_title, seo_description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'published', ?, ?, ?, ?, ?)");
    const initialPosts = [
      ["seed-1", "quiet-personal-website", "从零搭建一个安静、可靠的个人网站", "从内容结构、部署方式到长期维护，记录一次个人网站的完整搭建过程。", "## 为什么重新做一个博客\n\n一个长期使用的个人网站，需要稳定的结构、清楚的内容和足够低的维护成本。\n\n> 记录本身，就是整理思考的过程。\n\n## 这次采用的原则\n\n- 文字优先\n- 响应式阅读\n- 资源本地化\n- 图片使用国内对象存储外链", "tutorials", '["BLOG","DESIGN"]', "2026-07-12T08:00:00.000Z", "从零搭建一个安静、可靠的个人网站", "个人博客的内容结构、部署方式与长期维护实践。"],
      ["seed-2", "rain-books-slow-work", "雨天，旧书，以及缓慢完成的事情", "最近生活里留下来的几段小记。", "雨下了一整天。桌边放着一本读到一半的旧书，很多事情也在缓慢推进。\n\n速度放慢以后，细节开始变得清楚。", "notes", '["DAILY"]', "2026-07-03T08:00:00.000Z", "", ""],
      ["seed-3", "minimal-reading-tool", "一个只保存重要信息的阅读工具", "设计过程、技术取舍与最后的成品。", "## 项目缘起\n\n我想做一个更安静的阅读工具，让摘录和回顾都保持简单。\n\n## 过程\n\n项目从一个极小的原型开始，逐步补充搜索、标签和导出。", "notes", '["PROJECT"]', "2026-06-18T08:00:00.000Z", "", ""],
      ["seed-4", "long-term-note-system", "如何整理一套可以长期使用的笔记系统", "从收集、筛选到归档的个人方法。", "## 收集\n\n先让记录足够轻，再定期整理。\n\n## 筛选\n\n保留会再次使用、会改变判断、会推动行动的信息。", "tutorials", '["NOTES"]', "2026-06-02T08:00:00.000Z", "", ""],
      ["seed-5", "focus-walking-restart", "关于专注、散步和重新开始", "五月份的一些零散想法。", "散步给思考留下了没有安排的时间。重新开始，也常常发生在这些空白里。", "notes", '["DAILY"]', "2026-05-21T08:00:00.000Z", "", ""],
    ];
    for (const row of initialPosts) {
      insert.run(...row, row[7], row[7]);
    }
  }

  nodeAdapter = {
    async all<T>(sql: string, values: SqlValue[] = []): Promise<T[]> {
      return database.prepare(sql).all(...values) as T[];
    },
    async run(sql: string, values: SqlValue[] = []): Promise<void> {
      database.prepare(sql).run(...values);
    },
  };
  return nodeAdapter;
}

async function getD1Adapter(): Promise<DatabaseAdapter> {
  const moduleName = "cloudflare:workers";
  const runtime = (await import(/* @vite-ignore */ moduleName)) as unknown as { env: { DB?: D1Like } };
  const d1 = runtime.env.DB;
  if (!d1) throw new Error("D1 binding DB is unavailable");
  return {
    async all<T>(sql: string, values: SqlValue[] = []): Promise<T[]> {
      const result = await d1.prepare(sql).bind(...values).all<T>();
      return result.results;
    },
    async run(sql: string, values: SqlValue[] = []): Promise<void> {
      await d1.prepare(sql).bind(...values).run();
    },
  };
}

export async function getDatabase() {
  return process.env.STORAGE_DRIVER === "sqlite" ? getNodeAdapter() : getD1Adapter();
}
