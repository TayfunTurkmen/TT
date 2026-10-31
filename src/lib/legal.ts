import { consultingPackage, formatTry, seller } from "@/lib/business";

/**
 * Shared clauses for the consumer-facing sales documents (pre-information form,
 * distance sales agreement, cancellation & refund policy). Written for a
 * single online consulting service paid through an iyzico payment link,
 * under Law No. 6502 and the Distance Contracts Regulation.
 */

export const LEGAL_UPDATED = "2026-10-31";

type Section = { title: string; body: string | string[] };

function clauses(locale: string) {
  const tr = locale === "tr";
  const price = formatTry(consultingPackage.priceTry, locale);
  const minutes = consultingPackage.minutes;

  return {
    service: tr
      ? `${minutes} dakikalık online danışmanlık görüşmesi: web geliştirme, yapay zekâ, veri ve siber güvenlik konularında bire bir görüntülü görüşme.`
      : `${minutes}-minute online consulting session: a one-to-one video call on web development, AI, data and cybersecurity.`,
    price: tr
      ? `Toplam bedel ${price}'dir (tüm vergiler dahil). Ek ücret veya kargo bedeli yoktur.`
      : `The total price is ${price} (all taxes included). There are no extra fees or shipping costs.`,
    payment: tr
      ? "Ödeme, iyzico (iyzi Ödeme ve Elektronik Para Hizmetleri A.Ş.) altyapısıyla sağlanan ödeme bağlantısı üzerinden kredi kartı veya banka kartıyla tek seferde alınır. Kart bilgileri bu sitede saklanmaz."
      : "Payment is taken in a single charge by credit or debit card through a payment link provided by iyzico (iyzi Ödeme ve Elektronik Para Hizmetleri A.Ş.). Card details are never stored on this site.",
    delivery: tr
      ? [
          "Hizmet fiziksel olarak teslim edilmez; online görüntülü görüşme olarak sunulur.",
          "Ödemenin ardından en geç 2 iş günü içinde alıcının e-posta adresine dönülerek görüşme tarihi ve saati birlikte belirlenir. Görüşme, ödeme tarihinden itibaren en geç 30 gün içinde yapılır ve görüşme bağlantısı e-posta ile gönderilir.",
        ]
      : [
          "The service is not physically delivered; it is provided as an online video call.",
          "Within 2 business days of payment the buyer is contacted by e-mail to agree on a date and time. The session takes place within 30 days of payment and the meeting link is sent by e-mail.",
        ],
    withdrawal: tr
      ? [
          "Alıcı, sözleşmenin kurulduğu tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeden ve cezai şart ödemeden cayma hakkını kullanabilir. Cayma bildirimi bu süre içinde satıcının iletişim bilgilerine veya sitedeki iletişim formuna yazılı olarak iletilir.",
          "Mesafeli Sözleşmeler Yönetmeliği'nin 15/1-(h) maddesi uyarınca, cayma süresi dolmadan alıcının onayıyla ifasına başlanan hizmetlerde cayma hakkı kullanılamaz. Bu nedenle görüşme gerçekleştikten sonra cayma hakkı ve bedel iadesi söz konusu değildir.",
        ]
      : [
          "The buyer may withdraw within 14 days of the contract date without giving a reason and without penalty, by notifying the seller in writing through the contact details or the contact form on this site.",
          "Under Article 15/1-(h) of the Distance Contracts Regulation, the right of withdrawal does not apply to services whose performance has started with the buyer's consent before the withdrawal period ends. Once the session has taken place, it can no longer be withdrawn from or refunded.",
        ],
    cancellation: tr
      ? "Görüşme başlamadan önce yapılan iptal taleplerinde ödenen bedelin tamamı iade edilir. Görüşme tarihi, taraflar anlaşarak değiştirilebilir."
      : "If the buyer cancels before the session starts, the full amount is refunded. The session date can be changed by mutual agreement.",
    refund: tr
      ? "İade, cayma veya iptal bildiriminin satıcıya ulaştığı tarihten itibaren en geç 14 gün içinde, ödemenin yapıldığı karta iyzico üzerinden yapılır. Tutarın hesaba yansıma süresi bankaya göre değişebilir."
      : "Refunds are made to the card used for payment, through iyzico, within 14 days of the seller receiving the withdrawal or cancellation notice. The time for the amount to appear on the account depends on the bank.",
    complaints: tr
      ? "Talep ve şikâyetler için satıcının iletişim bilgileri veya sitedeki iletişim formu kullanılabilir. Uyuşmazlıklarda, Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar dahilinde alıcının yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetine, bu sınırları aşan durumlarda Tüketici Mahkemesine başvurulabilir."
      : "Requests and complaints can be sent through the seller's contact details or the contact form on this site. Disputes may be brought, within the monetary limits set each year by the Ministry of Trade, before the Consumer Arbitration Committee where the buyer lives or where the purchase was made, and above those limits before the Consumer Courts.",
  };
}

