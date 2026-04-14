import { getAllPosts } from "@/lib/posts";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "tr" ? "tr" : "en";
  const base = "https://tayfunturkmen.com";
  const posts = getAllPosts(locale);

  const items = posts
    .map((p) => {
      const url = `${base}/${locale}/blog/${p.slug}`;
      const desc = escapeXml(p.excerpt ?? p.title);
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${desc}</description>
    </item>`;
    })
    .join("");

  const channelTitle =
    locale === "tr" ? "Tayfun Türkmen — Blog" : "Tayfun Türkmen — Blog";

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${base}/${locale}/blog</link>
    <description>${escapeXml(channelTitle)}</description>
    <language>${locale}</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
