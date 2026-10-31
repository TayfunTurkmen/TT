"use client";

import { unlockAdmin } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

type Props = {
  configured: boolean;
  problems: string[];
  twoFactorEnabled: boolean;
};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)]";

export function AdminLogin({ configured, problems, twoFactorEnabled }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [lastUsername, setLastUsername] = useState("");
  const [formRenderedAt] = useState(() => String(Date.now()));

  if (!configured) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-md)] sm:p-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-[var(--text)]">{t("notConfiguredTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t("notConfiguredLead")}</p>
        <ul className="mt-4 space-y-1.5">
          {problems.map((name) => (
            <li key={name} className="font-mono text-xs text-[var(--text)]">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--danger)] align-middle" aria-hidden />
              {name}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-[var(--muted)]">{t("notConfiguredHint")}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-mono text-xs text-[var(--text)]">
          npm run admin:hash
        </pre>
      </div>
    );
  }

  return (
    <form
      className="mx-auto max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-md)] sm:p-8"
      action={(fd) => {
        setError(null);
        setLastUsername(String(fd.get("username") ?? ""));
        start(async () => {
          const res = await unlockAdmin(fd);
          if (res.ok) {
            router.refresh();
            return;
          }
          setError(
            res.error === "blocked" ? t("loginBlocked") : res.error === "config" ? t("error") : t("loginFailed"),
          );
        });
      }}
    >
      <input type="hidden" name="formRenderedAt" value={formRenderedAt} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--accent-ink)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-[var(--text)]">{t("loginTitle")}</h1>
      <p className="mt-1.5 text-sm text-[var(--muted)]">{t("loginLead")}</p>

      <div className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-[var(--text)]">
          {t("username")}
          <input name="username" type="text" required defaultValue={lastUsername} autoComplete="username" autoCapitalize="none" spellCheck={false} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-[var(--text)]">
          {t("password")}
          <span className="relative block">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className={`${fieldClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 mt-1.5 px-3 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)]"
              aria-pressed={showPassword}
            >
              {showPassword ? t("hidePassword") : t("showPassword")}
            </button>
          </span>
        </label>
        {twoFactorEnabled ? (
          <label className="block text-sm font-medium text-[var(--text)]">
            {t("twoFactorCode")}
            <input
              name="totp"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              className={`${fieldClass} font-mono tracking-[0.3em]`}
            />
          </label>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
        {pending ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}
