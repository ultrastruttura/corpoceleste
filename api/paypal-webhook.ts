import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyStockDecrement, createLedger, ledgerExists } from "../server/github-stock.js";
import { parseOrderLines } from "../src/lib/paypal-lines.js";
import { fetchPayPalOrder, linesFromOrder, verifyPayPalWebhook } from "../server/paypal.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

type CaptureResource = {
  id?: string;
  custom_id?: string;
  supplementary_data?: {
    related_ids?: {
      order_id?: string;
    };
  };
};

async function readRawBody(req: VercelRequest): Promise<string> {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");

  const chunks: Buffer[] = [];
  const stream = req as unknown as AsyncIterable<Buffer | string>;
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length) return Buffer.concat(chunks).toString("utf8");

  // Fallback if platform already parsed JSON (may break signature verify).
  return JSON.stringify(req.body ?? {});
}

/**
 * PayPal → Vercel webhook.
 * Event: PAYMENT.CAPTURE.COMPLETED
 * Decrements content/products/*.md stock via GitHub API.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "paypal-webhook" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await readRawBody(req);

  try {
    const ok = await verifyPayPalWebhook({
      body: rawBody,
      headers: req.headers as Record<string, string | string[] | undefined>,
    });
    if (!ok) return res.status(400).json({ error: "Invalid signature" });
  } catch (err) {
    console.error("verify failed", err);
    return res.status(500).json({ error: "Verification error" });
  }

  let event: { event_type?: string; resource?: CaptureResource };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
    return res.status(200).json({ ok: true, ignored: event.event_type });
  }

  const captureId = event.resource?.id;
  if (!captureId) return res.status(200).json({ ok: true, skipped: "no capture id" });

  try {
    if (await ledgerExists(captureId)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
    let lines = orderId ? linesFromOrder(await fetchPayPalOrder(orderId)) : [];

    if (!lines.length && event.resource?.custom_id) {
      lines = parseOrderLines(event.resource.custom_id);
    }

    if (!lines.length) {
      console.warn("No order lines for capture", captureId);
      return res.status(200).json({ ok: true, skipped: "no lines" });
    }

    const claimed = await createLedger(captureId, lines);
    if (!claimed) return res.status(200).json({ ok: true, duplicate: true });

    const notes = await applyStockDecrement(lines);
    return res.status(200).json({ ok: true, captureId, notes });
  } catch (err) {
    console.error("stock update failed", err);
    return res.status(500).json({ error: "Stock update failed" });
  }
}
