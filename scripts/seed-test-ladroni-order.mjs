/**
 * One-shot: fake bank order + deal sale for ladroni-a-casa-nostra (pipeline check).
 * Loads TURSO_* from .env — do not commit output with secrets.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

function loadEnv() {
  try {
    const raw = readFileSync(".env", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  } catch {
    /* use process.env only */
  }
}

function euro(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

loadEnv();
const url = (process.env.TURSO_DATABASE_URL || "").trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || "").trim();
if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN in .env");
  process.exit(1);
}

const db = createClient({ url, authToken });
const productId = "ladroni-a-casa-nostra";
const qty = 1;
const size = "M";
const unitPrice = 40;
const merchandise = euro(qty * unitPrice);
const shipping = 0;
const total = euro(merchandise + shipping);
const external = `test-ladroni-${Date.now()}`;
const now = new Date().toISOString();

const dealRes = await db.execute({
  sql: `SELECT * FROM deals WHERE product_id = ? AND active = 1 LIMIT 1`,
  args: [productId],
});
const deal = dealRes.rows[0];
if (!deal) {
  console.error(
    `Nessun deal attivo per product_id=${productId}. Crealo prima in Area personale → artista → Deal.`,
  );
  process.exit(1);
}

const dealId = String(deal.id);
const userId = String(deal.user_id);
const price = Number(deal.unit_price) || unitPrice;
const lineTotal = euro(qty * price);

const lines = [
  {
    id: productId,
    title: String(deal.product_title || "Ladroni a casa nostra"),
    size,
    qty,
    unitPrice: price,
  },
];

const orderId = newId("ord");
const year = new Date().getFullYear();
const seqRes = await db.execute({
  sql: `SELECT COALESCE(MAX(order_seq), 0) AS m FROM shop_orders WHERE order_year = ?`,
  args: [year],
});
const seq = Number(seqRes.rows[0]?.m || 0) + 1;

await db.execute({
  sql: `INSERT INTO shop_orders (
    id, external_id, source, status, order_year, order_seq,
    customer_name, customer_email, customer_phone,
    shipping_address, ship_country, ship_zip,
    merchandise, shipping, total, currency,
    lines_json, packlink_ref, notes, paid_at, created_at, updated_at
  ) VALUES (?, ?, 'bank', 'nuovo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EUR', ?, '', ?, ?, ?, ?)`,
  args: [
    orderId,
    external,
    year,
    seq,
    "Cliente Prova Pipeline",
    "prova-pipeline@example.com",
    "",
    "Via Test 1, 24100 Bergamo BG",
    "IT",
    "24100",
    lineTotal,
    shipping,
    lineTotal,
    JSON.stringify(lines),
    "ordine finto pipeline artista — eliminabile",
    now,
    now,
    now,
  ],
});

const saleId = newId("sale");
await db.execute({
  sql: `INSERT INTO sales (id, deal_id, qty, unit_price, size, source, external_id, sold_at)
        VALUES (?, ?, ?, ?, ?, 'bank', ?, ?)`,
  args: [
    saleId,
    dealId,
    qty,
    price,
    size,
    `${external}:${productId}:${size}`,
    now,
  ],
});

const vatPct = Number(deal.vat_rate_pct) || 22;
const sharePct = Number(deal.artist_share_pct) || 40;
const costsRes = await db.execute({
  sql: `SELECT amount, per_unit FROM deal_costs WHERE deal_id = ?`,
  args: [dealId],
});
let costPerUnit = 0;
for (const c of costsRes.rows) {
  if (Number(c.per_unit)) costPerUnit += Number(c.amount);
}
const gross = lineTotal;
const vat = euro((gross * vatPct) / 100);
const costs = euro(costPerUnit * qty);
const profit = euro(gross - vat - costs);
const artistDue = euro((profit * sharePct) / 100);

console.log(
  JSON.stringify(
    {
      ok: true,
      order: { id: orderId, number: `${seq}/${String(year).slice(-2)}`, external },
      sale: { id: saleId, deal_id: dealId, user_id: userId, qty, size, unit_price: price },
      expected: { gross, vat, costs, profit, artistDue },
    },
    null,
    2,
  ),
);
