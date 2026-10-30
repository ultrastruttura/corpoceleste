import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { customerWithdrawalText } from "../server/customer-mail.js";
import { field, isEmail, isHoney, parseForm, thanksUrl } from "../server/form-body.js";
import { nowRome, sendMail } from "../server/mail.js";
import { cors, requireSiteOrigin } from "../server/portal/http.js";
import { assertTurnstile } from "../server/turnstile.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  if (!requireSiteOrigin(req, res)) return;

  const body = parseForm(req);
  const next = thanksUrl(body, "recesso");
  if (isHoney(body)) return res.redirect(303, next);
  if (!(await assertTurnstile(req, body))) {
    return res.status(403).send("Bot check failed");
  }

  // Caps: the acknowledgement must echo the withdrawal content, so limit size instead of dropping it.
  const name = field(body, "nome").slice(0, 120);
  const email = field(body, "email");
  const orderRef = field(body, "ordine").slice(0, 80);
  if (!name || !orderRef || !isEmail(email)) {
    return res.status(400).send("Missing fields");
  }

  const limited = await abuseLimit(req, "withdrawal", 3, 60 * 60, { email });
  if (!limited.ok) {
    res.setHeader("Retry-After", String(limited.retryAfterSec || 60));
    if (limited.unavailable) return res.status(503).send("Service unavailable");
    return res.status(429).send("Too many requests");
  }

  const locale = field(body, "locale") || "it";
  const when = nowRome(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "it-IT");
  const received = field(body, "consegna").slice(0, 40);
  const note = field(body, "note").slice(0, 1000);
  const shopTo = (process.env.SHOP_EMAIL || "").trim();
  const ack = customerWithdrawalText({ locale, name, orderRef, received, note, when });

  // Shop always; customer ack is legally useful but capped hard by IP+email rate limit.
  if (!shopTo) {
    console.error("withdrawal: SHOP_EMAIL missing");
    return res.status(503).send("Mail not configured");
  }
  const shop = await sendMail({
    to: shopTo,
    subject: "Recesso — Corpoceleste",
    text: ack,
  });
  if (!shop.ok) {
    console.error("withdrawal: shop mail failed");
    return res.status(502).send("Mail failed");
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
  if (!customer.ok) {
    console.error("withdrawal: customer mail failed");
    // Shop already notified — still complete UX; avoid blocking consumer on Resend blip.
  }

  return res.redirect(303, next);
}
