import { PolicyPage } from "@/components/PolicyPage";
import { LEGAL_UPDATED, preInformationSections } from "@/lib/legal";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "tr" ? "Ön Bilgilendirme Formu" : "Pre-Information Form", alternates: { canonical: `/${locale}/pre-information` } };
}

export default async function PreInformationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  return (
    <PolicyPage
      title={tr ? "Ön Bilgilendirme Formu" : "Pre-Information Form"}
      lead={tr ? "Online danışmanlık hizmetini satın almadan önce bilmeniz gerekenler." : "What you need to know before buying the online consulting service."}
      sections={preInformationSections(locale)}
      locale={locale}
      showSeller
      updated={LEGAL_UPDATED}
    />
  );
}
