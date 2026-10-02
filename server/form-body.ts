import type { VercelRequest } from "@vercel/node";
import { siteBase } from "./mail.js";

export function field(body: Record<string, unknown>, name: string) {
  const v = body[name];
  if (Array.isArray(v)) return String(v[0] ?? "").trim();
  return String(v ?? "").trim();
}

export function parseForm(req: VercelRequest): Record<string, unknown> {
  const raw = req.body;
  if (raw && typeof raw === "object" && !Buffer.isBuffer(raw) && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  const text = typeof raw === "string" ? raw : Buffer.isBuffer(raw) ? raw.toString("utf8") : "";
  const out: Record<string, unknown> = {};
  for (const [k, v] of new URLSearchParams(text)) out[k] = v;
  return out;
}

export function isHoney(body: Record<string, unknown>) {
  return Boolean(field(body, "_honey"));
}

/** Same-origin redirects only — blocks open redirects via _next. */
export function thanksUrl(body: Record<string, unknown>, fallbackFrom: string) {
  const site = siteBase();
  const fallback = `${site}/grazie/?from=${encodeURIComponent(fallbackFrom)}`;
  const next = field(body, "_next");
  if (!next) return fallback;

  try {
    const siteOrigin = new URL(site).origin;
    if (next.startsWith("/") && !next.startsWith("//")) {
      return `${siteOrigin}${next}`;
    }
    const target = new URL(next);
    if (target.protocol !== "http:" && target.protocol !== "https:") return fallback;
    if (target.origin !== siteOrigin) return fallback;
    return target.toString();
  } catch {
    return fallback;
  }
}

/** Cap / sanitize attacker-controlled email subjects. */
export function safeSubject(raw: string, fallback: string) {
  const cleaned = raw.replace(/[\r\n\0]/g, " ").trim().slice(0, 120);
  return cleaned || fallback;
}
