import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { customerWithdrawalText } from "../server/customer-mail.js";
import { field, isHoney, parseForm, thanksUrl } from "../server/form-body.js";
import { nowRome, sendMail } from "../server/mail.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const limited = await abuseLimit(req, "withdrawal", 5, 15 * 60);
  if (!limited.ok) {
    res.setHeader("Retry-After", String(limited.retryAfterSec || 60));
    return res.status(429).send("Too many requests");
  }

  const body = parseForm(req);
  const next = thanksUrl(body, "recesso");
  if (isHoney(body)) return res.redirect(303, next);

  const name = field(body, "nome");
  const email = field(body, "email");
  const orderRef = field(body, "ordine");
  if (!name || !email || !orderRef || !email.includes("@")) {
    return res.status(400).send("Missing fields");
  }

  const locale = field(body, "locale") || "it";
  const when = nowRome(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "it-IT");
  const received = field(body, "consegna");
  const note = field(body, "note");
  const shopTo = (process.env.SHOP_EMAIL || "").trim();
  const ack = customerWithdrawalText({ locale, name, orderRef, received, note, when });

  let mailed = true;
  if (shopTo) {
    const shop = await sendMail({
      to: shopTo,
      subject: "Recesso — Corpoceleste",
      text: ack,
    });
    mailed = shop.ok && mailed;
  } else {
    mailed = false;
  }

  const customer = await sendMail({
    to: email,
    subject:
      locale === "en"
        ? "Acknowledgement of withdrawal — Corpoceleste"
        : locale === "de"
          ? "Empfangsbestätigung Widerruf — Corpoceleste"
          : "Avviso di ricevimento del recesso — Corpoceleste",
    text: ack,
  });
  mailed = customer.ok && mailed;

  if (!mailed) {
    console.error("withdrawal: mail failed");
    return res.status(502).send("Mail failed");
  }

  return res.redirect(303, next);
}
