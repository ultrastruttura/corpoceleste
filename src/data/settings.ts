import matter from "gray-matter";
import type { Locale } from "../i18n/locales";
import type { Localized } from "./artists";
import { site } from "./site";

function emptyLocalized(): Localized {
  return { it: "", en: "", de: "" };
}

function asLocalized(value: unknown): Localized {
  if (!value || typeof value !== "object") return emptyLocalized();
  const o = value as Record<string, unknown>;
  return {
    it: String(o.it ?? ""),
    en: String(o.en ?? ""),
    de: String(o.de ?? ""),
  };
}

const raw = import.meta.glob("../../content/settings/site.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const file = Object.values(raw)[0] ?? "";
const { data } = matter(file || "---\n---\n");

const shopEmailFromCms = String(data.shopEmail ?? "").trim();

export const siteSettings = {
  /** FormSubmit destination; falls back to `site.email` if empty in CMS. */
  shopEmail: shopEmailFromCms || site.email,
  metaDescription: asLocalized(data.metaDescription),
  homeTitle: asLocalized(data.homeTitle),
  homeLede: asLocalized(data.homeLede),
  /** Top promo bar. Off when disabled or text empty — toggle in Tina. */
  announcementEnabled: Boolean(data.announcementEnabled),
  announcementText: asLocalized(data.announcementText),
  announcementLink: String(data.announcementLink ?? "").trim(),
  ogImage: data.ogImage ? String(data.ogImage) : "",
  /** Umami Cloud website ID (public; empty = script off). */
  umamiWebsiteId: String(data.umamiWebsiteId ?? "").trim(),
  /**
   * Badge “in esaurimento” quando i pezzi totali ≤ questa soglia.
   * 0 = disattivato. Default 10.
   */
  lowStockThreshold: (() => {
    const n = Number(data.lowStockThreshold);
    if (!Number.isFinite(n) || n < 0) return 10;
    return Math.floor(n);
  })(),
  /** Commerce / legal overrides (empty = use fallbacks in site.ts). */
  iban: String(data.iban ?? "").trim(),
  intestatario: String(data.intestatario ?? "").trim(),
  legalName: String(data.legalName ?? "").trim(),
  vatId: String(data.vatId ?? "").trim(),
  pec: String(data.pec ?? "").trim(),
  sdiCode: String(data.sdiCode ?? "").trim(),
  telefono: String(data.telefono ?? "").trim(),
  rea: String(data.rea ?? "").trim(),
  indirizzo: String(data.indirizzo ?? "").trim(),
  paypalClientId: String(data.paypalClientId ?? "").trim(),
  formApi: String(data.formApi ?? "").trim(),
  /** Short blurb on Contatti only — full bio lives in content/bio. */
  andreaName: String(data.andreaName ?? "").trim() || "Andrea Baldelli",
  andreaBio: asLocalized(data.andreaBio),
};

export function localizedSetting(
  field: keyof Pick<
    typeof siteSettings,
    "metaDescription" | "homeTitle" | "homeLede" | "andreaBio" | "announcementText"
  >,
  locale: Locale,
) {
  const value = siteSettings[field];
  return value[locale] || value.it || "";
}
