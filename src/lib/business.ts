/**
 * The site owner's public contact details, shown on the contact page and in
 * the privacy policy (KVKK data controller). Empty fields are hidden.
 */
type Seller = { name: string; address: string; phone: string; email: string; website: string };

export const seller: Seller = {
  name: "Tayfun Türkmen",
  address: "",
  phone: "",
  email: "",
  website: "https://tayfunturkmen.com",
};

/** Contact lines for the contact page and privacy policy; empty fields are left out. */
export function sellerDetails(locale: string): Array<{ label: string; value: string; href?: string }> {
  const tr = locale === "tr";
  const rows: Array<{ label: string; value: string; href?: string }> = [
    { label: tr ? "Ad soyad" : "Name", value: seller.name },
    { label: tr ? "Adres" : "Address", value: seller.address },
    { label: tr ? "Telefon" : "Phone", value: seller.phone, href: `tel:${seller.phone.replace(/\s+/g, "")}` },
    { label: tr ? "E-posta" : "E-mail", value: seller.email, href: `mailto:${seller.email}` },
    { label: tr ? "Web sitesi" : "Website", value: seller.website.replace(/^https?:\/\//, ""), href: seller.website },
  ];
  return rows.filter((row) => row.value);
}
