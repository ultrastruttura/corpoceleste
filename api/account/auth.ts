import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  allowDevMagicLinks,
  createArtistUser,
  createSession,
  destroySession,
  ensureAdmin,
  getUserByEmail,
  issueMagicLink,
  portalAdminEmail,
  sendMagicLinkEmail,
  consumeMagicLink,
  sessionUser,
} from "../../server/portal/auth.js";
import { portalConfigured } from "../../server/portal/db.js";
import { mailConfigured } from "../../server/mail.js";
import { bearer, cors, json, readJson, requireSiteOrigin, requireUser } from "../../server/portal/http.js";
import { clientIp, rateLimit } from "../../server/portal/rate-limit.js";

const LOGIN_MSG =
  "Se l’email è registrata, riceverai un link di accesso. Controlla la posta.";

/** Minimum wall time for production login replies — reduces timing email enumeration. */
const LOGIN_MIN_MS = 900;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function padLoginTiming(started: number) {
  const pad = LOGIN_MIN_MS - (Date.now() - started);
  if (pad > 0) await sleep(pad);
}

/**
 * Auth endpoints for artist portal.
 * POST { action: "login"|"invite"|"verify"|"logout"|"me", ... }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!requireSiteOrigin(req, res)) return;

  try {
    if (!portalConfigured()) {
      return json(res, 503, { error: "Portal DB not configured (TURSO_DATABASE_URL)" });
    }

    await ensureAdmin();

    if (req.method === "GET") {
      const user = await sessionUser(bearer(req));
      return json(res, 200, { user, configured: true });
    }

    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const body = await readJson<{
      action?: string;
      email?: string;
      name?: string;
      artist_slug?: string;
      token?: string;
      replace_session?: string;
    }>(req);
    const action = String(body.action || "");
    const ip = clientIp(req.headers as Record<string, string | string[] | undefined>);

    if (action === "login") {
      const started = Date.now();
      const email = String(body.email || "").trim().toLowerCase();
      const rlIp = await rateLimit({
        key: `login:ip:${ip}`,
        limit: 10,
        windowSeconds: 15 * 60,
      });
      if (!rlIp.ok) {
        await padLoginTiming(started);
        return json(res, 429, {
          error: "Troppi tentativi. Riprova tra poco.",
          retryAfterSec: rlIp.retryAfterSec,
        });
      }
      if (email.includes("@")) {
        const rlEmail = await rateLimit({
          key: `login:email:${email}`,
          limit: 3,
          windowSeconds: 15 * 60,
        });
        if (!rlEmail.ok) {
          await padLoginTiming(started);
          return json(res, 429, {
            error: "Troppi tentativi. Riprova tra poco.",
            retryAfterSec: rlEmail.retryAfterSec,
          });
        }
      }
      let user = email.includes("@") ? await getUserByEmail(email) : null;
      // Production + dev: typing PORTAL_ADMIN_EMAIL must create/find the admin row.
      if (!user && email && email === portalAdminEmail()) {
        user = await ensureAdmin();
      }
      if (!user) {
        console.info(
          "[portal] login: no user for that email; admin env is",
          portalAdminEmail() || "(empty)",
        );
        if (allowDevMagicLinks()) {
          const admin = portalAdminEmail();
          return json(res, 200, {
            ok: true,
            emailed: false,
            message: admin
              ? `Nessun utente per questa email. In locale usa esattamente: ${admin}`
              : "Nessun utente. Imposta PORTAL_ADMIN_EMAIL nel .env e riavvia vercel dev.",
          });
        }
        await padLoginTiming(started);
        // Same copy as success (no enumeration), but emailed:false so UI can stay honest later if needed.
        return json(res, 200, { ok: true, emailed: true, message: LOGIN_MSG });
      }
      // Local/dev only: skip magic link, open session immediately.
      if (allowDevMagicLinks()) {
        const session = await createSession(user.id);
        console.info("[portal] login instant (dev)", user.email);
        return json(res, 200, {
          ok: true,
          emailed: false,
          instant: true,
          user,
          session: session.token,
          expires_at: session.expires_at,
          message: "Accesso locale (dev): sessione aperta.",
        });
      }
      const token = await issueMagicLink(user.id);
      const sent = await sendMagicLinkEmail(user, token);
      if (!sent.ok) {
        console.warn("[portal] magic link email failed for", user.email, sent.error);
        await padLoginTiming(started);
        return json(res, 200, {
          ok: true,
          emailed: false,
          message: `Invio mail fallito: ${sent.error || "controlla RESEND_API_KEY e MAIL_FROM su Vercel (Production)."}`,
        });
      }
      console.info("[portal] magic link emailed to", user.email, "role", user.role);
      await padLoginTiming(started);
      return json(res, 200, { ok: true, emailed: true, message: LOGIN_MSG });
    }

    if (action === "invite") {
      const admin = await requireUser(req, res, "admin");
      if (!admin) return;
      const rl = await rateLimit({
        key: `invite:${admin.id}`,
        limit: 20,
        windowSeconds: 60 * 60,
      });
      if (!rl.ok) {
        return json(res, 429, { error: "Troppi inviti. Riprova più tardi." });
      }
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const artist_slug = String(body.artist_slug || "").trim() || undefined;
      if (!name) return json(res, 400, { error: "Nome artista obbligatorio" });
      if (!email.includes("@")) return json(res, 400, { error: "Email non valida" });
      const user = await createArtistUser({ email, name, artist_slug });
      if (user.role !== "artist") {
        return json(res, 400, {
          error: `L’utente ${user.email} non è artista (ruolo: ${user.role}). Controlla PORTAL_ADMIN_EMAIL su Vercel.`,
        });
      }
      const token = await issueMagicLink(user.id);
      const sent = await sendMagicLinkEmail(user, token, { kind: "invite" });
      console.info("[portal] invite →", user.email, user.name, user.role, sent.ok ? "mailed" : "mail-failed");
      const payload: Record<string, unknown> = {
        ok: true,
        user,
        emailed: sent.ok,
        message: sent.ok
          ? `Invito artista inviato a ${user.name} <${user.email}>. Controlla che nome e mail siano quelli dell’artista (non admin).`
          : `Utente creato, ma email non inviata. ${sent.error || "Controlla RESEND_API_KEY e MAIL_FROM su Vercel."}`,
      };
      if (!sent.ok && allowDevMagicLinks()) {
        console.info("[portal] invite magic link (dev only)", sent.link);
        payload.devLink = sent.link;
      }
      if (!sent.ok) console.warn("[portal] invite email failed", user.email, sent.error);
      return json(res, 200, payload);
    }

    if (action === "verify") {
      const rl = await rateLimit({
        key: `verify:${ip}`,
        limit: 30,
        windowSeconds: 15 * 60,
      });
      if (!rl.ok) {
        return json(res, 429, {
          error: "Troppi tentativi. Riprova tra poco.",
          retryAfterSec: rl.retryAfterSec,
        });
      }
      const token = String(body.token || "").trim();
      const consumed = await consumeMagicLink(token);
      if (consumed.ok === false) {
        const reason = consumed.reason;
        const error =
          reason === "used"
            ? "Questo link è già stato usato. Torna all’area personale e richiedi un nuovo accesso."
            : reason === "expired"
              ? "Questo link è scaduto. Torna all’area personale e richiedi un nuovo accesso."
              : "Link non valido. Torna all’area personale e richiedi un nuovo accesso.";
        return json(res, 400, { error, reason });
      }
      // If another user was logged in on this browser, kill that session so
      // opening an artist invite never leaves you as admin in other tabs.
      const prev = String(body.replace_session || bearer(req) || "").trim();
      if (prev) await destroySession(prev);
      const session = await createSession(consumed.user.id);
      return json(res, 200, {
        ok: true,
        user: consumed.user,
        session: session.token,
        expires_at: session.expires_at,
      });
    }

    if (action === "logout") {
      const t = bearer(req);
      if (t) await destroySession(t);
      return json(res, 200, { ok: true });
    }

    if (action === "me") {
      const user = await sessionUser(bearer(req));
      return json(res, user ? 200 : 401, {
        user,
        mailConfigured: user?.role === "admin" ? mailConfigured() : undefined,
        // So admin can verify Production env without guessing.
        portalAdminEmail: user?.role === "admin" ? portalAdminEmail() || null : undefined,
      });
    }

    return json(res, 400, { error: "Unknown action" });
  } catch (err) {
    console.error("account auth", err);
    cors(req, res);
    return json(res, 500, { error: "Server error" });
  }
}
