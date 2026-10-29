/** Shop orders for admin (PayPal + bonifico). */

import { ensureSchema, euro, getDb, newId } from "./db.js";

export type ShopOrderStatus = "nuovo" | "evaso";
export type ShopOrderSource = "paypal" | "bank";

export type ShopOrderLine = {
  /** Catalog product id (for artist deals). */
  id?: string;
  title: string;
  size: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type ShopOrder = {
  id: string;
  external_id: string;
  source: ShopOrderSource;
  status: ShopOrderStatus;
  order_year: number;
  order_seq: number;
  /** Display code e.g. 1/26 */
  number: string;
  /** Sum of line quantities */
  pieces: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  ship_country: string;
  ship_zip: string;
  merchandise: number;
  shipping: number;
  total: number;
  currency: string;
  lines: ShopOrderLine[];
  packlink_ref: string;
  notes: string;
  /** ISO timestamp when payment confirmed; null = unpaid bank hold. */
  paid_at: string | null;
  /** ISO when marked evaso (shipping mail sent). */
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShopOrderInput = {
  external_id: string;
  source: ShopOrderSource;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  ship_country?: string;
  ship_zip?: string;
  merchandise: number;
  shipping: number;
  total: number;
  currency?: string;
  lines: ShopOrderLine[];
  packlink_ref?: string;
  notes?: string;
  created_at?: string;
  /** Pass null for unpaid bank; omit or ISO for paid (PayPal). */
  paid_at?: string | null;
};

export function yearFromOrderDate(iso: string): number {
  const y = Number(String(iso || "").slice(0, 4));
  return Number.isFinite(y) && y >= 2000 ? y : new Date().getFullYear();
}

export function formatOrderNumber(seq: number, year: number) {
  const n = Math.max(1, Math.floor(seq) || 1);
  const yy = String(year).slice(-2);
  return `${n}/${yy}`;
}

function piecesFromLines(lines: ShopOrderLine[]) {
  return lines.reduce((s, l) => s + l.qty, 0);
}

function parseLines(raw: unknown): ShopOrderLine[] {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      id: String(row?.id || "").trim() || undefined,
      title: String(row?.title || "").trim() || "Articolo",
      size: String(row?.size || "").trim(),
      qty: Math.max(1, Math.floor(Number(row?.qty) || 1)),
      unitPrice: euro(Number(row?.unitPrice) || 0),
      lineTotal: euro(Number(row?.lineTotal) || 0),
    }));
  } catch {
    return [];
  }
}

function mapRow(r: Record<string, unknown>): ShopOrder {
  const lines = parseLines(r.lines_json);
  const created = String(r.created_at || "");
  const year = Number(r.order_year) || yearFromOrderDate(created);
  const seq = Number(r.order_seq) || 0;
  return {
    id: String(r.id),
    external_id: String(r.external_id || ""),
    source: r.source === "bank" ? "bank" : "paypal",
    status: r.status === "evaso" ? "evaso" : "nuovo",
    order_year: year,
    order_seq: seq,
    number: seq > 0 ? formatOrderNumber(seq, year) : "—",
    pieces: piecesFromLines(lines),
    customer_name: String(r.customer_name || ""),
    customer_email: String(r.customer_email || ""),
    customer_phone: String(r.customer_phone || ""),
    shipping_address: String(r.shipping_address || ""),
    ship_country: String(r.ship_country || ""),
    ship_zip: String(r.ship_zip || ""),
    merchandise: euro(Number(r.merchandise) || 0),
    shipping: euro(Number(r.shipping) || 0),
    total: euro(Number(r.total) || 0),
    currency: String(r.currency || "EUR"),
    lines,
    packlink_ref: String(r.packlink_ref || ""),
    notes: String(r.notes || ""),
    paid_at: r.paid_at ? String(r.paid_at) : null,
    shipped_at: r.shipped_at ? String(r.shipped_at) : null,
    created_at: created,
    updated_at: String(r.updated_at || ""),
  };
}

