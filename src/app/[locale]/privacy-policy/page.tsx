import { PolicyPage } from "@/components/PolicyPage";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "tr" ? "Gizlilik Politikası" : "Privacy Policy", alternates: { canonical: `/${locale}/privacy-policy` } };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  return (
    <PolicyPage
      title={tr ? "Gizlilik Politikası" : "Privacy Policy"}
      lead={tr ? "Bu sayfa, site kullanımında hangi verilerin nasıl işlendiğini açıklar." : "This page explains how data is handled when you use this site."}
      sections={[
        { title: tr ? "Toplanan veriler" : "Data collected", body: tr ? "İletişim formları, yorumlar, bülten aboneliği ve güvenlik kayıtları kapsamında sınırlı veri işlenebilir." : "Limited data may be processed through contact forms, comments, newsletter subscriptions, and security logs." },
        { title: tr ? "Reklam ve analiz" : "Ads and analytics", body: tr ? "Google AdSense, Google Analytics 4 veya benzeri üçüncü taraf sağlayıcılar yalnızca yapılandırıldığında ve uygun çerez onayıyla kullanılmalıdır." : "Google AdSense, Google Analytics 4, or similar third-party providers should run only when configured and with appropriate cookie consent." },
        { title: tr ? "Haklarınız" : "Your rights", body: tr ? "Verilerinizle ilgili erişim, düzeltme veya silme talepleri için iletişim sayfasını kullanabilirsiniz." : "Use the contact page to request access, correction, or deletion of your data." },
      ]}
    />
  );
}
