import matter from "gray-matter";
import type { Locale } from "../i18n/locales";

export type Localized = { it: string; en: string; de: string };

export type Artist = {
  id: string;
  slug: string;
  name: string;
  /** Override for A–Z letter / order (e.g. Fritsch). Empty = first word of name. */
  sortAs: string;
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

/**
 * Chiave A–Z per elenco artisti.
 * Default: prima parola (nome d’arte: Lapis Niger → L, Dottor Pira → D).
 * Persona nome+cognome: imposta `sortAs` al cognome (Rudy Fritsch → Fritsch → F).
 */
export function artistSortKey(name: string, sortAs = "") {
  const override = sortAs.trim();
  if (override) return override;
  let n = name.trim();
  if (/\s&\s/.test(n)) n = n.split(/\s&\s/)[0].trim();
  const parts = n.split(/\s+/).filter(Boolean);
  // Solo "Dr." inglese come rumore; "Dottor" resta (Dottor Pira → D).
  const cleaned = parts.filter((p) => !/^dr\.?$/i.test(p));
  return cleaned[0] || n;
}

export function artistSortKeyFor(artist: Pick<Artist, "name" | "sortAs">) {
  return artistSortKey(artist.name, artist.sortAs);
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
      sortAs: String(data.sortAs ?? "").trim(),
      bio: asLocalized(data.bio),
      seoDescription: asLocalized(data.seoDescription),
      instagram: data.instagram ? String(data.instagram) : undefined,
    };
  })
  .sort((a, b) =>
    artistSortKeyFor(a).localeCompare(artistSortKeyFor(b), "it", { sensitivity: "base" }),
  );

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