async function nextSeqForYear(year: number): Promise<number> {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT COALESCE(MAX(order_seq), 0) AS m FROM shop_orders WHERE order_year = ?`,
    args: [year],
  });
  return Number((res.rows[0] as { m?: number } | undefined)?.m || 0) + 1;
}

/** Warm-instance: skip after first successful pass (or when nothing to fix). */
let orderNumbersBackfilled = false;

/** Assign 1/YY, 2/YY… to rows missing order_seq (by created_at ASC within year). */
async function backfillOrderNumbers() {
  if (orderNumbersBackfilled) return;
  const db = getDb();
  const need = await db.execute(
    `SELECT 1 AS x FROM shop_orders WHERE order_seq IS NULL OR order_seq = 0 LIMIT 1`,
  );
  if (!need.rows.length) {
    orderNumbersBackfilled = true;
    return;
  }
  const res = await db.execute(
    `SELECT id, created_at, order_year, order_seq FROM shop_orders ORDER BY created_at ASC, id ASC`,
  );
  const counters = new Map<number, number>();
  const updates: Array<{ sql: string; args: Array<string | number> }> = [];
  for (const raw of res.rows) {
    const r = raw as Record<string, unknown>;
    const id = String(r.id);
    const year = Number(r.order_year) || yearFromOrderDate(String(r.created_at || ""));
    let seq = Number(r.order_seq) || 0;
    if (seq > 0) {
      counters.set(year, Math.max(counters.get(year) || 0, seq));
      continue;
    }
    seq = (counters.get(year) || 0) + 1;
    counters.set(year, seq);
    updates.push({
      sql: `UPDATE shop_orders SET order_year = ?, order_seq = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [year, seq, id],
    });
  }
  if (updates.length) await db.batch(updates, "write");
  orderNumbersBackfilled = true;
}

/** Insert or no-op if external_id already exists (idempotent). */
export async function upsertShopOrder(input: ShopOrderInput): Promise<ShopOrder | null> {
  await ensureSchema();
  await backfillOrderNumbers();
  const db = getDb();
  const external = String(input.external_id || "").trim();
  if (!external) return null;

  const existing = await db.execute({
    sql: `SELECT * FROM shop_orders WHERE external_id = ? LIMIT 1`,
    args: [external],
  });
  if (existing.rows[0]) return mapRow(existing.rows[0] as Record<string, unknown>);

  const id = newId("ord");
  const linesJson = JSON.stringify(input.lines || []);
  const created = String(input.created_at || "").trim();
  const year = yearFromOrderDate(created || new Date().toISOString());
  const seq = await nextSeqForYear(year);

  const paidAt =
    input.paid_at === null
      ? null
      : input.paid_at !== undefined
        ? String(input.paid_at).trim() || null
        : input.source === "paypal"
          ? created || new Date().toISOString()
          : null;

  if (created) {
    await db.execute({
      sql: `INSERT INTO shop_orders (
        id, external_id, source, status, order_year, order_seq,
        customer_name, customer_email, customer_phone,
        shipping_address, ship_country, ship_zip,
        merchandise, shipping, total, currency,
        lines_json, packlink_ref, notes, paid_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'nuovo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        external,
        input.source,
        year,
        seq,
        String(input.customer_name || "").trim(),
        String(input.customer_email || "").trim(),
        String(input.customer_phone || "").trim(),
        String(input.shipping_address || "").trim(),
        String(input.ship_country || "").trim().toUpperCase(),
        String(input.ship_zip || "").trim().toUpperCase(),
        euro(input.merchandise),
        euro(input.shipping),
        euro(input.total),
        String(input.currency || "EUR"),
        linesJson,
        String(input.packlink_ref || "").trim(),
        String(input.notes || "").trim(),
        paidAt,
        created,
        created,
      ],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO shop_orders (
        id, external_id, source, status, order_year, order_seq,
        customer_name, customer_email, customer_phone,
        shipping_address, ship_country, ship_zip,
        merchandise, shipping, total, currency,
        lines_json, packlink_ref, notes, paid_at
      ) VALUES (?, ?, ?, 'nuovo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        external,
        input.source,
        year,
        seq,
        String(input.customer_name || "").trim(),
        String(input.customer_email || "").trim(),
        String(input.customer_phone || "").trim(),
        String(input.shipping_address || "").trim(),
        String(input.ship_country || "").trim().toUpperCase(),
        String(input.ship_zip || "").trim().toUpperCase(),
        euro(input.merchandise),
        euro(input.shipping),
        euro(input.total),
        String(input.currency || "EUR"),
        linesJson,
        String(input.packlink_ref || "").trim(),
        String(input.notes || "").trim(),
        paidAt,
      ],
    });
  }

  return getShopOrder(id);
}

export async function listShopOrders(opts?: {
  status?: ShopOrderStatus | "all";
}): Promise<ShopOrder[]> {
  await ensureSchema();
  await backfillOrderNumbers();
  const db = getDb();
  const status = opts?.status && opts.status !== "all" ? opts.status : null;
  const res = status
    ? await db.execute({
        sql: `SELECT * FROM shop_orders WHERE status = ? ORDER BY created_at DESC`,
        args: [status],
      })
    : await db.execute(`SELECT * FROM shop_orders ORDER BY created_at DESC`);
  return res.rows.map((r) => mapRow(r as Record<string, unknown>));
}

export async function getShopOrder(id: string): Promise<ShopOrder | null> {
  await ensureSchema();
  await backfillOrderNumbers();
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT * FROM shop_orders WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const row = res.rows[0];
  return row ? mapRow(row as Record<string, unknown>) : null;
}

export async function updateShopOrderStatus(
  id: string,
  status: ShopOrderStatus,
): Promise<ShopOrder | null> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `UPDATE shop_orders SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [status, id],
  });
  return getShopOrder(id);
}

/** Set once when the customer shipping email has been sent successfully. */
export async function markShopOrderShippedMail(id: string): Promise<ShopOrder | null> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE shop_orders SET shipped_at = COALESCE(shipped_at, ?), updated_at = datetime('now') WHERE id = ?`,
    args: [now, id],
  });
  return getShopOrder(id);
}

/** Mark bank order as paid (then decrement GitHub stock if still pending). */
export async function markShopOrderPaid(id: string): Promise<ShopOrder | null> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE shop_orders SET paid_at = COALESCE(paid_at, ?), updated_at = datetime('now') WHERE id = ?`,
    args: [now, id],
  });
  return getShopOrder(id);
}

