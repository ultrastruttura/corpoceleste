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
  ogImage: data.ogImage ? String(data.ogImage) : "",
  andreaName: String(data.andreaName ?? "Andrea Baldelli"),
  andreaBio: asLocalized(data.andreaBio),
};

export function localizedSetting(
  field: keyof Pick<
    typeof siteSettings,
    "metaDescription" | "homeTitle" | "homeLede" | "andreaBio"
  >,
  locale: Locale,
) {
  const value = siteSettings[field];
  return value[locale] || value.it || "";
}
