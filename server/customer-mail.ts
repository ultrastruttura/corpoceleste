import { nowRome, siteBase } from "./mail.js";
import type { ShopIdentity } from "./shop-identity.js";

/** Best guess for PayPal orders, which carry no site locale: ship-to country. */
export function localeForCountry(country: string | undefined) {
  const c = String(country || "").toUpperCase();
  if (c === "IT" || c === "SM" || c === "VA") return "it";
  if (c === "DE" || c === "AT" || c === "LI") return "de";
  return "en";
}

function legalFooter(locale: string) {
  const site = siteBase();
  if (locale === "en") {
    return [
      "You have 14 days from delivery to withdraw without giving a reason.",
      `Online withdrawal: ${site}/en/recesso/`,
      `Terms of sale, returns and 2-year legal guarantee: ${site}/en/vendita/`,
    ].join("\n");
  }
  if (locale === "de") {
    return [
      "Du hast 14 Tage ab Lieferung Zeit, ohne Angabe von Gründen zu widerrufen.",
      `Online-Widerruf: ${site}/de/recesso/`,
      `Verkaufsbedingungen, Rückgabe und 2-jährige Gewährleistung: ${site}/de/vendita/`,
    ].join("\n");
  }
  return [
    "Hai 14 giorni dalla consegna per recedere senza motivo.",
    `Recesso online: ${site}/recesso/`,
    `Condizioni di vendita, resi e garanzia legale di 2 anni: ${site}/vendita/`,
  ].join("\n");
}

/** Seller identity + model withdrawal form (Codice del consumo, all. I parte B) — required in the durable-medium confirmation. */
function sellerAndForm(locale: string, id: ShopIdentity) {
  const email = (process.env.SHOP_EMAIL || "").trim() || "info@corpoceleste.eu";
  const seller = [
    id.legalName,
    id.indirizzo,
    id.vatId && (locale === "de" ? `USt-IdNr. ${id.vatId}` : locale === "en" ? `VAT ${id.vatId}` : `P. IVA ${id.vatId}`),
    id.pec && `PEC ${id.pec}`,
    email,
  ].filter(Boolean);
  const to = `${id.legalName}, ${id.indirizzo}, ${email}`;
  if (locale === "en") {
    return [
      "Seller",
      ...seller,
      "",
      "Model withdrawal form (fill in and return only if you wish to withdraw)",
      `To: ${to}`,
      "I hereby give notice that I withdraw from my contract of sale of the following goods: ______",
      "Ordered on / received on: ______",
      "Name of consumer: ______",
      "Address of consumer: ______",
      "Signature (only if this form is sent on paper): ______",
      "Date: ______",
    ];
  }
  if (locale === "de") {
    return [
      "Verkäufer",
      ...seller,
      "",
      "Muster-Widerrufsformular (nur ausfüllen und zurücksenden, wenn du widerrufen willst)",
      `An: ${to}`,
      "Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über den Kauf der folgenden Waren: ______",
      "Bestellt am / erhalten am: ______",
      "Name des Verbrauchers: ______",
      "Anschrift des Verbrauchers: ______",
      "Unterschrift (nur bei Mitteilung auf Papier): ______",
      "Datum: ______",
    ];
  }
  return [
    "Venditore",
    ...seller,
    "",
    "Modulo tipo di recesso (compilalo e rispediscilo solo se vuoi recedere)",
    `Destinatario: ${to}`,
    "Con la presente notifico il recesso dal mio contratto di vendita dei seguenti beni: ______",
    "Ordinato il / ricevuto il: ______",
    "Nome del consumatore: ______",
    "Indirizzo del consumatore: ______",
    "Firma (solo se il modulo è inviato su carta): ______",
    "Data: ______",
  ];
}

export function customerOrderText(opts: {
  locale?: string;
  metodo: string;
  ordine: string;
  identity: ShopIdentity;
  /** First line; defaults to the localized "order confirmation". */
  heading?: string;
  when?: string;
}) {
  const locale = opts.locale || "it";
  const when = opts.when || nowRome(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "it-IT");
  if (locale === "en") {
    return [
      opts.heading || "Order confirmation — Corpoceleste",
      `Date and time: ${when}`,
      `Payment: ${opts.metodo}`,
      "",
      opts.ordine,
      "",
      legalFooter("en"),
      "",
      ...sellerAndForm("en", opts.identity),
      "",
      "Keep this email: it is your confirmation on a durable medium.",
    ].join("\n");
  }
  if (locale === "de") {
    return [
      opts.heading || "Bestellbestätigung — Corpoceleste",
      `Datum und Uhrzeit: ${when}`,
      `Zahlung: ${opts.metodo}`,
      "",
      opts.ordine,
      "",
      legalFooter("de"),
      "",
      ...sellerAndForm("de", opts.identity),
      "",
      "Bewahre diese E-Mail auf: sie ist deine Bestätigung auf einem dauerhaften Datenträger.",
    ].join("\n");
  }
  return [
    opts.heading || "Conferma d’ordine — Corpoceleste",
    `Data e ora: ${when}`,
    `Pagamento: ${opts.metodo}`,
    "",
    opts.ordine,
    "",
    legalFooter("it"),
    "",
    ...sellerAndForm("it", opts.identity),
    "",
    "Conserva questa email: è la conferma d’ordine su supporto durevole.",
  ].join("\n");
}

/** Not a "confirmation": for bank transfer the contract is concluded only when the money arrives. */
export function bankOrderSubject(locale: string, orderRef: string) {
  if (locale === "en") return `Order ${orderRef} received — bank transfer details — Corpoceleste`;
  if (locale === "de") return `Bestellung ${orderRef} erhalten — Überweisungsdaten — Corpoceleste`;
  return `Ordine ${orderRef} ricevuto — dati per il bonifico — Corpoceleste`;
}

