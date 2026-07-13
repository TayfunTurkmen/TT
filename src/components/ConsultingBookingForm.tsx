"use client";

import { createConsultingCheckout } from "@/app/actions/consulting";
import { formatMoney, type ConsultingPackage } from "@/lib/stripe";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

declare global {
  interface Window {
    onConsultingTurnstileSuccess?: () => void;
    onConsultingTurnstileExpired?: () => void;
    onConsultingTurnstileError?: () => void;
  }
}

type Props = {
  enabled: boolean;
  turnstileSiteKey: string | null;
  price30: number;
  price60: number;
  currency: string;
  cancelled?: boolean;
};

export function ConsultingBookingForm({
  enabled,
  turnstileSiteKey,
  price30,
  price60,
  currency,
  cancelled = false,
}: Props) {
  const t = useTranslations("consulting");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [challengeReady, setChallengeReady] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ConsultingPackage>("30");
  const formRef = useRef<HTMLFormElement>(null);

  const minDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    window.onConsultingTurnstileSuccess = () => setChallengeReady(true);
    window.onConsultingTurnstileExpired = () => setChallengeReady(false);
    window.onConsultingTurnstileError = () => setChallengeReady(false);

    return () => {
      delete window.onConsultingTurnstileSuccess;
      delete window.onConsultingTurnstileExpired;
      delete window.onConsultingTurnstileError;
    };
  }, []);

  if (!enabled) {
    return (
      <p className="max-w-prose text-sm leading-relaxed text-[var(--muted)]">{t("disabled")}</p>
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
      {cancelled ? (
        <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--muted)]">
          {t("cancelled")}
        </p>
      ) : null}
      <form
        ref={formRef}
        className="w-full min-w-0 space-y-5"
        action={(fd) => {
          fd.set("locale", locale);
          fd.set("package", selectedPackage);
          setErr(null);
          start(async () => {
            const res = await createConsultingCheckout(fd);
            if (res.ok) {
              window.location.href = res.checkoutUrl;
              return;
            }
            if (res.error === "turnstile") setErr(t("errorTurnstile"));
            else if (res.error === "config") setErr(t("disabled"));
            else setErr(t("error"));
            setChallengeReady(false);
            setTurnstileKey((k) => k + 1);
          });
        }}
      >
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-[var(--text)]">{t("packageLabel")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["30", "60"] as const).map((pkg) => {
              const price = pkg === "30" ? price30 : price60;
              const active = selectedPackage === pkg;
              return (
                <button
                  key={pkg}
                  type="button"
                  onClick={() => setSelectedPackage(pkg)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-[var(--accent-2)] bg-[var(--bg)] ring-1 ring-[var(--accent-2)]"
                      : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {pkg === "30" ? t("package30Title") : t("package60Title")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {pkg === "30" ? t("package30Desc") : t("package60Desc")}
                  </p>
                  <p className="mt-3 text-lg font-bold text-[var(--accent-2)]">
                    {formatMoney(price, currency, locale)}
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-sm text-[var(--muted)]">
            {t("name")}
            <input
              name="name"
              required
              maxLength={120}
              autoComplete="name"
              className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] sm:text-sm"
            />
          </label>
          <label className="min-w-0 text-sm text-[var(--muted)]">
            {t("email")}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-sm text-[var(--muted)]">
            {t("preferredDate")}
            <input
              name="preferredDate"
              type="date"
              required
              min={minDate}
              className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] sm:text-sm"
            />
          </label>
          <label className="min-w-0 text-sm text-[var(--muted)]">
            {t("preferredTime")}
            <input
              name="preferredTime"
              type="time"
              required
              className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] sm:text-sm"
            />
          </label>
        </div>

        <label className="block min-w-0 text-sm text-[var(--muted)]">
          {t("topic")}
          <textarea
            name="topic"
            required
            minLength={10}
            maxLength={4000}
            rows={4}
            placeholder={t("topicPlaceholder")}
            className="mt-1 w-full min-w-0 resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] sm:text-sm"
          />
        </label>

        {turnstileSiteKey ? (
          <div className="w-full min-w-0 overflow-x-auto py-1 [-webkit-overflow-scrolling:touch]">
            <div
              key={turnstileKey}
              className="cf-turnstile mx-auto w-fit max-w-full sm:mx-0"
              data-sitekey={turnstileSiteKey}
              data-size="flexible"
              data-callback="onConsultingTurnstileSuccess"
              data-expired-callback="onConsultingTurnstileExpired"
              data-error-callback="onConsultingTurnstileError"
            />
          </div>
        ) : null}

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
          {t("paymentNote")}
        </div>

        <button
          type="submit"
          disabled={pending || !turnstileSiteKey || !challengeReady}
          className="w-full min-h-11 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#041016] disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
        >
          {pending ? t("redirecting") : t("payAndBook")}
        </button>

        {turnstileSiteKey && !challengeReady ? (
          <p className="text-sm leading-relaxed text-[var(--muted)]">{t("waitingChallenge")}</p>
        ) : null}
        {err ? <p className="text-sm leading-relaxed text-[#ff9a9a]">{err}</p> : null}
      </form>
    </>
  );
}
