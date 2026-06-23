import { PolicyPage } from "@/components/PolicyPage";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "tr" ? "Kullanım Şartları" : "Terms of Use", alternates: { canonical: `/${locale}/terms` } };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  return (
    <PolicyPage
      title={tr ? "Kullanım Şartları" : "Terms of Use"}
      lead={tr ? "Bu siteyi kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız." : "By using this site, you agree to the following terms."}
      sections={[
        { title: tr ? "İçerik sorumluluğu" : "Content responsibility", body: tr ? "Yazılar bilgilendirme amacı taşır; profesyonel danışmanlık yerine geçmez." : "Articles are for informational purposes and do not replace professional advice." },
        { title: tr ? "Telif hakkı" : "Copyright", body: tr ? "Site içeriği izinsiz kopyalanamaz; alıntılarda kaynak gösterilmelidir." : "Site content may not be copied without permission; cite the source when quoting." },
        { title: tr ? "Kullanıcı katkıları" : "User contributions", body: tr ? "Yorumlar spam, hakaret veya yasa dışı içerik içermemelidir ve moderasyona tabidir." : "Comments must not include spam, abuse, or illegal content and may be moderated." },
      ]}
    />
  );
}
