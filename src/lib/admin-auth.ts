import { createHmac, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { clearAdminLoginFailures, isAdminLoginBlocked, registerAdminLoginFailure } from "@/lib/d1";
import { createSignedToken, readSignedToken, safeEqual } from "@/lib/signed-token";
import { verifyTotpCode } from "@/lib/totp";

/**
 * Admin authentication backed by environment variables (no database needed):
 *
 * - ADMIN_USERNAME          login name
 * - ADMIN_PASSWORD_HASH     `scrypt:<saltHex>:<hashHex>` (generate with `npm run admin:hash`)
 * - ADMIN_SESSION_SECRET    random string (32+ chars) used to sign session cookies
 * - ADMIN_TOTP_SECRET       optional base32 secret; when set, a 2FA code is required
 *
 * Changing the password hash, the TOTP secret or the session secret signs out
 * every existing session.
 */

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;
const MIN_SESSION_SECRET_LENGTH = 32;
const SESSION_SCOPE = "admin-session";
const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-tt_admin" : "tt_admin";
const PASSWORD_HASH_PATTERN = /^scrypt:([0-9a-f]{32,128}):([0-9a-f]{128})$/i;

type AdminConfig = {
  username: string;
  passwordHashRaw: string;
  salt: Buffer;
  hash: Buffer;
  sessionSecret: string;
  totpSecret: string | null;
};

export type AdminAuthStatus = {
  configured: boolean;
  /** Env variables that are missing or invalid. Names only, never values. */
  problems: string[];
  twoFactorEnabled: boolean;
};

export type AdminSession = { username: string; expiresAt: number };

type SessionPayload = { sub: string; iat: number; exp: number; fp: string };

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function loadConfig(): { config: AdminConfig | null; status: AdminAuthStatus } {
  const problems: string[] = [];
  const username = env("ADMIN_USERNAME").toLowerCase();
  const passwordHashRaw = env("ADMIN_PASSWORD_HASH");
  const sessionSecret = env("ADMIN_SESSION_SECRET");
  const totpRaw = env("ADMIN_TOTP_SECRET").replace(/\s+/g, "").toUpperCase();

  if (username.length < 3) problems.push("ADMIN_USERNAME");
  const match = PASSWORD_HASH_PATTERN.exec(passwordHashRaw);
  if (!match) problems.push("ADMIN_PASSWORD_HASH");
  if (sessionSecret.length < MIN_SESSION_SECRET_LENGTH) problems.push("ADMIN_SESSION_SECRET");
  // An invalid 2FA secret must not silently disable 2FA: refuse to log in instead.
  if (totpRaw && !/^[A-Z2-7]{16,}$/.test(totpRaw)) problems.push("ADMIN_TOTP_SECRET");

  const status: AdminAuthStatus = {
    configured: problems.length === 0,
    problems,
    twoFactorEnabled: Boolean(totpRaw),
  };
  if (!match || problems.length) return { config: null, status };

  return {
    config: {
      username,
      passwordHashRaw,
      salt: Buffer.from(match[1], "hex"),
      hash: Buffer.from(match[2], "hex"),
      sessionSecret,
      totpSecret: totpRaw || null,
    },
    status,
  };
}

export function getAdminAuthStatus(): AdminAuthStatus {
  return loadConfig().status;
}

/** Binds sessions to the current credentials so rotating them revokes old cookies. */
function credentialFingerprint(config: AdminConfig): string {
  return createHmac("sha256", config.sessionSecret)
    .update(`fp|${config.username}|${config.passwordHashRaw}|${config.totpSecret ?? ""}`)
    .digest("base64url")
    .slice(0, 22);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const { config } = loadConfig();
  if (!config) return null;
  const jar = await cookies();
  const payload = readSignedToken<SessionPayload>(
    config.sessionSecret,
    SESSION_SCOPE,
    jar.get(COOKIE_NAME)?.value,
  );
  if (!payload) return null;
  if (payload.sub !== config.username || payload.fp !== credentialFingerprint(config)) return null;
  if (payload.iat * 1000 > Date.now() + 60_000) return null;
  return { username: payload.sub, expiresAt: payload.exp * 1000 };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return Boolean(await getAdminSession());
}

async function startSession(config: AdminConfig) {
  const now = Math.floor(Date.now() / 1000);
  const token = createSignedToken(config.sessionSecret, SESSION_SCOPE, {
    sub: config.username,
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
    fp: credentialFingerprint(config),
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export async function endAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

// ---------------------------------------------------------------------------
// Brute-force protection. D1 is used when it is bound; an in-memory limiter
// (per worker isolate) always applies as well, so login stays rate limited
// even without a database.
// ---------------------------------------------------------------------------

type MemoryAttempt = { count: number; blockedUntil: number; lastFailure: number };
const memoryAttempts = new Map<string, MemoryAttempt>();
const ATTEMPT_RESET_MS = 60 * 60 * 1000;
const MAX_TRACKED_KEYS = 5000;

function blockMinutesFor(count: number): number {
  return count >= 10 ? 60 : count >= 5 ? 15 : 0;
}

async function isBlocked(keys: string[]): Promise<boolean> {
  const now = Date.now();
  for (const key of keys) {
    const entry = memoryAttempts.get(key);
    if (entry && entry.blockedUntil > now) return true;
    if ((await isAdminLoginBlocked(key)) > 0) return true;
  }
  return false;
}

async function recordFailure(keys: string[]) {
  const now = Date.now();
  if (memoryAttempts.size > MAX_TRACKED_KEYS) {
    for (const [key, entry] of memoryAttempts) {
      if (now - entry.lastFailure > ATTEMPT_RESET_MS) memoryAttempts.delete(key);
    }
  }
  for (const key of keys) {
    const previous = memoryAttempts.get(key);
    const count = previous && now - previous.lastFailure < ATTEMPT_RESET_MS ? previous.count + 1 : 1;
    memoryAttempts.set(key, {
      count,
      blockedUntil: now + blockMinutesFor(count) * 60_000,
      lastFailure: now,
    });
    await registerAdminLoginFailure(key);
  }
}

async function clearFailures(keys: string[]) {
  for (const key of keys) {
    memoryAttempts.delete(key);
    await clearAdminLoginFailures(key);
  }
}

function failureDelay() {
  return new Promise((resolve) => setTimeout(resolve, 350 + Math.floor(Math.random() * 400)));
}

export type AdminLoginResult = "ok" | "config" | "blocked" | "invalid";

export async function attemptAdminLogin(input: {
  username: string;
  password: string;
  totp: string;
  ip: string;
}): Promise<AdminLoginResult> {
  const { config } = loadConfig();
  if (!config) return "config";

  const username = input.username.trim().toLowerCase().slice(0, 120);
  const keys = [`ip:${input.ip}`, `user:${username}|ip:${input.ip}`];
  if (await isBlocked(keys)) return "blocked";

  // Always run scrypt, even for an unknown username, so timing does not reveal it.
  const candidate = await scryptAsync(input.password.slice(0, 1024), config.salt, config.hash.length);
  const passwordOk = safeEqual(candidate.toString("hex"), config.hash.toString("hex"));
  const usernameOk = safeEqual(username, config.username);
  // The 2FA code is checked together with the password so a failure never
  // reveals which factor was wrong.
  const totpOk = config.totpSecret ? verifyTotpCode(config.totpSecret, input.totp) : true;

  if (!(usernameOk && passwordOk && totpOk)) {
    await recordFailure(keys);
    await failureDelay();
    return "invalid";
  }

  await clearFailures(keys);
  await startSession(config);
  return "ok";
}

export function getClientIp(h: Headers): string {
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return "unknown";
}
