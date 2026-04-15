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

## Current D1 Usage

- Binding name: `BLOG_DB`
- Migration file: `migrations/0001_auto_blog_runs.sql`
- Auto-blog endpoint stores request metadata in `auto_blog_runs`
