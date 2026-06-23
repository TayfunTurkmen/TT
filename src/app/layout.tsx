import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { getPublicSiteSettings } from "@/lib/d1";
import "./globals.css";

const DEFAULT_ADSENSE_CLIENT = "ca-pub-2877579504931285";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tayfunturkmen.com"),
  title: {
    default: "Tayfun Türkmen",
    template: "%s · Tayfun Türkmen",
  },
  authors: [{ name: "Tayfun Türkmen", url: "https://tayfunturkmen.com" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["tr_TR"],
    siteName: "Tayfun Türkmen",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSiteSettings();
  const adsenseClient = settings.adsenseClient ?? DEFAULT_ADSENSE_CLIENT;
  const analyticsId = settings.analyticsMeasurementId;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] font-[family-name:var(--font-sans)] text-[var(--text)] antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const s=localStorage.getItem('tt-theme');const d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}",
          }}
        />
        {analyticsId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analyticsId}',{anonymize_ip:true});`,
              }}
            />
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
