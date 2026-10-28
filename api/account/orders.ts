import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildOrderProformaPdf } from "../../server/portal/order-pdf.js";
import {
  deleteShopOrder,
  getShopOrder,
  listShopOrders,
  applyBankStockOnPaid,
  markShopOrderPaid,
  updateShopOrderStatus,
  type ShopOrder,
  type ShopOrderStatus,
} from "../../server/portal/orders.js";
import { cors, json, readJson, requireUser } from "../../server/portal/http.js";

function csvEscape(raw: string) {
  // Customer text starting with = + - @ would run as a formula in Excel/Sheets.
  const value = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function ordersToCsv(orders: ShopOrder[]) {
  const header = [
    "number",
    "external_id",
    "source",
    "status",
    "paid_at",
    "created_at",
    "customer_name",
    "customer_email",
    "customer_phone",
    "ship_country",
    "ship_zip",
    "pieces",
    "merchandise",
    "shipping",
    "total",
    "currency",
    "lines",
    "notes",
  ];
  const rows = orders.map((o) =>
    [
      o.number,
      o.external_id,
      o.source,
      o.status,
      o.paid_at || "",
      o.created_at,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.ship_country,
      o.ship_zip,
      String(o.pieces),
      o.merchandise.toFixed(2),
      o.shipping.toFixed(2),
      o.total.toFixed(2),
      o.currency,
      o.lines.map((l) => `${l.title} ${l.size} x${l.qty}`).join("; "),
      o.notes,
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );
  return [header.join(","), ...rows].join("\n") + "\n";
}

/** Admin shop orders: list, status, paid, delete, PDF proforma, CSV export. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const admin = await requireUser(req, res, "admin");
  if (!admin) return;

  try {
    if (req.method === "GET") {
      const id = typeof req.query.id === "string" ? req.query.id : "";
      const pdf = req.query.pdf === "1" || req.query.pdf === "true";
      const csv = req.query.csv === "1" || req.query.csv === "true";
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
      if (csv) {
        const body = ordersToCsv(orders);
        res.status(200);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="corpoceleste-ordini.csv"`,
        );
        res.setHeader("Cache-Control", "no-store");
        return res.send(body);
      }
      return json(res, 200, { orders });
    }

    if (req.method === "PATCH") {
      const body = await readJson<{
        id?: string;
        status?: ShopOrderStatus;
        paid?: boolean;
      }>(req);
      if (!body.id) return json(res, 400, { error: "id required" });

      if (body.paid === true) {
        const order = await markShopOrderPaid(body.id);
        if (!order) return json(res, 404, { error: "Order not found" });
        // Soft-hold: scale GitHub stock only when bonifico is confirmed.
        if (order.source === "bank") {
          const stock = await applyBankStockOnPaid(order);
          if (!stock.ok) {
            console.error("orders: bank stock on paid failed", order.external_id, stock.note);
            return json(res, 503, {
              error: `Pagato, ma magazzino non aggiornato: ${stock.note}`,
              order,
            });
          }
          try {
            const { recordSalesFromOrder } = await import("../../server/portal/deals.js");
            await recordSalesFromOrder({
              captureId: order.external_id,
              source: "bank",
              lines: order.lines
                .filter((l) => l.id)
                .map((l) => ({
                  id: String(l.id),
                  size: l.size,
                  qty: l.qty,
                  unit_price: l.unitPrice,
                })),
            });
          } catch (err) {
            console.warn("orders: recordSalesFromOrder on paid", err);
          }
        }
        return json(res, 200, { order });
      }

      if (body.status !== "nuovo" && body.status !== "evaso") {
        return json(res, 400, { error: "id and status (nuovo|evaso) or paid:true required" });
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
