import { ensureSchema, euro, getDb, newId } from "./db.js";
import { computeShare, type DealCost } from "./math.js";

export type Deal = {
  id: string;
  user_id: string;
  product_id: string;
  product_title: string;
  unit_price: number;
  planned_qty: number;
  artist_share_pct: number;
  vat_rate_pct: number;
  active: boolean;
  notes: string;
  costs: Array<DealCost & { id: string }>;
};

function mapDeal(row: Record<string, unknown>, costs: Array<DealCost & { id: string }>): Deal {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    product_id: String(row.product_id),
    product_title: String(row.product_title || ""),
    unit_price: Number(row.unit_price),
    planned_qty: Number(row.planned_qty),
    artist_share_pct: Number(row.artist_share_pct),
    vat_rate_pct: Number(row.vat_rate_pct),
    active: Number(row.active) === 1,
    notes: String(row.notes || ""),
    costs,
  };
}

async function costsFor(dealId: string) {
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, label, amount, per_unit FROM deal_costs WHERE deal_id = ? ORDER BY label",
    args: [dealId],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    label: String(r.label),
    amount: Number(r.amount),
    per_unit: Number(r.per_unit) === 1,
  }));
}

export async function listDeals(userId?: string) {
  await ensureSchema();
  const db = getDb();
  const res = userId
    ? await db.execute({
        sql: "SELECT * FROM deals WHERE user_id = ? ORDER BY created_at DESC",
        args: [userId],
      })
    : await db.execute("SELECT * FROM deals ORDER BY created_at DESC");
  const out: Deal[] = [];
  for (const row of res.rows) {
    const id = String(row.id);
    out.push(mapDeal(row as Record<string, unknown>, await costsFor(id)));
  }
  return out;
}

export async function getDeal(id: string) {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({ sql: "SELECT * FROM deals WHERE id = ?", args: [id] });
  const row = res.rows[0];
  if (!row) return null;
  return mapDeal(row as Record<string, unknown>, await costsFor(id));
}

export async function getDealByProduct(productId: string) {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT * FROM deals WHERE product_id = ? AND active = 1 LIMIT 1",
    args: [productId],
  });
  const row = res.rows[0];
  if (!row) return null;
  return mapDeal(row as Record<string, unknown>, await costsFor(String(row.id)));
}

