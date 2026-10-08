/** IP (+ optional email) abuse limits for public APIs (Turso when available, else memory). */

import type { VercelRequest } from "@vercel/node";
import { portalConfigured } from "./portal/db.js";
import { clientIp, rateLimit } from "./portal/rate-limit.js";

const memory = new Map<string, { count: number; start: number }>();

function memoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const row = memory.get(key);
  if (!row || now - row.start >= windowMs) {
    memory.set(key, { count: 1, start: now });
    return { ok: true };
  }
  if (row.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - row.start)) / 1000)) };
  }
  row.count += 1;
  return { ok: true };
}

async function limitKey(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  if (portalConfigured()) {
    return rateLimit({ key, limit, windowSeconds, failOpen: false });
  }
  return memoryRateLimit(key, limit, windowSeconds);
}

export async function abuseLimit(
  req: VercelRequest,
  prefix: string,
  limit: number,
  windowSeconds: number,
  opts?: { email?: string },
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const ip = clientIp(req.headers as Record<string, string | string[] | undefined>);
  const byIp = await limitKey(`${prefix}:${ip}`, limit, windowSeconds);
  if (!byIp.ok) return byIp;

  const email = (opts?.email || "").trim().toLowerCase();
  if (email.includes("@")) {
    // Separate (stricter) budget per recipient — stops rotating IPs into one inbox.
    const byEmail = await limitKey(`${prefix}:mail:${email}`, Math.min(limit, 3), windowSeconds);
    if (!byEmail.ok) return byEmail;
  }
  return { ok: true };
}
