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
  parseShipDest,
  paymentCoversExpected,
  priceOrderLines,
} from "../server/order-pricing.js";
import {
  createShipmentAndLabels,
  normalizeZip,
  packagesForQty,
  packlinkConfigured,
  personFromFullName,
} from "../server/packlink.js";
import {
  fetchPayPalOrder,
  linesFromOrder,
  orderEmailBits,
  paypalWebhookConfigured,
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

function shippingAddressText(order: PayPalOrder | null): string {
  const ship = order?.purchase_units?.[0]?.shipping;
  if (!ship?.address) return "";
  const a = ship.address;
  return [
    ship.name?.full_name || "",
    a.address_line_1 || "",
    a.address_line_2 || "",
    [a.postal_code, a.admin_area_2].filter(Boolean).join(" "),
    a.admin_area_1 || "",
    a.country_code || "",
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join("\n");
}

async function ensurePacklinkShipment(opts: {
  ledger: LedgerRecord;
  order: PayPalOrder | null;
  priced: Extract<Awaited<ReturnType<typeof priceOrderLines>>, { ok: true }>["order"];
  captureId: string;
}): Promise<Pick<LedgerRecord, "packlinkRef" | "packlinkLabels" | "packlinkError" | "packlinkServiceId">> {
  if (opts.ledger.packlinkRef) {
    return {
      packlinkRef: opts.ledger.packlinkRef,
      packlinkLabels: opts.ledger.packlinkLabels || [],
      packlinkServiceId: opts.ledger.packlinkServiceId || opts.priced.packlink.serviceId,
      packlinkError: opts.ledger.packlinkError,
    };
  }

  if (!packlinkConfigured()) {
    return { packlinkError: "PACKLINK_API_KEY missing" };
  }

  const ship = opts.order?.purchase_units?.[0]?.shipping;
  const addr = ship?.address;
  const dest = parseShipDest({
    country: addr?.country_code,
    zip: addr?.postal_code,
  });
  if (!dest || !addr?.address_line_1 || !addr.admin_area_2) {
    return { packlinkError: "PayPal shipping address incomplete" };
  }

  const fullName = ship?.name?.full_name || "Cliente";
  const person = personFromFullName(fullName);
  const email = (opts.order?.payer?.email_address || process.env.SHOP_EMAIL || "").trim();
  const paypalPhone = String(ship?.phone?.phone_number?.national_number || "").trim();
  const phone = (
    paypalPhone ||
    process.env.PACKLINK_DEFAULT_TO_PHONE ||
    process.env.PACKLINK_FROM_PHONE ||
    ""
  ).trim();
  if (!email || !phone) {
    return { packlinkError: "Missing recipient email/phone for Packlink" };
  }

  const pieceCount = opts.priced.lines.reduce((n, l) => n + l.qty, 0);

  try {
    const created = await createShipmentAndLabels({
      serviceId: opts.priced.packlink.serviceId,
      packages: packagesForQty(pieceCount),
      content: "Maglie serigrafate",
      contentValue: opts.priced.merchandise,
      customReference: opts.captureId.slice(0, 50),
      to: {
        name: person.name,
        surname: person.surname,
        street1: String(addr.address_line_1),
        street2: addr.address_line_2 ? String(addr.address_line_2) : undefined,
        zip_code: normalizeZip(dest.zip),
        city: String(addr.admin_area_2),
        state: addr.admin_area_1 ? String(addr.admin_area_1) : undefined,
        country: dest.country,
        phone,
        email,
      },
    });
    return {
      packlinkRef: created.reference,
      packlinkLabels: created.labelUrls,
      packlinkServiceId: opts.priced.packlink.serviceId,
      packlinkError: created.labelUrls.length ? undefined : "Shipment created, labels pending",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("packlink shipment", opts.captureId, msg);
    return { packlinkError: msg, packlinkServiceId: opts.priced.packlink.serviceId };
  }
}

/**
 * PayPal → Vercel webhook.
 * Event: PAYMENT.CAPTURE.COMPLETED
 * Verifies catalog prices + Packlink shipping, then stock + label + mail (resumable ledger).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Fail closed: never touch GitHub stock without full PayPal + token config.
  if (!paypalWebhookConfigured()) {
    console.error("paypal-webhook: misconfigured (WEBHOOK_ID / PayPal creds / GITHUB_TOKEN)");
    return res.status(503).json({ error: "Webhook not configured" });
  }

  const rawBody = await readRawBody(req);

  let verified = false;
  try {
    verified = await verifyPayPalWebhook({
      body: rawBody,
      headers: req.headers as Record<string, string | string[] | undefined>,
    });
  } catch (err) {
    console.error("verify failed", err);
    return res.status(500).json({ error: "Verification error" });
  }
  if (!verified) return res.status(400).json({ error: "Invalid signature" });

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

    const addr = order?.purchase_units?.[0]?.shipping?.address;
    const dest = parseShipDest({
      country: addr?.country_code,
      zip: addr?.postal_code,
    });
    if (!dest) {
      const msg = `Missing PayPal shipping CAP/country (${addr?.country_code || "?"}/${addr?.postal_code || "?"})`;
      console.error(msg, captureId);
      await failLedger(captureId, lines, msg, event.resource?.amount?.value);
      await alertUnderpay(captureId, msg, event.resource?.amount?.value);
      return res.status(200).json({ ok: true, rejected: "no shipping address" });
    }

    const priced = await priceOrderLines(lines, dest);
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
      const msg = `UNDERPAY paid=${paidRaw} expected=${money(priced.order.total)} ${dest.country} ${dest.zip}`;
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

    const packlink = await ensurePacklinkShipment({
      ledger: { ...claim.ledger, stockNotes: notes },
      order,
      priced: priced.order,
      captureId,
    });

    const bits = order ? orderEmailBits(order) : { labels: [] as string[], total: undefined };
    const shopBody = formatShopOrderEmail({
      captureId,
      lines,
      stockNotes: notes,
      itemLabels: bits.labels,
      total: bits.total || `${money(priced.order.total)} EUR`,
      shippingAddress: shippingAddressText(order),
      packlinkRef: packlink.packlinkRef,
      packlinkLabels: packlink.packlinkLabels,
      packlinkError: packlink.packlinkError,
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
          ...packlink,
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
        const { upsertShopOrder } = await import("../server/portal/orders.js");
        const ship = order?.purchase_units?.[0]?.shipping;
        await upsertShopOrder({
          external_id: captureId,
          source: "paypal",
          customer_name: ship?.name?.full_name || "",
          customer_email: order?.payer?.email_address || "",
          shipping_address: shippingAddressText(order),
          ship_country: dest.country,
          ship_zip: dest.zip,
          merchandise: priced.order.merchandise,
          shipping: priced.order.shipping,
          total: priced.order.total,
          lines: priced.order.lines.map((l) => ({
            title: l.title,
            size: l.size,
            qty: l.qty,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
          packlink_ref: packlink.packlinkRef || "",
          notes: packlink.packlinkError ? `Packlink: ${packlink.packlinkError}` : "",
        });
      }
    } catch (err) {
      console.error("artist sales / shop order ledger failed", err);
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
      ...packlink,
    };
    await writeLedger(done);

    return res.status(200).json({
      ok: true,
      captureId,
      notes,
      emailed: true,
      artistSales,
      packlinkRef: packlink.packlinkRef,
    });
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
