import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Handler eventi SpedirePRO (etichetta / tracking).
 * Esposto come /api/spedire-webhook via rewrite → /api/form (limite Hobby: 12 functions).
 */
export async function handleSpedireWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET" || req.method === "HEAD") {
    return res.status(200).json({ ok: true, provider: "spedirepro" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    console.log("[spedire-webhook]", body.slice(0, 4000));
  } catch (err) {
    console.error("[spedire-webhook] read", err);
  }

  return res.status(200).json({ ok: true });
}

export function isSpedireWebhookRequest(req: VercelRequest) {
  const q = req.query?.spedire_hook;
  const flag = Array.isArray(q) ? q[0] : q;
  if (String(flag || "") === "1") return true;
  const url = String(req.url || "");
  return url.includes("spedire-webhook") || url.includes("spedire_hook=1");
}
