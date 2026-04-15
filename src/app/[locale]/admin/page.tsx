import { AdminPanel } from "@/components/AdminPanel";
import { getPublicSiteSettings, hasAdminUser, listAdminBlogPosts, pingD1 } from "@/lib/d1";
import { cookies } from "next/headers";
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
  const jar = await cookies();
  const unlocked = jar.get("admin_ok")?.value === "1";
  const posts = unlocked ? await listAdminBlogPosts(100) : [];
  const marketing = enabled ? await getPublicSiteSettings() : null;

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
          unlocked={unlocked}
          initialPosts={posts.map((p) => ({
            slug: p.slug,
            locale: p.locale,
            title: p.title,
            published: p.published,
            updatedAt: p.updatedAt,
            scheduledFor: p.scheduledFor,
          }))}
          initialSettings={{
            adsenseClient: marketing?.adsenseClient ?? "",
            analyticsMeasurementId: marketing?.analyticsMeasurementId ?? "",
            adSlotBlogList: marketing?.adSlotBlogList ?? "1234567890",
            adSlotBlogPost: marketing?.adSlotBlogPost ?? "1234567891",
          }}
        />
      </div>
    </div>
  );
}
