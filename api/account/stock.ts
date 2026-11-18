import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listLiveCatalogProducts } from "../../server/live-catalog.js";
import { listDeals } from "../../server/portal/deals.js";
import { json, requireUser } from "../../server/portal/http.js";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "unica"];

function sizeRank(size: string) {
  const i = SIZE_ORDER.indexOf(size);
  return i >= 0 ? i : 100 + size.toLowerCase().charCodeAt(0);
}

function sortSizes(a: string, b: string) {
  const ra = sizeRank(a);
  const rb = sizeRank(b);
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b, "it");
}

function sumMap(map: Record<string, number>) {
  let n = 0;
  for (const v of Object.values(map)) n += Math.max(0, Math.floor(Number(v) || 0));
  return n;
}

/** Magazzino: Tina seed vs Turso live (post-ordini). Admin all; artist filtered. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

    const products = await listLiveCatalogProducts();

    let allowed: Set<string> | null = null;
    let artistSlug = "";
    if (user.role === "artist") {
      artistSlug = (user.artist_slug || "").trim();
      const deals = await listDeals(user.id);
      allowed = new Set(deals.map((d) => d.product_id).filter(Boolean));
    }

    const items = products
      .filter((p) => {
        if (!allowed) return true;
        if (allowed.has(p.id)) return true;
        if (artistSlug && p.artistSlug === artistSlug) return true;
        return false;
      })
      .map((p) => {
        const sizes = new Set([
          ...Object.keys(p.tinaStock || {}),
          ...Object.keys(p.stock || {}),
        ]);
        const rows = [...sizes].sort(sortSizes).map((size) => {
          const tina = Math.max(0, Math.floor(Number(p.tinaStock[size]) || 0));
          const live = Math.max(0, Math.floor(Number(p.stock[size]) || 0));
          return {
            size,
            tina,
            live,
            sold: Math.max(0, tina - live),
          };
        });
        return {
          id: p.id,
          title: p.title || p.id,
          status: p.status,
          artistSlug: p.artistSlug || "",
          price: p.price,
          tinaTotal: sumMap(p.tinaStock),
          liveTotal: sumMap(p.stock),
          sizes: rows,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title, "it"));

    return json(res, 200, {
      products: items,
      source: {
        tina: "content/products (GitHub / TinaCMS)",
        live: "Turso stock_levels (ordini / hold)",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(res, 500, { error: msg });
  }
}
