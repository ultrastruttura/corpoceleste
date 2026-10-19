import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import {
  bufferRequestBody,
  field,
  isHoney,
  parseForm,
  safeSubject,
  thanksUrl,
} from "../server/form-body.js";
import { sendMail, siteBase } from "../server/mail.js";
import {
  confirmNewsletterSubscriber,
  sendNewsletterConfirmEmail,
  verifyNewsletterConfirm,
} from "../server/newsletter.js";
import { cors, requireSiteOrigin } from "../server/portal/http.js";
import {
  handleSendcloudWebhook,
  isSendcloudWebhookRequest,
} from "../server/sendcloud-webhook-handler.js";

/** Raw body for Sendcloud HMAC; form POSTs buffered then urlencoded-parsed. */
export const config = {
  api: {
    bodyParser: false,
  },
};

const SKIP = new Set(["_honey", "_next", "_gotcha", "privacy", "privacy_newsletter"]);

function queryFlag(req: VercelRequest, key: string) {
  const v = req.query[key];
  return typeof v === "string" ? v : Array.isArray(v) ? String(v[0] || "") : "";
}

function cronAuthorized(req: VercelRequest) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  const auth = String(req.headers.authorization || "");
  return auth === `Bearer ${secret}`;
}

/** Release unpaid PayPal holds (3h) and legacy bank holds (48h). Cron or CRON_SECRET. */
async function runStockReleaseJob(res: VercelResponse) {
  if (!(process.env.GITHUB_TOKEN || "").trim()) {
    return res.status(503).json({ error: "GITHUB_TOKEN missing" });
  }
  const { releaseExpiredPaypalHolds, releaseExpiredBankHolds } = await import(
    "../server/github-stock.js"
  );
  const paypal = await releaseExpiredPaypalHolds();
  let bank: string[] = [];
  try {
    const { portalConfigured } = await import("../server/portal/db.js");
    if (portalConfigured()) {
      const { isShopOrderPaidByExternalId } = await import("../server/portal/orders.js");
      bank = await releaseExpiredBankHolds((id) => isShopOrderPaidByExternalId(id));
    } else {
      // Without portal, treat all bank holds as unpaid after TTL.
      bank = await releaseExpiredBankHolds(async () => false);
    }
  } catch (err) {
    console.error("form: bank release", err);
  }
  return res.status(200).json({ ok: true, paypalReleased: paypal, bankReleased: bank });
}

/**
 * Generic site forms → Resend to shop. Contact, newsletter, workshops, consulting, reprint.
 * Also: newsletter confirm (?nl_confirm=), stock cron (?job=stock_release).
 * Sendcloud: rewrite /api/sendcloud-webhook → here (Hobby function budget).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Must run before bufferRequestBody — HMAC needs the untouched stream/body.
  if (isSendcloudWebhookRequest(req)) {
    return handleSendcloudWebhook(req, res);
  }

  const job = queryFlag(req, "job");
  if (job === "stock_release") {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).send("Method not allowed");
    }
    if (!cronAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      return await runStockReleaseJob(res);
    } catch (err) {
      console.error("form: stock_release", err);
      return res.status(500).json({ error: "Release failed" });
    }
  }

  const nlToken = queryFlag(req, "nl_confirm");
  if (nlToken) {
    if (req.method !== "GET") return res.status(405).send("Method not allowed");
    const parsed = verifyNewsletterConfirm(nlToken);
    // Thank-you page lives on the static site, not on Vercel.
    const thanks = `${siteBase()}/grazie/?from=newsletter`;
    if (!parsed) {
      return res.status(400).send("Link non valido o scaduto");
    }
    try {
      const result = await confirmNewsletterSubscriber(parsed.email, parsed.locale);
      const shopTo = (process.env.SHOP_EMAIL || "").trim();
      if (shopTo) {
        await sendMail({
          to: shopTo,
          subject: "Newsletter confermata — Corpoceleste",
          text: `Email: ${parsed.email}\nLocale: ${parsed.locale}\nLista Turso: ${result.stored ? "sì" : "no (portal off)"}`,
        });
      }
    } catch (err) {
      console.error("form: nl confirm", err);
    }
    return res.redirect(303, thanks);
  }

  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  cors(req, res);
  if (!requireSiteOrigin(req, res)) return;

  await bufferRequestBody(req);
  const body = parseForm(req);
  const subject = safeSubject(field(body, "_subject"), "Messaggio dal sito Corpoceleste");
  const fromKey = guessFrom(subject, field(body, "_next"));
  const next = thanksUrl(body, fromKey);
  if (isHoney(body)) return res.redirect(303, next);

  const email = field(body, "email");
  if (!email || !email.includes("@")) {
    return res.status(400).send("Missing email");
  }

  const limited = await abuseLimit(req, "form", 5, 60 * 60, { email });
  if (!limited.ok) {
    res.setHeader("Retry-After", String(limited.retryAfterSec || 60));
    if (limited.unavailable) return res.status(503).send("Service unavailable");
    return res.status(429).send("Too many requests");
  }

  // Newsletter: double opt-in — confirm email to subscriber, not yet to shop list.
  if (fromKey === "newsletter") {
    const locale = field(body, "locale") || "it";
    const sent = await sendNewsletterConfirmEmail({ email, locale });
    if (!sent.ok) {
      console.error("form: newsletter confirm mail failed", sent.error);
      return res.status(502).send("Mail failed");
    }
    return res.redirect(303, next);
  }

  const shopTo = (process.env.SHOP_EMAIL || "").trim();
  if (!shopTo) {
    console.warn("form: SHOP_EMAIL missing");
    return res.status(503).send("Mail not configured");
  }

  const lines: string[] = [];
  for (const [key, raw] of Object.entries(body)) {
    if (SKIP.has(key) || key.startsWith("_")) continue;
    const value = Array.isArray(raw) ? raw.map(String).join(", ") : String(raw ?? "").trim();
    if (!value) continue;
    lines.push(`${key}: ${value.slice(0, 2000)}`);
  }
  if (!lines.length) {
    return res.status(400).send("Empty form");
  }

  const ok = await sendMail({
    to: shopTo,
    subject,
    text: lines.join("\n"),
  });
  if (ok.ok === false) {
    console.error("form: Resend failed for", subject, ok.error);
    return res.status(502).send("Mail failed");
  }

  return res.redirect(303, next);
}

function guessFrom(subject: string, next: string) {
  const s = subject.toLowerCase();
  if (/newsletter/i.test(s)) return "newsletter";
  if (/ristampa/i.test(s)) return "ristampa";
  if (/\bbio\b/i.test(s)) return "bio";
  if (/workshop in studio|iscrizione workshop/i.test(s)) return "corsi";
  if (/workshop presso|proposta workshop/i.test(s)) return "workshop";
  if (/contatto/i.test(s)) return "contatto";
  const m = /[?&]from=([^&]+)/.exec(next);
  if (m) return decodeURIComponent(m[1]);
  return "form";
}
