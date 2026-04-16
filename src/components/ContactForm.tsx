"use client";

import { submitContactForm } from "@/app/actions/contact";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

export function ContactForm({
  enabled,
  turnstileSiteKey,
}: {
  enabled: boolean;
  turnstileSiteKey: string | null;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  if (!enabled) {
    return (
      <p className="max-w-prose text-sm leading-relaxed text-[var(--muted)]">{t("contactDisabled")}</p>
    );
  }

  return (
    <>
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      ) : null}
      <form
        ref={formRef}
        className="mt-4 w-full min-w-0 space-y-4"
        action={(fd) => {
          fd.set("locale", locale);
          setInfo(null);
          setErr(null);
          start(async () => {
            const res = await submitContactForm(fd);
            if (res.ok) {
              setInfo(t("contactSent"));
              formRef.current?.reset();
              setTurnstileKey((k) => k + 1);
              return;
            }
            if (res.error === "turnstile") setErr(t("contactErrorTurnstile"));
            else if (res.error === "config") setErr(t("contactDisabled"));
            else setErr(t("contactError"));
          });
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-sm text-[var(--muted)]">
            {t("contactName")}
            <input
              name="name"
              required
              maxLength={120}
              autoComplete="name"
              className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] sm:text-sm"
            />
          </label>
          <label className="min-w-0 text-sm text-[var(--muted)]">
            {t("contactEmail")}
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              inputMode="email"
              className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] sm:text-sm"
            />
          </label>
        </div>
        <label className="block min-w-0 text-sm text-[var(--muted)]">
          {t("contactMessage")}
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={8000}
            rows={5}
            className="mt-1 w-full min-w-0 resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] sm:text-sm"
          />
        </label>
        {turnstileSiteKey ? (
          <div className="w-full min-w-0 overflow-x-auto py-1 [-webkit-overflow-scrolling:touch]">
            <div
              key={turnstileKey}
              className="cf-turnstile cf-turnstile-contact mx-auto w-fit max-w-full sm:mx-0"
              data-sitekey={turnstileSiteKey}
              data-size="flexible"
            />
          </div>
        ) : null}
        <button
          type="submit"
          disabled={pending || !turnstileSiteKey}
          className="w-full min-h-11 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#041016] disabled:opacity-50 sm:w-auto sm:min-w-[8rem]"
        >
          {t("contactSubmit")}
        </button>
        {info ? (
          <p className="text-sm leading-relaxed text-[var(--accent-2)]">{info}</p>
        ) : null}
        {err ? <p className="text-sm leading-relaxed text-[#ff9a9a]">{err}</p> : null}
      </form>
    </>
  );
}
