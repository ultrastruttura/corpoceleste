import type { VercelRequest, VercelResponse } from "@vercel/node";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import {
  capturePayPalOrder,
  createPayPalCheckoutOrder,
  fetchPayPalOrder,
  type CheckoutShipTo,
} from "../server/paypal.js";
import { cors, json, readJson, requireSiteOrigin } from "../server/portal/http.js";
import { abuseLimit } from "../server/abuse-limit.js";
import {
  abandonPaypalCheckoutHold,
  bindPaypalCheckoutHold,
  releaseExpiredPaypalHoldsBestEffort,
  reservePaypalCheckoutHold,
} from "../server/stock/reserve-paypal-checkout.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";

/** Only capture orders we created (stock hold) or APPROVED under our merchant. */
async function assertCapturableOrder(orderId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((process.env.GITHUB_TOKEN || "").trim()) {
    try {
      const { getLedger, paypalHoldId } = await import("../server/github-stock.js");
      const hold = await getLedger(paypalHoldId(orderId));
      if (hold?.kind === "paypal_hold" && !hold.releasedAt) return { ok: true };
    } catch (err) {
      console.warn("paypal-create: hold lookup for capture", err);
    }
  }
  try {
    const order = await fetchPayPalOrder(orderId);
    if (String(order.status || "").toUpperCase() === "APPROVED") return { ok: true };
    return { ok: false, error: "Order not approved" };
  } catch {
    return { ok: false, error: "Unknown order" };
  }
}

function parseShipTo(raw: Partial<CheckoutShipTo> | undefined, country: string, zip: string): CheckoutShipTo | null {
  if (!raw) return null;
  const fullName = String(raw.fullName || "").trim();
  const email = String(raw.email || "").trim();
  const phone = String(raw.phone || "").trim();
  const street = String(raw.street || "").trim();
  const city = String(raw.city || "").trim();
  let province = String(raw.province || "").trim();
  if (country === "IT") province = province.slice(0, 2).toUpperCase();
  // Phone and province optional — Sendcloud falls back via provinceForLabel / default phone.
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
 * Server-side PayPal order create — prices, stock and Sendcloud shipping from server.
 * Stock is reserved BEFORE creating the PayPal order; on failure units are restored.
 * POST { lines, country, zip, shipTo: { fullName, email, phone, street, city, province } }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!requireSiteOrigin(req, res)) return;

  const limited = await abuseLimit(req, "paypal-create", 15, 15 * 60);
  if (!limited.ok) {
    if (limited.unavailable) {
      return json(res, 503, { error: "Service unavailable", retryAfterSec: limited.retryAfterSec });
    }
    return json(res, 429, { error: "Too many requests", retryAfterSec: limited.retryAfterSec });
  }

  try {
    const body = await readJson<{
      action?: string;
      orderId?: string;
      lines?: OrderLine[];
      country?: string;
      zip?: string;
      shipTo?: Partial<CheckoutShipTo>;
    }>(req);

    // Google Pay (and similar) confirm then capture server-side.
    if (body.action === "capture") {
      const orderId = String(body.orderId || "").trim();
      if (!orderId) return json(res, 400, { error: "Missing orderId" });
      const allowed = await assertCapturableOrder(orderId);
      if (allowed.ok === false) return json(res, 403, { error: allowed.error });
      const captured = await capturePayPalOrder(orderId);
      return json(res, 200, { ok: true, id: captured.id, status: captured.status });
    }

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

    await releaseExpiredPaypalHoldsBestEffort();

    const priced = await priceOrderLines(lines, dest);
    if (priced.ok === false) return json(res, 400, { error: priced.error });

    const stockLines = priced.order.lines.map((l) => ({
      id: l.id,
      size: l.size,
      qty: l.qty,
    }));

    const reserved = await reservePaypalCheckoutHold(stockLines, priced.order.total);
    if (reserved.ok === false) {
      return json(res, reserved.http, { error: reserved.error });
    }
    const tmpHoldId = reserved.tmpHoldId;

    let orderId: string;
    try {
      orderId = await createPayPalCheckoutOrder(priced.order, shipTo);
    } catch (err) {
      await abandonPaypalCheckoutHold(tmpHoldId);
      throw err;
    }

    await bindPaypalCheckoutHold(tmpHoldId, orderId);

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
