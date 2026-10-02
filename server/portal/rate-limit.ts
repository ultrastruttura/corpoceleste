/** Simple sliding-window rate limit (Turso). */

import { ensureSchema, getDb } from "./db.js";

export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
  /** Default false — deny on DB errors for auth/abuse paths. */
  failOpen?: boolean;
}): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const failOpen = opts.failOpen === true;
  try {
    await ensureSchema();
    const db = getDb();
    const now = Date.now();
    const windowMs = opts.windowSeconds * 1000;
    const res = await db.execute({
      sql: "SELECT count, window_start FROM rate_limits WHERE key = ?",
      args: [opts.key],
    });
    const row = res.rows[0];
    if (!row) {
      await db.execute({
        sql: "INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)",
        args: [opts.key, String(now)],
      });
      return { ok: true };
    }
    const start = Number(row.window_start);
    const count = Number(row.count);
    if (!Number.isFinite(start) || now - start >= windowMs) {
      await db.execute({
        sql: "UPDATE rate_limits SET count = 1, window_start = ? WHERE key = ?",
        args: [String(now), opts.key],
      });
      return { ok: true };
    }
    if (count >= opts.limit) {
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - start)) / 1000));
      return { ok: false, retryAfterSec };
    }
    const bumped = await db.execute({
      sql: "UPDATE rate_limits SET count = count + 1 WHERE key = ? AND count = ?",
      args: [opts.key, count],
    });
    if (Number(bumped.rowsAffected ?? 0) === 0) {
      // Lost race — treat as consumed slot if still under limit on re-read
      const again = await db.execute({
        sql: "SELECT count, window_start FROM rate_limits WHERE key = ?",
        args: [opts.key],
      });
      const row2 = again.rows[0];
      const c2 = Number(row2?.count ?? opts.limit);
      if (c2 >= opts.limit) {
        const start2 = Number(row2?.window_start ?? now);
        return {
          ok: false,
          retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - start2)) / 1000)),
        };
      }
      return { ok: true };
    }
    return { ok: true };
  } catch (err) {
    console.warn("rateLimit failed", failOpen ? "open" : "closed", err);
    if (failOpen) return { ok: true };
    return { ok: false, retryAfterSec: 60 };
  }
}

export function clientIp(headers: Record<string, string | string[] | undefined> | undefined) {
  const h = headers || {};
  const xf = h["x-forwarded-for"];
  const raw = Array.isArray(xf) ? xf[0] : xf;
  if (raw) return raw.split(",")[0]?.trim() || "unknown";
  const real = h["x-real-ip"];
  return (Array.isArray(real) ? real[0] : real) || "unknown";
}
