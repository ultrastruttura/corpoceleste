/** HttpOnly session cookie for portal (cross-site Pages → Vercel needs SameSite=None). */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export const PORTAL_COOKIE = "cc_portal_session";

function cookieSecure() {
  // Local vercel dev over http — Secure cookies won't stick.
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}

export function readSessionCookie(req: VercelRequest): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parts = String(raw).split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    if (name !== PORTAL_COOKIE) continue;
    const value = part.slice(idx + 1).trim();
    try {
      return decodeURIComponent(value) || null;
    } catch {
      return value || null;
    }
  }
  return null;
}

export function setSessionCookie(res: VercelResponse, token: string, expiresAtIso: string) {
  const maxAge = Math.max(
    60,
    Math.floor((Date.parse(expiresAtIso) - Date.now()) / 1000) || 14 * 86_400,
  );
  const secure = cookieSecure();
  const parts = [
    `${PORTAL_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAge}`,
    // Cross-origin API (GitHub Pages → Vercel): None required for credentialed fetch.
    secure ? "SameSite=None" : "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res: VercelResponse) {
  const secure = cookieSecure();
  const parts = [
    `${PORTAL_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    secure ? "SameSite=None" : "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}
