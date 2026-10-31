import { PolicyPage } from "@/components/PolicyPage";
import { LEGAL_UPDATED, distanceSalesSections } from "@/lib/legal";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "tr" ? "Mesafeli Satış Sözleşmesi" : "Distance Sales Agreement", alternates: { canonical: `/${locale}/distance-sales-agreement` } };
}

export default async function DistanceSalesAgreementPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  return (
    <PolicyPage
      title={tr ? "Mesafeli Satış Sözleşmesi" : "Distance Sales Agreement"}
      lead={tr ? "Online danışmanlık hizmetinin satışına ilişkin sözleşme." : "The agreement covering the sale of the online consulting service."}
      sections={distanceSalesSections(locale)}
      locale={locale}
      showSeller
      updated={LEGAL_UPDATED}
    />
  );
}
