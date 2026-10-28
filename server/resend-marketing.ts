/** Resend Contacts + Broadcasts (newsletter marketing). */

import { fromAddress, wrapEmailHtml } from "./mail.js";

function apiKey() {
  return (process.env.RESEND_API_KEY || "").trim();
}

export function newsletterSegmentId() {
  return (process.env.RESEND_NEWSLETTER_SEGMENT_ID || "").trim();
}

export function marketingConfigured() {
  return Boolean(apiKey() && newsletterSegmentId() && fromAddress());
}

async function resendFetch(path: string, init?: RequestInit) {
  const key = apiKey();
  if (!key) return { ok: false as const, status: 0, body: "RESEND_API_KEY mancante" };
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { ok: res.ok, status: res.status, body: text, json };
}

/** Create or update contact and attach to the newsletter segment. */
export async function upsertNewsletterContact(
  email: string,
  opts?: { resubscribe?: boolean },
) {
  const segmentId = newsletterSegmentId();
  if (!apiKey()) return { ok: false as const, error: "RESEND_API_KEY mancante" };
  if (!segmentId) return { ok: false as const, error: "RESEND_NEWSLETTER_SEGMENT_ID mancante" };

  const normalized = email.toLowerCase().trim();
  const resubscribe = Boolean(opts?.resubscribe);
  const create = await resendFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email: normalized,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    }),
  });

  if (create.ok) {
    const id =
      create.json && typeof create.json === "object" && "id" in create.json
        ? String((create.json as { id: string }).id)
        : "";
    return { ok: true as const, contactId: id };
  }

  // Already exists → segment (+ optional clear unsubscribe after new double opt-in).
  if (create.status === 409) {
    if (resubscribe) {
      const patch = await resendFetch(`/contacts/${encodeURIComponent(normalized)}`, {
        method: "PATCH",
        body: JSON.stringify({ unsubscribed: false }),
      });
      if (!patch.ok) {
        return {
          ok: false as const,
          error: `Resend update ${patch.status}: ${patch.body.slice(0, 200)}`,
        };
      }
    }
    const addSeg = await resendFetch(
      `/contacts/${encodeURIComponent(normalized)}/segments/${encodeURIComponent(segmentId)}`,
      { method: "POST" },
    );
    // 409 = already in segment — fine
    if (!addSeg.ok && addSeg.status !== 409) {
      return {
        ok: false as const,
        error: `Resend segment ${addSeg.status}: ${addSeg.body.slice(0, 200)}`,
      };
    }
    return { ok: true as const, contactId: "" };
  }

  return {
    ok: false as const,
    error: `Resend create ${create.status}: ${create.body.slice(0, 200)}`,
  };
}

export async function unsubscribeResendContact(email: string) {
  if (!apiKey()) return { ok: false as const, error: "RESEND_API_KEY mancante" };
  const normalized = email.toLowerCase().trim();
  const patch = await resendFetch(`/contacts/${encodeURIComponent(normalized)}`, {
    method: "PATCH",
    body: JSON.stringify({ unsubscribed: true }),
  });
  if (patch.ok || patch.status === 404) return { ok: true as const };
  return {
    ok: false as const,
    error: `Resend unsub ${patch.status}: ${patch.body.slice(0, 200)}`,
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text → simple HTML paragraphs + Resend unsubscribe placeholder. */
export function newsletterBodyToHtml(text: string) {
  const blocks = text
    .trim()
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const paras = blocks
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return wrapEmailHtml(`${paras}
<p style="margin-top:2em;font-size:12px;color:#666">
<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe / Disiscriviti</a>
</p>`);
}

export async function sendNewsletterBroadcast(opts: {
  subject: string;
  text: string;
  name?: string;
}) {
  const segmentId = newsletterSegmentId();
  const from = fromAddress();
  if (!apiKey()) return { ok: false as const, error: "RESEND_API_KEY mancante" };
  if (!segmentId) return { ok: false as const, error: "RESEND_NEWSLETTER_SEGMENT_ID mancante" };
  if (!from) return { ok: false as const, error: "MAIL_FROM o SHOP_EMAIL mancante" };

  const subject = opts.subject.trim();
  const text = opts.text.trim();
  if (!subject || !text) return { ok: false as const, error: "Oggetto e testo obbligatori" };

  const html = newsletterBodyToHtml(text);
  const plain = `${text}\n\n—\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`;

  const created = await resendFetch("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      segment_id: segmentId,
      from,
      subject,
      html,
      text: plain,
      name: (opts.name || subject).slice(0, 120),
      send: true,
    }),
  });

  if (!created.ok) {
    return {
      ok: false as const,
      error: `Resend broadcast ${created.status}: ${created.body.slice(0, 280)}`,
    };
  }

  const id =
    created.json && typeof created.json === "object" && "id" in created.json
      ? String((created.json as { id: string }).id)
      : "";
  return { ok: true as const, broadcastId: id };
}