/**
 * Decrement GitHub/Tina stock once per order (ledger id = external_id).
 * PayPal already did this in the webhook → no-op when ledger is complete.
 */
export async function applyOrderStockOnce(order: ShopOrder): Promise<{ ok: boolean; note: string }> {
  if (!(process.env.GITHUB_TOKEN || "").trim()) {
    return { ok: false, note: "GITHUB_TOKEN missing" };
  }
  const stockLines = order.lines
    .filter((l) => l.id && l.size && l.qty > 0)
    .map((l) => ({ id: String(l.id), size: l.size, qty: l.qty }));
  if (!stockLines.length) return { ok: true, note: "no lines" };
  try {
    const {
      claimOrResumeLedger,
      applyStockDecrementCheckpointed,
      writeLedger,
      LedgerBusyError,
    } = await import("../github-stock.js");
    const claim = await claimOrResumeLedger(order.external_id, stockLines, {
      expectedTotal: order.total.toFixed(2),
    });
    if (claim.action === "skip" && claim.ledger.stockComplete) {
      return { ok: true, note: "already decremented" };
    }
    if (claim.action === "skip") {
      return { ok: false, note: `ledger busy (${claim.ledger.status})` };
    }
    const held = await applyStockDecrementCheckpointed(
      claim.ledger,
      stockLines,
      writeLedger,
    );
    await writeLedger({
      ...held,
      kind: order.source === "bank" ? "bank" : "capture",
      status: "done",
      stockComplete: true,
      at: new Date().toISOString(),
    });
    return {
      ok: true,
      note: held.stockNotes?.length ? held.stockNotes.join("; ") : "updated",
    };
  } catch (err: unknown) {
    const { LedgerBusyError } = await import("../github-stock.js");
    if (err instanceof LedgerBusyError) {
      return { ok: false, note: "stock busy" };
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("applyOrderStockOnce", msg);
    return { ok: false, note: msg.slice(0, 200) };
  }
}

export async function applyBankStockOnPaid(order: ShopOrder) {
  if (order.source !== "bank") return { ok: true, note: "not bank" };
  return applyOrderStockOnce(order);
}

export async function isShopOrderPaidByExternalId(externalId: string): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT paid_at, source FROM shop_orders WHERE external_id = ? LIMIT 1`,
    args: [externalId],
  });
  const row = res.rows[0] as { paid_at?: string; source?: string } | undefined;
  if (!row) return false;
  if (row.source === "paypal") return true;
  return Boolean(row.paid_at);
}

export async function deleteShopOrder(id: string): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: `DELETE FROM shop_orders WHERE id = ?`,
    args: [id],
  });
  return Number(res.rowsAffected || 0) > 0;
}
