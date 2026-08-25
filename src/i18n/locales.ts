export const locales = ["it", "en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "it";

export const localeNames: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  de: "Deutsch",
};

export const localeCodes: Record<Locale, string> = {
  it: "IT",
  en: "EN",
  de: "DE",
};

export function isLocale(value: string | undefined): value is Locale {
  return value === "it" || value === "en" || value === "de";
}

export function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `${locale}/`;
}

export const paypalSdkLocale: Record<Locale, string> = {
  it: "it_IT",
  en: "en_US",
  de: "de_DE",
};

export const paypalLc: Record<Locale, string> = {
  it: "IT",
  en: "US",
  de: "DE",
};
