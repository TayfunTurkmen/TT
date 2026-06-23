import { getDemoPosts } from "@/lib/cms";
import { upsertBlogPost } from "@/lib/d1";
import { putGeneratedPostThumbnail } from "@/lib/r2-media";

export async function syncDemoSitePostsToAdminDb() {
  for (const locale of ["en", "tr"] as const) {
    const posts = getDemoPosts(locale);
    for (const post of posts) {
      const featuredImage =
        post.featuredImage?.startsWith("http")
          ? post.featuredImage
          : await putGeneratedPostThumbnail({
              title: post.title,
              category: post.category,
              slug: `${post.slug}-${locale}`,
            });

      const ok = await upsertBlogPost({
        slug: post.slug,
        locale,
        title: post.title,
        excerpt: post.excerpt ?? "",
        content: post.content,
        tags: post.tags ?? [],
        published: true,
        scheduledFor: null,
        metaTitle: post.seoTitle ?? post.title,
        metaDescription: post.seoDescription ?? post.excerpt ?? post.title,
        category: post.category,
        author: post.author,
        featuredImage: featuredImage ?? post.featuredImage ?? null,
      });
      if (!ok) return false;
    }
  }

  return true;
}
