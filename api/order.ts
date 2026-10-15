import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { field, isHoney, parseForm, thanksUrl } from "../server/form-body.js";
import { sendMail } from "../server/mail.js";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import { cors, requireSiteOrigin } from "../server/portal/http.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";
import type { PricedOrder } from "../server/order-pricing.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  if (!requireSiteOrigin(req, res)) return;

  const body = parseForm(req);
  const next = thanksUrl(body, "ordine");
  if (isHoney(body)) return res.redirect(303, next);

  const nome = field(body, "nome");
  const email = field(body, "email");
  const phone = field(body, "telefono");
  const address = field(body, "indirizzo");
  const city = field(body, "citta");
  if (!nome || !email || !email.includes("@") || !address || !city) {
    return res.status(400).send("Missing fields");
  }

  const limited = await abuseLimit(req, "order", 3, 60 * 60, { email });
  if (!limited.ok) {
    res.setHeader("Retry-After", String(limited.retryAfterSec || 60));
    return res.status(429).send("Too many requests");
  }

  const dest = parseShipDest({
    country: field(body, "shipCountry"),
    zip: field(body, "shipZip"),
  });
  if (!dest) return res.status(400).send("Invalid shipping destination");

  const linesRaw = field(body, "lines");
  if (!linesRaw) return res.status(400).send("Missing cart lines");

  let ordine = "";
  let pricedOrder: PricedOrder | null = null;
  try {
    const parsed = JSON.parse(linesRaw) as OrderLine[];
    const priced = await priceOrderLines(Array.isArray(parsed) ? parsed : [], dest);
    if (priced.ok === false) return res.status(400).send(priced.error);
    pricedOrder = priced.order;
    const carrier = priced.order.packlink.carrier
      ? ` · ${priced.order.packlink.carrier}`
      : "";
    ordine = [
      ...priced.order.lines.map(
        (l) => `${l.title} · ${l.size} · ×${l.qty} · ${money(l.lineTotal)}€`,
      ),
      `Spedizione ${money(priced.order.shipping)}€ (${priced.order.shipCountry} ${priced.order.shipZip}${carrier})`,
      `Totale ${money(priced.order.total)}€`,
    ].join("\n");
  } catch {
    return res.status(400).send("Invalid lines");
  }

  const shopTo = (process.env.SHOP_EMAIL || "").trim();
  const note = field(body, "note");
  const recap = [
    `Nome: ${nome}`,
    `Email: ${email}`,
    `Telefono: ${phone}`,
    `Indirizzo: ${address}`,
    `CAP: ${dest.zip}`,
    `Città: ${city}`,
    `Paese: ${dest.country}`,
    note ? `Note: ${note}` : "",
    "",
    ordine,
  ]
    .filter(Boolean)
    .join("\n");

  if (!shopTo) {
    console.error("order: SHOP_EMAIL missing");
    return res.status(503).send("Mail not configured");
  }

  const { newId, portalConfigured } = await import("../server/portal/db.js");
  const bankId = newId("bank");

  // Hold GitHub stock before notifying the shop (parity with PayPal webhook).
  // True OOS → reject. Infra/token errors → still take the order and warn in the shop mail
  // (bonifico is not paid yet; losing the request is worse than a manual stock tweak).
  let stockNote = "";
  if (pricedOrder && (process.env.GITHUB_TOKEN || "").trim()) {
    const stockLines = pricedOrder.lines.map((l) => ({
      id: l.id,
      size: l.size,
      qty: l.qty,
    }));
    try {
      const {
        claimOrResumeLedger,
        applyStockDecrementCheckpointed,
        writeLedger,
        LedgerBusyError,
      } = await import("../server/github-stock.js");
      const claim = await claimOrResumeLedger(bankId, stockLines, {
        expectedTotal: money(pricedOrder.total),
      });
      if (claim.action === "process" && !claim.ledger.stockComplete) {
        const held = await applyStockDecrementCheckpointed(
          claim.ledger,
          stockLines,
          writeLedger,
        );
        await writeLedger({
          ...held,
          status: "done",
          stockComplete: true,
          at: new Date().toISOString(),
        });
        stockNote = held.stockNotes?.length
          ? `Magazzino:\n${held.stockNotes.join("\n")}`
          : "Magazzino: aggiornato";
      } else if (claim.action === "skip") {
        stockNote = "Magazzino: già scalato (ledger)";
      }
    } catch (err) {
      const { LedgerBusyError } = await import("../server/github-stock.js");
      if (err instanceof LedgerBusyError) {
        return res.status(503).send("Stock busy, retry");
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error("order: stock hold failed", msg);
      if (msg.includes("INSUFFICIENT_STOCK")) {
        return res.status(409).send("Out of stock");
      }
      // Do not block bonifico on GitHub/API failures — ask shop to adjust stock by hand.
      stockNote = `Magazzino: NON aggiornato automaticamente (${msg.slice(0, 200)}). Aggiorna a mano su Tina.`;
    }
  } else if (pricedOrder) {
    stockNote = "Magazzino: GITHUB_TOKEN assente — aggiorna a mano su Tina.";
  }

  // Only mail the shop — no Resend to attacker-controlled customer email.
  const shop = await sendMail({
    to: shopTo,
    subject: "Ordine shop Corpoceleste (bonifico)",
    text: [recap, "", stockNote].filter(Boolean).join("\n"),
  });
  if (!shop.ok) {
    console.error("order: mail failed");
    return res.status(502).send("Mail failed");
  }

  if (pricedOrder && portalConfigured()) {
    try {
      const { upsertShopOrder } = await import("../server/portal/orders.js");
      const shippingAddress = [address, `${dest.zip} ${city}`.trim(), dest.country]
        .filter(Boolean)
        .join("\n");
      await upsertShopOrder({
        external_id: bankId,
        source: "bank",
        customer_name: nome,
        customer_email: email,
        customer_phone: phone,
        shipping_address: shippingAddress,
        ship_country: dest.country,
        ship_zip: dest.zip,
        merchandise: pricedOrder.merchandise,
        shipping: pricedOrder.shipping,
        total: pricedOrder.total,
        lines: pricedOrder.lines.map((l) => ({
          title: l.title,
          size: l.size,
          qty: l.qty,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
        notes: note,
      });
    } catch (err) {
      console.error("order: shop order save failed", err);
    }
  }

  return res.redirect(303, next);
}
