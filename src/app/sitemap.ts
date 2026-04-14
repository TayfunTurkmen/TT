import { getAllSlugs } from "@/lib/posts";
import { routing } from "@/i18n/routing";
import type { MetadataRoute } from "next";

const base = "https://tayfunturkmen.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    const last = new Date();
    entries.push({
      url: `${base}/${locale}`,
      lastModified: last,
    });
    entries.push({
      url: `${base}/${locale}/blog`,
      lastModified: last,
    });
    entries.push({
      url: `${base}/${locale}/about`,
      lastModified: last,
    });

    for (const slug of getAllSlugs(locale)) {
      entries.push({
        url: `${base}/${locale}/blog/${slug}`,
        lastModified: last,
      });
    }
  }

  return entries;
}
