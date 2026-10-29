/** Pure parse of product markdown frontmatter (stock / status / price / sizes). */

import { parseProductStatus, type ProductStatus } from "./product-status.js";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

export type ProductFrontmatterCore = {
  title: string;
  price: number;
  status: ProductStatus;
  sizes: string[];
  stock: Record<string, number>;
};

export function parseSizes(raw: unknown): string[] {
  const sizes = Array.isArray(raw) ? raw.map((x) => String(x)) : [...DEFAULT_SIZES];
  return sizes.length ? sizes : [...DEFAULT_SIZES];
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

/** Core commerce fields from gray-matter `data` (or live_stock JSON). */
export function parseProductFrontmatter(
  data: Record<string, unknown>,
  fallbackTitle = "",
): ProductFrontmatterCore {
  const sizes = parseSizes(data.sizes);
  return {
    title: String(data.title ?? fallbackTitle),
    price: Number(data.price ?? 0),
    status: parseProductStatus(data.status),
    sizes,
    stock: stockFromProductData(data, sizes),
  };
}
