import "server-only";
import { getRuntimeValue } from "./runtime-env";
import { isAllowedHttpsImageUrl } from "./url-policy";

const DEFAULT_ALLOWED_HOSTS = [
  "aliyuncs.com",
  "myqcloud.com",
  "qiniucdn.com",
  "clouddn.com",
];

export function getAllowedImageHosts() {
  const configured = getRuntimeValue("IMAGE_HOST_ALLOWLIST")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_HOSTS;
}

export function isAllowedImageUrl(value: string) {
  return isAllowedHttpsImageUrl(value, getAllowedImageHosts());
}
