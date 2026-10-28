import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Handler eventi Sendcloud (status / tracking).
 * Esposto come /api/sendcloud-webhook (bodyParser: false).
 * Verifica header `Sendcloud-Signature` = HMAC-SHA256(raw body, secret key).
 */

async function rawBody(req: VercelRequest): Promise<string> {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  // Prefer stream when bodyParser is disabled (Vercel may leave body unset).
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
  // Last resort — may fail HMAC if Vercel already parsed JSON.
  return JSON.stringify(req.body);
}

function signatureOk(body: string, header: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  const got = header.trim().toLowerCase();
  const exp = expected.toLowerCase();
  if (!got || got.length !== exp.length) return false;
  try {
    return timingSafeEqual(Buffer.from(got), Buffer.from(exp));
  } catch {
    return false;
  }
}

export async function handleSendcloudWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET" || req.method === "HEAD") {
    return res.status(200).json({ ok: true, provider: "sendcloud" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = (
    process.env.SENDCLOUD_WEBHOOK_SECRET ||
    process.env.SENDCLOUD_SECRET_KEY ||
    ""
  ).trim();
  if (!secret) {
    console.warn("[sendcloud-webhook] SENDCLOUD_SECRET_KEY unset — rejecting POST");
    return res.status(503).json({ error: "Webhook not configured" });
  }

  const headerRaw = req.headers["sendcloud-signature"];
  const signature = String(Array.isArray(headerRaw) ? headerRaw[0] : headerRaw || "");
  const body = await rawBody(req);
  if (!signatureOk(body, signature, secret)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let event = "";
    try {
      const parsed = JSON.parse(body) as { action?: string; type?: string; parcel?: { id?: unknown } };
      event = String(parsed.action || parsed.type || "");
      const parcelId = parsed.parcel?.id;
      console.log("[sendcloud-webhook]", event || "ok", parcelId != null ? `parcel ${parcelId}` : "");
    } catch {
      console.log("[sendcloud-webhook]", "ok", body.length);
    }
  } catch (err) {
    console.error("[sendcloud-webhook] read", err);
  }

  return res.status(200).json({ ok: true });
}

export function isSendcloudWebhookRequest(req: VercelRequest) {
  const q = req.query?.sendcloud_hook;
  const flag = Array.isArray(q) ? q[0] : q;
  if (String(flag || "") === "1") return true;
  const url = String(req.url || "");
  return url.includes("sendcloud-webhook") || url.includes("sendcloud_hook=1");
}
