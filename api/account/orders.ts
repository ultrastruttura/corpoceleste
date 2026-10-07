import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildOrderProformaPdf } from "../../server/portal/order-pdf.js";
import {
  deleteShopOrder,
  getShopOrder,
  listShopOrders,
  updateShopOrderStatus,
  type ShopOrderStatus,
} from "../../server/portal/orders.js";
import { cors, json, readJson, requireUser } from "../../server/portal/http.js";

/** Admin shop orders: list, status, delete, PDF proforma. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const admin = await requireUser(req, res, "admin");
  if (!admin) return;

  try {
    if (req.method === "GET") {
      const id = typeof req.query.id === "string" ? req.query.id : "";
      const pdf = req.query.pdf === "1" || req.query.pdf === "true";
      if (id && pdf) {
        const order = await getShopOrder(id);
        if (!order) return json(res, 404, { error: "Order not found" });
        const buf = buildOrderProformaPdf(order);
        res.status(200);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="corpoceleste-ordine-${order.id}.pdf"`,
        );
        res.setHeader("Cache-Control", "no-store");
        return res.send(buf);
      }
      if (id) {
        const order = await getShopOrder(id);
        if (!order) return json(res, 404, { error: "Order not found" });
        return json(res, 200, { order });
      }
      const statusRaw = typeof req.query.status === "string" ? req.query.status : "all";
      const status =
        statusRaw === "nuovo" || statusRaw === "evaso" || statusRaw === "all"
          ? statusRaw
          : "all";
      const orders = await listShopOrders({ status });
      return json(res, 200, { orders });
    }

    if (req.method === "PATCH") {
      const body = await readJson<{ id?: string; status?: ShopOrderStatus }>(req);
      if (!body.id || (body.status !== "nuovo" && body.status !== "evaso")) {
        return json(res, 400, { error: "id and status (nuovo|evaso) required" });
      }
      const order = await updateShopOrderStatus(body.id, body.status);
      if (!order) return json(res, 404, { error: "Order not found" });
      return json(res, 200, { order });
    }

    if (req.method === "DELETE") {
      const body = await readJson<{ id?: string }>(req);
      const id =
        body.id || (typeof req.query.id === "string" ? req.query.id : "");
      if (!id) return json(res, 400, { error: "id required" });
      const ok = await deleteShopOrder(id);
      if (!ok) return json(res, 404, { error: "Order not found" });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("account orders", err);
    return json(res, 500, { error: "Server error" });
  }
}
