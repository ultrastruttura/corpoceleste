/** Product catalog from GitHub (live stock/prices for PayPal APIs). */

import matter from "gray-matter";
import { parseProductFrontmatter } from "../src/lib/product-frontmatter.js";
import { isPurchasableStatus, type ProductStatus } from "../src/lib/product-status.js";
import { getRepoFile } from "./github-stock.js";
import { getRuntimeStockMap } from "./stock/runtime-stock.js";

export type CatalogProduct = {
  id: string;
  title: string;
  price: number;
  status: ProductStatus;
  sizes: string[];
  stock: Record<string, number>;
};

export { isPurchasableStatus };

export async function loadCatalogProduct(id: string): Promise<CatalogProduct | null> {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe || safe !== id) return null;
  const file = await getRepoFile(`content/products/${safe}.md`);
  if (!file) return null;
  const { data } = matter(file.content);
  const core = parseProductFrontmatter(data as Record<string, unknown>, safe);
  const overlay = await getRuntimeStockMap(safe, core.stock);
  const stock = { ...core.stock };
  for (const [size, qty] of Object.entries(overlay)) {
    stock[size] = qty;
  }
  return {
    id: safe,
    title: core.title,
    price: core.price,
    status: core.status,
    sizes: core.sizes,
    stock,
  };
}
