import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import { cors, json, readJson, requireSiteOrigin } from "../server/portal/http.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";

/**
 * Preview Sendcloud cheapest rate for checkout UI.
 * POST { lines, country, zip }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
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
    }>(req);
    const dest = parseShipDest({ country: body.country, zip: body.zip });
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
