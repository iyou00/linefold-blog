export function isAllowedHttpsImageUrl(value: string, allowedHosts: string[]) {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    return allowedHosts.some((entry) => {
      const allowed = entry.trim().toLowerCase();
      return Boolean(allowed) && (hostname === allowed || hostname.endsWith(`.${allowed}`));
    });
  } catch {
    return false;
  }
}

export function safeMarkdownLink(value: string) {
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
