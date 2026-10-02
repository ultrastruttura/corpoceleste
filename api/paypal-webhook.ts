import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  applyStockDecrement,
  claimOrResumeLedger,
  writeLedger,
  type LedgerRecord,
} from "../server/github-stock.js";
import { notifyOrder } from "../server/notify-shop.js";
import { customerOrderText } from "../server/customer-mail.js";
import { formatCustomerOrderLines, formatShopOrderEmail } from "../server/stock-patch.js";
import { parseOrderLines } from "../src/lib/paypal-lines.js";
import {
  money,
  paymentCoversExpected,
  priceOrderLines,
  shipZoneFromCountry,
} from "../server/order-pricing.js";
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
  amount?: { value?: string; currency_code?: string };
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
 * Verifies catalog prices + destination shipping, then stock + mail (resumable ledger).
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

    const country = order?.purchase_units?.[0]?.shipping?.address?.country_code;
    const shipZone = shipZoneFromCountry(country);
    const priced = await priceOrderLines(lines, shipZone);
    const paidRaw =
      event.resource?.amount?.value ||
      order?.purchase_units?.[0]?.amount?.value ||
      "";
    const paid = Number(paidRaw);

    if (priced.ok === false) {
      console.error("catalog reject", captureId, priced.error);
      await failLedger(captureId, lines, priced.error, paidRaw);
      await alertUnderpay(captureId, priced.error, paidRaw);
      return res.status(200).json({ ok: true, rejected: priced.error });
    }

    if (!paymentCoversExpected(paid, priced.order.total)) {
      const msg = `UNDERPAY paid=${paidRaw} expected=${money(priced.order.total)} zone=${shipZone} country=${country || "?"}`;
      console.error(msg, captureId);
      await failLedger(captureId, lines, msg, paidRaw, money(priced.order.total));
      await alertUnderpay(captureId, msg, paidRaw);
      return res.status(200).json({ ok: true, rejected: "underpay" });
    }

    const claim = await claimOrResumeLedger(captureId, lines, {
      expectedTotal: money(priced.order.total),
      paidTotal: paidRaw,
    });
    if (claim.action === "skip") {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    let notes = claim.ledger.stockNotes || [];
    if (!notes.length) {
      try {
        notes = await applyStockDecrement(lines);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("stock update failed", captureId, msg);
        const failed: LedgerRecord = {
          ...claim.ledger,
          status: "failed",
          error: msg,
          at: new Date().toISOString(),
        };
        await writeLedger(failed);
        if (msg.startsWith("INSUFFICIENT_STOCK")) {
          await alertUnderpay(captureId, msg, paidRaw);
          return res.status(200).json({ ok: true, rejected: "insufficient stock" });
        }
        return res.status(500).json({ error: "Stock update failed" });
      }
    }

    const bits = order ? orderEmailBits(order) : { labels: [] as string[], total: undefined };
    const shopBody = formatShopOrderEmail({
      captureId,
      lines,
      stockNotes: notes,
      itemLabels: bits.labels,
      total: bits.total || `${money(priced.order.total)} EUR`,
    });
    const customerBody = customerOrderText({
      metodo: "PayPal",
      ordine: formatCustomerOrderLines({
        captureId,
        lines,
        itemLabels: bits.labels,
        total: bits.total || `${money(priced.order.total)} EUR`,
      }),
    });

    let emailed = Boolean(claim.ledger.emailed);
    if (!emailed) {
      emailed = await notifyOrder({
        shopSubject: "Ordine shop Corpoceleste (PayPal)",
        shopBody,
        customerTo: order?.payer?.email_address,
        customerSubject: "Conferma d’ordine — Corpoceleste",
        customerBody,
      });
      if (!emailed) {
        const pending: LedgerRecord = {
          ...claim.ledger,
          status: "pending",
          stockNotes: notes,
          emailed: false,
          error: "notify failed",
          at: new Date().toISOString(),
        };
        await writeLedger(pending);
        return res.status(500).json({ error: "Notify failed" });
      }
    }

    let artistSales: string[] = [];
    try {
      const { portalConfigured } = await import("../server/portal/db.js");
      if (portalConfigured()) {
        const { recordSalesFromOrder } = await import("../server/portal/deals.js");
        artistSales = await recordSalesFromOrder({
          captureId,
          source: "paypal",
          lines,
        });
      }
    } catch (err) {
      console.error("artist sales ledger failed", err);
    }

    const done: LedgerRecord = {
      ...claim.ledger,
      status: "done",
      stockNotes: notes,
      emailed: true,
      error: undefined,
      at: new Date().toISOString(),
      expectedTotal: money(priced.order.total),
      paidTotal: paidRaw,
    };
    await writeLedger(done);

    return res.status(200).json({ ok: true, captureId, notes, emailed: true, artistSales });
  } catch (err) {
    console.error("webhook handler failed", err);
    return res.status(500).json({ error: "Handler failed" });
  }
}

async function failLedger(
  captureId: string,
  lines: ReturnType<typeof linesFromOrder>,
  error: string,
  paidTotal?: string,
  expectedTotal?: string,
) {
  try {
    await writeLedger({
      captureId,
      lines,
      status: "failed",
      at: new Date().toISOString(),
      error,
      paidTotal,
      expectedTotal,
    });
  } catch (err) {
    console.error("failLedger write", err);
  }
}

async function alertUnderpay(captureId: string, detail: string, paid?: string) {
  try {
    const { sendMail } = await import("../server/mail.js");
    const shop = (process.env.SHOP_EMAIL || "").trim();
    if (!shop) return;
    await sendMail({
      to: shop,
      subject: "ATTENZIONE pagamento anomalo — Corpoceleste",
      text: [`Capture: ${captureId}`, paid ? `Pagato: ${paid}` : "", detail].filter(Boolean).join("\n"),
    });
  } catch (err) {
    console.error("alertUnderpay", err);
  }
}