export function preInformationSections(locale: string): Section[] {
  const tr = locale === "tr";
  const c = clauses(locale);
  return [
    { title: tr ? "Hizmetin temel nitelikleri" : "Main features of the service", body: c.service },
    { title: tr ? "Fiyat ve ödeme" : "Price and payment", body: [c.price, c.payment] },
    { title: tr ? "İfa ve teslimat" : "Performance and delivery", body: c.delivery },
    { title: tr ? "Cayma hakkı" : "Right of withdrawal", body: c.withdrawal },
    { title: tr ? "İptal ve iade" : "Cancellation and refund", body: [c.cancellation, c.refund] },
    { title: tr ? "Şikâyet ve uyuşmazlıklar" : "Complaints and disputes", body: c.complaints },
    {
      title: tr ? "Onay" : "Acceptance",
      body: tr
        ? "Alıcı, ödeme öncesinde bu formu okuduğunu ve onayladığını kabul eder. Bu form, Mesafeli Satış Sözleşmesi'nin ayrılmaz bir parçasıdır."
        : "The buyer confirms having read and accepted this form before payment. This form is an integral part of the Distance Sales Agreement.",
    },
  ];
}

export function distanceSalesSections(locale: string): Section[] {
  const tr = locale === "tr";
  const c = clauses(locale);
  const site = seller.website.replace(/^https?:\/\//, "");
  return [
    {
      title: tr ? "1. Taraflar" : "1. Parties",
      body: tr
        ? [
            `SATICI: Bilgileri yukarıda yer alan ${seller.name}.`,
            "ALICI: Ödeme sırasında adını, soyadını, e-posta adresini ve iletişim bilgilerini beyan eden kişi.",
          ]
        : [
            `SELLER: ${seller.name}, whose details are shown above.`,
            "BUYER: The person who provides their name, e-mail address and contact details during payment.",
          ],
    },
    {
      title: tr ? "2. Konu" : "2. Subject",
      body: tr
        ? `Bu sözleşmenin konusu, alıcının ${site} sitesi üzerinden elektronik ortamda satın aldığı online danışmanlık hizmetinin satışı ve ifasına ilişkin olarak, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca tarafların hak ve yükümlülüklerinin belirlenmesidir.`
        : `This agreement sets out the rights and obligations of the parties regarding the sale and performance of the online consulting service bought electronically on ${site}, under Turkish Consumer Protection Law No. 6502 and the Distance Contracts Regulation.`,
    },
    { title: tr ? "3. Hizmet ve bedel" : "3. Service and price", body: [c.service, c.price] },
    { title: tr ? "4. Ödeme" : "4. Payment", body: c.payment },
    { title: tr ? "5. İfa ve teslimat" : "5. Performance and delivery", body: c.delivery },
    {
      title: tr ? "6. Tarafların yükümlülükleri" : "6. Obligations of the parties",
      body: tr
        ? [
            "Satıcı, hizmeti özenle ve kararlaştırılan sürede sunmakla yükümlüdür.",
            "Alıcı, iletişim bilgilerini doğru vermekle ve planlanan görüşmeye zamanında katılmakla yükümlüdür. Danışmanlık bilgilendirme niteliğindedir; bu bilgilere dayanarak alınan kararlar alıcıya aittir.",
          ]
        : [
            "The seller shall provide the service with due care and within the agreed time.",
            "The buyer shall give accurate contact details and attend the scheduled session on time. The consulting is advisory; decisions taken on the basis of it remain the buyer's.",
          ],
    },
    { title: tr ? "7. Cayma hakkı" : "7. Right of withdrawal", body: c.withdrawal },
    { title: tr ? "8. İptal ve iade" : "8. Cancellation and refund", body: [c.cancellation, c.refund] },
    {
      title: tr ? "9. Kişisel veriler" : "9. Personal data",
      body: tr
        ? "Alıcının kişisel verileri, Gizlilik Politikası ve 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında yalnızca hizmetin sunulması ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir."
        : "The buyer's personal data is processed under the Privacy Policy and Turkish Data Protection Law No. 6698, only to provide the service and meet legal obligations.",
    },
    { title: tr ? "10. Uyuşmazlıklar" : "10. Disputes", body: c.complaints },
    {
      title: tr ? "11. Yürürlük" : "11. Entry into force",
      body: tr
        ? "Alıcı, ödemeyi tamamlamadan önce Ön Bilgilendirme Formu'nu ve bu sözleşmeyi okuyup elektronik ortamda onayladığında sözleşme kurulmuş sayılır. Satıcı, sözleşmenin kurulduğunu alıcıya e-posta ile teyit eder."
        : "The agreement is concluded when the buyer reads and electronically accepts the Pre-Information Form and this agreement before completing payment. The seller confirms the agreement to the buyer by e-mail.",
    },
  ];
}

export function cancellationRefundSections(locale: string): Section[] {
  const tr = locale === "tr";
  const c = clauses(locale);
  return [
    { title: tr ? "Teslimat" : "Delivery", body: c.delivery },
    { title: tr ? "Cayma hakkı" : "Right of withdrawal", body: c.withdrawal },
    { title: tr ? "İptal" : "Cancellation", body: c.cancellation },
    {
      title: tr ? "İade süreci" : "Refund process",
      body: [
        c.refund,
        tr
          ? "İade talebi için iletişim formundan adınızı ve ödeme tarihini yazmanız yeterlidir."
          : "To request a refund, send your name and the payment date through the contact form.",
      ],
    },
    { title: tr ? "Şikâyet ve uyuşmazlıklar" : "Complaints and disputes", body: c.complaints },
  ];
}
