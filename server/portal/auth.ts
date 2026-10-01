import { ensureSchema, getDb, newId } from "./db.js";
import { sendMail, siteBase } from "../mail.js";

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "artist";
  artist_slug: string | null;
};

function sessionDays() {
  return Number(process.env.PORTAL_SESSION_DAYS || 14);
}

function magicMinutes() {
  return Number(process.env.PORTAL_MAGIC_MINUTES || 30);
}

export async function ensureAdmin() {
  await ensureSchema();
  const email = (process.env.PORTAL_ADMIN_EMAIL || process.env.SHOP_EMAIL || "").trim().toLowerCase();
  if (!email) return null;
  const db = getDb();
  const existing = await db.execute({
    sql: "SELECT id, email, name, role, artist_slug FROM users WHERE email = ?",
    args: [email],
  });
  if (existing.rows[0]) {
    const row = existing.rows[0];
    if (String(row.role) !== "admin") {
      await db.execute({ sql: "UPDATE users SET role = 'admin' WHERE id = ?", args: [String(row.id)] });
    }
    return rowToUser(row);
  }
  const id = newId("usr");
  await db.execute({
    sql: "INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, 'admin')",
    args: [id, email, (process.env.PORTAL_ADMIN_NAME || "Andrea Baldelli").trim()],
  });
  return {
    id,
    email,
    name: (process.env.PORTAL_ADMIN_NAME || "Andrea Baldelli").trim(),
    role: "admin" as const,
    artist_slug: null,
  };
}

function rowToUser(row: Record<string, unknown>): PortalUser {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name || ""),
    role: String(row.role) === "admin" ? "admin" : "artist",
    artist_slug: row.artist_slug ? String(row.artist_slug) : null,
  };
}

export async function getUserByEmail(email: string) {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, email, name, role, artist_slug FROM users WHERE email = ?",
    args: [email.trim().toLowerCase()],
  });
  return res.rows[0] ? rowToUser(res.rows[0] as Record<string, unknown>) : null;
}

export async function getUserById(id: string) {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, email, name, role, artist_slug FROM users WHERE id = ?",
    args: [id],
  });
  return res.rows[0] ? rowToUser(res.rows[0] as Record<string, unknown>) : null;
}

export async function listUsers() {
  await ensureSchema();
  await ensureAdmin();
  const db = getDb();
  const res = await db.execute("SELECT id, email, name, role, artist_slug FROM users ORDER BY role, name, email");
  return res.rows.map((r) => rowToUser(r as Record<string, unknown>));
}

export async function createArtistUser(opts: {
  email: string;
  name: string;
  artist_slug?: string;
}) {
  await ensureSchema();
  const email = opts.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Invalid email");
  const existing = await getUserByEmail(email);
  if (existing) {
    if (existing.role === "admin") throw new Error("Email is admin");
    const db = getDb();
    await db.execute({
      sql: "UPDATE users SET name = ?, artist_slug = COALESCE(?, artist_slug) WHERE id = ?",
      args: [opts.name.trim() || existing.name, opts.artist_slug?.trim() || null, existing.id],
    });
    return (await getUserById(existing.id))!;
  }
  const id = newId("usr");
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO users (id, email, name, role, artist_slug) VALUES (?, ?, ?, 'artist', ?)",
    args: [id, email, opts.name.trim() || email, opts.artist_slug?.trim() || null],
  });
  return (await getUserById(id))!;
}

export async function deleteUser(id: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM users WHERE id = ? AND role = 'artist'", args: [id] });
}

export async function issueMagicLink(userId: string) {
  await ensureSchema();
  const token = newId("mag");
  const expires = new Date(Date.now() + magicMinutes() * 60_000).toISOString();
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO magic_links (token, user_id, expires_at) VALUES (?, ?, ?)",
    args: [token, userId, expires],
  });
  return token;
}

export async function sendMagicLinkEmail(user: PortalUser, token: string) {
  // Hash fragment: not sent in Referer / server logs of the landing request.
  const link = `${siteBase()}/account/auth/#t=${encodeURIComponent(token)}`;
  const mins = magicMinutes();
  const result = await sendMail({
    to: user.email,
    subject: "Accesso area Corpoceleste",
    text: [
      `Ciao${user.name ? ` ${user.name}` : ""},`,
      "",
      "Usa questo link per entrare nell’area personale Corpoceleste.",
      `È monouso e scade dopo circa ${mins} minuti:`,
      link,
      "",
      "Se non l’hai chiesto tu, ignora questa mail.",
    ].join("\n"),
  });
  return { ok: result.ok, link, error: result.ok ? undefined : result.error };
}

/** Expose magic links in API only for local/dev opt-in — never on Vercel production. */
export function allowDevMagicLinks() {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production" && process.env.PORTAL_DEV_LINKS !== "1") return false;
  return process.env.PORTAL_DEV_LINKS === "1" || process.env.VERCEL_ENV === "development";
}

export type MagicConsumeResult =
  | { ok: true; user: PortalUser }
  | { ok: false; reason: "missing" | "used" | "expired" };

export async function consumeMagicLink(token: string): Promise<MagicConsumeResult> {
  await ensureSchema();
  if (!token) return { ok: false, reason: "missing" };
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT token, user_id, expires_at, used_at FROM magic_links WHERE token = ?",
    args: [token],
  });
  const row = res.rows[0];
  if (!row) return { ok: false, reason: "missing" };
  if (row.used_at) return { ok: false, reason: "used" };
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  await db.execute({
    sql: "UPDATE magic_links SET used_at = datetime('now') WHERE token = ?",
    args: [token],
  });
  const user = await getUserById(String(row.user_id));
  if (!user) return { ok: false, reason: "missing" };
  return { ok: true, user };
}

export async function createSession(userId: string) {
  await ensureSchema();
  const token = newId("ses");
  const expires = new Date(Date.now() + sessionDays() * 86_400_000).toISOString();
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    args: [token, userId, expires],
  });
  return { token, expires_at: expires };
}

export async function sessionUser(token: string | null | undefined) {
  if (!token) return null;
  await ensureSchema();
  await ensureAdmin();
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT u.id, u.email, u.name, u.role, u.artist_slug
          FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > datetime('now')`,
    args: [token],
  });
  return res.rows[0] ? rowToUser(res.rows[0] as Record<string, unknown>) : null;
}

export async function destroySession(token: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] });
}
