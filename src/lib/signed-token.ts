import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Compact HMAC-SHA256 signed tokens (`<payload>.<signature>`, base64url).
 * Used for session cookies so their contents cannot be forged or edited.
 */

type TokenPayload = { exp: number } & Record<string, unknown>;

function sign(secret: string, scope: string, body: string): Buffer {
  return createHmac("sha256", secret).update(`${scope}|${body}`).digest();
}

export function createSignedToken(secret: string, scope: string, payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(secret, scope, body).toString("base64url")}`;
}

export function readSignedToken<T extends TokenPayload>(
  secret: string,
  scope: string,
  token: string | undefined,
): T | null {
  if (!secret || !token) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = sign(secret, scope, body);
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time string comparison that does not leak length differences. */
export function safeEqual(a: string, b: string): boolean {
  const key = "tt-safe-equal";
  const ha = createHmac("sha256", key).update(a).digest();
  const hb = createHmac("sha256", key).update(b).digest();
  return timingSafeEqual(ha, hb);
}
