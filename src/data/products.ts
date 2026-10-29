import matter from "gray-matter";
import { parseProductFrontmatter } from "../lib/product-frontmatter";
import {
  isPurchasableStatus,
  maxQtyForStatus,
  sizeSellable,
  type ProductStatus,
} from "../lib/product-status";
import { artistName, artists } from "./artists";
import { fitModelIdFromRef } from "./fit-models";
import { ui } from "../i18n/dict";
import type { Locale } from "../i18n/locales";

export type { ProductStatus };

/** Forma dell’oggetto in vendita — guida alt immagine e (dopo) UI. */
export type ProductKind = "shirt" | "print" | "edition";

export type Localized = { it: string; en: string; de: string };

/** Pezzi a magazzino per taglia. Aggiornare a mano dopo ogni vendita. */
export type ProductStock = Partial<Record<string, number>>;

export type Product = {
  id: string;
  slug: string;
  title: string;
  artistId: string;
  price: number;
  nuovo?: boolean;
  createdAt: string;
  status: ProductStatus;
  kind: ProductKind;
  color: string;
  colorName: string;
  /** Composizione fibrosa, obbligatoria sui tessili (reg. UE 1007/2011). */
  composition: string;
  images: string[];
  /** First image path — kept for cart line thumbs */
  print: string;
  sizes: string[];
  stock: ProductStock;
  /** Fit-model id for size chart (`content/fit-models/<id>.md`). Empty = site fallback. */
  fitModelId: string;
  description: Localized;
  seoDescription: Localized;
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

function artistIdFromRef(ref: unknown): string {
  const s = String(ref ?? "");
  const match = s.match(/artists\/([^/]+?)(?:\.md)?$/);
  return match?.[1] ?? s;
}

function parseKind(raw: unknown): ProductKind {
  if (raw === "print" || raw === "edition") return raw;
  return "shirt";
}

export function isPurchasable(status: ProductStatus) {
  return isPurchasableStatus(status);
}

/** Pezzi disponibili per taglia (0 = esaurita). */
export function stockOf(product: Product, size: string) {
  const n = Number(product.stock[size]);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/** Pezzi totali ancora disponibili (tutte le taglie). */
export function totalStock(product: Product) {
  return product.sizes.reduce((sum, size) => sum + stockOf(product, size), 0);
}

/**
 * In esaurimento: acquistabile e pezzi totali ≤ soglia (Tina / settings).
 * Soglia ≤ 0 spegne il badge.
 */
export function isLowStock(product: Product, threshold: number) {
  if (!isInStock(product)) return false;
  const limit = Math.floor(Number(threshold));
  if (!Number.isFinite(limit) || limit < 1) return false;
  return totalStock(product) <= limit;
}

export function maxQtyFor(product: Product, size: string) {
  return maxQtyForStatus(product.status, stockOf(product, size));
}

export function sizeInStock(product: Product, size: string) {
  return sizeSellable(product.status, stockOf(product, size));
}

/** Almeno una taglia con pezzi > 0 e stato acquistabile. */
export function isInStock(product: Product) {
  if (!isPurchasable(product.status)) return false;
  return product.sizes.some((s) => sizeInStock(product, s));
}

const files = import.meta.glob("../../content/products/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const products: Product[] = Object.entries(files).map(([path, raw]) => {
  const { data } = matter(raw);
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  const core = parseProductFrontmatter(data as Record<string, unknown>, slug);
  const images = Array.isArray(data.images)
    ? data.images.map((x: unknown) => String(x)).filter(Boolean)
    : [];
  const created =
    data.createdAt instanceof Date
      ? data.createdAt.toISOString().slice(0, 10)
      : String(data.createdAt ?? "").slice(0, 10);

  return {
    id: slug,
    slug,
    title: core.title,
    artistId: artistIdFromRef(data.artist),
    price: core.price,
    nuovo: Boolean(data.nuovo),
    createdAt: created || "2017-01-01",
    status: core.status,
    kind: parseKind(data.kind),
    color: String(data.color ?? "#141414"),
    colorName: String(data.colorName ?? "Nero"),
    composition: String(data.composition ?? ""),
    images,
    print: images[0] ?? "",
    sizes: core.sizes,
    stock: core.stock,
    fitModelId: fitModelIdFromRef(data.fitModel),
    description: asLocalized(data.description),
    seoDescription: asLocalized(data.seoDescription),
  };
});

export function productBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

/** Acquistabili (available/preorder con stock). */
export function availableProducts() {
  return products.filter((p) => isInStock(p));
}

/** Esauriti / non in vendita. */
export function soldOutProducts() {
  return products.filter((p) => !isInStock(p));
}

export { artistName, artists };

export function formatPrice(n: number) {
  return `${n} €`;
}

export function productDescription(product: Product, locale: Locale) {
  return product.description[locale] || product.description.it || "";
}

export function productSeoDescription(product: Product, locale: Locale) {
  return (
    product.seoDescription[locale] ||
    product.seoDescription.it ||
    productDescription(product, locale)
  );
}

/**
 * Alt immagine prodotto (SEO + accessibilità):
 * preferisce seoDescription CMS; altrimenti template per tipo.
 * `index` > 0 = foto secondaria / miniatura galleria.
 */
export function productImageAlt(
  product: Product,
  artistLabel: string,
  locale: Locale,
  options?: { index?: number },
) {
  const { imageAlt, imageAltDetail } = ui[locale].product;
  const seo = productSeoDescription(product, locale)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.。]+$/, "");
  const base = seo || imageAlt(product.kind, product.title, artistLabel);
  const index = options?.index ?? 0;
  if (index > 0) return imageAltDetail(base, index + 1);
  return base;
}
