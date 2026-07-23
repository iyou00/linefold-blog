export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: "notes" | "tutorials";
  tags: string[];
  coverImageUrl: string | null;
  status: "draft" | "published";
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
};

export type AdminPostSummary = Pick<AdminPost, "id" | "slug" | "title" | "category" | "tags" | "status" | "updatedAt">;

export type DraftPost = Omit<AdminPost, "id" | "updatedAt">;

export type AdminSettings = {
  siteName: string;
  shortName: string;
  author: string;
  description: string;
  contactEmail: string;
  showEmail: string;
  footerCopyright: string;
  startedYear: string;
  heroLine1: string;
  heroLine2: string;
  intro: string;
  about: string;
  icpNumber: string;
  publicSecurityNumber: string;
  publicSecurityUrl: string;
  social1Platform: string;
  social1Url: string;
  social2Platform: string;
  social2Url: string;
  social3Platform: string;
  social3Url: string;
  social4Platform: string;
  social4Url: string;
};

export function createEmptyPost(): DraftPost {
  return {
    slug: "",
    title: "",
    summary: "",
    content: "",
    category: "notes",
    tags: [],
    coverImageUrl: "",
    status: "draft",
    publishedAt: new Date().toISOString(),
    seoTitle: "",
    seoDescription: "",
  };
}
