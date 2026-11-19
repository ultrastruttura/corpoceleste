import type { VercelRequest, VercelResponse } from "@vercel/node";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import {
  capturePayPalOrder,
  createPayPalCheckoutOrder,
  fetchPayPalOrder,
  paypalOrderIsCaptured,
  type CheckoutShipTo,
} from "../server/paypal.js";
import { cors, json, readJson, requireSiteOrigin } from "../server/portal/http.js";
import { abuseLimit } from "../server/abuse-limit.js";
import { isEmail } from "../server/form-body.js";
import {
  abandonPaypalCheckoutHold,
  abandonPaypalCheckoutOrderHold,
  bindPaypalCheckoutHold,
  releaseExpiredPaypalHoldsBestEffort,
  reservePaypalCheckoutHold,
} from "../server/stock/reserve-paypal-checkout.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";

/**
 * Prefer an open checkout hold; if missing (Turso blip / Apple race), fall back to a
 * merchant-scoped PayPal GET — our token only sees our orders.
 */
async function assertCapturableOrder(
  orderId: string,
): Promise<{ ok: true; alreadyCaptured?: boolean } | { ok: false; error: string }> {
  try {
    const { getLedger, paypalHoldId } = await import("../server/github-stock.js");
    const hold = await getLedger(paypalHoldId(orderId));
    if (hold?.kind === "paypal_hold" && !hold.releasedAt) return { ok: true };
  } catch (err) {
    console.warn("paypal-create: hold lookup for capture", err);
  }

  try {
    const order = await fetchPayPalOrder(orderId);
    const st = String(order.status || "").toUpperCase();
    if (paypalOrderIsCaptured(order)) return { ok: true, alreadyCaptured: true };
    if (st === "APPROVED") return { ok: true };
    return { ok: false, error: `Order not capturable (${st || "unknown"})` };
  } catch (err) {
    console.warn("paypal-create: order lookup for capture", err);
    return { ok: false, error: "Hold lookup failed" };
  }
}

