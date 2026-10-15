import type { VercelRequest, VercelResponse } from "@vercel/node";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import {
  createPayPalCheckoutOrder,
  type CheckoutShipTo,
} from "../server/paypal.js";
import { cors, json, readJson, requireSiteOrigin } from "../server/portal/http.js";
import { abuseLimit } from "../server/abuse-limit.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";

function parseShipTo(raw: Partial<CheckoutShipTo> | undefined, country: string, zip: string): CheckoutShipTo | null {
  if (!raw) return null;
  const fullName = String(raw.fullName || "").trim();
  const email = String(raw.email || "").trim();
  const phone = String(raw.phone || "").trim();
  const street = String(raw.street || "").trim();
  const city = String(raw.city || "").trim();
  let province = String(raw.province || "").trim();
  if (country === "IT") province = province.slice(0, 2).toUpperCase();
  // Phone and province optional — Spedire falls back via provinceForLabel / default phone.
  if (!fullName || !email.includes("@") || !street || !city) return null;
  return {
    fullName,
    email,
    phone,
    street,
    city,
    province: province || country,
    zip,
    country,
  };
}

/**
 * Server-side PayPal order create — prices, stock and Spedire shipping from server.
 * POST { lines, country, zip, shipTo: { fullName, email, phone, street, city, province } }
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
      shipTo?: Partial<CheckoutShipTo>;
    }>(req);
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const dest = parseShipDest({
      country: body.country,
      zip: body.zip,
      city: body.shipTo?.city,
      province: body.shipTo?.province,
    });
    if (!dest) return json(res, 400, { error: "Invalid shipping destination" });

    const shipTo = parseShipTo(body.shipTo, dest.country, dest.zip);
    if (!shipTo) return json(res, 400, { error: "Invalid shipping address" });

    const priced = await priceOrderLines(lines, dest);
    if (priced.ok === false) return json(res, 400, { error: priced.error });

    const orderId = await createPayPalCheckoutOrder(priced.order, shipTo);
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
