import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRuntimeValue } from "./runtime-env";

const COOKIE_NAME = "field_notes_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function safeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }
  return mismatch === 0;
}

async function hmac(data: string) {
  const secret = getRuntimeValue("SESSION_SECRET");
  if (secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

export async function verifyPassword(password: string) {
  const encoded = getRuntimeValue("ADMIN_PASSWORD_HASH");
  const [scheme, iterationsText, saltText, hashText] = encoded.split("$");
  const iterations = Number(iterationsText);
  if (scheme !== "pbkdf2" || !iterations || !saltText || !hashText) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: base64UrlToBytes(saltText),
        iterations,
      },
      key,
      256,
    ),
  );
  return safeEqual(derived, base64UrlToBytes(hashText));
}

export async function createSessionToken(username: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${username}.${expires}`;
  const signature = bytesToBase64Url(await hmac(payload));
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [username, expiresText, signatureText] = token.split(".");
  const expires = Number(expiresText);
  if (!username || !expires || !signatureText || expires < Date.now() / 1000) {
    return false;
  }
  if (username !== getRuntimeValue("ADMIN_USERNAME")) return false;
  const expected = await hmac(`${username}.${expiresText}`);
  return safeEqual(expected, base64UrlToBytes(signatureText));
}

export function sessionCookie(token: string) {
  const secure = getRuntimeValue("SITE_URL").startsWith("https://");
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${SESSION_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function isAdminRequest(request: Request) {
  return verifySessionToken(readCookie(request.headers.get("cookie"), COOKIE_NAME));
}

export async function requireAdminPage() {
  const store = await cookies();
  const valid = await verifySessionToken(store.get(COOKIE_NAME)?.value);
  if (!valid) redirect("/admin/login");
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
    const protocol = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");
    return originUrl.host === host && originUrl.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}
