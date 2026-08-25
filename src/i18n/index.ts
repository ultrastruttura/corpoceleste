import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from "astro:i18n";
import type { Locale } from "./locales";

export { ui } from "./dict";
export {
  defaultLocale,
  isLocale,
  localeCodes,
  localeNames,
  localePrefix,
  locales,
  paypalLc,
  paypalSdkLocale,
  type Locale,
} from "./locales";
export type { Ui } from "./dict";
export { currentLocale, formatDate, t, thanksMessage } from "./runtime";

export function pageUrl(locale: Locale, path = "") {
  const p = path.replace(/^\/+|\/+$/g, "");
  let href = getRelativeLocaleUrl(locale, p);
  if (!href.endsWith("/")) href += "/";
  return href;
}

export function pageAbs(locale: Locale, path = "") {
  const p = path.replace(/^\/+|\/+$/g, "");
  let href = getAbsoluteLocaleUrl(locale, p);
  if (!href.endsWith("/")) href += "/";
  return href;
}

export function switchLocaleUrl(pathname: string, target: Locale) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let rest = pathname;
  if (base && (rest === base || rest.startsWith(`${base}/`))) {
    rest = rest.slice(base.length) || "/";
  }
  rest = rest.replace(/^\/(en|de)(?=\/|$)/, "") || "/";
  return pageUrl(target, rest.replace(/^\/+|\/+$/g, ""));
}

export function innerPath(pathname: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let rest = pathname;
  if (base && (rest === base || rest.startsWith(`${base}/`))) {
    rest = rest.slice(base.length) || "/";
  }
  rest = rest.replace(/^\/(en|de)(?=\/|$)/, "") || "/";
  return rest.replace(/^\/+|\/+$/g, "");
}
