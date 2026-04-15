const MAX_FETCH_BYTES = 900_000;
const FETCH_TIMEOUT_MS = 18_000;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "metadata.google.internal",
  "169.254.169.254",
]);

const EN_STOP = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "your",
  "have",
  "will",
  "were",
  "been",
  "their",
  "about",
  "into",
  "more",
  "other",
  "some",
  "than",
  "when",
  "what",
  "which",
  "while",
  "where",
  "after",
  "before",
  "also",
  "such",
  "each",
  "many",
  "over",
  "only",
  "most",
  "much",
  "can",
  "not",
  "are",
  "was",
  "but",
  "has",
  "had",
  "its",
  "our",
  "out",
  "you",
  "all",
  "any",
  "may",
  "one",
  "how",
  "who",
  "why",
]);

const TR_STOP = new Set([
  "ve",
  "bir",
  "bu",
  "şu",
  "o",
  "da",
  "de",
  "ki",
  "mi",
  "mı",
  "mu",
  "mü",
  "için",
  "ile",
  "gibi",
  "çok",
  "daha",
  "veya",
  "ya",
  "hem",
  "her",
  "olan",
  "olarak",
  "üzerine",
  "kadar",
  "sonra",
  "önce",
  "içinde",
  "arasında",
  "en",
  "büyük",
  "kendi",
  "olan",
  "ancak",
]);

function isPrivateOrReservedIp(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost") return true;
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = h.match(ipv4);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (h.includes(":")) {
    if (h.startsWith("::1") || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd"))
      return true;
  }
  return false;
}

export function isSafePublicHttpUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  const url = new URL(trimmed);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "only-http-https" };
  }
  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) {
    return { ok: false, reason: "blocked-host" };
  }
  if (isPrivateOrReservedIp(url.hostname)) {
    return { ok: false, reason: "blocked-ip" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "no-credentials-in-url" };
  }
  return { ok: true, url };
}

export async function fetchPageText(urlString: string): Promise<
  | { ok: true; url: string; title: string; text: string }
  | { ok: false; url: string; error: string }
> {
  const safe = isSafePublicHttpUrl(urlString);
  if (!safe.ok) {
    return { ok: false, url: urlString, error: safe.reason };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(safe.url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "TayfunSiteResearchBot/1.0 (+https://tayfunturkmen.com) research-only; respects robots.txt",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return { ok: false, url: safe.url.toString(), error: `http-${res.status}` };
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_FETCH_BYTES) {
      return { ok: false, url: safe.url.toString(), error: "too-large" };
    }

    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const title = extractTitle(html) || safe.url.hostname;
    const text = htmlToPlainText(html);

    if (!text || text.length < 80) {
      return { ok: false, url: safe.url.toString(), error: "too-little-text" };
    }

    return { ok: true, url: safe.url.toString(), title, text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch-failed";
    return { ok: false, url: safe.url.toString(), error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

function extractTitle(html: string): string | null {
  const og = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (og?.[1]) return decodeBasicEntities(og[1].trim());
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t?.[1]) return decodeBasicEntities(stripTags(t[1]).trim());
  return null;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ");
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToPlainText(html: string): string {
  const noScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const text = stripTags(noScripts);
  return decodeBasicEntities(text).replace(/\s+/g, " ").trim();
}

export function extractKeywords(text: string, locale: "en" | "tr", limit = 8): string[] {
  const stop = locale === "tr" ? TR_STOP : EN_STOP;
  const words = text
    .toLowerCase()
    .replace(/[^a-zğüşıöç0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, limit);
}

export function extractSentences(text: string, max = 12): string[] {
  const parts = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 520);

  const out: string[] = [];
  for (const s of parts) {
    if (looksLikeBoilerplate(s)) continue;
    out.push(clampWords(s, 48));
    if (out.length >= max) break;
  }
  return out;
}

function looksLikeBoilerplate(s: string): boolean {
  const lower = s.toLowerCase();
  return (
    (lower.includes("cookie") && lower.includes("privacy")) ||
    lower.includes("subscribe to our newsletter") ||
    (lower.includes("sign in") && lower.includes("register")) ||
    lower.includes("javascript:")
  );
}

function clampWords(s: string, maxWords: number): string {
  const w = s.split(/\s+/);
  if (w.length <= maxWords) return s;
  return `${w.slice(0, maxWords).join(" ")} …`;
}
