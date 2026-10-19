import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { listLiveCatalogProducts } from "../server/live-catalog.js";
import { cors, json, requireSiteOrigin } from "../server/portal/http.js";

/** GET — live GitHub stock overlay for static catalog. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  if (!requireSiteOrigin(req, res)) return;

  const limited = await abuseLimit(req, "live-stock", 60, 15 * 60);
  if (!limited.ok) {
    if (limited.unavailable) {
      return json(res, 503, { error: "Service unavailable", retryAfterSec: limited.retryAfterSec });
    }
    return json(res, 429, { error: "Too many requests", retryAfterSec: limited.retryAfterSec });
  }

  try {
    if (!(process.env.GITHUB_TOKEN || "").trim()) {
      return json(res, 503, { error: "Stock API unavailable" });
    }
    const products = await listLiveCatalogProducts();
    res.setHeader("Cache-Control", "public, max-age=30");
    return json(res, 200, { products, at: new Date().toISOString() });
  } catch (err) {
    console.error("live-stock", err);
    return json(res, 500, { error: "Could not load stock" });
  }
}
