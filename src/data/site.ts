export const site = {
  name: "Corpoceleste",
  tagline: "Serigrafie d’autore",
  email: "info@corpoceleste.eu",
  instagram: "https://www.instagram.com/cccorpocelesteee/",
  corpoc: "https://ccoorrppoocc.wordpress.com/",
  ultrastruttura: "https://ultrastruttura.com/",
  /** Vecchi progetti (pagina Contatti). */
  satellite: "https://www.instagram.com/satellitepress/",
  tddDiscogs: "https://www.discogs.com/search/?q=TDD&type=label",
  /** Giorni lavorativi indicativi per la spedizione (info precontrattuale). */
  shippingDays: "5",
  /** Ragione sociale / ditta per le pagine legali. */
  legalName: "Andrea Baldelli Lorenzo",
  /** Intestatario IBAN / titolare. */
  intestatario: "Andrea Baldelli Lorenzo",
  /** Public business identifiers (legal/checkout) — not secrets. */
  iban: "IT02C03268223000EM002734005",
  /** Codice destinatario SDI (fatturazione elettronica). */
  sdiCode: "BA6ET11",
  /** PEC. */
  pec: "andrealorenzobaldelli@pec.it",
  /**
   * Email conto PayPal Business (riferimento). Il checkout usa solo il Client ID (SDK).
   */
  paypalEmail: "baldellimtt@gmail.com",
  /**
   * PayPal Client ID (public by design). Secret: PAYPAL_CLIENT_SECRET on Vercel only.
   */
  paypalClientId:
    "BAAM0t3KcdroiWYnkmi328SdvzTkYVhsGK9W2sRAOgmXuAF0cP8B7bPs-Pu7EJGvMRRxhLyteIrIUMyd-I",
  /**
   * URL del progetto Vercel (senza slash finale), es. https://corpoceleste-xxxx.vercel.app
   * Se vuoto, bonifico e recesso restano su FormSubmit. Con URL: mail transazionali da Vercel.
   */
  formApi: "https://corpoceleste.vercel.app",
  sede: "Nembro (BG), Italia",
  /** Indirizzo completo della sede: obbligatorio nelle info precontrattuali. */
  indirizzo: "Via Moroni 51, Lonno, 24027 Nembro (BG), Italia",
  /** Partita IVA. */
  vatId: "IT04952110163",
  /** Numero REA / iscrizione Registro imprese, se presente. */
  rea: "",
  /** Telefono di contatto, se lo pubblichi. */
  telefono: "",
  sizes: ["S", "M", "L", "XL", "XXL"] as const,
  /**
   * Fallback tabella taglie se il prodotto non ha `fitModel`.
   * Preferisci content/fit-models/*.md (Tina → Modelli capo).
   * chest = A larghezza (½ petto). length = B lunghezza. sleeve opzionale.
   * Fonte misure: guida T-shirt FareTessile (cotone regular).
   */
  sizeChart: [
    { size: "S", chest: 49, length: 70, sleeve: 0 },
    { size: "M", chest: 51, length: 71, sleeve: 0 },
    { size: "L", chest: 54, length: 73, sleeve: 0 },
    { size: "XL", chest: 57, length: 75, sleeve: 0 },
    { size: "XXL", chest: 59, length: 77, sleeve: 0 },
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
