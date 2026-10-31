"use client";

import { useState, useSyncExternalStore } from "react";

type Consent = "all" | "necessary" | null;

const STORAGE_KEY = "tt-cookie-consent";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readStoredConsent(): Consent {
  try {
    return window.localStorage.getItem(STORAGE_KEY) as Consent;
  } catch {
    return "necessary";
  }
}

export function CookieConsent({ locale }: { locale: string }) {
  // The server snapshot renders the collapsed button; the stored choice is read
  // only on the client after hydration, so both renders match.
  const stored = useSyncExternalStore(subscribe, readStoredConsent, () => "necessary" as Consent);
  const [choice, setChoice] = useState<Consent>(null);
  const [reopened, setReopened] = useState(false);
  const consent = choice ?? stored;
  const open = reopened || !consent;
  const tr = locale === "tr";

  const save = (value: Exclude<Consent, null>) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setChoice(value);
    setReopened(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setReopened(true)}
        className="fixed bottom-3 left-3 z-50 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--muted)] shadow-sm"
      >
        {tr ? "Çerezler" : "Cookies"}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 shadow-[var(--shadow-md)] sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{tr ? "Çerez tercihleri" : "Cookie preferences"}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {tr
              ? "Zorunlu çerezler sitenin çalışmasını sağlar. Analiz çerezleri yalnızca onayınızla kullanılmalıdır."
              : "Necessary cookies keep the site working. Analytics cookies should run only with your consent."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => save("necessary")} className="btn-secondary min-h-9 px-3 py-1.5 text-xs">
            {tr ? "Yalnızca gerekli" : "Necessary only"}
          </button>
          <button type="button" onClick={() => save("all")} className="btn-primary min-h-9 px-3 py-1.5 text-xs">
            {tr ? "Tümünü kabul et" : "Accept all"}
          </button>
        </div>
      </div>
      <span className="sr-only">Current consent: {consent ?? "unset"}</span>
    </div>
  );
}
