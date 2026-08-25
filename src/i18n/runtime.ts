import { ui, type Ui } from "./dict";
import { defaultLocale, isLocale, type Locale } from "./locales";

export function currentLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function t(locale: string | undefined): Ui {
  return ui[currentLocale(locale)];
}

export function thanksMessage(locale: Locale, from: string) {
  const copy = ui[locale].thanks;
  const map: Record<string, { title: string; body: string; order?: boolean }> = {
    contatto: { title: copy.received, body: copy.contact },
    newsletter: { title: copy.received, body: copy.newsletter },
    ristampa: { title: copy.received, body: copy.reprint },
    consulenza: { title: copy.received, body: copy.contact },
    corsi: { title: copy.received, body: copy.waitlist },
    workshop: { title: copy.received, body: copy.contact },
    ordine: { title: copy.order, body: copy.bank, order: true },
    paypal: { title: copy.order, body: copy.paypal, order: true },
    form: { title: copy.received, body: "" },
  };
  return map[from] ?? map.form;
}

export function formatDate(iso: string, locale: Locale) {
  const tag = locale === "en" ? "en-GB" : locale === "de" ? "de-DE" : "it-IT";
  return new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
