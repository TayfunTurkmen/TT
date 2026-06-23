import { getAllSlugs } from "@/lib/posts";
import { routing } from "@/i18n/routing";
import { categories, authors, getDemoPosts } from "@/lib/cms";
import type { MetadataRoute } from "next";

const base = "https://tayfunturkmen.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    for (const page of ["about", "contact", "privacy-policy", "cookie-policy", "terms", "search"]) {
      entries.push({ url: `${base}/${locale}/${page}`, lastModified: last });
    }
    for (const category of categories) {
      entries.push({ url: `${base}/${locale}/category/${category.slug}`, lastModified: last });
    }
    for (const author of authors) {
      entries.push({ url: `${base}/${locale}/author/${author.slug}`, lastModified: last });
    }
    const tags = new Set(getDemoPosts(locale).flatMap((post) => post.tags ?? []));
    for (const tag of tags) {
      entries.push({ url: `${base}/${locale}/tag/${tag}`, lastModified: last });
    }

    for (const slug of await getAllSlugs(locale)) {
      entries.push({
        url: `${base}/${locale}/blog/${slug}`,
        lastModified: last,
      });
    }
  }

  return entries;
}
