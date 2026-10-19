import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { listLiveCatalogProducts } from "../server/live-catalog.js";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import { cors, json, readJson, requireSiteOrigin } from "../server/portal/http.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";

/**
 * Preview Sendcloud cheapest rate for checkout UI.
 * POST { lines, country, zip, city?, province? }
 * GET ?live_stock=1 — deprecated alias → prefer /api/live-stock
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET" && (req.query.live_stock === "1" || req.query.live_stock === "true")) {
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

  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!requireSiteOrigin(req, res)) return;

  const limited = await abuseLimit(req, "shipping-quote", 30, 15 * 60);
  if (!limited.ok) {
    if (limited.unavailable) {
      return json(res, 503, { error: "Service unavailable", retryAfterSec: limited.retryAfterSec });
    }
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

    const cmp = priced.order.shippingCompare;
    return json(res, 200, {
      shipping: money(priced.order.shipping),
      merchandise: money(priced.order.merchandise),
      total: money(priced.order.total),
      serviceId: priced.order.packlink.serviceId,
      carrier: priced.order.packlink.carrier,
      serviceName: priced.order.packlink.serviceName,
      transitDays: priced.order.packlink.transitDays || "",
      firstMile: priced.order.packlink.firstMile || "",
      country: priced.order.shipCountry,
      zip: priced.order.shipZip,
      compare: cmp
        ? {
            pickup: cmp.pickup != null ? money(cmp.pickup) : null,
            dropoff: cmp.dropoff != null ? money(cmp.dropoff) : null,
            delta:
              cmp.pickup != null && cmp.dropoff != null
                ? money(cmp.pickup - cmp.dropoff)
                : null,
          }
        : undefined,
    });
  } catch (err) {
    console.error("shipping-quote", err);
    return json(res, 500, { error: "Could not quote shipping" });
  }
}
