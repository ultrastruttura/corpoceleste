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
  return Math.min(99, catalogStock(p, size));
}

export function catalogSizeInStock(p: CatalogProduct, size: string) {
  return catalogStock(p, size) > 0;
}
