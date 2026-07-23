type Attempt = { failures: number; resetAt: number; blockedUntil: number };

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const globalStore = globalThis as typeof globalThis & { __fieldNotesLoginAttempts?: Map<string, Attempt> };
const attempts = globalStore.__fieldNotesLoginAttempts ??= new Map<string, Attempt>();

export function loginClientKey(request: Request) {
  return request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export function checkLoginAttempt(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.delete(key);
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.blockedUntil > now) return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
  return { allowed: true, retryAfter: 0 };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  const entry = !current || current.resetAt <= now ? { failures: 0, resetAt: now + WINDOW_MS, blockedUntil: 0 } : current;
  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) entry.blockedUntil = now + BLOCK_MS;
  attempts.set(key, entry);
  if (attempts.size > 10_000) {
    for (const [storedKey, value] of attempts) if (value.resetAt <= now) attempts.delete(storedKey);
  }
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
