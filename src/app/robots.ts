import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/en/admin", "/tr/admin"],
    },
    sitemap: "https://tayfunturkmen.com/sitemap.xml",
    host: "https://tayfunturkmen.com",
  };
}
