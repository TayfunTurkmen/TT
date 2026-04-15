import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit, Syne } from "next/font/google";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-[var(--bg)] font-[family-name:var(--font-sans)] text-[var(--text)] antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const s=localStorage.getItem('tt-theme');const d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
