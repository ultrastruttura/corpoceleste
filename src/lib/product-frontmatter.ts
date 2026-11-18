/** Pure parse of product markdown frontmatter (stock / status / price / sizes). */

import { parseProductStatus, type ProductStatus } from "./product-status.js";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

/** Canonical garment order — Tina checkboxes often reshuffle YAML. */
const SIZE_RANK = new Map(
  ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "unica"].map((s, i) => [s, i]),
);

/** One-size key for print / shopper / edition (no garment sizes). */
export const ONE_SIZE = "unica";

export type ProductFrontmatterCore = {
  title: string;
  price: number;
  status: ProductStatus;
  sizes: string[];
  stock: Record<string, number>;
};

export function isSizedKind(kind: unknown): boolean {
  return String(kind ?? "shirt") === "shirt";
}

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ra = SIZE_RANK.get(a);
    const rb = SIZE_RANK.get(b);
    if (ra != null && rb != null) return ra - rb;
    if (ra != null) return -1;
    if (rb != null) return 1;
    return a.localeCompare(b, "it");
  });
}

export function parseSizes(raw: unknown): string[] {
  const sizes = Array.isArray(raw) ? raw.map((x) => String(x)) : [...DEFAULT_SIZES];
  if (!sizes.length) return [...DEFAULT_SIZES];
  return sortSizes(sizes);
}

export function parseStockMap(raw: unknown, sizes: string[]): Record<string, number> {
  const stock: Record<string, number> = {};
  const src =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  for (const size of sizes) {
    const n = Number(src[size]);
    stock[size] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  return stock;
}

/**
 * Prefer flat Tina fields (stockS…); fall back to nested `stock: { S: n }` for
 * older files and live GitHub stock patches.
 */
export function stockFromProductData(
  data: Record<string, unknown>,
  sizes: string[],
): Record<string, number> {
  const nested = parseStockMap(data.stock, sizes);
  const out: Record<string, number> = { ...nested };
  for (const size of sizes) {
    const flat = data[`stock${size}`];
    if (flat === undefined || flat === null || flat === "") continue;
    const n = Number(flat);
    if (Number.isFinite(n)) out[size] = Math.max(0, Math.floor(n));
  }
  for (const size of sizes) {
    if (out[size] === undefined) out[size] = 0;
  }
  return out;
}

function oneSizeStock(data: Record<string, unknown>): Record<string, number> {
  const nested =
    data.stock && typeof data.stock === "object" && !Array.isArray(data.stock)
      ? Number((data.stock as Record<string, unknown>)[ONE_SIZE])
      : NaN;
  const fromQty = Number(data.stockQty);
  const n = Number.isFinite(fromQty)
    ? fromQty
    : Number.isFinite(nested)
      ? nested
      : 0;
  return { [ONE_SIZE]: Math.max(0, Math.floor(n)) };
}

/** Core commerce fields from gray-matter `data` (or live_stock JSON). */
export function parseProductFrontmatter(
  data: Record<string, unknown>,
  fallbackTitle = "",
): ProductFrontmatterCore {
  if (!isSizedKind(data.kind)) {
    return {
      title: String(data.title ?? fallbackTitle),
      price: Number(data.price ?? 0),
      status: parseProductStatus(data.status),
      sizes: [ONE_SIZE],
      stock: oneSizeStock(data),
    };
  }
  const sizes = parseSizes(data.sizes);
  return {
    title: String(data.title ?? fallbackTitle),
    price: Number(data.price ?? 0),
    status: parseProductStatus(data.status),
    sizes,
    stock: stockFromProductData(data, sizes),
  };
}
