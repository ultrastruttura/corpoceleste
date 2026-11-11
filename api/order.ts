import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { bankOrderSubject, customerBankOrderText } from "../server/customer-mail.js";
import { field, isEmail, isHoney, parseForm, thanksUrl } from "../server/form-body.js";
import { sendMail } from "../server/mail.js";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import { cors, requireSiteOrigin } from "../server/portal/http.js";
import { loadShopIdentity } from "../server/shop-identity.js";
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

  const nome = field(body, "nome").slice(0, 120);
  const email = field(body, "email");
  const phone = field(body, "telefono").slice(0, 40);
  const address = field(body, "indirizzo").slice(0, 200);
  const city = field(body, "citta").slice(0, 100);
  if (!nome || !isEmail(email) || !address || !city) {
    return res.status(400).send("Missing fields");
  }

  const limited = await abuseLimit(req, "order", 2, 60 * 60, { email });
  if (!limited.ok) {
    res.setHeader("Retry-After", String(limited.retryAfterSec || 60));
    if (limited.unavailable) return res.status(503).send("Service unavailable");
    return res.status(429).send("Too many requests");
  }

  const delivery = field(body, "delivery") === "pickup" ? "pickup" : "ship";
  const dest = parseShipDest({
    country: field(body, "shipCountry"),
    zip: field(body, "shipZip"),
    city: field(body, "citta"),
    province: field(body, "provincia"),
  });
  if (!dest) return res.status(400).send("Invalid shipping destination");

  const linesRaw = field(body, "lines");
  if (!linesRaw) return res.status(400).send("Missing cart lines");

  let ordine = "";
  let pricedOrder: PricedOrder | null = null;
  try {
    const parsed = JSON.parse(linesRaw) as OrderLine[];
    const priced = await priceOrderLines(Array.isArray(parsed) ? parsed : [], dest, {
      delivery,
    });
    if (priced.ok === false) return res.status(400).send(priced.error);
    pricedOrder = priced.order;
    const carrier = priced.order.packlink.carrier
      ? ` · ${priced.order.packlink.carrier}`
      : "";
    const shipLabel =
      delivery === "pickup"
        ? `Ritiro a mano ${money(priced.order.shipping)}€${carrier}`
        : `Spedizione ${money(priced.order.shipping)}€ (${priced.order.shipCountry} ${priced.order.shipZip}${carrier})`;
    ordine = [
      ...priced.order.lines.map(
        (l) => `${l.title} · ${l.size} · ×${l.qty} · ${money(l.lineTotal)}€`,
      ),
      shipLabel,
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
    delivery === "pickup"
      ? "Consegna: ritiro a mano zona Bergamo (tempi da concordare)"
      : `Indirizzo: ${address}`,
    delivery === "pickup" ? "" : `CAP: ${dest.zip}`,
    delivery === "pickup" ? `Città contatto: ${city}` : `Città: ${city}`,
    delivery === "pickup" ? "" : `Paese: ${dest.country}`,
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
  if (!portalConfigured()) {
    console.error("order: Turso portal not configured — cannot assign order number");
    return res.status(503).send("Orders unavailable");
  }
  if (!pricedOrder) return res.status(400).send("Invalid lines");

  const bankId = newId("bank");

  // Soft-hold: stock is checked in priceOrderLines but only decremented when admin
  // marks the bonifico paid (avoids unpaid orders locking inventory for days).
  const stockNote = (process.env.GITHUB_TOKEN || "").trim()
    ? "Magazzino: verrà scalato alla conferma bonifico (area personale)."
    : "Magazzino: GITHUB_TOKEN assente — aggiorna a mano su Tina alla conferma.";

  // Same yearly sequence as PayPal (1/26, 2/26…) — required before customer mail / causale.
  let orderNumber = "";
  try {
    const { upsertShopOrder } = await import("../server/portal/orders.js");
    const shippingAddress = [address, `${dest.zip} ${city}`.trim(), dest.country]
      .filter(Boolean)
      .join("\n");
    const saved = await upsertShopOrder({
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
        id: l.id,
        title: l.title,
        size: l.size,
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
      })),
      notes: note,
      paid_at: null,
    });
    if (saved?.number && saved.number !== "—") orderNumber = saved.number;
  } catch (err) {
    console.error("order: shop order save failed", err);
  }
  if (!orderNumber) {
    console.error("order: missing shop order number after upsert");
    return res.status(503).send("Could not assign order number");
  }

  const identity = await loadShopIdentity();
  const locale = field(body, "locale") || "it";
  const totalStr = money(pricedOrder.total);
  const shippingStr = money(pricedOrder.shipping);
  const merchandiseStr = money(pricedOrder.merchandise);
  const customerBody = customerBankOrderText({
    locale,
    orderRef: orderNumber,
    identity,
    total: totalStr,
    shipping: shippingStr,
    merchandise: merchandiseStr,
    ordine: [
      `${locale === "en" ? "Order reference" : locale === "de" ? "Bestellnummer" : "Riferimento ordine"}: ${orderNumber}`,
      `${locale === "en" || locale === "de" ? "Name" : "Nome"}: ${nome}`,
      "",
      ordine,
    ].join("\n"),
  });

  const shop = await sendMail({
    to: shopTo,
    subject: `Ordine shop Corpoceleste (bonifico) ${orderNumber}`,
    text: [
      recap,
      "",
      `Causale cliente: ${orderNumber}`,
      `IBAN indicato: ${identity.iban}`,
      "",
      stockNote,
    ]
      .filter(Boolean)
      .join("\n"),
  });
  if (shop.ok === false) {
    console.error("order: shop mail failed");
    return res.status(502).send("Mail failed");
  }

  const customer = await sendMail({
    to: email,
    subject: bankOrderSubject(locale, orderNumber),
    text: customerBody,
  });
  if (customer.ok === false) {
    console.error("order: customer mail failed", customer.error);
    await sendMail({
      to: shopTo,
      subject: `ATTENZIONE: mail cliente fallita — ${orderNumber}`,
      text: `Ordine ${orderNumber} salvato ma la conferma a ${email} non è partita: ${customer.error}\n\nInvia a mano IBAN + causale ${orderNumber}.`,
    });
  }

  try {
    const thanks = new URL(next);
    thanks.searchParams.set("ref", orderNumber);
    return res.redirect(303, thanks.toString());
  } catch {
    return res.redirect(303, next);
  }
}
