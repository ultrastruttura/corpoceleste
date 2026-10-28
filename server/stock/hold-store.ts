/** PayPal hold ledgers in Turso: one indexed query finds expired holds instead of listing every GitHub ledger file. */

import type { LedgerRecord } from "../github-stock.js";
import { ensureSchema, getDb, portalConfigured } from "../portal/db.js";

export function holdStoreActive(id: string) {
  return id.startsWith("hold_") && portalConfigured();
}

function isOpen(ledger: LedgerRecord) {
  return ledger.kind === "paypal_hold" && !ledger.releasedAt && !ledger.consumedBy ? 1 : 0;
}

function atMs(ledger: LedgerRecord) {
  const t = Date.parse(ledger.at);
  return Number.isFinite(t) ? t : Date.now();
}

export async function getHold(id: string): Promise<LedgerRecord | null> {
  await ensureSchema();
  const res = await getDb().execute({ sql: "SELECT data FROM stock_holds WHERE id = ?", args: [id] });
  const raw = res.rows[0]?.data;
  return raw == null ? null : (JSON.parse(String(raw)) as LedgerRecord);
}

/** Insert only — false when the id already exists (lost claim race). */
export async function createHold(ledger: LedgerRecord): Promise<boolean> {
  await ensureSchema();
  const res = await getDb().execute({
    sql: "INSERT INTO stock_holds (id, data, open, at_ms) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
    args: [ledger.captureId, JSON.stringify(ledger), isOpen(ledger), atMs(ledger)],
  });
  return Number(res.rowsAffected ?? 0) > 0;
}

export async function putHold(ledger: LedgerRecord): Promise<void> {
  await ensureSchema();
  await getDb().execute({
    sql: `INSERT INTO stock_holds (id, data, open, at_ms) VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, open = excluded.open, at_ms = excluded.at_ms`,
    args: [ledger.captureId, JSON.stringify(ledger), isOpen(ledger), atMs(ledger)],
  });
}

export async function listExpiredOpenHolds(cutoffMs: number): Promise<LedgerRecord[]> {
  await ensureSchema();
  const res = await getDb().execute({
    sql: "SELECT data FROM stock_holds WHERE open = 1 AND at_ms < ? ORDER BY at_ms LIMIT 50",
    args: [cutoffMs],
  });
  return res.rows.map((r) => JSON.parse(String(r.data)) as LedgerRecord);
}
