"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Agreement checkbox + iyzico payment link. The buyer must accept the
 * pre-information form and distance sales agreement before paying. The
 * checkbox is shown even before the link exists, so reviewers see the flow.
 */
export function ConsultingPurchase({ paymentLink }: { paymentLink: string }) {
  const t = useTranslations("consulting");
  const [accepted, setAccepted] = useState(false);

  const linkClass = "font-medium text-[var(--text)] underline underline-offset-4";

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--muted)]">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--border-strong)]"
        />
        <span>
          {t.rich("agreement", {
            preInfo: (chunks) => (
              <Link href="/pre-information" target="_blank" className={linkClass}>
                {chunks}
              </Link>
            ),
            contract: (chunks) => (
              <Link href="/distance-sales-agreement" target="_blank" className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
      {paymentLink && accepted ? (
        <a href={paymentLink} rel="noopener noreferrer" className="btn-primary w-full">
          {t("pay")}
          <span aria-hidden>→</span>
        </a>
      ) : (
        <button type="button" disabled className="btn-primary w-full" title={paymentLink ? t("acceptFirst") : undefined}>
          {paymentLink ? t("pay") : t("payComingSoon")}
        </button>
      )}
      {!paymentLink ? (
        <p className="text-sm text-[var(--muted)]">
          {t("payComingSoonHint")}{" "}
          <Link href="/contact" className={linkClass}>
            {t("contactLink")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
