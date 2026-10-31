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
      locale={locale}
      showSeller
      sections={[
        { title: tr ? "Veri sorumlusu" : "Data controller", body: tr ? "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu, iletişim bilgileri yukarıda yer alan Tayfun Türkmen'dir." : "Under Turkish Data Protection Law No. 6698 (KVKK), the data controller is Tayfun Türkmen, whose contact details are shown above." },
        { title: tr ? "Toplanan veriler" : "Data collected", body: tr ? "İletişim formları, yorumlar, bülten aboneliği ve güvenlik kayıtları kapsamında sınırlı veri işlenebilir." : "Limited data may be processed through contact forms, comments, newsletter subscriptions, and security logs." },
        { title: tr ? "Analiz" : "Analytics", body: tr ? "Google Analytics 4 veya benzeri araçlar yalnızca yapılandırıldığında ve uygun çerez onayıyla kullanılmalıdır." : "Google Analytics 4 or similar tools should run only when configured and with appropriate cookie consent." },
        { title: tr ? "Randevu talepleri" : "Appointment requests", body: tr ? "Danışmanlık randevu formunda paylaştığınız ad, e-posta, tercih ettiğiniz tarih/saat ve konu yalnızca görüşmeyi planlamak ve size dönüş yapmak için işlenir; talep sonuçlandıktan sonra gerekmedikçe saklanmaz." : "The name, e-mail, preferred date/time and topic you share in the appointment form are used only to schedule the call and reply to you, and are not kept longer than needed once the request is settled." },
        { title: tr ? "Haklarınız" : "Your rights", body: tr ? "KVKK'nın 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme ve işlemeye itiraz etme haklarına sahipsiniz. Talepleriniz için iletişim sayfasını kullanabilirsiniz." : "Under Article 11 of KVKK you may ask whether your data is processed, request information, ask for correction or deletion, and object to processing. Use the contact page for any request." },
      ]}
    />
  );
}
