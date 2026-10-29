import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { unsubscribeNewsletterSubscriber } from "./newsletter.js";

/**
 * Resend webhooks (Svix) → sync Turso when a contact unsubscribes from Broadcasts.
 * Esposto come /api/resend-webhook (rewrite → /api/form?resend_hook=1).
 * Env: RESEND_WEBHOOK_SECRET (whsec_… from Resend → Webhooks).
 */

async function rawBody(req: VercelRequest): Promise<string> {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.body == null) {
    const chunks: Buffer[] = [];
    try {
      const stream = req as unknown as AsyncIterable<Buffer | string>;
      for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
    } catch {
      return "";
    }
    if (chunks.length) return Buffer.concat(chunks).toString("utf8");
    return "";
  }
  return JSON.stringify(req.body);
}

function header(req: VercelRequest, name: string) {
  const raw = req.headers[name];
  return String(Array.isArray(raw) ? raw[0] : raw || "");
}

/** Svix verify without adding the `svix` package. */
function verifySvix(payload: string, req: VercelRequest, secret: string): boolean {
  const msgId = header(req, "svix-id");
  const msgTimestamp = header(req, "svix-timestamp");
  const msgSignature = header(req, "svix-signature");
  if (!msgId || !msgTimestamp || !msgSignature) return false;

  const ts = Number(msgTimestamp);
  if (!Number.isFinite(ts)) return false;
  // 5-minute tolerance (replay protection).
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const keyPart = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(keyPart, "base64");
  } catch {
    return false;
  }

  const toSign = `${msgId}.${msgTimestamp}.${payload}`;
  const expected = createHmac("sha256", key).update(toSign).digest("base64");

  for (const part of msgSignature.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export function isResendWebhookRequest(req: VercelRequest) {
  const q = req.query?.resend_hook;
  const flag = Array.isArray(q) ? q[0] : q;
  if (String(flag || "") === "1") return true;
  const url = String(req.url || "");
  return url.includes("resend-webhook") || url.includes("resend_hook=1");
}

export async function handleResendWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET" || req.method === "HEAD") {
    return res.status(200).json({ ok: true, provider: "resend" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = (process.env.RESEND_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    console.warn("[resend-webhook] RESEND_WEBHOOK_SECRET unset — rejecting POST");
    return res.status(503).json({ error: "Webhook not configured" });
  }

  const body = await rawBody(req);
  if (!verifySvix(body, req, secret)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let type = "";
  let email = "";
  let unsubscribed: boolean | null = null;
  try {
    const parsed = JSON.parse(body) as {
      type?: string;
      data?: { email?: string; unsubscribed?: boolean };
    };
    type = String(parsed.type || "");
    email = String(parsed.data?.email || "")
      .trim()
      .toLowerCase();
    if (typeof parsed.data?.unsubscribed === "boolean") {
      unsubscribed = parsed.data.unsubscribed;
    }
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  console.log("[resend-webhook]", type || "ok", email || "", unsubscribed);

  if (type === "contact.updated" && email && unsubscribed === true) {
    try {
      // Resend already flipped the contact — only Turso + notify Andrea.
      await unsubscribeNewsletterSubscriber(email, { skipResend: true });
    } catch (err) {
      console.error("[resend-webhook] unsub sync", err);
      return res.status(500).json({ error: "Sync failed" });
    }
  }

  return res.status(200).json({ ok: true });
}
