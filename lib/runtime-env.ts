import "server-only";

export type RuntimeKey =
  | "ADMIN_USERNAME"
  | "ADMIN_PASSWORD_HASH"
  | "SESSION_SECRET"
  | "IMAGE_HOST_ALLOWLIST"
  | "SITE_URL";

export function getRuntimeValue(key: RuntimeKey): string {
  return process.env[key] || "";
}
