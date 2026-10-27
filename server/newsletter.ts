/** Newsletter double opt-in, Turso list, Resend Segment sync, unsubscribe. */

import { createHmac, timingSafeEqual } from "node:crypto";
import { sendMail } from "./mail.js";
import {
  marketingConfigured,
  unsubscribeResendContact,
  upsertNewsletterContact,
} from "./resend-marketing.js";

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

/** Fail-closed: never fall back to CRON/RESEND keys or a hardcoded default. */
function secret() {
  const s = (process.env.NEWSLETTER_SECRET || "").trim();
  if (!s) throw new Error("Missing NEWSLETTER_SECRET");
  return s;
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

/** Long-lived unsubscribe token (1 year). */
export function signNewsletterUnsub(email: string, ttlSec = 365 * 24 * 3600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `unsub|${email.toLowerCase()}|${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest();
  return b64url(Buffer.from(`${payload}|${b64url(sig)}`, "utf8"));
}

export function verifyNewsletterUnsub(token: string): { email: string } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split("|");
    if (parts.length !== 4 || parts[0] !== "unsub") return null;
    const [, email, expStr, sigB64] = parts;
    const exp = Number(expStr);
    if (!email?.includes("@") || !Number.isFinite(exp) || exp < Date.now() / 1000) return null;
    const payload = `unsub|${email}|${expStr}`;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const got = Buffer.from(sigB64, "base64url");
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    return { email: email.toLowerCase() };
  } catch {
    return null;
  }
}

export function unsubscribeUrl(email: string) {
  const token = signNewsletterUnsub(email);
  return `${apiPublicBase()}/api/form?nl_unsub=${encodeURIComponent(token)}`;
}

export async function sendNewsletterConfirmEmail(opts: {
  email: string;
  locale?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const locale = opts.locale || "it";
  let token: string;
  try {
    token = signNewsletterConfirm(opts.email, locale);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("newsletter: sign failed", msg);
    return { ok: false, error: msg };
  }
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
    return { stored: false as const, resend: false as const };
  }
  await ensureSchema();
  const db = getDb();
  const normalized = email.toLowerCase();
  const loc = locale || "it";

  await db.execute({
    sql: `INSERT INTO newsletter_subscribers (email, confirmed_at, locale, unsubscribed_at)
          VALUES (?, datetime('now'), ?, NULL)
          ON CONFLICT(email) DO UPDATE SET
            confirmed_at = datetime('now'),
            locale = excluded.locale,
            unsubscribed_at = NULL`,
    args: [normalized, loc],
  });

  let resendOk = false;
  let resendError = "";
  if (marketingConfigured()) {
    const sync = await upsertNewsletterContact(normalized, { resubscribe: true });
    if (sync.ok) {
      resendOk = true;
      if (sync.contactId) {
        await db.execute({
          sql: `UPDATE newsletter_subscribers SET resend_contact_id = ? WHERE email = ?`,
          args: [sync.contactId, normalized],
        });
      }
    } else {
      resendError = sync.error;
      console.error("newsletter: resend sync", sync.error);
    }
  }

  return { stored: true as const, resend: resendOk, resendError };
}

export async function unsubscribeNewsletterSubscriber(email: string) {
  const { portalConfigured, ensureSchema, getDb } = await import("./portal/db.js");
  const normalized = email.toLowerCase();
  let stored = false;
  if (portalConfigured()) {
    await ensureSchema();
    const db = getDb();
    await db.execute({
      sql: `UPDATE newsletter_subscribers SET unsubscribed_at = datetime('now') WHERE email = ?`,
      args: [normalized],
    });
    stored = true;
  }
  const resend = await unsubscribeResendContact(normalized);
  return { stored, resend: resend.ok, resendError: resend.ok ? "" : resend.error };
}

export type NewsletterSubscriberRow = {
  email: string;
  confirmed_at: string;
  locale: string;
  unsubscribed_at: string | null;
  resend_contact_id: string | null;
};

export async function listNewsletterSubscribers(opts?: { includeUnsubscribed?: boolean }) {
  const { portalConfigured, ensureSchema, getDb } = await import("./portal/db.js");
  if (!portalConfigured()) return [];
  await ensureSchema();
  const db = getDb();
  const include = Boolean(opts?.includeUnsubscribed);
  const result = await db.execute({
    sql: include
      ? `SELECT email, confirmed_at, locale, unsubscribed_at, resend_contact_id
         FROM newsletter_subscribers ORDER BY confirmed_at DESC`
      : `SELECT email, confirmed_at, locale, unsubscribed_at, resend_contact_id
         FROM newsletter_subscribers
         WHERE unsubscribed_at IS NULL
         ORDER BY confirmed_at DESC`,
    args: [],
  });
  return result.rows.map((r) => ({
    email: String(r.email || ""),
    confirmed_at: String(r.confirmed_at || ""),
    locale: String(r.locale || "it"),
    unsubscribed_at: r.unsubscribed_at ? String(r.unsubscribed_at) : null,
    resend_contact_id: r.resend_contact_id ? String(r.resend_contact_id) : null,
  })) as NewsletterSubscriberRow[];
}

/** Push all active Turso subscribers to the Resend segment. */
export async function syncAllNewsletterToResend() {
  if (!marketingConfigured()) {
    return { ok: false as const, error: "Marketing Resend non configurato (SEGMENT_ID)", synced: 0, failed: 0 };
  }
  const rows = await listNewsletterSubscribers({ includeUnsubscribed: false });
  let synced = 0;
  let failed = 0;
  const { getDb, ensureSchema, portalConfigured } = await import("./portal/db.js");
  if (portalConfigured()) await ensureSchema();
  const db = portalConfigured() ? getDb() : null;

  for (const row of rows) {
    const sync = await upsertNewsletterContact(row.email, { resubscribe: false });
    if (sync.ok) {
      synced += 1;
      if (db && sync.contactId) {
        await db.execute({
          sql: `UPDATE newsletter_subscribers SET resend_contact_id = ? WHERE email = ?`,
          args: [sync.contactId, row.email],
        });
      }
    } else {
      failed += 1;
      console.error("newsletter sync", row.email, sync.error);
    }
  }
  return { ok: true as const, synced, failed, total: rows.length };
}
