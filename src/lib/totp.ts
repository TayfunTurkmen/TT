import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");

  let output = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return output;
}

function decodeBase32(secret: string): Buffer {
  const clean = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value < 0) continue;
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotpCode(secret: string, counter: number): string {
  const key = decodeBase32(secret);
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  message.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export function verifyTotpCode(secret: string | null | undefined, input: string): boolean {
  if (!secret) return false;
  const clean = input.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  for (let drift = -1; drift <= 1; drift += 1) {
    const expected = generateTotpCode(secret, currentCounter + drift);
    if (
      timingSafeEqual(
        Buffer.from(clean.padStart(TOTP_DIGITS, "0")),
        Buffer.from(expected),
      )
    ) {
      return true;
    }
  }
  return false;
}

export function buildTotpUri(params: {
  secret: string;
  username: string;
  issuer?: string;
}): string {
  const issuer = params.issuer ?? "Tayfun Turkmen";
  const label = `${issuer}:${params.username}`;
  const search = new URLSearchParams({
    secret: params.secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${search.toString()}`;
}
