import { PolicyPage } from "@/components/PolicyPage";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "tr" ? "Çerez Politikası" : "Cookie Policy", alternates: { canonical: `/${locale}/cookie-policy` } };
}

export default async function CookiePolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  return (
    <PolicyPage
      title={tr ? "Çerez Politikası" : "Cookie Policy"}
      lead={tr ? "Çerez tercihlerinizi sitedeki çerez panelinden yönetebilirsiniz." : "You can manage cookie preferences from the cookie panel on the site."}
      sections={[
        { title: tr ? "Zorunlu çerezler" : "Necessary cookies", body: tr ? "Tema, dil, oturum ve güvenlik gibi temel işlevler için kullanılabilir." : "Used for essential features such as theme, language, sessions, and security." },
        { title: tr ? "Analiz çerezleri" : "Analytics cookies", body: tr ? "Site trafiğini anlamak için GA4 gibi araçlarla kullanılabilir ve onay gerektirir." : "May be used with tools like GA4 to understand site traffic and requires consent." },
        { title: tr ? "Reklam çerezleri" : "Advertising cookies", body: tr ? "AdSense gibi reklam sağlayıcıları kişiselleştirme veya ölçüm için çerez kullanabilir." : "Advertising providers such as AdSense may use cookies for personalization or measurement." },
      ]}
    />
  );
}
