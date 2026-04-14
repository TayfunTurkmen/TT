import { StudioPanel } from "@/components/StudioPanel";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "autoBlog" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/studio` },
  };
}

export default async function StudioPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "autoBlog" });
  const enabled = Boolean(process.env.AUTO_BLOG_PANEL_SECRET);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--text)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--muted)]">{t("lead")}</p>
      <div className="mt-10">
        <StudioPanel enabled={enabled} />
      </div>
    </div>
  );
}
