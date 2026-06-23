## TT Personal Blog CMS

Next.js 16 + OpenNext/Cloudflare setup for a bilingual, WordPress-like personal blog platform with a custom CMS panel, SEO-first public pages, AdSense-ready ad placements, cookie consent, demo content, and D1 migration files.

## Local Development

```bash
npm install
npm run dev
```

## Cloudflare Build

```bash
npm run build
```

This generates both Next.js output and OpenNext Worker artifacts (`.open-next/worker.js` + assets).

## D1 Database Setup

1. Create a D1 database (if you do not have one yet):
   ```bash
   npx wrangler d1 create tayfun-blog-db
   ```
2. Copy `database_id` and `preview_database_id` into `wrangler.jsonc`:
   - `d1_databases[0].database_id`
   - `d1_databases[0].preview_database_id`
3. Run migration:
   ```bash
   npm run d1:migrate:remote
   ```
4. Test connection:
   - `GET /api/db/ping`

## Admin Panel

- Route: `/{locale}/admin` (e.g. `/en/admin`, `/tr/admin`)
- On first visit, create an admin username and password (stored in D1 as hash+salt).
- Demo admin credentials are not hard-coded for security. First D1-backed visit creates the initial admin account.
- Use the panel to create/edit posts, save drafts, publish, and set single-post schedule date.
- Use bulk AI form to generate multiple drafts and auto-schedule across future days.
- Published posts are read from D1 and rendered in the public blog.
- Section URLs such as `/en/admin/posts`, `/en/admin/pages`, `/en/admin/categories`, `/en/admin/tags`, `/en/admin/media`, `/en/admin/comments`, `/en/admin/ads`, `/en/admin/settings`, `/en/admin/seo`, and `/en/admin/users` resolve to the same secured CMS shell.

## Public Routes

- `/`, `/blog`, `/blog/post-slug`
- `/category/category-slug`, `/tag/tag-slug`, `/author/author-slug`
- `/about`, `/contact`, `/privacy-policy`, `/cookie-policy`, `/terms`
- `/search?q=query`, `/api/rss`, `/sitemap.xml`, `/robots.txt`

The app ships with 10 high-quality demo posts, 5 categories, author metadata, policy pages, search, category/tag archives, related posts, table of contents, JSON-LD article/breadcrumb schema, newsletter UI, and responsive ad containers that reserve layout space to reduce CLS.

## AI + Scheduling

- Optional paid API: `OPENAI_API_KEY`
- Optional free-tier path: `OPENROUTER_API_KEY` with `OPENROUTER_MODEL` (default free model preconfigured)
- Single post scheduling: `scheduleDate`
- Bulk scheduling: start date + interval days

## Cron Auto Publish

- Endpoint: `POST /api/cron/publish` with `Authorization: Bearer <CRON_SECRET>`
- GitHub Actions workflow: `.github/workflows/auto-publish.yml` (hourly)
- Required GitHub secrets:
  - `SITE_URL` (e.g. `https://www.tayfunturkmen.com`)
  - `CRON_SECRET`

## AdSense Compatibility

- Set `NEXT_PUBLIC_ADSENSE_CLIENT` (e.g. `ca-pub-xxxxxxxxxxxx`).
- Ad script is loaded only when this variable or the admin setting is set.
- Ad slots are included on the homepage, blog archive, sidebar, and blog post pages.
- Ad containers include visible labels and minimum heights so ads are separated from content and less likely to create layout shift.
- This project is structured to be AdSense-ready, but it does not and cannot guarantee AdSense approval.

## Current D1 Usage

- Binding name: `BLOG_DB`
- Migration file: `migrations/0001_auto_blog_runs.sql`
- Migration file: `migrations/0002_blog_posts.sql`
- Migration file: `migrations/0003_admin_users.sql`
- Migration file: `migrations/0004_wordpress_like_cms.sql`
- Auto-blog endpoint stores request metadata in `auto_blog_runs`
- Auto publish endpoint releases due scheduled posts

## Production Checklist

1. Copy `.env.example` to `.env.local` and fill only the services you use.
2. Configure Cloudflare D1 binding `BLOG_DB`.
3. Run `npm run d1:migrate:remote`.
4. Visit `/{locale}/admin` and create the initial admin user.
5. Replace or delete demo content once real original articles are ready.
6. Verify policy pages, contact form, cookie consent, sitemap, robots, and mobile layout before AdSense review.
