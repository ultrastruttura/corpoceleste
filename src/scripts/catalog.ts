import {
  isPurchasableStatus,
  maxQtyForStatus,
  sizeSellable,
  type ProductStatus,
} from "../lib/product-status";

export type CatalogProduct = {
  id: string;
  title: string;
  artistName: string;
  kind?: string;
  sizes: string[];
  stock: Record<string, number>;
  price: number;
  status: ProductStatus;
  print: string;
  imageAlt: string;
};

export function catalogHasSizes(p: CatalogProduct) {
  return (p.kind ?? "shirt") === "shirt";
}

declare global {
  interface Window {
    __catalog?: { products: CatalogProduct[] };
  }
}

/** Parse `#cc-catalog` into `window.__catalog`. Safe to call more than once. */
export function hydrateCatalog() {
  const node = document.getElementById("cc-catalog");
  if (!node?.textContent) return;
  try {
    const data = JSON.parse(node.textContent) as { products?: unknown };
    if (data && typeof data === "object") {
      window.__catalog = data as typeof window.__catalog;
    }
  } catch {
    /* keep empty catalog */
  }
}

export function catalogProducts(): CatalogProduct[] {
  return window.__catalog?.products ?? [];
}

export function catalogProduct(id: string) {
  return catalogProducts().find((p) => p.id === id);
}

export function catalogStock(p: CatalogProduct, size: string) {
  const n = Number(p.stock?.[size]);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function catalogMaxQty(p: CatalogProduct, size: string) {
  return maxQtyForStatus(p.status, catalogStock(p, size));
}

export function catalogSizeInStock(p: CatalogProduct, size: string) {
  return sizeSellable(p.status, catalogStock(p, size));
}

/** Total units across listed sizes (or all stock keys). */
export function catalogTotalStock(p: CatalogProduct) {
  const sizes = p.sizes?.length ? p.sizes : Object.keys(p.stock || {});
  return sizes.reduce((sum, size) => sum + catalogStock(p, size), 0);
}

export function catalogInStock(p: CatalogProduct) {
  if (!isPurchasableStatus(p.status)) return false;
  const sizes = p.sizes?.length ? p.sizes : Object.keys(p.stock || {});
  return sizes.some((size) => catalogSizeInStock(p, size));
}

/** Low-stock badge: purchasable and total units ≤ threshold. */
export function catalogIsLowStock(p: CatalogProduct, threshold: number) {
  if (!catalogInStock(p)) return false;
  const limit = Math.floor(Number(threshold));
  if (!Number.isFinite(limit) || limit < 1) return false;
  return catalogTotalStock(p) <= limit;
}

/** Merge live GitHub stock into the build-time catalog (checkout / cart). */
export function applyLiveStock(
  live: Array<{ id: string; stock: Record<string, number>; status?: string; price?: number }>,
) {
  const catalog = window.__catalog;
  if (!catalog?.products?.length || !live?.length) return;
  const byId = new Map(live.map((p) => [p.id, p]));
  for (const p of catalog.products) {
    const row = byId.get(p.id);
    if (!row) continue;
    p.stock = { ...p.stock, ...row.stock };
    if (row.status === "available" || row.status === "preorder" || row.status === "soldout") {
      p.status = row.status;
    }
    if (Number.isFinite(row.price) && (row.price as number) > 0) {
      p.price = row.price as number;
    }
  }
}
