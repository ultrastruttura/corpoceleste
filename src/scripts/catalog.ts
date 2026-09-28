export type CatalogProduct = {
  id: string;
  title: string;
  artistName: string;
  sizes: string[];
};

declare global {
  interface Window {
    __catalog?: { products: CatalogProduct[] };
  }
}

export function catalogProducts(): CatalogProduct[] {
  return window.__catalog?.products ?? [];
}
