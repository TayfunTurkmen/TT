import AdminPage from "../page";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, section } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return {
    title: `${section} · ${t("title")}`,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/admin/${section}` },
  };
}

export default async function AdminSectionPage({ params }: Props) {
  const { locale } = await params;
  return <AdminPage params={Promise.resolve({ locale })} />;
}
