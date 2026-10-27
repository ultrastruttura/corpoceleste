import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  listNewsletterSubscribers,
  syncAllNewsletterToResend,
} from "../../server/newsletter.js";
import { marketingConfigured, sendNewsletterBroadcast } from "../../server/resend-marketing.js";
import { json, readJson, requireUser } from "../../server/portal/http.js";

/** Admin: list subscribers, sync to Resend, send broadcast. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireUser(req, res, "admin");
  if (!admin) return;

  try {
    if (req.method === "GET") {
      const include = String(req.query.include || "") === "all";
      const subscribers = await listNewsletterSubscribers({ includeUnsubscribed: include });
      return json(res, 200, {
        subscribers,
        activeCount: subscribers.filter((s) => !s.unsubscribed_at).length,
        marketingConfigured: marketingConfigured(),
      });
    }

    if (req.method === "POST") {
      const body = await readJson<{
        action?: string;
        subject?: string;
        text?: string;
        name?: string;
      }>(req);
      const action = String(body.action || "send").trim();

      if (action === "sync") {
        const result = await syncAllNewsletterToResend();
        if (!result.ok) return json(res, 400, { error: result.error });
        return json(res, 200, result);
      }

      if (action === "send") {
        const result = await sendNewsletterBroadcast({
          subject: String(body.subject || ""),
          text: String(body.text || ""),
          name: body.name ? String(body.name) : undefined,
        });
        if (!result.ok) return json(res, 400, { error: result.error });
        return json(res, 200, result);
      }

      return json(res, 400, { error: "Unknown action" });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("account newsletter", err);
    return json(res, 500, { error: "Server error" });
  }
}
