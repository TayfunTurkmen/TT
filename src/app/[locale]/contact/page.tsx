import { ContactForm } from "@/components/ContactForm";
import { getPublicSiteSettings, isContactFormConfigured } from "@/lib/d1";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "tr" ? "İletişim" : "Contact",
    description: locale === "tr" ? "Tayfun Türkmen ile iletişime geçin." : "Contact Tayfun Türkmen.",
    alternates: { canonical: `/${locale}/contact` },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  const site = await getPublicSiteSettings();
  const ready = await isContactFormConfigured();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text)]">{tr ? "İletişim" : "Contact"}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-[var(--muted)]">
        {tr ? "İş birliği, geri bildirim veya teknik sorular için kısa bir not bırakabilirsiniz." : "Send a short note for collaborations, feedback, or technical questions."}
      </p>
      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--chip)] p-5">
        <ContactForm enabled={ready} turnstileSiteKey={site.turnstileSiteKey} />
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          {tr ? "Form gönderimleri spam koruması ve KVKK/GDPR ilkeleri gözetilerek işlenir." : "Form submissions are handled with spam protection and privacy principles in mind."}
        </p>
      </div>
    </div>
  );
}
