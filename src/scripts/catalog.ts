export type CatalogProduct = {
  id: string;
  title: string;
  artistName: string;
  sizes: string[];
  price: number;
  status: "available" | "preorder" | "soldout";
  print: string;
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