export async function upsertDeal(input: {
  id?: string;
  user_id: string;
  product_id: string;
  product_title: string;
  unit_price: number;
  planned_qty: number;
  artist_share_pct: number;
  vat_rate_pct?: number;
  active?: boolean;
  notes?: string;
  costs: DealCost[];
}) {
  await ensureSchema();
  const db = getDb();
  const id = input.id || newId("deal");
  const existing = input.id ? await getDeal(input.id) : null;
  if (existing) {
    await db.execute({
      sql: `UPDATE deals SET user_id=?, product_id=?, product_title=?, unit_price=?, planned_qty=?,
            artist_share_pct=?, vat_rate_pct=?, active=?, notes=? WHERE id=?`,
      args: [
        input.user_id,
        input.product_id,
        input.product_title,
        input.unit_price,
        Math.max(1, Math.floor(input.planned_qty)),
        input.artist_share_pct,
        input.vat_rate_pct ?? 22,
        input.active === false ? 0 : 1,
        input.notes || "",
        id,
      ],
    });
    await db.execute({ sql: "DELETE FROM deal_costs WHERE deal_id = ?", args: [id] });
  } else {
    await db.execute({
      sql: `INSERT INTO deals (id, user_id, product_id, product_title, unit_price, planned_qty, artist_share_pct, vat_rate_pct, active, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        input.user_id,
        input.product_id,
        input.product_title,
        input.unit_price,
        Math.max(1, Math.floor(input.planned_qty)),
        input.artist_share_pct,
        input.vat_rate_pct ?? 22,
        input.active === false ? 0 : 1,
        input.notes || "",
      ],
    });
  }
  for (const c of input.costs) {
    await db.execute({
      sql: "INSERT INTO deal_costs (id, deal_id, label, amount, per_unit) VALUES (?, ?, ?, ?, ?)",
      args: [newId("cost"), id, c.label.trim(), c.amount, c.per_unit ? 1 : 0],
    });
  }
  return getDeal(id);
}

export async function deleteDeal(id: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM deals WHERE id = ?", args: [id] });
}

export async function listSales(dealId: string) {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT * FROM sales WHERE deal_id = ? ORDER BY sold_at DESC",
    args: [dealId],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    deal_id: String(r.deal_id),
    qty: Number(r.qty),
    unit_price: Number(r.unit_price),
    size: String(r.size || ""),
    source: String(r.source) as "paypal" | "bank" | "manual",
    external_id: r.external_id ? String(r.external_id) : null,
    sold_at: String(r.sold_at),
  }));
}

export async function recordSale(input: {
  deal_id: string;
  qty: number;
  unit_price: number;
  size?: string;
  source: "paypal" | "bank" | "manual";
  external_id?: string;
  sold_at?: string;
}) {
  await ensureSchema();
  const db = getDb();
  const id = newId("sale");
  const external = input.external_id || null;
  try {
    await db.execute({
      sql: `INSERT INTO sales (id, deal_id, qty, unit_price, size, source, external_id, sold_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))`,
      args: [
        id,
        input.deal_id,
        Math.max(1, Math.floor(input.qty)),
        input.unit_price,
        input.size || "",
        input.source,
        external,
        input.sold_at || null,
      ],
    });
    return id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (external && /UNIQUE/i.test(msg)) return null;
    throw err;
  }
}

/**
 * After PayPal capture: map product lines onto active deals.
 * external_id = captureId:productId:size for idempotency per line.
 */
export async function recordSalesFromOrder(opts: {
  captureId: string;
  source: "paypal" | "bank";
  lines: Array<{ id: string; size: string; qty: number; unit_price?: number }>;
}) {
  await ensureSchema();
  const written: string[] = [];
  for (const line of opts.lines) {
    const deal = await getDealByProduct(line.id);
    if (!deal) continue;
    const saleId = await recordSale({
      deal_id: deal.id,
      qty: line.qty,
      unit_price: line.unit_price ?? deal.unit_price,
      size: line.size,
      source: opts.source,
      external_id: `${opts.captureId}:${line.id}:${line.size}`,
    });
    if (saleId) written.push(saleId);
  }
  return written;
}

export async function listSettlements(userId: string) {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT * FROM settlements WHERE user_id = ? ORDER BY period DESC",
    args: [userId],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    user_id: String(r.user_id),
    period: String(r.period),
    amount: Number(r.amount),
    note: String(r.note || ""),
    paid_at: String(r.paid_at),
  }));
}

export async function upsertSettlement(input: {
  user_id: string;
  period: string;
  amount: number;
  note?: string;
}) {
  await ensureSchema();
  const db = getDb();
  const period = input.period.trim();
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error("period must be YYYY-MM");
  const existing = await db.execute({
    sql: "SELECT id FROM settlements WHERE user_id = ? AND period = ?",
    args: [input.user_id, period],
  });
  if (existing.rows[0]) {
    const prev = await db.execute({
      sql: "SELECT amount FROM settlements WHERE id = ?",
      args: [String(existing.rows[0].id)],
    });
    const prevAmount = Number(prev.rows[0]?.amount || 0);
    await db.execute({
      sql: "UPDATE settlements SET amount = ?, note = ?, paid_at = datetime('now') WHERE id = ?",
      args: [
        euro(prevAmount + input.amount),
        input.note || "",
        String(existing.rows[0].id),
      ],
    });
    return String(existing.rows[0].id);
  }
  const id = newId("set");
  await db.execute({
    sql: "INSERT INTO settlements (id, user_id, period, amount, note) VALUES (?, ?, ?, ?, ?)",
    args: [id, input.user_id, period, euro(input.amount), input.note || ""],
  });
  return id;
}

export async function deleteSettlement(id: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM settlements WHERE id = ?", args: [id] });
}

export async function dealSummary(deal: Deal) {
  const sales = await listSales(deal.id);
  const share = computeShare({
    sales: sales.map((s) => ({ qty: s.qty, unit_price: s.unit_price })),
    costs: deal.costs,
    planned_qty: deal.planned_qty,
    artist_share_pct: deal.artist_share_pct,
    vat_rate_pct: deal.vat_rate_pct,
  });
  return { deal, sales, ...share };
}

export async function artistDashboard(userId: string) {
  const deals = await listDeals(userId);
  const summaries = [];
  for (const deal of deals) {
    summaries.push(await dealSummary(deal));
  }
  const settlements = await listSettlements(userId);
  const artistDueTotal = euro(summaries.reduce((s, x) => s + x.artistDue, 0));
  const paidTotal = euro(settlements.reduce((s, x) => s + x.amount, 0));
  const outstanding = euro(artistDueTotal - paidTotal);
  return {
    deals: summaries,
    settlements,
    artistDueTotal,
    paidTotal,
    outstanding,
  };
}
