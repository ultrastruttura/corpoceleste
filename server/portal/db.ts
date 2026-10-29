import { createClient, type Client, type InStatement } from "@libsql/client";
import { PORTAL_SCHEMA } from "./schema.js";

let client: Client | null = null;
let migrated = false;
let migrating: Promise<void> | null = null;

export function portalConfigured() {
  const url = (process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || "").trim();
  const authToken = (process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || "").trim();
  return Boolean(url && authToken);
}

export function getDb(): Client {
  if (client) return client;
  const url = (process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || "").trim();
  if (!url) {
    throw new Error("Missing TURSO_DATABASE_URL (or LIBSQL_URL) for artist portal");
  }
  const authToken = (process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || "").trim();
  if (!authToken) {
    throw new Error("Missing TURSO_AUTH_TOKEN (or LIBSQL_AUTH_TOKEN) for artist portal");
  }
  client = createClient({ url, authToken });
  return client;
}

export async function ensureSchema() {
  if (migrated) return;
  if (migrating) return migrating;
  migrating = (async () => {
    const db = getDb();
    const statements = PORTAL_SCHEMA.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((sql): InStatement => ({ sql }));
    // One round-trip instead of N sequential CREATE/INDEX calls to Turso.
    if (statements.length) await db.batch(statements, "write");
    await db.execute(
      `CREATE TABLE IF NOT EXISTS portal_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    );
    const ver = await db.execute({
      sql: `SELECT value FROM portal_meta WHERE key = ?`,
      args: ["schema_version"],
    });
    const current = String(ver.rows[0]?.value || "");
    if (current !== "2") {
      for (const sql of [
        `ALTER TABLE shop_orders ADD COLUMN order_year INTEGER`,
        `ALTER TABLE shop_orders ADD COLUMN order_seq INTEGER`,
        `ALTER TABLE shop_orders ADD COLUMN paid_at TEXT`,
        `ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribed_at TEXT`,
        `ALTER TABLE newsletter_subscribers ADD COLUMN resend_contact_id TEXT`,
      ]) {
        try {
          await db.execute(sql);
        } catch {
          /* column already exists */
        }
      }
      await db.execute({
        sql: `INSERT INTO portal_meta (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: ["schema_version", "2"],
      });
    }
    migrated = true;
    migrating = null;
  })();
  try {
    await migrating;
  } catch (err) {
    migrating = null;
    throw err;
  }
}

export function newId(prefix = "") {
  const id = crypto.randomUUID().replace(/-/g, "");
  return prefix ? `${prefix}_${id}` : id;
}

export function euro(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
