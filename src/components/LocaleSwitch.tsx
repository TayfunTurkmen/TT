"use client";

import { Link, usePathname, routing } from "@/i18n/routing";

type Props = { locale: string };

export function LocaleSwitch({ locale }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex rounded-lg border border-[var(--border)] bg-[var(--chip)] p-0.5">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          className={`rounded-md px-2 py-1 text-xs uppercase tracking-wider ${
            l === locale
              ? "bg-[var(--accent-2)] text-[var(--bg)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