function parseShipTo(raw: Partial<CheckoutShipTo> | undefined, country: string, zip: string): CheckoutShipTo | null {
  if (!raw) return null;
  const fullName = String(raw.fullName || "").trim().slice(0, 120);
  const email = String(raw.email || "").trim();
  const phone = String(raw.phone || "").trim().slice(0, 40);
  const street = String(raw.street || "").trim().slice(0, 200);
  const city = String(raw.city || "").trim().slice(0, 100);
  let province = String(raw.province || "").trim();
  if (country === "IT") province = province.slice(0, 2).toUpperCase();
  // Phone and province optional — Sendcloud falls back via provinceForLabel / default phone.
  if (!fullName || !isEmail(email) || !street || !city) return null;
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

  try {
    const body = await readJson<{
      action?: string;
      orderId?: string;
      lines?: OrderLine[];
      country?: string;
      zip?: string;
      delivery?: string;
      expectedTotal?: string;
      shipTo?: Partial<CheckoutShipTo>;
    }>(req);

    // Google Pay / Apple Pay / PayPal Buttons: capture server-side after approval.
    // Separate abuse bucket so create retries do not block capture.
    if (body.action === "capture") {
      const limitedCap = await abuseLimit(req, "paypal-capture", 30, 15 * 60);
      if (!limitedCap.ok) {
        if (limitedCap.unavailable) {
          return json(res, 503, { error: "Service unavailable", retryAfterSec: limitedCap.retryAfterSec });
        }
        return json(res, 429, { error: "Too many requests", retryAfterSec: limitedCap.retryAfterSec });
      }
      const orderId = String(body.orderId || "").trim();
      if (!orderId) return json(res, 400, { error: "Missing orderId" });
      const allowed = await assertCapturableOrder(orderId);
      if (allowed.ok === false) return json(res, 403, { error: allowed.error });
      if (allowed.alreadyCaptured) {
        return json(res, 200, { ok: true, id: orderId, status: "COMPLETED" });
      }
      try {
        const captured = await capturePayPalOrder(orderId);
        return json(res, 200, {
          ok: true,
          id: captured.id,
          status: captured.status || "COMPLETED",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("paypal-create-order capture", msg);
        const declined = /INSTRUMENT_DECLINED/i.test(msg);
        // Last resort: Apple confirmOrder may have completed capture despite POST error.
        try {
          const existing = await fetchPayPalOrder(orderId);
          if (paypalOrderIsCaptured(existing)) {
            return json(res, 200, {
              ok: true,
              id: existing.id || orderId,
              status: "COMPLETED",
            });
          }
        } catch {
          /* keep original failure */
        }
        return json(res, declined ? 422 : 502, {
          error: declined ? "INSTRUMENT_DECLINED" : "Capture failed",
          details: declined ? [{ issue: "INSTRUMENT_DECLINED" }] : undefined,
        });
      }
    }

    // Apple Pay / Google Pay: user closed the sheet after create+hold — restore stock.
    if (body.action === "abandon") {
      const limitedAbandon = await abuseLimit(req, "paypal-abandon", 30, 15 * 60);
      if (!limitedAbandon.ok) {
        if (limitedAbandon.unavailable) {
          return json(res, 503, { error: "Service unavailable", retryAfterSec: limitedAbandon.retryAfterSec });
        }
        return json(res, 429, { error: "Too many requests", retryAfterSec: limitedAbandon.retryAfterSec });
      }
      const orderId = String(body.orderId || "").trim();
      if (!orderId || !/^[A-Z0-9_-]+$/i.test(orderId)) {
        return json(res, 400, { error: "Missing orderId" });
      }
      try {
        const existing = await fetchPayPalOrder(orderId);
        const st = String(existing.status || "").toUpperCase();
        if (paypalOrderIsCaptured(existing) || st === "COMPLETED" || st === "APPROVED") {
          // Payment in flight or done — never restore stock here.
          return json(res, 200, { ok: true, skipped: true, status: st || "protected" });
        }
      } catch (err) {
        console.warn("paypal-create-order abandon lookup", err);
        // Still try hold release if PayPal GET fails (orphan CREATED hold).
      }
      try {
        await abandonPaypalCheckoutOrderHold(orderId);
      } catch (err) {
        console.error("paypal-create-order abandon hold", err);
        return json(res, 502, { error: "Abandon failed" });
      }
      return json(res, 200, { ok: true });
    }

    const limited = await abuseLimit(req, "paypal-create", 15, 15 * 60);
    if (!limited.ok) {
      if (limited.unavailable) {
        return json(res, 503, { error: "Service unavailable", retryAfterSec: limited.retryAfterSec });
      }
      return json(res, 429, { error: "Too many requests", retryAfterSec: limited.retryAfterSec });
    }

    const lines = Array.isArray(body.lines) ? body.lines : [];
    const delivery = String(body.delivery || "").trim() === "pickup" ? "pickup" : "ship";
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

    const priced = await priceOrderLines(lines, dest, { delivery });
    if (priced.ok === false) return json(res, 400, { error: priced.error });

    // Apple Pay sheet amount is fixed at begin() — refuse before PayPal create if quote drifted.
    const expectedTotal = String(body.expectedTotal || "").trim();
    const serverTotal = money(priced.order.total);
    if (expectedTotal && expectedTotal !== serverTotal) {
      return json(res, 409, {
        error: "Total changed",
        total: serverTotal,
        expectedTotal,
      });
    }

    const stockLines = priced.order.lines.map((l) => ({
      id: l.id,
      size: l.size,
      qty: l.qty,
    }));

    const reserved = await reservePaypalCheckoutHold(stockLines, priced.order.total);
    if (reserved.ok === false) {
      return json(res, reserved.http, {
        error: reserved.error,
        ...(reserved.detail ? { detail: reserved.detail } : {}),
      });
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
