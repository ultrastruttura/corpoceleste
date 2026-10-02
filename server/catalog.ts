/** Product catalog from GitHub (live stock/prices for PayPal APIs). */

import matter from "gray-matter";
import { getRepoFile } from "./github-stock.js";

export type CatalogProduct = {
  id: string;
  title: string;
  price: number;
  status: "available" | "preorder" | "soldout";
  sizes: string[];
  stock: Record<string, number>;
};

export async function loadCatalogProduct(id: string): Promise<CatalogProduct | null> {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe || safe !== id) return null;
  const file = await getRepoFile(`content/products/${safe}.md`);
  if (!file) return null;
  const { data } = matter(file.content);
  const sizes = Array.isArray(data.sizes)
    ? data.sizes.map((x: unknown) => String(x))
    : ["S", "M", "L", "XL"];
  const resolved = sizes.length ? sizes : ["S", "M", "L", "XL"];
  const stock: Record<string, number> = {};
  const rawStock = data.stock && typeof data.stock === "object" ? (data.stock as Record<string, unknown>) : {};
  for (const size of resolved) {
    const n = Number(rawStock[size]);
    stock[size] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  const status =
    data.status === "soldout" ? "soldout" : data.status === "preorder" ? "preorder" : "available";
  return {
    id: safe,
    title: String(data.title ?? safe),
    price: Number(data.price ?? 0),
    status,
    sizes: resolved,
    stock,
  };
}

export function isPurchasableStatus(status: CatalogProduct["status"]) {
  return status === "available" || status === "preorder";
}
