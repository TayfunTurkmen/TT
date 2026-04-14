import { getTranslations } from "next-intl/server";

type Props = { locale: string };

export async function SiteFooter({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--footer-bg)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Tayfun Türkmen — {t("rights")}</p>
        <p className="max-w-md text-xs leading-relaxed">{t("built")}</p>
      </div>
    </footer>
  );
}
