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
  iban: "IT00 X000 0000 0000 0000 0000 000",
  intestatario: "Andrea Baldelli",
  /** Email dell'account PayPal Business (gratis). Basta questa per accettare pagamenti. */
  paypalEmail: "baldellimtt@gmail.com",
  /**
   * Opzionale: Client ID da developer.paypal.com (gratis).
   * Se c'è, il bottone PayPal resta sulla pagina invece di reindirizzare.
   */
  paypalClientId: "",
  sede: "Bergamo (BG), Italia",
  vatId: "",
  sizes: ["S", "M", "L", "XL"] as const,
};

export type Site = typeof site;
