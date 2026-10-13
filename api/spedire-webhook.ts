import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Endpoint di ascolto eventi SpedirePRO (etichetta pronta, tracking, errori).
 * Configura questo URL in Impostazioni → App e Integrazioni → API.
 *
 * Per ora: ack 200 + log. Estendibile (salvare URL etichetta, mail shop, ecc.).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
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
