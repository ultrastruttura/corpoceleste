export type CatalogProduct = {
  id: string;
  title: string;
  artistName: string;
  sizes: string[];
  stock: Record<string, number>;
  price: number;
  status: "available" | "preorder" | "soldout";
  print: string;
  imageAlt: string;
};

declare global {
  interface Window {
    __catalog?: { products: CatalogProduct[] };
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
  if (p.status === "preorder") return 99;
  return Math.min(99, catalogStock(p, size));
}

export function catalogSizeInStock(p: CatalogProduct, size: string) {
  if (p.status === "preorder") return true;
  return catalogStock(p, size) > 0;
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
