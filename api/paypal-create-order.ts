import type { VercelRequest, VercelResponse } from "@vercel/node";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import { createPayPalCheckoutOrder } from "../server/paypal.js";
import { cors, json, readJson, requireSiteOrigin } from "../server/portal/http.js";
import { abuseLimit } from "../server/abuse-limit.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";

/**
 * Server-side PayPal order create — prices, stock and Sendcloud shipping from server.
 * POST { lines: [{ id, size, qty }], country, zip }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!requireSiteOrigin(req, res)) return;

  const limited = await abuseLimit(req, "paypal-create", 15, 15 * 60);
  if (!limited.ok) {
    return json(res, 429, { error: "Too many requests", retryAfterSec: limited.retryAfterSec });
  }

  try {
    const body = await readJson<{
      lines?: OrderLine[];
      country?: string;
      zip?: string;
    }>(req);
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const dest = parseShipDest({ country: body.country, zip: body.zip });
    if (!dest) return json(res, 400, { error: "Invalid shipping destination" });

    const priced = await priceOrderLines(lines, dest);
    if (priced.ok === false) return json(res, 400, { error: priced.error });

    const orderId = await createPayPalCheckoutOrder(priced.order);
    return json(res, 200, {
      id: orderId,
      total: money(priced.order.total),
      merchandise: money(priced.order.merchandise),
      shipping: money(priced.order.shipping),
      serviceId: priced.order.packlink.serviceId,
      country: priced.order.shipCountry,
      zip: priced.order.shipZip,
    });
  } catch (err) {
    console.error("paypal-create-order", err);
    return json(res, 500, { error: "Could not create order" });
  }
}
