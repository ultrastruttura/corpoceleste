/** Live product stock/price snapshot from GitHub Contents API. */

import matter from "gray-matter";
import { parseProductFrontmatter } from "../src/lib/product-frontmatter.js";

export type LiveCatalogProduct = {
  id: string;
  title: string;
  stock: Record<string, number>;
  status: string;
  price: number;
};

function repoParts() {
  const full = process.env.GITHUB_REPO || "ultrastruttura/corpoceleste";
  const [owner, name] = full.split("/");
  return { owner, name, branch: process.env.GITHUB_BRANCH || "main" };
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
  const products: LiveCatalogProduct[] = [];
  for (const f of files) {
    if (!f.name?.endsWith(".md") || !f.download_url) continue;
    const id = f.name.replace(/\.md$/, "");
    const raw = await fetch(f.download_url).then((r) => r.text());
    const { data } = matter(raw);
    const core = parseProductFrontmatter(data as Record<string, unknown>, id);
    products.push({
      id,
      title: core.title || id,
      stock: core.stock,
      status: core.status,
      price: core.price,
    });
  }
  return products;
}
