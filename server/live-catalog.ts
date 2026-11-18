/** Live product stock/price snapshot from GitHub Contents API. */

import matter from "gray-matter";
import { parseProductFrontmatter } from "../src/lib/product-frontmatter.js";
import { getRuntimeStockMap } from "./stock/runtime-stock.js";

export type LiveCatalogProduct = {
  id: string;
  title: string;
  /** On-hand qty after Turso overlay (orders / holds). */
  stock: Record<string, number>;
  /** Seed qty from Tina frontmatter (pre-sale baseline). */
  tinaStock: Record<string, number>;
  status: string;
  price: number;
  artistSlug: string;
};

function repoParts() {
  const full = process.env.GITHUB_REPO || "ultrastruttura/corpoceleste";
  const [owner, name] = full.split("/");
  return { owner, name, branch: process.env.GITHUB_BRANCH || "main" };
}

function artistSlugFromRef(ref: unknown): string {
  if (ref == null || ref === "") return "";
  const s = String(ref).trim();
  if (!s || s === "null" || s === "undefined") return "";
  const match = s.match(/artists\/([^/]+?)(?:\.md)?$/);
  return match?.[1] ?? s;
}

export async function listLiveCatalogProducts(): Promise<LiveCatalogProduct[]> {
  if (!(process.env.GITHUB_TOKEN || "").trim()) {
    throw new Error("GITHUB_TOKEN missing");
  }
  const { owner, name, branch } = repoParts();
  const listRes = await fetch(
    `https://api.github.com/repos/${owner}/${name}/contents/content/products?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!listRes.ok) throw new Error(`Could not list products (${listRes.status})`);
  const files = (await listRes.json()) as Array<{ name?: string; download_url?: string }>;
  const mdFiles = files.filter((f) => f.name?.endsWith(".md") && f.download_url);
  const products = await Promise.all(
    mdFiles.map(async (f) => {
      const id = String(f.name).replace(/\.md$/, "");
      const raw = await fetch(String(f.download_url)).then((r) => r.text());
      const { data } = matter(raw);
      const core = parseProductFrontmatter(data as Record<string, unknown>, id);
      const tinaStock = { ...core.stock };
      const overlay = await getRuntimeStockMap(id, core.stock);
      const stock = { ...core.stock };
      for (const [size, qty] of Object.entries(overlay)) {
        stock[size] = qty;
      }
      return {
        id,
        title: core.title || id,
        stock,
        tinaStock,
        status: core.status,
        price: core.price,
        artistSlug: artistSlugFromRef((data as Record<string, unknown>).artist),
      } satisfies LiveCatalogProduct;
    }),
  );
  return products;
}
