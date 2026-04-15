import { AdminPanel } from "@/components/AdminPanel";
import { hasAdminUser, listAdminBlogPosts, pingD1 } from "@/lib/d1";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/admin` },
  };
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const enabled = Boolean(await pingD1());
  const adminUserExists = enabled ? await hasAdminUser() : false;
  const posts = await listAdminBlogPosts(100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--text)]">
        {t("title")}
      </h1>
      <p className="mt-3 text-[var(--muted)]">{t("lead")}</p>
      <div className="mt-8">
        <AdminPanel
          enabled={enabled}
          hasAdminUser={adminUserExists}
          initialPosts={posts.map((p) => ({
            slug: p.slug,
            locale: p.locale,
            title: p.title,
            published: p.published,
            updatedAt: p.updatedAt,
          }))}
        />
      </div>
    </div>
  );
}
