/** Runtime on-hand qty in Turso — avoids GitHub Contents PUTs blocked by main PR ruleset. */

import { ensureSchema, getDb, portalConfigured } from "../portal/db.js";

export function runtimeStockActive() {
  return portalConfigured();
}

export async function getRuntimeStockQty(productId: string, size: string): Promise<number | null> {
  if (!runtimeStockActive()) return null;
  await ensureSchema();
  const res = await getDb().execute({
    sql: "SELECT qty FROM stock_levels WHERE product_id = ? AND size = ?",
    args: [productId, size],
  });
  const raw = res.rows[0]?.qty;
  if (raw == null) return null;
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

export async function getRuntimeStockMap(
  productId: string,
): Promise<Record<string, number>> {
  if (!runtimeStockActive()) return {};
  await ensureSchema();
  const res = await getDb().execute({
    sql: "SELECT size, qty FROM stock_levels WHERE product_id = ?",
    args: [productId],
  });
  const out: Record<string, number> = {};
  for (const row of res.rows) {
    const size = String(row.size || "");
    const n = Math.floor(Number(row.qty));
    if (!size || !Number.isFinite(n)) continue;
    out[size] = Math.max(0, n);
  }
  return out;
}

/**
 * Ensure a row exists (seeded from Tina), then decrement if enough stock.
 * `allowOversell` (preorder): clamp at 0 instead of failing.
 */
export async function consumeRuntimeStock(
  productId: string,
  size: string,
  qty: number,
  tinaQty: number,
  opts?: { allowOversell?: boolean },
): Promise<{ before: number; after: number }> {
  if (!runtimeStockActive()) {
    throw new Error("Runtime stock unavailable");
  }
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const seed = Math.max(0, Math.floor(tinaQty));
  const need = Math.max(0, Math.floor(qty));

  await db.execute({
    sql: `INSERT INTO stock_levels (product_id, size, qty, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(product_id, size) DO NOTHING`,
    args: [productId, size, seed, now],
  });

  for (let attempt = 0; attempt < 5; attempt++) {
    const cur = await getRuntimeStockQty(productId, size);
    const before = cur == null ? seed : cur;
    if (!opts?.allowOversell && before < need) {
      throw new Error(
        `INSUFFICIENT_STOCK ${productId} ${size}: aveva ${before}, ordine ×${need}`,
      );
    }
    const after = opts?.allowOversell ? Math.max(0, before - need) : before - need;
    const res = await db.execute({
      sql: `UPDATE stock_levels SET qty = ?, updated_at = ?
            WHERE product_id = ? AND size = ? AND qty = ?`,
      args: [after, now, productId, size, before],
    });
    if (Number(res.rowsAffected ?? 0) > 0) return { before, after };
  }
  throw new Error(`stock race ${productId} ${size}`);
}

export async function restoreRuntimeStock(
  productId: string,
  size: string,
  qty: number,
  tinaQty: number,
): Promise<{ before: number; after: number }> {
  if (!runtimeStockActive()) {
    throw new Error("Runtime stock unavailable");
  }
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const seed = Math.max(0, Math.floor(tinaQty));
  const add = Math.max(0, Math.floor(qty));

  await db.execute({
    sql: `INSERT INTO stock_levels (product_id, size, qty, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(product_id, size) DO NOTHING`,
    args: [productId, size, seed, now],
  });

  for (let attempt = 0; attempt < 5; attempt++) {
    const cur = await getRuntimeStockQty(productId, size);
    const before = cur == null ? seed : cur;
    const after = before + add;
    const res = await db.execute({
      sql: `UPDATE stock_levels SET qty = ?, updated_at = ?
            WHERE product_id = ? AND size = ? AND qty = ?`,
      args: [after, now, productId, size, before],
    });
    if (Number(res.rowsAffected ?? 0) > 0) return { before, after };
  }
  throw new Error(`stock race restore ${productId} ${size}`);
}
