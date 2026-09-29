export const site = {
  name: "Corpoceleste",
  tagline: "Maglie serigrafate",
  email: "info@corpoceleste.com",
  instagram: "https://www.instagram.com/ultrastruttura/",
  facebook: "https://www.facebook.com/ultrastruttura",
  corpoc: "https://ccoorrppoocc.wordpress.com/",
  ultrastruttura: "https://ultrastruttura.com/",
  shippingItaly: 8,
  shippingEU: 16,
  iban: "",
  intestatario: "Andrea Baldelli",
  /** Email dell'account PayPal Business (gratis). Basta questa per accettare pagamenti. */
  paypalEmail: "baldellimtt@gmail.com",
  /**
   * Client ID da developer.paypal.com (gratis).
   * Necessario per il bottone in-page e per lo sconto magazzino automatico (webhook Vercel).
   * Gli importi partono comunque dal catalogo buildato, non dai campi del browser.
   */
  paypalClientId: "",
  sede: "Bergamo (BG), Italia",
  vatId: "",
  sizes: ["S", "M", "L", "XL"] as const,
};

export type Site = typeof site;
