import type { VercelRequest, VercelResponse } from "@vercel/node";
import { abuseLimit } from "../server/abuse-limit.js";
import { field, isHoney, parseForm, safeSubject, thanksUrl } from "../server/form-body.js";
import { sendMail } from "../server/mail.js";

const SKIP = new Set(["_honey", "_next", "_gotcha", "privacy", "privacy_newsletter"]);

/** Generic site forms → Resend to shop. Contact, newsletter, workshops, consulting, reprint. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

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
    return res.status(429).send("Too many requests");
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
  if (/consulenza/i.test(s)) return "consulenza";
  if (/workshop in studio|iscrizione workshop/i.test(s)) return "corsi";
  if (/workshop presso|proposta workshop/i.test(s)) return "workshop";
  if (/contatto/i.test(s)) return "contatto";
  const m = /[?&]from=([^&]+)/.exec(next);
  if (m) return decodeURIComponent(m[1]);
  return "form";
}
