/** Newsletter double opt-in (confirm link + Turso list when portal is configured). */

import { createHmac, timingSafeEqual } from "node:crypto";
import { sendMail } from "./mail.js";

/** Public Vercel API origin (newsletter confirm must not hit GitHub Pages). */
function apiPublicBase() {
  const raw = (
    process.env.SITE_API_URL ||
    process.env.FORM_API_BASE ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://corpoceleste.vercel.app"
  ).trim();
  return raw.replace(/\/$/, "");
}

function secret() {
  return (
    (process.env.NEWSLETTER_SECRET || "").trim() ||
    (process.env.CRON_SECRET || "").trim() ||
    (process.env.RESEND_API_KEY || "").trim() ||
    "corpoceleste-newsletter-dev"
  );
}

function b64url(buf: Buffer) {
  return buf.toString("base64url");
}

export function signNewsletterConfirm(email: string, locale: string, ttlSec = 48 * 3600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${email.toLowerCase()}|${locale}|${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest();
  return b64url(Buffer.from(`${payload}|${b64url(sig)}`, "utf8"));
}

export function verifyNewsletterConfirm(token: string): { email: string; locale: string } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split("|");
    if (parts.length !== 4) return null;
    const [email, locale, expStr, sigB64] = parts;
    const exp = Number(expStr);
    if (!email?.includes("@") || !Number.isFinite(exp) || exp < Date.now() / 1000) return null;
    const payload = `${email}|${locale}|${expStr}`;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const got = Buffer.from(sigB64, "base64url");
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    return { email: email.toLowerCase(), locale: locale || "it" };
  } catch {
    return null;
  }
}

export async function sendNewsletterConfirmEmail(opts: {
  email: string;
  locale?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const locale = opts.locale || "it";
  const token = signNewsletterConfirm(opts.email, locale);
  const url = `${apiPublicBase()}/api/form?nl_confirm=${encodeURIComponent(token)}`;
  const text =
    locale === "en"
      ? [
          "Confirm your Corpoceleste newsletter subscription",
          "",
          "Click the link below (valid 48 hours):",
          url,
          "",
          "If you did not request this, ignore this email.",
        ].join("\n")
      : locale === "de"
        ? [
            "Newsletter Corpoceleste bestätigen",
            "",
            "Klicke den Link (48 Stunden gültig):",
            url,
            "",
            "Falls du das nicht angefordert hast, ignoriere diese E-Mail.",
          ].join("\n")
        : [
            "Conferma iscrizione newsletter Corpoceleste",
            "",
            "Clicca il link qui sotto (valido 48 ore):",
            url,
            "",
            "Se non hai chiesto tu l’iscrizione, ignora questa email.",
          ].join("\n");

  const subject =
    locale === "en"
      ? "Confirm newsletter — Corpoceleste"
      : locale === "de"
        ? "Newsletter bestätigen — Corpoceleste"
        : "Conferma newsletter — Corpoceleste";

  return sendMail({ to: opts.email, subject, text });
}

export async function confirmNewsletterSubscriber(email: string, locale: string) {
  const { portalConfigured, ensureSchema, getDb } = await import("./portal/db.js");
  if (!portalConfigured()) {
    return { stored: false as const };
  }
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO newsletter_subscribers (email, confirmed_at, locale)
          VALUES (?, datetime('now'), ?)
          ON CONFLICT(email) DO UPDATE SET confirmed_at = datetime('now'), locale = excluded.locale`,
    args: [email.toLowerCase(), locale || "it"],
  });
  return { stored: true as const };
}
