import type { VercelRequest } from "@vercel/node";
import { field } from "./form-body.js";

function vercelDeployed() {
  const env = process.env.VERCEL_ENV || "";
  return env === "production" || env === "preview";
}

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
 * On Vercel production/preview: secret required (fail closed).
 * Local/dev without secret: skip (DX).
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const secret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
  if (!secret) {
    if (vercelDeployed()) {
      console.error("turnstile: TURNSTILE_SECRET_KEY missing on Vercel — reject");
      return { ok: false };
    }
    console.warn("turnstile: TURNSTILE_SECRET_KEY missing — skip verify (local)");
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
  const token =
    field(body, "cf-turnstile-response") ||
    field(body, "turnstileToken") ||
    field(body, "turnstile_token");
  const result = await verifyTurnstileToken(token, clientIp(req));
  return result.ok;
}
