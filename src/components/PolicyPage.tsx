import { sellerDetails } from "@/lib/business";

type Section = { title: string; body: string | string[] };

export function PolicyPage({
  title,
  lead,
  sections,
  locale,
  showSeller = false,
  updated,
}: {
  title: string;
  lead: string;
  sections: Section[];
  locale?: string;
  /** Show the seller's identity and contact details above the sections. */
  showSeller?: boolean;
  /** Last-updated date (YYYY-MM-DD). */
  updated?: string;
}) {
  const tr = locale === "tr";
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">{title}</h1>
      <p className="mt-3 text-lg leading-8 text-[var(--muted)]">{lead}</p>
      {updated ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {tr ? "Son güncelleme" : "Last updated"}: <time dateTime={updated}>{updated}</time>
        </p>
      ) : null}
      {showSeller && locale ? (
        <dl className="mt-8 grid gap-x-6 gap-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm sm:grid-cols-[max-content_1fr]">
          {sellerDetails(locale).map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-[var(--muted)]">{row.label}</dt>
              <dd className="text-[var(--text)]">
                {row.href ? (
                  <a href={row.href} className="underline-offset-4 hover:underline">
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="prose-doc mt-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {(Array.isArray(section.body) ? section.body : [section.body]).map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
