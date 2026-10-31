"use client";

import { Link, usePathname } from "@/i18n/routing";

type Item = { href: string; label: string };

export function HeaderNav({ items, label }: { items: Item[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className="flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-sm [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 transition-colors ${
              active
                ? "bg-[var(--chip)] font-medium text-[var(--text)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
