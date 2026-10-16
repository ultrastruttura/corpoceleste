/** Tina overrides for legal / payment fields (Astro/client only — not for Vercel APIs). */

import { site } from "./site";
import { siteSettings } from "./settings";

/** Merged shop identity for pages (vendita, checkout, privacy). */
export const commerce = {
  legalName: siteSettings.legalName || site.legalName,
  intestatario: siteSettings.intestatario || site.intestatario,
  iban: siteSettings.iban || site.iban,
  vatId: siteSettings.vatId || site.vatId,
  rea: siteSettings.rea || site.rea,
  telefono: siteSettings.telefono || site.telefono,
  indirizzo: siteSettings.indirizzo || site.indirizzo,
  pec: siteSettings.pec || site.pec,
  sdiCode: siteSettings.sdiCode || site.sdiCode,
  paypalClientId: siteSettings.paypalClientId || site.paypalClientId,
  formApi: (siteSettings.formApi || site.formApi).replace(/\/$/, ""),
  shippingDays: site.shippingDays,
  sede: site.sede,
};

export function commerceApiBase() {
  return commerce.formApi;
}
