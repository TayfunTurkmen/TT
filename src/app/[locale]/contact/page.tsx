import { ContactForm } from "@/components/ContactForm";
import { sellerDetails } from "@/lib/business";
import { pingD1 } from "@/lib/d1";
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
  const ready = Boolean(await pingD1());
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">{tr ? "İletişim" : "Contact"}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-[var(--muted)]">
        {tr ? "İş birliği, geri bildirim veya teknik sorular için kısa bir not bırakabilirsiniz." : "Send a short note for collaborations, feedback, or technical questions."}
      </p>
      <dl className="mt-8 grid gap-x-6 gap-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm sm:grid-cols-[max-content_1fr]">
        {sellerDetails(locale).map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-[var(--muted)]">{row.label}</dt>
            <dd className="text-[var(--text)]">
              {row.href ? (
                <a href={row.href} className="underline-offset-4 hover:underline">
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6">
        <ContactForm enabled={ready} />
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          {tr ? "Form gönderimleri spam koruması ve KVKK/GDPR ilkeleri gözetilerek işlenir." : "Form submissions are handled with spam protection and privacy principles in mind."}
        </p>
      </div>
    </div>
  );
}
