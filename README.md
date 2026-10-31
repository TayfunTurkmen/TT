## TT Personal Blog CMS

Next.js 16 + OpenNext/Cloudflare setup for a bilingual, WordPress-like personal blog platform with a custom CMS panel, SEO-first public pages, cookie consent, demo content, and D1 migration files.

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
- Login credentials come from environment variables, not from D1:

  | Variable | Purpose |
  | --- | --- |
  | `ADMIN_USERNAME` | Login name |
  | `ADMIN_PASSWORD_HASH` | `scrypt:<saltHex>:<hashHex>` |
  | `ADMIN_SESSION_SECRET` | 32+ random characters used to sign the session cookie |
  | `ADMIN_TOTP_SECRET` | Optional base32 secret; when set a 2FA code is required |

- Generate the values with `npm run admin:hash` (hidden password prompt), then put them in `.env` (see `.env.example`).
  For builds that run on Cloudflare, add them as secrets: `npx wrangler secret put ADMIN_PASSWORD_HASH` (and the others).
- Sessions are HMAC-signed, HttpOnly, `SameSite=Strict` cookies that expire after 8 hours.
  Changing the password hash, the 2FA secret or `ADMIN_SESSION_SECRET` signs out every session.
- Failed logins are rate limited (5 failures → 15 min, 10 → 60 min) in memory and, when bound, in D1.
- 2FA: Admin → Security → *Generate 2FA key*, test a code, then save it as `ADMIN_TOTP_SECRET`.
- Posts, messages, bookings and settings still live in D1; without the `BLOG_DB` binding the panel opens but those sections are disabled.

## Paid Consulting (iyzico)

- Payment is taken through an iyzico payment link (individual account); there is no checkout API or webhook.
- Seller details, the package price and the payment link live in `src/lib/business.ts`.
  Fill in `address`, `phone` and `email` and set `paymentLink` once the iyzico link is created; empty fields are hidden.
- Legal pages required by iyzico and Turkish distance-sales rules: `/pre-information`, `/distance-sales-agreement`,
  `/cancellation-refund`, plus `/privacy-policy`. The texts are generated from `src/lib/legal.ts`.
- Buyers must accept the pre-information form and the distance sales agreement before the pay button is enabled.
- To show iyzico's official logo band in the footer, put the file in `public/` and set `paymentLogoBand`.

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
6. Verify policy pages, contact form, cookie consent, sitemap, robots, and mobile layout.
