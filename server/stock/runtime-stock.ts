/** Runtime on-hand qty in Turso — avoids GitHub Contents PUTs blocked by main PR ruleset. */

import { ensureSchema, getDb, portalConfigured } from "../portal/db.js";

export function runtimeStockActive() {
  return portalConfigured();
}

/**
 * Apply a Tina edit onto live qty without wiping sales.
 * `tinaBase == null` = legacy row: adopt Tina as baseline, keep live qty.
 */
export function applyTinaStockDelta(
  liveQty: number,
  tinaBase: number | null,
  tinaNow: number,
) {
  const live = Math.max(0, Math.floor(liveQty));
  const now = Math.max(0, Math.floor(tinaNow));
  if (tinaBase == null) {
    return { qty: live, tinaBase: now, changed: true };
  }
  const base = Math.max(0, Math.floor(tinaBase));
  if (base === now) return { qty: live, tinaBase: base, changed: false };
  return { qty: Math.max(0, live + (now - base)), tinaBase: now, changed: true };
}

type StockRow = { qty: number; tinaBase: number | null };

async function readStockRow(productId: string, size: string): Promise<StockRow | null> {
  await ensureSchema();
  const res = await getDb().execute({
    sql: "SELECT qty, tina_base FROM stock_levels WHERE product_id = ? AND size = ?",
    args: [productId, size],
  });
  const row = res.rows[0];
  if (!row) return null;
  const qty = Math.floor(Number(row.qty));
  if (!Number.isFinite(qty)) return null;
  const rawBase = row.tina_base;
  const tinaBase =
    rawBase == null || rawBase === ""
      ? null
      : Math.max(0, Math.floor(Number(rawBase)));
  return {
    qty: Math.max(0, qty),
    tinaBase: tinaBase != null && Number.isFinite(tinaBase) ? tinaBase : null,
  };
}

/**
 * Seed or realign one size from Tina.
 * If Tina stock changed since last sync, shift live qty by the same delta (restock/cut).
 */
export async function syncRuntimeStockFromTina(
  productId: string,
  size: string,
  tinaQty: number,
): Promise<number> {
  if (!runtimeStockActive()) return Math.max(0, Math.floor(tinaQty));
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const seed = Math.max(0, Math.floor(tinaQty));

  await db.execute({
    sql: `INSERT INTO stock_levels (product_id, size, qty, tina_base, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(product_id, size) DO NOTHING`,
    args: [productId, size, seed, seed, now],
  });

  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await readStockRow(productId, size);
    if (!row) return seed;
    const next = applyTinaStockDelta(row.qty, row.tinaBase, seed);
    if (!next.changed) return row.qty;
    const res =
      row.tinaBase == null
        ? await db.execute({
            sql: `UPDATE stock_levels SET qty = ?, tina_base = ?, updated_at = ?
                  WHERE product_id = ? AND size = ? AND qty = ? AND tina_base IS NULL`,
            args: [next.qty, next.tinaBase, now, productId, size, row.qty],
          })
        : await db.execute({
            sql: `UPDATE stock_levels SET qty = ?, tina_base = ?, updated_at = ?
                  WHERE product_id = ? AND size = ? AND qty = ? AND tina_base = ?`,
            args: [next.qty, next.tinaBase, now, productId, size, row.qty, row.tinaBase],
          });
    if (Number(res.rowsAffected ?? 0) > 0) return next.qty;
  }
  const again = await readStockRow(productId, size);
  return again?.qty ?? seed;
}

export async function getRuntimeStockQty(productId: string, size: string): Promise<number | null> {
  if (!runtimeStockActive()) return null;
  const row = await readStockRow(productId, size);
  return row ? row.qty : null;
}

/** Overlay live qty; pass Tina map to auto-align before read. */
export async function getRuntimeStockMap(
  productId: string,
  tinaStock?: Record<string, number>,
): Promise<Record<string, number>> {
  if (!runtimeStockActive()) return {};
  await ensureSchema();

  if (tinaStock) {
    const out: Record<string, number> = {};
    for (const [size, tinaQty] of Object.entries(tinaStock)) {
      out[size] = await syncRuntimeStockFromTina(productId, size, tinaQty);
    }
    return out;
  }

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
 * Sync from Tina, then decrement if enough stock.
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
  await syncRuntimeStockFromTina(productId, size, tinaQty);
  const db = getDb();
  const now = new Date().toISOString();
  const need = Math.max(0, Math.floor(qty));
  const seed = Math.max(0, Math.floor(tinaQty));

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
  await syncRuntimeStockFromTina(productId, size, tinaQty);
  const db = getDb();
  const now = new Date().toISOString();
  const add = Math.max(0, Math.floor(qty));
  const seed = Math.max(0, Math.floor(tinaQty));

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
