import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  artistDashboard,
  deleteSettlement,
  listSettlements,
  upsertSettlement,
} from "../../server/portal/deals.js";
import { json, readJson, requireUser } from "../../server/portal/http.js";

/** Settlements + artist dashboard. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      const userId =
        user.role === "admin" && req.query.user_id
          ? String(req.query.user_id)
          : user.id;
      if (user.role !== "admin" && userId !== user.id) {
        return json(res, 403, { error: "Forbidden" });
      }
      if (req.query.dashboard === "1" || user.role === "artist") {
        return json(res, 200, await artistDashboard(userId));
      }
      return json(res, 200, { settlements: await listSettlements(userId) });
    }

    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });

    if (req.method === "POST") {
      const body = await readJson<{
        user_id?: string;
        period?: string;
        amount?: number;
        note?: string;
      }>(req);
      if (!body.user_id || !body.period || body.amount == null) {
        return json(res, 400, { error: "user_id, period, amount required" });
      }
      const id = await upsertSettlement({
        user_id: body.user_id,
        period: body.period,
        amount: Number(body.amount),
        note: body.note,
      });
      return json(res, 200, { ok: true, id });
    }

    if (req.method === "DELETE") {
      const id = String(req.query.id || "");
      if (!id) return json(res, 400, { error: "Missing id" });
      await deleteSettlement(id);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("account settle", err);
    return json(res, 500, { error: "Server error" });
  }
}