/** Bank-transfer order request with IBAN + payment reference (causale). */
export function customerBankOrderText(opts: {
  locale?: string;
  ordine: string;
  orderRef: string;
  identity: ShopIdentity;
  total: string;
  /** Optional breakdown — same Sendcloud quote as PayPal checkout. */
  merchandise?: string;
  shipping?: string;
  when?: string;
}) {
  const locale = opts.locale || "it";
  const when = opts.when || nowRome(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "it-IT");
  const amountLine =
    opts.merchandise && opts.shipping
      ? locale === "en"
        ? `Amount: ${opts.total} € (goods ${opts.merchandise} € + shipping ${opts.shipping} €)`
        : locale === "de"
          ? `Betrag: ${opts.total} € (Ware ${opts.merchandise} € + Versand ${opts.shipping} €)`
          : `Importo: ${opts.total} € (merce ${opts.merchandise} € + spedizione ${opts.shipping} €)`
      : locale === "en"
        ? `Amount: ${opts.total} €`
        : locale === "de"
          ? `Betrag: ${opts.total} €`
          : `Importo: ${opts.total} €`;
  const payBlock =
    locale === "en"
      ? [
          "Bank transfer details",
          `IBAN: ${opts.identity.iban}`,
          `Account holder: ${opts.identity.intestatario}`,
          amountLine,
          `Payment reference (required): ${opts.orderRef}`,
          "",
          "The contract is concluded when the payment arrives. Until then the piece is not reserved: if it sells out first I tell you and, if you have already paid, refund you in full.",
        ]
      : locale === "de"
        ? [
            "Überweisungsdaten",
            `IBAN: ${opts.identity.iban}`,
            `Kontoinhaber: ${opts.identity.intestatario}`,
            amountLine,
            `Verwendungszweck (pflicht): ${opts.orderRef}`,
            "",
            "Der Vertrag kommt mit Zahlungseingang zustande. Bis dahin ist das Stück nicht reserviert: ist es vorher ausverkauft, sage ich dir Bescheid und erstatte bereits Gezahltes vollständig.",
          ]
        : [
            "Dati per il bonifico",
            `IBAN: ${opts.identity.iban}`,
            `Intestatario: ${opts.identity.intestatario}`,
            amountLine,
            `Causale (obbligatoria): ${opts.orderRef}`,
            "",
            "Il contratto si conclude quando arriva il pagamento. Fino ad allora il pezzo non è riservato: se si esaurisce prima ti avviso e, se hai già pagato, ti rimborso per intero.",
          ];

  return customerOrderText({
    locale,
    metodo: locale === "en" ? "Bank transfer" : locale === "de" ? "Überweisung" : "Bonifico",
    ordine: [opts.ordine, "", ...payBlock].join("\n"),
    identity: opts.identity,
    heading: bankOrderSubject(locale, opts.orderRef),
    when,
  });
}

export function customerWithdrawalText(opts: {
  locale?: string;
  name: string;
  orderRef: string;
  received?: string;
  note?: string;
  when: string;
}) {
  const locale = opts.locale || "it";
  const extra = [
    opts.name && (locale === "en" ? `Name: ${opts.name}` : locale === "de" ? `Name: ${opts.name}` : `Nome: ${opts.name}`),
    opts.orderRef &&
      (locale === "en"
        ? `Order: ${opts.orderRef}`
        : locale === "de"
          ? `Bestellung: ${opts.orderRef}`
          : `Ordine: ${opts.orderRef}`),
    opts.received &&
      (locale === "en"
        ? `Delivery date indicated: ${opts.received}`
        : locale === "de"
          ? `Angegebenes Lieferdatum: ${opts.received}`
          : `Data di consegna indicata: ${opts.received}`),
    opts.note &&
      (locale === "en" ? `Notes: ${opts.note}` : locale === "de" ? `Anmerkungen: ${opts.note}` : `Note: ${opts.note}`),
  ].filter(Boolean) as string[];

  if (locale === "en") {
    return [
      "Acknowledgement of withdrawal — Corpoceleste",
      `Date and time of transmission: ${opts.when}`,
      "",
      "We have received your notice of withdrawal from the contract of sale of the goods indicated below, under art. 52 of the Italian Consumer Code.",
      "",
      ...extra,
      "",
      "You have 14 days from this notice to send the item back; return shipping is at your cost.",
      legalFooter("en"),
    ].join("\n");
  }
  if (locale === "de") {
    return [
      "Empfangsbestätigung des Widerrufs — Corpoceleste",
      `Datum und Uhrzeit der Übermittlung: ${opts.when}`,
      "",
      "Wir haben deine Widerrufserklärung zum Kaufvertrag über die unten angegebenen Waren gemäß Art. 52 des italienischen Verbrauchergesetzbuchs erhalten.",
      "",
      ...extra,
      "",
      "Du hast 14 Tage ab dieser Mitteilung, um das Stück zurückzuschicken; die Rücksendekosten trägst du.",
      legalFooter("de"),
    ].join("\n");
  }
  return [
    "Avviso di ricevimento del recesso — Corpoceleste",
    `Data e ora di trasmissione: ${opts.when}`,
    "",
    "Ho ricevuto la tua dichiarazione di recesso dal contratto di vendita dei beni sotto indicati, ai sensi dell’art. 52 del Codice del consumo.",
    "",
    ...extra,
    "",
    "Hai 14 giorni da questa comunicazione per rispedire il pezzo; il costo del reso è a tuo carico.",
    legalFooter("it"),
  ].join("\n");
}
