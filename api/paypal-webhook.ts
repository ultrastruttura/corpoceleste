import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  applyStockDecrementCheckpointed,
  claimOrResumeLedger,
  getLedger,
  LedgerBusyError,
  StockPartialError,
  writeLedger,
  type LedgerRecord,
} from "../server/github-stock.js";
import { notifyOrder } from "../server/notify-shop.js";
import { customerOrderText, localeForCountry } from "../server/customer-mail.js";
import { loadShopIdentity } from "../server/shop-identity.js";
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
  personFromFullName,
  sendcloudConfigured,
} from "../server/sendcloud.js";
import {
  fetchPayPalOrder,
  linesFromOrder,
  orderEmailBits,
  paypalWebhookConfigured,
  shipContactFromInvoiceId,
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

function shippingAddressText(
  order: PayPalOrder | null,
  fallback?: { country: string; zip: string; note?: string },
): string {
  const ship = order?.purchase_units?.[0]?.shipping;
  if (ship?.address) {
    const a = ship.address;
    const text = [
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
    if (text) return text;
  }
  if (fallback) {
    return [fallback.note || "Indirizzo incompleto da PayPal", `${fallback.zip} ${fallback.country}`]
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

async function ensureSendcloudShipment(opts: {
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

  if (!sendcloudConfigured()) {
    return { packlinkError: "SENDCLOUD_PUBLIC_KEY / SENDCLOUD_SECRET_KEY missing" };
  }

  const unit = opts.order?.purchase_units?.[0];
  const ship = unit?.shipping;
  const addr = ship?.address;
  const dest = parseShipDest({
    country: addr?.country_code,
    zip: addr?.postal_code,
  });
  if (!dest || !addr?.address_line_1 || !addr.admin_area_2) {
    return { packlinkError: "Checkout shipping address incomplete" };
  }

  const fullName = ship?.name?.full_name || "Cliente";
  const person = personFromFullName(fullName);
  const fromInvoice = shipContactFromInvoiceId(unit?.invoice_id);
  const email = (
    fromInvoice.email ||
    opts.order?.payer?.email_address ||
    process.env.SHOP_EMAIL ||
    ""
  ).trim();
  const paypalPhone = String(
    ship?.phone_number?.national_number ||
      ship?.phone?.phone_number?.national_number ||
      "",
  ).trim();
  const phone = (
    fromInvoice.phone ||
    paypalPhone ||
    process.env.SENDCLOUD_DEFAULT_TO_PHONE ||
    process.env.SENDCLOUD_FROM_PHONE ||
    ""
  ).trim();
  if (!email || !phone) {
    return { packlinkError: "Missing recipient email/phone for Sendcloud" };
  }

  const pieceCount = opts.priced.lines.reduce((n, l) => n + l.qty, 0);

  try {
    const created = await createShipmentAndLabels({
      serviceId: opts.priced.packlink.serviceId,
      contractId: opts.priced.packlink.contractId,
      packages: packagesForQty(pieceCount),
      content: "Maglie serigrafate",
      contentValue: opts.priced.merchandise,
      customReference: opts.captureId.slice(0, 40),
      to: {
        name: person.name,
        surname: person.surname,
        street1: String(addr.address_line_1),
        street2: addr.address_line_2 ? String(addr.address_line_2) : undefined,
        zip_code: normalizeZip(dest.zip, dest.country),
        city: String(addr.admin_area_2),
        state: addr.admin_area_1 ? String(addr.admin_area_1) : dest.country,
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
    console.error("sendcloud shipment", opts.captureId, msg);
    return { packlinkError: msg, packlinkServiceId: opts.priced.packlink.serviceId };
  }
}

/**
 * PayPal → Vercel webhook.
 * Event: PAYMENT.CAPTURE.COMPLETED
 * Verifies catalog prices + Sendcloud shipping, then stock + label + mail (resumable ledger).
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
    // Never overwrite a finished capture (retry / quote drift after done).
    const alreadyDone = await getLedger(captureId);
    if (alreadyDone?.status === "done") {
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
      // Fallback only — create-order omits custom_id when the cart would truncate.
      lines = parseOrderLines(event.resource.custom_id);
      if (lines.length) {
        console.warn("capture lines from custom_id fallback", captureId);
      }
    }

    if (!lines.length) {
      console.warn("No order lines for capture", captureId);
      await alertUnderpay(captureId, "No order lines (items/custom_id empty)", event.resource?.amount?.value);
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

    // Consume hold BEFORE pricing so cron cannot release units mid-webhook.
    const relatedOrderId = String(
      event.resource?.supplementary_data?.related_ids?.order_id || order?.id || "",
    ).trim();
    let earlyHold: LedgerRecord | null = null;
    if (relatedOrderId && (process.env.GITHUB_TOKEN || "").trim()) {
      try {
        const { consumePaypalHold } = await import("../server/github-stock.js");
        earlyHold = await consumePaypalHold(relatedOrderId, captureId);
      } catch (err) {
        console.warn("paypal-webhook: early consume hold failed", captureId, err);
      }
    }
    // Any live hold (complete or partial): catalog already reflects reserved units.
    const ignoreStock = Boolean(earlyHold && !earlyHold.releasedAt);

    const priced = await priceOrderLines(lines, dest, { ignoreStock });
    const paidRaw =
      event.resource?.amount?.value ||
      order?.purchase_units?.[0]?.amount?.value ||
      "";
    const paidCurrency = String(
      event.resource?.amount?.currency_code ||
        order?.purchase_units?.[0]?.amount?.currency_code ||
        "",
    )
      .trim()
      .toUpperCase();
    const paid = Number(paidRaw);

    if (priced.ok === false) {
      console.error("catalog reject", captureId, priced.error);
      await failLedger(captureId, lines, priced.error, paidRaw);
      await alertUnderpay(captureId, priced.error, paidRaw);
      return res.status(200).json({ ok: true, rejected: priced.error });
    }

    if (paidCurrency && paidCurrency !== "EUR") {
      const msg = `WRONG_CURRENCY paid=${paidRaw} ${paidCurrency} expected=EUR`;
      console.error(msg, captureId);
      await failLedger(captureId, lines, msg, paidRaw, money(priced.order.total));
      await alertUnderpay(captureId, msg, paidRaw);
      return res.status(200).json({ ok: true, rejected: "wrong currency" });
    }

    if (!paymentCoversExpected(paid, priced.order.total)) {
      const msg = `UNDERPAY paid=${paidRaw} expected=${money(priced.order.total)} ${dest.country} ${dest.zip}`;
      console.error(msg, captureId);
      await failLedger(captureId, lines, msg, paidRaw, money(priced.order.total));
      await alertUnderpay(captureId, msg, paidRaw);
      return res.status(200).json({ ok: true, rejected: "underpay" });
    }

    let claim: Awaited<ReturnType<typeof claimOrResumeLedger>>;
    try {
      claim = await claimOrResumeLedger(captureId, lines, {
        expectedTotal: money(priced.order.total),
        paidTotal: paidRaw,
      });
    } catch (err) {
      if (err instanceof LedgerBusyError) {
        console.info("ledger busy", captureId);
        return res.status(500).json({ error: "Ledger busy" });
      }
      throw err;
    }
    if (claim.action === "skip") {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    let working: LedgerRecord = { ...claim.ledger };

    // Reuse create-order hold progress (complete or partial) — never double-decrement applied keys.
    if (!working.stockComplete && earlyHold && !earlyHold.releasedAt) {
      working = {
        ...working,
        kind: "capture",
        stockNotes: earlyHold.stockNotes?.length
          ? earlyHold.stockNotes
          : working.stockNotes,
        stockAppliedKeys: earlyHold.stockAppliedKeys?.length
          ? earlyHold.stockAppliedKeys
          : working.stockAppliedKeys,
        stockComplete: Boolean(earlyHold.stockComplete),
        status: "processing",
        at: new Date().toISOString(),
      };
      await writeLedger(working);
    }

    let notes = working.stockNotes || [];
    if (!working.stockComplete) {
      try {
        // Per-line ledger checkpoint — PayPal retries resume remaining lines only.
        working = await applyStockDecrementCheckpointed(working, lines, writeLedger);
        notes = working.stockNotes || [];
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("stock update failed", captureId, msg);
        if (err instanceof StockPartialError) {
          working = {
            ...working,
            status: "failed",
            stockNotes: err.appliedNotes.length ? err.appliedNotes : working.stockNotes,
            error: msg,
            at: new Date().toISOString(),
          };
        }
        if (msg.includes("INSUFFICIENT_STOCK")) {
          await alertUnderpay(captureId, msg, paidRaw);
          return res.status(200).json({ ok: true, rejected: "insufficient stock" });
        }
        return res.status(500).json({ error: "Stock update failed" });
      }
    }

    let packlink: Pick<
      LedgerRecord,
      "packlinkRef" | "packlinkLabels" | "packlinkError" | "packlinkServiceId"
    > = {
      packlinkRef: working.packlinkRef,
      packlinkLabels: working.packlinkLabels,
      packlinkError: working.packlinkError,
      packlinkServiceId: working.packlinkServiceId,
    };
    if (!working.packlinkRef) {
      packlink = await ensureSendcloudShipment({
        ledger: { ...working, stockNotes: notes },
        order,
        priced: priced.order,
        captureId,
      });
      working = {
        ...working,
        status: "processing",
        stockNotes: notes,
        at: new Date().toISOString(),
        ...packlink,
      };
      // Checkpoint label ref so retries do not create a second paid shipment.
      await writeLedger(working);
    } else {
      packlink = {
        packlinkRef: working.packlinkRef,
        packlinkLabels: working.packlinkLabels || [],
        packlinkError: working.packlinkError,
        packlinkServiceId: working.packlinkServiceId || priced.order.packlink.serviceId,
      };
    }

    const bits = order ? orderEmailBits(order) : { labels: [] as string[], total: undefined };
    const fromInvoice = shipContactFromInvoiceId(order?.purchase_units?.[0]?.invoice_id);
    const customerEmail = (
      fromInvoice.email ||
      order?.payer?.email_address ||
      ""
    ).trim();
    const customerPhone = fromInvoice.phone || "";
    const addressText = shippingAddressText(order, {
      country: dest.country,
      zip: dest.zip,
      note: "Destinazione da checkout",
    });
    const shopBody = formatShopOrderEmail({
      captureId,
      lines,
      stockNotes: notes,
      itemLabels: bits.labels,
      merchandise: `${money(priced.order.merchandise)} EUR`,
      shippingCost: `${money(priced.order.shipping)} EUR`,
      total: bits.total || `${money(priced.order.total)} EUR`,
      customerEmail,
      customerPhone,
      shippingAddress: addressText,
      packlinkRef: packlink.packlinkRef,
      packlinkLabels: packlink.packlinkLabels,
      packlinkError: packlink.packlinkError,
    });
    const customerLocale = localeForCountry(addr?.country_code || dest.country);
    const customerBody = customerOrderText({
      locale: customerLocale,
      metodo: "PayPal",
      ordine: formatCustomerOrderLines({
        captureId,
        lines,
        itemLabels: bits.labels,
        total: bits.total || `${money(priced.order.total)} EUR`,
        locale: customerLocale,
      }),
      identity: await loadShopIdentity(),
    });

    let emailed = Boolean(working.emailed);
    if (!emailed) {
      emailed = await notifyOrder({
        shopSubject: "Ordine shop Corpoceleste (PayPal)",
        shopBody,
        customerTo: customerEmail || order?.payer?.email_address,
        customerSubject: "Conferma d’ordine — Corpoceleste",
        customerBody,
      });
      if (!emailed) {
        const pending: LedgerRecord = {
          ...working,
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
          customer_email: customerEmail || order?.payer?.email_address || "",
          customer_phone: customerPhone,
          shipping_address: addressText,
          ship_country: dest.country,
          ship_zip: dest.zip,
          merchandise: priced.order.merchandise,
          shipping: priced.order.shipping,
          total: priced.order.total,
          lines: priced.order.lines.map((l) => ({
            id: l.id,
            title: l.title,
            size: l.size,
            qty: l.qty,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
          packlink_ref: packlink.packlinkRef || "",
          notes: packlink.packlinkError ? `Sendcloud: ${packlink.packlinkError}` : "",
        });
      }
    } catch (err) {
      console.error("artist sales / shop order ledger failed", err);
    }

    const done: LedgerRecord = {
      ...working,
      status: "done",
      stockNotes: notes,
      stockComplete: true,
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
    const existing = await getLedger(captureId);
    if (existing?.status === "done") return;
    await writeLedger({
      captureId,
      lines: existing?.lines?.length ? existing.lines : lines,
      status: "failed",
      at: new Date().toISOString(),
      error,
      paidTotal,
      expectedTotal,
      stockNotes: existing?.stockNotes,
      stockAppliedKeys: existing?.stockAppliedKeys,
      stockComplete: existing?.stockComplete,
      packlinkRef: existing?.packlinkRef,
      packlinkLabels: existing?.packlinkLabels,
      packlinkError: existing?.packlinkError,
      packlinkServiceId: existing?.packlinkServiceId,
      emailed: existing?.emailed,
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
