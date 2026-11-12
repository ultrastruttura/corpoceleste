import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Handler eventi Sendcloud (status / tracking).
 * Esposto come /api/sendcloud-webhook (bodyParser: false).
 * Verifica header `Sendcloud-Signature` = HMAC-SHA256(raw body, secret).
 * Sendcloud firma con Webhook Signature Key oppure con SENDCLOUD_SECRET_KEY
 * a seconda del tipo di integrazione — accettiamo entrambi.
 */

async function rawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  try {
    const stream = req as unknown as AsyncIterable<Buffer | string>;
    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
  } catch {
    // Stream already consumed or unavailable.
  }
  if (chunks.length) return Buffer.concat(chunks);
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  if (Buffer.isBuffer(req.body)) return req.body;
  // Last resort — may fail HMAC if Vercel already parsed JSON.
  if (req.body != null) return Buffer.from(JSON.stringify(req.body), "utf8");
  return Buffer.alloc(0);
}

function normalizeSignature(header: string): string {
  let got = header.trim().toLowerCase();
  if (got.startsWith("sha256=")) got = got.slice("sha256=".length);
  return got;
}

function signatureOk(body: Buffer, header: string, secrets: string[]): boolean {
  const got = normalizeSignature(header);
  if (!got) return false;
  for (const secret of secrets) {
    if (!secret) continue;
    const expected = createHmac("sha256", secret).update(body).digest("hex").toLowerCase();
    if (got.length !== expected.length) continue;
    try {
      if (timingSafeEqual(Buffer.from(got), Buffer.from(expected))) return true;
    } catch {
      /* try next secret */
    }
  }
  return false;
}

function webhookSecrets(): string[] {
  const dedicated = (process.env.SENDCLOUD_WEBHOOK_SECRET || "").trim();
  const apiKey = (process.env.SENDCLOUD_SECRET_KEY || "").trim();
  const vercel = process.env.VERCEL_ENV || "";
  const prodLike = vercel === "production" || vercel === "preview";
  if (prodLike) {
    // Dedicated must be configured; also accept API secret (Sendcloud may sign with either).
    if (!dedicated) return [];
    return [...new Set([dedicated, apiKey].filter(Boolean))];
  }
  const local = dedicated || apiKey;
  return local ? [local] : [];
}

export async function handleSendcloudWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET" || req.method === "HEAD") {
    return res.status(200).json({ ok: true, provider: "sendcloud" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secrets = webhookSecrets();
  if (!secrets.length) {
    console.warn(
      "[sendcloud-webhook] SENDCLOUD_WEBHOOK_SECRET unset — rejecting POST",
    );
    return res.status(503).json({ error: "Webhook not configured" });
  }

  const headerRaw = req.headers["sendcloud-signature"];
  const signature = String(Array.isArray(headerRaw) ? headerRaw[0] : headerRaw || "");
  const body = await rawBody(req);
  if (!signatureOk(body, signature, secrets)) {
    console.warn(
      "[sendcloud-webhook] bad signature",
      `body=${body.length}`,
      `sig=${signature ? "present" : "missing"}`,
      `secrets=${secrets.length}`,
    );
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let event = "";
    try {
      const parsed = JSON.parse(body.toString("utf8")) as {
        action?: string;
        type?: string;
        parcel?: { id?: unknown };
      };
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
