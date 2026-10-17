import type { VercelRequest, VercelResponse } from "@vercel/node";
import matter from "gray-matter";
import { abuseLimit } from "../server/abuse-limit.js";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import { cors, json, readJson, requireSiteOrigin } from "../server/portal/http.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";

/**
 * Preview Sendcloud cheapest rate for checkout UI.
 * POST { lines, country, zip, city?, province? }
 * GET ?live_stock=1 — stock snapshot from GitHub (overlay on static catalog).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET" && (req.query.live_stock === "1" || req.query.live_stock === "true")) {
    if (!requireSiteOrigin(req, res)) return;
    const limited = await abuseLimit(req, "live-stock", 60, 15 * 60);
    if (!limited.ok) {
      return json(res, 429, { error: "Too many requests", retryAfterSec: limited.retryAfterSec });
    }
    try {
      if (!(process.env.GITHUB_TOKEN || "").trim()) {
        return json(res, 503, { error: "Stock API unavailable" });
      }
      const { owner, name, branch } = (() => {
        const full = process.env.GITHUB_REPO || "ultrastruttura/corpoceleste";
        const [o, n] = full.split("/");
        return { owner: o, name: n, branch: process.env.GITHUB_BRANCH || "main" };
      })();
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
      if (!listRes.ok) return json(res, 502, { error: "Could not list products" });
      const files = (await listRes.json()) as Array<{ name?: string; download_url?: string }>;
      const products: Array<{
        id: string;
        stock: Record<string, number>;
        status: string;
        price: number;
      }> = [];
      for (const f of files) {
        if (!f.name?.endsWith(".md") || !f.download_url) continue;
        const id = f.name.replace(/\.md$/, "");
        const raw = await fetch(f.download_url).then((r) => r.text());
        const { data } = matter(raw);
        const sizes = Array.isArray(data.sizes)
          ? data.sizes.map((x: unknown) => String(x))
          : ["S", "M", "L", "XL"];
        const stock: Record<string, number> = {};
        const rawStock =
          data.stock && typeof data.stock === "object"
            ? (data.stock as Record<string, unknown>)
            : {};
        for (const size of sizes) {
          const n = Number(rawStock[size]);
          stock[size] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
        }
        products.push({
          id,
          stock,
          status:
            data.status === "soldout"
              ? "soldout"
              : data.status === "preorder"
                ? "preorder"
                : "available",
          price: Number(data.price ?? 0),
        });
      }
      res.setHeader("Cache-Control", "public, max-age=30");
      return json(res, 200, { products, at: new Date().toISOString() });
    } catch (err) {
      console.error("live-stock", err);
      return json(res, 500, { error: "Could not load stock" });
    }
  }

  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!requireSiteOrigin(req, res)) return;

  const limited = await abuseLimit(req, "shipping-quote", 30, 15 * 60);
  if (!limited.ok) {
    return json(res, 429, { error: "Too many requests", retryAfterSec: limited.retryAfterSec });
  }

  try {
    const body = await readJson<{
      lines?: OrderLine[];
      country?: string;
      zip?: string;
      city?: string;
      province?: string;
    }>(req);
    const dest = parseShipDest({
      country: body.country,
      zip: body.zip,
      city: body.city,
      province: body.province,
    });
    if (!dest) return json(res, 400, { error: "Invalid shipping destination" });

    const lines = Array.isArray(body.lines) ? body.lines : [];
    const priced = await priceOrderLines(lines, dest);
    if (priced.ok === false) return json(res, 400, { error: priced.error });

    return json(res, 200, {
      shipping: money(priced.order.shipping),
      merchandise: money(priced.order.merchandise),
      total: money(priced.order.total),
      serviceId: priced.order.packlink.serviceId,
      carrier: priced.order.packlink.carrier,
      serviceName: priced.order.packlink.serviceName,
      transitDays: priced.order.packlink.transitDays || "",
      country: priced.order.shipCountry,
      zip: priced.order.shipZip,
    });
  } catch (err) {
    console.error("shipping-quote", err);
    return json(res, 500, { error: "Could not quote shipping" });
  }
}
