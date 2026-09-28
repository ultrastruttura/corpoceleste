import matter from "gray-matter";
import type { Locale } from "../i18n/locales";

export type Localized = { it: string; en: string; de: string };

export type Artist = {
  id: string;
  slug: string;
  name: string;
  bio: Localized;
  seoDescription: Localized;
  instagram?: string;
};

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

const files = import.meta.glob("../../content/artists/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const artists: Artist[] = Object.entries(files)
  .map(([path, raw]) => {
    const { data } = matter(raw);
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    return {
      id: slug,
      slug,
      name: String(data.name ?? slug),
      bio: asLocalized(data.bio),
      seoDescription: asLocalized(data.seoDescription),
      instagram: data.instagram ? String(data.instagram) : undefined,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

export function artistById(id: string) {
  return artists.find((a) => a.id === id);
}

export function artistBySlug(slug: string) {
  return artists.find((a) => a.slug === slug);
}

export function artistName(id: string) {
  return artistById(id)?.name ?? id;
}

export function artistBio(artist: Artist, locale: Locale) {
  return artist.bio[locale] || artist.bio.it || "";
}

export function artistSeoDescription(artist: Artist, locale: Locale) {
  return artist.seoDescription[locale] || artist.seoDescription.it || artistBio(artist, locale);
}
