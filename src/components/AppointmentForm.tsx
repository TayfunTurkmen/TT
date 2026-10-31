"use client";

import { submitAppointmentRequest } from "@/app/actions/appointment";
import { Link } from "@/i18n/routing";
import { useFormElapsed } from "@/lib/form-timing";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

const fieldClass =
  "mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] sm:text-sm";

export function AppointmentForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("consulting");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const formElapsed = useFormElapsed();

  if (!enabled) {
    return <p className="text-sm leading-relaxed text-[var(--muted)]">{t("disabled")}</p>;
  }

  if (sent) {
    return (
      <p role="status" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)]">
        {t("success")}
      </p>
    );
  }

  return (
    <form
      className="w-full min-w-0 space-y-4"
      // onSubmit (not `action`) so React does not clear the fields when sending fails.
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        fd.set("locale", locale);
        fd.set("formElapsedMs", String(formElapsed()));
        setErr(null);
        start(async () => {
          const res = await submitAppointmentRequest(fd);
          if (res.ok) {
            setSent(true);
            return;
          }
          setErr(
            res.error === "bot"
              ? t("errorBot")
              : res.error === "date"
                ? t("errorDate")
                : res.error === "config"
                  ? t("disabled")
                  : t("error"),
          );
        });
      }}
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="min-w-0 text-sm text-[var(--muted)]">
          {t("name")}
          <input name="name" required maxLength={120} autoComplete="name" className={fieldClass} />
        </label>
        <label className="min-w-0 text-sm text-[var(--muted)]">
          {t("email")}
          <input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" className={fieldClass} />
        </label>
        <label className="min-w-0 text-sm text-[var(--muted)]">
          {t("preferredDate")}
          <input name="preferredDate" type="date" required min={today} suppressHydrationWarning className={fieldClass} />
        </label>
        <label className="min-w-0 text-sm text-[var(--muted)]">
          {t("preferredTime")}
          <input name="preferredTime" type="time" required step={900} className={fieldClass} />
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
          className={`${fieldClass} resize-y`}
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-[var(--muted)]">
        <input
          name="humanCheck"
          type="checkbox"
          value="on"
          required
          checked={humanChecked}
          onChange={(event) => setHumanChecked(event.target.checked)}
          className="mt-1 rounded border-[var(--border)]"
        />
        <span>{t("humanCheck")}</span>
      </label>
      <p className="text-xs leading-relaxed text-[var(--muted)]">
        {t.rich("privacyNote", {
          privacy: (chunks) => (
            <Link href="/privacy-policy" className="underline underline-offset-4 hover:text-[var(--text)]">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <button type="submit" disabled={pending || !humanChecked} className="btn-primary min-h-11 w-full sm:w-auto sm:min-w-[12rem]">
        {pending ? t("sending") : t("submit")}
      </button>
      {err ? (
        <p role="alert" className="text-sm leading-relaxed text-[var(--danger)]">
          {err}
        </p>
      ) : null}
    </form>
  );
}
