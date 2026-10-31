/**
 * Public seller and payment details for paid consulting (iyzico individual account).
 *
 * Turkish distance-sales rules and iyzico require the seller's name, address,
 * phone and e-mail to be visible on the site. Empty fields are hidden, so fill
 * them in before applying to iyzico.
 */
type Seller = { name: string; address: string; phone: string; email: string; website: string };
type ConsultingPackage = { minutes: number; priceTry: number; paymentLink: string };

export const seller: Seller = {
  name: "Tayfun Türkmen",
  address: "",
  phone: "",
  email: "",
  website: "https://tayfunturkmen.com",
};

export const consultingPackage: ConsultingPackage = {
  minutes: 30,
  /** Price in Turkish lira, all taxes included. Must match the iyzico payment link. */
  priceTry: 2000,
  /** iyzico "Link ile Ödeme" URL. Leave empty until the link is created; the pay button stays disabled. */
  paymentLink: "",
};

/** Optional official iyzico logo band placed in /public (e.g. "/iyzico-logo-band.svg"). */
export const paymentLogoBand: string = "";

export function formatTry(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Seller lines for legal pages and the footer; empty fields are left out. */
export function sellerDetails(locale: string): Array<{ label: string; value: string; href?: string }> {
  const tr = locale === "tr";
  const rows: Array<{ label: string; value: string; href?: string }> = [
    { label: tr ? "Satıcı" : "Seller", value: seller.name },
    { label: tr ? "Adres" : "Address", value: seller.address },
    { label: tr ? "Telefon" : "Phone", value: seller.phone, href: `tel:${seller.phone.replace(/\s+/g, "")}` },
    { label: tr ? "E-posta" : "E-mail", value: seller.email, href: `mailto:${seller.email}` },
    { label: tr ? "Web sitesi" : "Website", value: seller.website.replace(/^https?:\/\//, ""), href: seller.website },
  ];
  return rows.filter((row) => row.value);
}
