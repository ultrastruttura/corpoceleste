import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  deleteDeal,
  getDeal,
  listDeals,
  upsertDeal,
  dealSummary,
} from "../../server/portal/deals.js";
import { json, readJson, requireUser } from "../../server/portal/http.js";

/** Admin CRUD + artist read of deals. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      const id = String(req.query.id || "");
      if (id) {
        const deal = await getDeal(id);
        if (!deal) return json(res, 404, { error: "Not found" });
        if (user.role !== "admin" && deal.user_id !== user.id) {
          return json(res, 403, { error: "Forbidden" });
        }
        return json(res, 200, await dealSummary(deal));
      }
      const deals =
        user.role === "admin" ? await listDeals() : await listDeals(user.id);
      const summaries = [];
      for (const d of deals) summaries.push(await dealSummary(d));
      return json(res, 200, { deals: summaries });
    }

    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });

    if (req.method === "POST" || req.method === "PUT") {
      const body = await readJson<{
        id?: string;
        user_id?: string;
        product_id?: string;
        product_title?: string;
        unit_price?: number;
        planned_qty?: number;
        artist_share_pct?: number;
        vat_rate_pct?: number;
        active?: boolean;
        notes?: string;
        costs?: Array<{ label: string; amount: number; per_unit?: boolean }>;
      }>(req);

      if (!body.user_id || !body.product_id || body.unit_price == null) {
        return json(res, 400, { error: "user_id, product_id, unit_price required" });
      }

      const deal = await upsertDeal({
        id: body.id,
        user_id: body.user_id,
        product_id: body.product_id,
        product_title: body.product_title || body.product_id,
        unit_price: Number(body.unit_price),
        planned_qty: Number(body.planned_qty || 1),
        artist_share_pct: Number(body.artist_share_pct ?? 40),
        vat_rate_pct: Number(body.vat_rate_pct ?? 22),
        active: body.active !== false,
        notes: body.notes || "",
        costs: (body.costs || []).map((c) => ({
          label: c.label,
          amount: Number(c.amount),
          per_unit: Boolean(c.per_unit),
        })),
      });
      return json(res, 200, { deal: deal ? await dealSummary(deal) : null });
    }

    if (req.method === "DELETE") {
      const id = String(req.query.id || "");
      if (!id) return json(res, 400, { error: "Missing id" });
      await deleteDeal(id);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("account deals", err);
    return json(res, 500, { error: "Server error" });
  }
}
