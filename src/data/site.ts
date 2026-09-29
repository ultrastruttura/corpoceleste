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
};

export type Site = typeof site;
