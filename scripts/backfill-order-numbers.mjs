/** Assegna N. ordine tipo 1/26 agli shop_orders senza order_seq. */
import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();
const url = (process.env.TURSO_DATABASE_URL || "").trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || "").trim();
if (!url) {
  console.error("Manca TURSO_DATABASE_URL");
  process.exit(1);
}

const db = createClient({ url, authToken });
try {
  await db.execute(`ALTER TABLE shop_orders ADD COLUMN order_year INTEGER`);
} catch {
  /* ok */
}
try {
  await db.execute(`ALTER TABLE shop_orders ADD COLUMN order_seq INTEGER`);
} catch {
  /* ok */
}

const res = await db.execute(
  `SELECT id, created_at, order_year, order_seq FROM shop_orders ORDER BY created_at ASC, id ASC`,
);
const counters = new Map();
for (const r of res.rows) {
  const year = Number(r.order_year) || Number(String(r.created_at).slice(0, 4));
  let seq = Number(r.order_seq) || 0;
  if (seq > 0) {
    counters.set(year, Math.max(counters.get(year) || 0, seq));
    console.log(`keep ${r.id} ${seq}/${String(year).slice(-2)}`);
    continue;
  }
  seq = (counters.get(year) || 0) + 1;
  counters.set(year, seq);
  await db.execute({
    sql: `UPDATE shop_orders SET order_year = ?, order_seq = ? WHERE id = ?`,
    args: [year, seq, r.id],
  });
  console.log(`set  ${r.id} ${seq}/${String(year).slice(-2)}`);
}
console.log("done");
