import { PolicyPage } from "@/components/PolicyPage";
import { LEGAL_UPDATED, cancellationRefundSections } from "@/lib/legal";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "tr" ? "İptal, İade ve Teslimat Koşulları" : "Cancellation, Refund and Delivery Policy", alternates: { canonical: `/${locale}/cancellation-refund` } };
}

export default async function CancellationRefundPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  return (
    <PolicyPage
      title={tr ? "İptal, İade ve Teslimat Koşulları" : "Cancellation, Refund and Delivery Policy"}
      lead={tr ? "Danışmanlık hizmetinin nasıl sunulduğu, iptal ve iade süreci." : "How the consulting service is delivered, and how cancellation and refunds work."}
      sections={cancellationRefundSections(locale)}
      locale={locale}
      showSeller
      updated={LEGAL_UPDATED}
    />
  );
}
