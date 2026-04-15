## TT Personal Site

Next.js + OpenNext/Cloudflare setup for a bilingual personal blog with security-first defaults.

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
- Use the panel to create/edit posts and set single-post schedule date.
- Use bulk AI form to generate multiple drafts and auto-schedule across future days.
- Published posts are read from D1 and rendered in the public blog.

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
- Ad script is loaded only when this variable is set.
- Ad slots are included in blog list and blog post pages.

## Current D1 Usage

- Binding name: `BLOG_DB`
- Migration file: `migrations/0001_auto_blog_runs.sql`
- Migration file: `migrations/0002_blog_posts.sql`
- Migration file: `migrations/0003_admin_users.sql`
- Auto-blog endpoint stores request metadata in `auto_blog_runs`
- Auto publish endpoint releases due scheduled posts
