import { nowRome, siteBase } from "./mail.js";

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

export function customerOrderText(opts: {
  locale?: string;
  metodo: string;
  ordine: string;
  when?: string;
}) {
  const locale = opts.locale || "it";
  const when = opts.when || nowRome(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "it-IT");
  if (locale === "en") {
    return [
      "Order confirmation — Corpoceleste",
      `Date and time: ${when}`,
      `Payment: ${opts.metodo}`,
      "",
      opts.ordine,
      "",
      legalFooter("en"),
      "",
      "Keep this email: it is your confirmation on a durable medium.",
    ].join("\n");
  }
  if (locale === "de") {
    return [
      "Bestellbestätigung — Corpoceleste",
      `Datum und Uhrzeit: ${when}`,
      `Zahlung: ${opts.metodo}`,
      "",
      opts.ordine,
      "",
      legalFooter("de"),
      "",
      "Bewahre diese E-Mail auf: sie ist deine Bestätigung auf einem dauerhaften Datenträger.",
    ].join("\n");
  }
  return [
    "Conferma d’ordine — Corpoceleste",
    `Data e ora: ${when}`,
    `Pagamento: ${opts.metodo}`,
    "",
    opts.ordine,
    "",
    legalFooter("it"),
    "",
    "Conserva questa email: è la conferma d’ordine su supporto durevole.",
  ].join("\n");
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
