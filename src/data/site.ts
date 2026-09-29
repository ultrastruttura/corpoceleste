export const site = {
  name: "Corpoceleste",
  tagline: "Serigrafia d’artista",
  email: "info@corpoceleste.com",
  instagram: "https://www.instagram.com/ultrastruttura/",
  facebook: "https://www.facebook.com/ultrastruttura",
  corpoc: "https://ccoorrppoocc.wordpress.com/",
  ultrastruttura: "https://ultrastruttura.com/",
  shippingItaly: 8,
  shippingEU: 16,
  /** Giorni lavorativi indicativi per la spedizione (info precontrattuale). */
  shippingDays: "5",
  iban: "",
  intestatario: "Andrea Baldelli",
  /**
   * Email conto PayPal Business (riferimento). Il checkout usa solo il Client ID (SDK).
   */
  paypalEmail: "baldellimtt@gmail.com",
  /**
   * Client ID da developer.paypal.com (gratis).
   * Obbligatorio per mostrare PayPal in checkout e per magazzino/mail via webhook Vercel.
   */
  paypalClientId: "",
  /**
   * URL del progetto Vercel (senza slash finale), es. https://corpoceleste-xxxx.vercel.app
   * Se vuoto, bonifico e recesso restano su FormSubmit. Con URL: mail transazionali da Vercel.
   */
  formApi: "",
  sede: "Bergamo (BG), Italia",
  /** Indirizzo completo della sede: obbligatorio nelle info precontrattuali. */
  indirizzo: "",
  /** Partita IVA. Da compilare se vendi come professionista. */
  vatId: "",
  /** Numero REA / iscrizione Registro imprese, se presente. */
  rea: "",
  /** Telefono di contatto, se lo pubblichi. */
  telefono: "",
  sizes: ["S", "M", "L", "XL"] as const,
  /**
   * Misure in cm, capo disteso. Indicative finché non misuri i blank reali.
   * chest = ½ petto (ascella–ascella). length = spalla–orlo. sleeve = spalla–polsino.
   */
  sizeChart: [
    { size: "S", chest: 49, length: 69, sleeve: 20 },
    { size: "M", chest: 52, length: 72, sleeve: 21 },
    { size: "L", chest: 55, length: 74, sleeve: 22 },
    { size: "XL", chest: 58, length: 76, sleeve: 23 },
  ] as const,
};

export function formEndpoint(kind: "order" | "withdrawal") {
  const base = site.formApi.replace(/\/$/, "");
  return base ? `${base}/api/${kind}` : "";
}

export type Site = typeof site;
