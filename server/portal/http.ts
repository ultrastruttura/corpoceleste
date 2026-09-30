import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sessionUser, type PortalUser } from "./auth.js";
import { portalConfigured } from "./db.js";

function originOnly(value: string) {
  const v = value.trim();
  if (!v) return "";
  try {
    return new URL(v).origin;
  } catch {
    return v.replace(/\/$/, "");
  }
}

function allowedOrigins() {
  const fromEnv = (process.env.PORTAL_CORS_ORIGINS || "")
    .split(",")
    .map(originOnly)
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  const site = originOnly(process.env.SITE_URL || "https://ultrastruttura.github.io");
  return [site, "http://localhost:4321", "http://127.0.0.1:4321"];
}

/** Exact Origin match only (no startsWith). */
export function cors(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || "");
  const list = allowedOrigins();
  if (origin && list.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
}

export function bearer(req: VercelRequest) {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(Array.isArray(h) ? h[0] : h);
  return m?.[1]?.trim() || null;
}

export async function readJson<T = Record<string, unknown>>(req: VercelRequest): Promise<T> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as T;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  const chunks: Buffer[] = [];
  const stream = req as unknown as AsyncIterable<Buffer | string>;
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (!chunks.length) return {} as T;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
  } catch {
    return {} as T;
  }
}

export function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(body));
}

export async function requireUser(
  req: VercelRequest,
  res: VercelResponse,
  role?: "admin" | "artist",
): Promise<PortalUser | null> {
  cors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return null;
  }
  if (!portalConfigured()) {
    json(res, 503, { error: "Portal DB not configured (TURSO_DATABASE_URL)" });
    return null;
  }
  const user = await sessionUser(bearer(req));
  if (!user) {
    json(res, 401, { error: "Unauthorized" });
    return null;
  }
  if (role === "admin" && user.role !== "admin") {
    json(res, 403, { error: "Admin only" });
    return null;
  }
  return user;
}
