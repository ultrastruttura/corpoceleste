import { ensureSchema, getDb, newId } from "./db.js";
import { sendMail, siteBase } from "../mail.js";

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "artist";
  artist_slug: string | null;
};

/**
 * Only PORTAL_ADMIN_EMAIL becomes admin — never SHOP_EMAIL (shared inbox ≠ portal admin).
 */
export function portalAdminEmail() {
  return (process.env.PORTAL_ADMIN_EMAIL || "").trim().toLowerCase();
}

function portalAdminName() {
  return (process.env.PORTAL_ADMIN_NAME || "Andrea Baldelli").trim();
}

function sessionDays() {
  return Number(process.env.PORTAL_SESSION_DAYS || 14);
}

function magicMinutes() {
  return Number(process.env.PORTAL_MAGIC_MINUTES || 30);
}

/** Warm-instance cache — avoid UPDATE users on every API hit. */
let cachedAdmin: PortalUser | null = null;
let adminEnsuredFor = "";

export async function ensureAdmin() {
  await ensureSchema();
  const email = portalAdminEmail();
  if (!email) return null;
  if (adminEnsuredFor === email && cachedAdmin) return cachedAdmin;
  const db = getDb();
  const adminName = portalAdminName();
  const existing = await db.execute({
    sql: "SELECT id, email, name, role, artist_slug FROM users WHERE email = ?",
    args: [email],
  });
  let admin: PortalUser;
  if (existing.rows[0]) {
    const row = existing.rows[0];
    const id = String(row.id);
    const alreadyOk =
      String(row.role) === "admin" && String(row.name || "") === adminName;
    if (!alreadyOk) {
      await db.execute({
        sql: "UPDATE users SET role = 'admin', name = ? WHERE id = ?",
        args: [adminName, id],
      });
    }
    admin = {
      id,
      email,
      name: adminName,
      role: "admin",
      artist_slug: row.artist_slug ? String(row.artist_slug) : null,
    };
  } else {
    const id = newId("usr");
    await db.execute({
      sql: "INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, 'admin')",
      args: [id, email, adminName],
    });
    admin = { id, email, name: adminName, role: "admin", artist_slug: null };
  }
  // Single admin: anyone else previously promoted (e.g. via old SHOP_EMAIL fallback) becomes artist.
  await db.execute({
    sql: "UPDATE users SET role = 'artist' WHERE role = 'admin' AND email != ?",
    args: [email],
  });
  adminEnsuredFor = email;
  cachedAdmin = admin;
  return admin;
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
  await ensureAdmin();
  const email = opts.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Invalid email");
  if (email === portalAdminEmail()) {
    throw new Error(
      `Questa email è l’admin del portal (${email}). Usa un’altra email per l’artista, oppure cambia PORTAL_ADMIN_EMAIL su Vercel.`,
    );
  }
  const existing = await getUserByEmail(email);
  if (existing) {
    if (existing.role === "admin") {
      throw new Error(
        `Questa email è ancora admin in database. Controlla PORTAL_ADMIN_EMAIL su Vercel (Production) e fai Redeploy.`,
      );
    }
    const db = getDb();
    await db.execute({
      sql: "UPDATE users SET name = ?, role = 'artist', artist_slug = COALESCE(?, artist_slug) WHERE id = ?",
      args: [opts.name.trim() || existing.name, opts.artist_slug?.trim() || null, existing.id],
    });
    const updated = (await getUserById(existing.id))!;
    if (updated.role !== "artist") throw new Error("Impossibile creare artista per questa email");
    return updated;
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

export async function sendMagicLinkEmail(
  user: PortalUser,
  token: string,
  opts?: { kind?: "login" | "invite" },
) {
  // Hash fragment: not sent in Referer / server logs of the landing request.
  const link = `${siteBase()}/account/auth/#t=${encodeURIComponent(token)}`;
  const mins = magicMinutes();
  const isInvite = opts?.kind === "invite";
  const isArtist = user.role === "artist" || isInvite;
  const subject = isInvite
    ? "Invito area personale artista — Corpoceleste"
    : isArtist
      ? "Accesso area personale artista — Corpoceleste"
      : "Accesso area Corpoceleste";
  const areaLine = isInvite
    ? `Sei stato invitato come artista su Corpoceleste (${user.email}). Usa questo link per entrare nell’area personale artista:`
    : isArtist
      ? "Usa questo link per entrare nell’area personale artista Corpoceleste."
      : "Usa questo link per entrare nell’area personale Corpoceleste.";
  const result = await sendMail({
    to: user.email,
    subject,
    text: [
      `Ciao${user.name ? ` ${user.name}` : ""},`,
      "",
      areaLine,
      `È monouso e scade dopo circa ${mins} minuti:`,
      link,
      "",
      "Se non l’hai chiesto tu, ignora questa mail.",
    ].join("\n"),
  });
  return { ok: result.ok, link, error: result.ok === false ? result.error : undefined };
}

/** Instant/dev magic links only on local/dev — never Vercel production or preview. */
export function allowDevMagicLinks() {
  const vercel = process.env.VERCEL_ENV || "";
  if (vercel === "production" || vercel === "preview") return false;
  return process.env.PORTAL_DEV_LINKS === "1" || vercel === "development";
}

export type MagicConsumeResult =
  | { ok: true; user: PortalUser }
  | { ok: false; reason: "missing" | "used" | "expired" };

export async function consumeMagicLink(token: string): Promise<MagicConsumeResult> {
  await ensureSchema();
  if (!token) return { ok: false, reason: "missing" };
  const db = getDb();
  const claim = await db.execute({
    sql: `UPDATE magic_links
          SET used_at = datetime('now')
          WHERE token = ?
            AND used_at IS NULL
            AND expires_at > datetime('now')`,
    args: [token],
  });
  if (Number(claim.rowsAffected ?? 0) === 0) {
    const res = await db.execute({
      sql: "SELECT used_at, expires_at FROM magic_links WHERE token = ?",
      args: [token],
    });
    const row = res.rows[0];
    if (!row) return { ok: false, reason: "missing" };
    if (row.used_at) return { ok: false, reason: "used" };
    return { ok: false, reason: "expired" };
  }
  const res = await db.execute({
    sql: "SELECT user_id FROM magic_links WHERE token = ?",
    args: [token],
  });
  const userId = res.rows[0] ? String(res.rows[0].user_id) : "";
  const user = userId ? await getUserById(userId) : null;
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
