import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LangSetter } from "@/components/LangSetter";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "tr")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LangSetter locale={locale} />
      <div className="noise-layer" aria-hidden />
      <div className="grid-bg" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader locale={locale} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
