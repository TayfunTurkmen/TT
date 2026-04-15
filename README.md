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
- Use the panel to create/edit posts and mark them as published.
- Published posts are read from D1 and rendered in the public blog.

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
