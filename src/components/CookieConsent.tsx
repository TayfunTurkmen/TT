"use client";

import { useState } from "react";

type Consent = "all" | "necessary" | null;

export function CookieConsent({ locale }: { locale: string }) {
  const [consent, setConsent] = useState<Consent>(() => {
    if (typeof window === "undefined") return "necessary";
    return window.localStorage.getItem("tt-cookie-consent") as Consent;
  });
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem("tt-cookie-consent");
  });
  const tr = locale === "tr";

  const save = (value: Exclude<Consent, null>) => {
    window.localStorage.setItem("tt-cookie-consent", value);
    setConsent(value);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-50 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--muted)] shadow-sm"
      >
        {tr ? "Çerezler" : "Cookies"}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 shadow-2xl">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-bold text-[var(--text)]">{tr ? "Çerez tercihleri" : "Cookie preferences"}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {tr
              ? "Zorunlu çerezler sitenin çalışmasını sağlar. Analiz ve reklam çerezleri yalnızca onayınızla kullanılmalıdır."
              : "Necessary cookies keep the site working. Analytics and advertising cookies should run only with your consent."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => save("necessary")} className="rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text)]">
            {tr ? "Yalnızca gerekli" : "Necessary only"}
          </button>
          <button type="button" onClick={() => save("all")} className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white">
            {tr ? "Tümünü kabul et" : "Accept all"}
          </button>
        </div>
      </div>
      <span className="sr-only">Current consent: {consent ?? "unset"}</span>
    </div>
  );
}
