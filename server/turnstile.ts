import type { VercelRequest } from "@vercel/node";
import { field } from "./form-body.js";

/** Client IP for Turnstile siteverify (optional but useful). */
export function clientIp(req: VercelRequest) {
  const xf = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    ?.trim();
  if (xf) return xf;
  const real = String(req.headers["x-real-ip"] || "").trim();
  return real || undefined;
}

/**
 * Verify Cloudflare Turnstile token.
 * - No secret configured → allow (local / unset); log once-style warn.
 * - Secret set → token required and must pass siteverify.
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const secret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
  if (!secret) {
    console.warn("turnstile: TURNSTILE_SECRET_KEY missing — skip verify");
    return { ok: true, skipped: true };
  }
  if (!token) return { ok: false };

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = (await res.json()) as { success?: boolean };
    return { ok: Boolean(data.success) };
  } catch (err) {
    console.error("turnstile: siteverify failed", err);
    return { ok: false };
  }
}

export async function assertTurnstile(
  req: VercelRequest,
  body: Record<string, unknown>,
): Promise<boolean> {
  const token = field(body, "cf-turnstile-response");
  const result = await verifyTurnstileToken(token, clientIp(req));
  return result.ok;
}
