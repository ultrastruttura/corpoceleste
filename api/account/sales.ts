import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDeal, recordSale, recordSalesFromOrder } from "../../server/portal/deals.js";
import { json, readJson, requireUser } from "../../server/portal/http.js";

/** Admin: confirm bank/manual sales onto a deal. */
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

    const id = await recordSale({
      deal_id: deal.id,
      qty: Number(body.qty),
      unit_price: body.unit_price != null ? Number(body.unit_price) : deal.unit_price,
      size: body.size || "",
      source: body.source === "manual" ? "manual" : "bank",
      external_id: body.external_id,
    });
    return json(res, 200, { ok: true, id });
  } catch (err) {
    console.error("account sales", err);
    return json(res, 500, { error: err instanceof Error ? err.message : "Server error" });
  }
}
