export const siteConfig = {
  name: "FIELD NOTES",
  title: "Field Notes｜个人记录",
  description: "记录项目、日常感受与可反复查阅的教程。",
  intro: "这里保存我做过的项目、日常感受，以及一些值得反复查阅的教程。",
  hero: ["记录正在发生的事，", "也记录缓慢形成的自己。"],
  author: "M",
};

export const navigation = [
  { href: "/", label: "INDEX" },
  { href: "/notes", label: "NOTES" },
  { href: "/tutorials", label: "TUTORIALS" },
  { href: "/archive", label: "ARCHIVE" },
  { href: "/about", label: "ABOUT" },
] as const;
