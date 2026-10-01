import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  allowDevMagicLinks,
  createArtistUser,
  createSession,
  destroySession,
  ensureAdmin,
  getUserByEmail,
  issueMagicLink,
  sendMagicLinkEmail,
  consumeMagicLink,
  sessionUser,
} from "../../server/portal/auth.js";
import { portalConfigured } from "../../server/portal/db.js";
import { mailConfigured } from "../../server/mail.js";
import { bearer, cors, json, readJson, requireUser } from "../../server/portal/http.js";
import { clientIp, rateLimit } from "../../server/portal/rate-limit.js";

const LOGIN_MSG =
  "Se l’email è registrata, riceverai un link di accesso. Controlla la posta.";

/**
 * Auth endpoints for artist portal.
 * POST { action: "login"|"invite"|"verify"|"logout"|"me", ... }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

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
    }>(req);
    const action = String(body.action || "");
    const ip = clientIp(req.headers as Record<string, string | string[] | undefined>);

    if (action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const rl = await rateLimit({
        key: `login:${ip}:${email || "none"}`,
        limit: 5,
        windowSeconds: 15 * 60,
      });
      if (!rl.ok) {
        return json(res, 429, {
          error: "Troppi tentativi. Riprova tra poco.",
          retryAfterSec: rl.retryAfterSec,
        });
      }
      const user = email.includes("@") ? await getUserByEmail(email) : null;
      if (!user) {
        console.info("[portal] login: no user for that email");
        return json(res, 200, { ok: true, message: LOGIN_MSG });
      }
      const token = await issueMagicLink(user.id);
      const sent = await sendMagicLinkEmail(user, token);
      if (!sent.ok && allowDevMagicLinks()) {
        console.info("[portal] magic link (dev only)", sent.link);
        return json(res, 200, { ok: true, message: LOGIN_MSG, emailed: false, devLink: sent.link });
      }
      if (!sent.ok) {
        console.warn("[portal] magic link email failed for", user.email, sent.error);
        return json(res, 200, {
          ok: true,
          emailed: false,
          message: `Non siamo riusciti a inviare l’email di accesso. ${sent.error || "Controlla Resend su Vercel."}`,
        });
      }
      console.info("[portal] magic link emailed to", user.email);
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
      const user = await createArtistUser({ email, name, artist_slug });
      const token = await issueMagicLink(user.id);
      const sent = await sendMagicLinkEmail(user, token);
      const payload: Record<string, unknown> = {
        ok: true,
        user,
        emailed: sent.ok,
        message: sent.ok
          ? "Invito inviato."
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
        return json(res, 429, { error: "Troppi tentativi. Riprova tra poco." });
      }
      const token = String(body.token || "").trim();
      const user = await consumeMagicLink(token);
      if (!user) return json(res, 400, { error: "Link non valido o scaduto" });
      const session = await createSession(user.id);
      return json(res, 200, {
        ok: true,
        user,
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
      });
    }

    return json(res, 400, { error: "Unknown action" });
  } catch (err) {
    console.error("account auth", err);
    cors(req, res);
    return json(res, 500, { error: err instanceof Error ? err.message : "Server error" });
  }
}
