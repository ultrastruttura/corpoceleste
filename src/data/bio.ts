import matter from "gray-matter";
import type { Locale } from "../i18n/locales";
import type { Localized } from "./artists";

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

const raw = import.meta.glob("../../content/bio/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const file = Object.values(raw)[0] ?? "";
const { data } = matter(file || "---\n---\n");

export const bioPage = {
  name: String(data.name ?? "Andrea Baldelli"),
  body: asLocalized(data.body),
  printTitle: asLocalized(data.printTitle),
  printBody: asLocalized(data.printBody),
  printCv: asLocalized(data.printCv),
  liveTitle: asLocalized(data.liveTitle),
  liveBody: asLocalized(data.liveBody),
};

export function bioField(
  field: Exclude<keyof typeof bioPage, "name">,
  locale: Locale,
) {
  const value = bioPage[field];
  return value[locale] || value.it || "";
}
