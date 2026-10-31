"use client";

import { Link, usePathname, routing } from "@/i18n/routing";

type Props = { locale: string };

export function LocaleSwitch({ locale }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex h-9 items-center rounded-lg border border-[var(--border)] p-0.5">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          aria-current={l === locale ? "true" : undefined}
          className={`flex h-full items-center rounded-md px-2 text-[0.7rem] font-medium uppercase tracking-wide transition-colors ${
            l === locale
              ? "bg-[var(--chip)] text-[var(--text)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
