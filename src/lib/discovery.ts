/** Shared “what AI / search should see” filters — placeholders stay out of llms.txt and sitemap. */

import { artists, type Artist } from "../data/artists";
import {
  productDescription,
  productSeoDescription,
  products,
  type Product,
} from "../data/products";

const PLACEHOLDER_RE =
  /placeholder|platzhalter|in aggiornamento|coming soon|Inhalt folgt|scheda artista\s*\d|artist\s*\d\s+profile|Künstler\s*\d|Artista\s*\d/i;

export function isPlaceholderCopy(text: string) {
  return PLACEHOLDER_RE.test(text);
}

export function isPlaceholderProduct(product: Product) {
  if (/^(Maglia|Stampa|Shirt|Print)\s*\d+$/i.test(product.title.trim())) return true;
  const blob = [
    product.title,
    productSeoDescription(product, "it"),
    productDescription(product, "it"),
    productSeoDescription(product, "en"),
    productDescription(product, "en"),
  ].join(" ");
  return isPlaceholderCopy(blob);
}

export function isPlaceholderArtist(artist: Artist) {
  if (/^Artista\s*\d+$/i.test(artist.name.trim())) return true;
  const blob = [
    artist.name,
    artist.bio.it,
    artist.bio.en,
    artist.seoDescription.it,
    artist.seoDescription.en,
  ].join(" ");
  return isPlaceholderCopy(blob);
}

/** Real catalogue rows for discovery (any status except empty CMS stubs). */
export function discoveryProducts() {
  return products.filter((p) => !isPlaceholderProduct(p));
}

export function discoveryArtists() {
  return artists.filter((a) => !isPlaceholderArtist(a));
}

/** Path fragments to drop from the XML sitemap (locale-agnostic). */
export function discoverySitemapBlockFragments() {
  const out: string[] = [];
  for (const p of products) {
    if (isPlaceholderProduct(p)) out.push(`/prodotto/${p.slug}/`);
  }
  for (const a of artists) {
    if (isPlaceholderArtist(a)) out.push(`/artisti/${a.slug}/`);
  }
  return out;
}
