"use client";

import { submitContactForm } from "@/app/actions/contact";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

export function ContactForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [formRenderedAt] = useState(() => String(Date.now()));
  const formRef = useRef<HTMLFormElement>(null);

  if (!enabled) {
    return (
      <p className="max-w-prose text-sm leading-relaxed text-[var(--muted)]">{t("contactDisabled")}</p>
    );
  }

  return (
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
            setHumanChecked(false);
            return;
          }
          if (res.error === "bot") setErr(t("contactErrorBot"));
          else setErr(t("contactError"));
        });
      }}
    >
      <input type="hidden" name="formRenderedAt" value={formRenderedAt} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
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
      <label className="flex items-start gap-2 text-sm text-[var(--muted)]">
        <input
          name="humanCheck"
          type="checkbox"
          value="on"
          required
          checked={humanChecked}
          onChange={(e) => setHumanChecked(e.target.checked)}
          className="mt-1 rounded border-[var(--border)]"
        />
        <span>{t("contactHumanCheck")}</span>
      </label>
      <button
        type="submit"
        disabled={pending || !humanChecked}
        className="w-full min-h-11 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#041016] disabled:opacity-50 sm:w-auto sm:min-w-[8rem]"
      >
        {t("contactSubmit")}
      </button>
      {info ? (
        <p className="text-sm leading-relaxed text-[var(--accent-2)]">{info}</p>
      ) : null}
      {err ? <p className="text-sm leading-relaxed text-[#ff9a9a]">{err}</p> : null}
    </form>
  );
}
