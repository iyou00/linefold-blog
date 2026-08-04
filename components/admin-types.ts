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

export type AdminWorkImage = { id?: string; url: string; caption: string; sortOrder?: number };
export type AdminRelatedPost = { id: string; slug: string; title: string; category: "notes" | "tutorials" };
export type AdminWork = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  linkLabel: string;
  linkUrl: string | null;
  showGallery: boolean;
  status: "draft" | "published";
  publishedAt: string;
  updatedAt: string;
  images: AdminWorkImage[];
  relatedPosts: AdminRelatedPost[];
};
export type AdminWorkSummary = Pick<AdminWork, "id" | "slug" | "title" | "status" | "updatedAt">;
export type DraftWork = Omit<AdminWork, "id" | "updatedAt" | "relatedPosts"> & { relatedPostIds: string[] };

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
  aboutNow: string;
  aboutLocation: string;
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

export function createEmptyWork(): DraftWork {
  return {
    slug: "",
    title: "",
    summary: "",
    tags: [],
    linkLabel: "",
    linkUrl: "",
    showGallery: false,
    status: "draft",
    publishedAt: new Date().toISOString(),
    images: [],
    relatedPostIds: [],
  };
}
