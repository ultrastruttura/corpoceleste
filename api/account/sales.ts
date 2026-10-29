import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDeal, recordSale, recordSalesFromOrder } from "../../server/portal/deals.js";
import { upsertShopOrder } from "../../server/portal/orders.js";
import { json, readJson, requireUser } from "../../server/portal/http.js";

/** Admin: confirm bank/manual sales onto a deal (+ shop order in Ordini). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireUser(req, res, "admin");
  if (!admin) return;

  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const body = await readJson<{
      deal_id?: string;
      qty?: number;
      unit_price?: number;
      size?: string;
      source?: "bank" | "manual";
      external_id?: string;
      customer_name?: string;
      customer_email?: string;
      /** Multi-line helper (same shape as PayPal lines). */
      capture_id?: string;
      lines?: Array<{ id: string; size: string; qty: number; unit_price?: number }>;
    }>(req);

    if (body.capture_id && body.lines?.length) {
      const written = await recordSalesFromOrder({
        captureId: body.capture_id,
        source: "bank",
        lines: body.lines,
      });
      return json(res, 200, { ok: true, written });
    }

    if (!body.deal_id || !body.qty) {
      return json(res, 400, { error: "deal_id and qty required" });
    }
    const deal = await getDeal(body.deal_id);
    if (!deal) return json(res, 404, { error: "Deal not found" });

    const qty = Math.max(1, Math.floor(Number(body.qty)));
    const unitPrice =
      body.unit_price != null ? Number(body.unit_price) : deal.unit_price;
    const size = String(body.size || "").trim();
    const source = body.source === "manual" ? "manual" : "bank";
    const external = String(body.external_id || "").trim() || `bank-${Date.now()}`;
    const saleExternal = `${external}:${deal.product_id}:${size || "UNI"}`;
    const merchandise = Math.round(qty * unitPrice * 100) / 100;
    const now = new Date().toISOString();

    const shopOrder = await upsertShopOrder({
      external_id: external,
      source: "bank",
      customer_name: String(body.customer_name || "").trim() || "Cliente bonifico",
      customer_email: String(body.customer_email || "").trim(),
      customer_phone: "",
      shipping_address: "",
      ship_country: "IT",
      ship_zip: "",
      merchandise,
      shipping: 0,
      total: merchandise,
      currency: "EUR",
      lines: [
        {
          id: deal.product_id,
          title: deal.product_title || deal.product_id,
          size: size || "—",
          qty,
          unitPrice,
          lineTotal: merchandise,
        },
      ],
      notes:
        source === "manual"
          ? "Vendita manuale (admin)"
          : "Bonifico registrato da admin",
      paid_at: now,
      created_at: now,
    });

    const id = await recordSale({
      deal_id: deal.id,
      qty,
      unit_price: unitPrice,
      size,
      source,
      external_id: saleExternal,
      sold_at: now,
    });
    return json(res, 200, { ok: true, id, order: shopOrder });
  } catch (err) {
    console.error("account sales", err);
    return json(res, 500, { error: "Server error" });
  }
}
