export function PolicyPage({
  title,
  lead,
  sections,
}: {
  title: string;
  lead: string;
  sections: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text)]">{title}</h1>
      <p className="mt-3 text-lg leading-8 text-[var(--muted)]">{lead}</p>
      <div className="prose-doc mt-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
