import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyStockDecrement, createLedger, ledgerExists } from "../server/github-stock.js";
import { notifyOrder } from "../server/notify-shop.js";
import { customerOrderText } from "../server/customer-mail.js";
import { formatCustomerOrderLines, formatShopOrderEmail } from "../server/stock-patch.js";
import { parseOrderLines } from "../src/lib/paypal-lines.js";
import {
  fetchPayPalOrder,
  linesFromOrder,
  orderEmailBits,
  verifyPayPalWebhook,
  type PayPalOrder,
} from "../server/paypal.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

type CaptureResource = {
  id?: string;
  custom_id?: string;
  supplementary_data?: {
    related_ids?: {
      order_id?: string;
    };
  };
};

async function readRawBody(req: VercelRequest): Promise<string> {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");

  const chunks: Buffer[] = [];
  const stream = req as unknown as AsyncIterable<Buffer | string>;
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length) return Buffer.concat(chunks).toString("utf8");

  return JSON.stringify(req.body ?? {});
}

/**
 * PayPal → Vercel webhook.
 * Event: PAYMENT.CAPTURE.COMPLETED
 * Decrements stock + emails shop (FormSubmit server-side).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "paypal-webhook" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await readRawBody(req);

  try {
    const ok = await verifyPayPalWebhook({
      body: rawBody,
      headers: req.headers as Record<string, string | string[] | undefined>,
    });
    if (!ok) return res.status(400).json({ error: "Invalid signature" });
  } catch (err) {
    console.error("verify failed", err);
    return res.status(500).json({ error: "Verification error" });
  }

  let event: { event_type?: string; resource?: CaptureResource };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
    return res.status(200).json({ ok: true, ignored: event.event_type });
  }

  const captureId = event.resource?.id;
  if (!captureId) return res.status(200).json({ ok: true, skipped: "no capture id" });

  try {
    if (await ledgerExists(captureId)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
    let order: PayPalOrder | null = null;
    let lines = [] as ReturnType<typeof linesFromOrder>;
    if (orderId) {
      order = await fetchPayPalOrder(orderId);
      lines = linesFromOrder(order);
    }

    if (!lines.length && event.resource?.custom_id) {
      lines = parseOrderLines(event.resource.custom_id);
    }

    if (!lines.length) {
      console.warn("No order lines for capture", captureId);
      return res.status(200).json({ ok: true, skipped: "no lines" });
    }

    const claimed = await createLedger(captureId, lines);
    if (!claimed) return res.status(200).json({ ok: true, duplicate: true });

    const notes = await applyStockDecrement(lines);
    const bits = order ? orderEmailBits(order) : { labels: [] as string[], total: undefined };
    const oversell = notes.some((n) => n.startsWith("OVERSELL"));
    const shopBody = formatShopOrderEmail({
      captureId,
      lines,
      stockNotes: notes,
      itemLabels: bits.labels,
      total: bits.total,
    });
    const customerBody = customerOrderText({
      metodo: "PayPal",
      ordine: formatCustomerOrderLines({
        captureId,
        lines,
        itemLabels: bits.labels,
        total: bits.total,
      }),
    });

    await notifyOrder({
      shopSubject: oversell
        ? "ATTENZIONE oversell — Ordine Corpoceleste (PayPal)"
        : "Ordine shop Corpoceleste (PayPal)",
      shopBody,
      customerTo: order?.payer?.email_address,
      customerSubject: "Conferma d’ordine — Corpoceleste",
      customerBody,
    });

    return res.status(200).json({ ok: true, captureId, notes, emailed: true });
  } catch (err) {
    console.error("stock update failed", err);
    return res.status(500).json({ error: "Stock update failed" });
  }
}
