import { createClient, type Client } from "@libsql/client";
import { PORTAL_SCHEMA } from "./schema.js";

let client: Client | null = null;
let migrated = false;

export function portalConfigured() {
  return Boolean((process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || "").trim());
}

export function getDb(): Client {
  if (client) return client;
  const url = (process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || "").trim();
  if (!url) {
    throw new Error("Missing TURSO_DATABASE_URL (or LIBSQL_URL) for artist portal");
  }
  const authToken = (process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || "").trim();
  client = createClient(authToken ? { url, authToken } : { url });
  return client;
}

export async function ensureSchema() {
  if (migrated) return;
  const db = getDb();
  await db.executeMultiple(PORTAL_SCHEMA);
  migrated = true;
}

export function newId(prefix = "") {
  const id = crypto.randomUUID().replace(/-/g, "");
  return prefix ? `${prefix}_${id}` : id;
}

export function euro(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
