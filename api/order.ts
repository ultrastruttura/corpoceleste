import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { customerOrderText } from "../server/customer-mail.js";
import { field, isHoney, parseForm, thanksUrl } from "../server/form-body.js";
import { nowRome, sendMail } from "../server/mail.js";
import { money, parseShipDest, priceOrderLines } from "../server/order-pricing.js";
import type { OrderLine } from "../src/lib/paypal-lines.js";
import type { PricedOrder } from "../server/order-pricing.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const limited = await abuseLimit(req, "order", 5, 15 * 60);
  if (!limited.ok) {
    res.setHeader("Retry-After", String(limited.retryAfterSec || 60));
    return res.status(429).send("Too many requests");
  }

  const body = parseForm(req);
  const next = thanksUrl(body, "ordine");
  if (isHoney(body)) return res.redirect(303, next);

  const nome = field(body, "nome");
  const email = field(body, "email");
  if (!nome || !email || !email.includes("@")) {
    return res.status(400).send("Missing fields");
  }

  const dest = parseShipDest({
    country: field(body, "shipCountry"),
    zip: field(body, "shipZip"),
  });
  if (!dest) return res.status(400).send("Invalid shipping destination");

  let ordine = field(body, "ordine");
  let pricedOrder: PricedOrder | null = null;
  const linesRaw = field(body, "lines");
  if (linesRaw) {
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
  }

  if (!ordine) return res.status(400).send("Missing fields");

  const locale = field(body, "locale") || "it";
  const when = nowRome(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "it-IT");
  const shopTo = (process.env.SHOP_EMAIL || "").trim();
  const phone = field(body, "telefono");
  const address = field(body, "indirizzo");
  const city = field(body, "citta");
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

  let mailed = true;
  if (shopTo) {
    const shop = await sendMail({
      to: shopTo,
      subject: "Ordine shop Corpoceleste (bonifico)",
      text: recap,
    });
    mailed = shop.ok && mailed;
  } else {
    mailed = false;
  }

  const customer = await sendMail({
    to: email,
    subject: "Conferma d’ordine — Corpoceleste",
    text: customerOrderText({ locale, metodo: "Bonifico", ordine: recap, when }),
  });
  mailed = customer.ok && mailed;

  if (!mailed) {
    console.error("order: mail failed");
    return res.status(502).send("Mail failed");
  }

  if (pricedOrder) {
    try {
      const { portalConfigured, newId } = await import("../server/portal/db.js");
      if (portalConfigured()) {
        const { upsertShopOrder } = await import("../server/portal/orders.js");
        const shippingAddress = [address, `${dest.zip} ${city}`.trim(), dest.country]
          .filter(Boolean)
          .join("\n");
        await upsertShopOrder({
          external_id: newId("bank"),
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
      }
    } catch (err) {
      console.error("order: shop order save failed", err);
    }
  }

  return res.redirect(303, next);
}
