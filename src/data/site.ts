export const site = {
  name: "Corpoceleste",
  tagline: "Serigrafia d’artista",
  email: "info@corpoceleste.eu",
  instagram: "https://www.instagram.com/ultrastruttura/",
  facebook: "https://www.facebook.com/ultrastruttura",
  corpoc: "https://ccoorrppoocc.wordpress.com/",
  ultrastruttura: "https://ultrastruttura.com/",
  /** Vecchi progetti (pagina Contatti). */
  satellite: "https://web.archive.org/web/20161107120751/http://satellitepress.it/",
  tddDiscogs: "https://www.discogs.com/search/?q=TDD&type=label",
  /** Legacy UI fallback; checkout usa Packlink (paese + codice postale UE). */
  shippingItaly: 0,
  shippingEU: 0,
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
  formApi: "https://corpoceleste.vercel.app",
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

export function formEndpoint(kind: "order" | "withdrawal" | "form") {
  const base = site.formApi.replace(/\/$/, "");
  return base ? `${base}/api/${kind}` : "";
}

/** Contact / newsletter / workshops / consulting / reprint. Falls back to FormSubmit. */
export function publicFormAction(shopEmail: string) {
  return formEndpoint("form") || `https://formsubmit.co/${shopEmail}`;
}

/** Base URL for Vercel APIs (orders, portal). Empty = not configured. */
export function apiBase() {
  return site.formApi.replace(/\/$/, "");
}

export function accountApi(path: string) {
  const base = apiBase();
  if (!base) return "";
  return `${base}/api/account/${path.replace(/^\//, "")}`;
}

export type Site = typeof site;
