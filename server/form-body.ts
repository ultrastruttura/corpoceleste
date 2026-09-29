import type { VercelRequest } from "@vercel/node";

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

export function thanksUrl(body: Record<string, unknown>, fallbackFrom: string) {
  const next = field(body, "_next");
  if (next.startsWith("http://") || next.startsWith("https://")) return next;
  const site = (process.env.SITE_URL || "https://ultrastruttura.github.io/corpoceleste").replace(/\/$/, "");
  return `${site}/grazie/?from=${encodeURIComponent(fallbackFrom)}`;
}
