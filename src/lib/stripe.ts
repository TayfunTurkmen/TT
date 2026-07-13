import Stripe from "stripe";

export type ConsultingPackage = "30" | "60";

export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function packageLabel(pkg: ConsultingPackage, locale: string): string {
  const minutes = pkg === "30" ? "30" : "60";
  return locale === "tr"
    ? `${minutes} dakika danışmanlık`
    : `${minutes}-minute consulting session`;
}

export function formatMoney(amountCents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}
