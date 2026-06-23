import { getCloudflareContext } from "@opennextjs/cloudflare";

type R2BucketLike = {
  put: (
    key: string,
    value: ArrayBuffer | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
      customMetadata?: Record<string, string>;
    },
  ) => Promise<unknown>;
};

type MediaEnv = {
  bucket: R2BucketLike | null;
  publicBaseUrl: string;
};

const DEFAULT_PUBLIC_BASE_URL = "https://cdn.tayfunturkmen.com";

export function getMediaEnv(): MediaEnv {
  try {
    const { env } = getCloudflareContext();
    const raw = env as unknown as Record<string, unknown>;
    return {
      bucket: (raw.MEDIA_BUCKET as R2BucketLike | undefined) ?? null,
      publicBaseUrl:
        typeof raw.R2_PUBLIC_BASE_URL === "string" && raw.R2_PUBLIC_BASE_URL.trim()
          ? raw.R2_PUBLIC_BASE_URL.trim()
          : DEFAULT_PUBLIC_BASE_URL,
    };
  } catch {
    return { bucket: null, publicBaseUrl: DEFAULT_PUBLIC_BASE_URL };
  }
}

export function publicMediaUrl(key: string, publicBaseUrl = DEFAULT_PUBLIC_BASE_URL) {
  return `${publicBaseUrl.replace(/\/+$/g, "")}/${key.replace(/^\/+/g, "")}`;
}

function colorForSlug(slug: string) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return {
    from: `hsl(${hue} 72% 42%)`,
    to: `hsl(${(hue + 58) % 360} 74% 54%)`,
  };
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function estimateTextWidth(value: string, fontSize: number) {
  let units = 0;
  for (const char of value) {
    if (/[ilI.,'|]/.test(char)) units += 0.35;
    else if (/[mwMW@#%&]/.test(char)) units += 0.9;
    else if (/[A-Z0-9]/.test(char)) units += 0.68;
    else units += 0.56;
  }
  return units * fontSize;
}

function ellipsizeToWidth(value: string, maxWidth: number, fontSize: number) {
  let output = value.trim();
  while (output.length > 1 && estimateTextWidth(`${output}...`, fontSize) > maxWidth) {
    output = output.slice(0, -1).trimEnd();
  }
  return output.length < value.trim().length ? `${output}...` : output;
}

function wrapTitleLines(title: string) {
  const maxWidth = 1040;
  const maxLines = 3;
  const clean = title.replace(/\s+/g, " ").trim();
  const words = clean.split(" ").filter(Boolean);

  for (const fontSize of [72, 66, 60, 54, 48]) {
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) lines.push(current);
      current =
        estimateTextWidth(word, fontSize) > maxWidth
          ? ellipsizeToWidth(word, maxWidth, fontSize)
          : word;
    }

    if (current) lines.push(current);
    if (lines.length <= maxLines) return { lines, fontSize };
  }

  const fontSize = 48;
  const lines: string[] = [];
  let current = "";
  let overflowIndex = words.length;
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const candidate = current ? `${current} ${word}` : word;
    if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) {
      overflowIndex = index;
      break;
    }
  }
  const remaining = words.slice(overflowIndex).join(" ") || current || clean;
  lines.push(ellipsizeToWidth(remaining || clean, maxWidth, fontSize));
  return { lines: lines.slice(0, maxLines), fontSize };
}

export function buildPostThumbnailSvg(input: {
  title: string;
  category?: string | null;
  slug: string;
}) {
  const colors = colorForSlug(input.slug);
  const label = ellipsizeToWidth((input.category || "Blog").toUpperCase(), 760, 34);
  const { lines, fontSize } = wrapTitleLines(input.title);
  const titleStartY = lines.length === 1 ? 330 : lines.length === 2 ? 295 : 260;
  const lineHeight = Math.round(fontSize * 1.18);
  const titleMarkup = lines
    .map(
      (line, index) =>
        `<text x="80" y="${titleStartY + index * lineHeight}" fill="#fff" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800">${escapeSvg(line)}</text>`,
    )
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.from}"/>
      <stop offset="1" stop-color="${colors.to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="1030" cy="120" r="210" fill="rgba(255,255,255,0.14)"/>
  <circle cx="120" cy="620" r="260" fill="rgba(0,0,0,0.16)"/>
  <text x="80" y="100" fill="rgba(255,255,255,0.78)" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="6">${escapeSvg(label)}</text>
  ${titleMarkup}
  <text x="80" y="575" fill="rgba(255,255,255,0.82)" font-family="Arial, sans-serif" font-size="32" font-weight="700">Tayfun Turkmen</text>
</svg>`;
}

export async function putGeneratedPostThumbnail(input: {
  title: string;
  category?: string | null;
  slug: string;
}) {
  const { bucket, publicBaseUrl } = getMediaEnv();
  if (!bucket) return null;
  const key = `media/thumbnails/v2/${input.slug}.svg`;
  await bucket.put(key, buildPostThumbnailSvg(input), {
    httpMetadata: { contentType: "image/svg+xml; charset=utf-8" },
    customMetadata: { title: input.title.slice(0, 120) },
  });
  return publicMediaUrl(key, publicBaseUrl);
}
