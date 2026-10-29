/** Transactional mail from Vercel (Resend). No FormSubmit. */

export type SendMailResult = { ok: true } | { ok: false; error: string };

export function fromAddress() {
  const raw = (process.env.MAIL_FROM || process.env.SHOP_EMAIL || "").trim();
  if (!raw) return "";
  return raw.includes("<") ? raw : `Corpoceleste <${raw}>`;
}

export function siteBase() {
  return (process.env.SITE_URL || "https://www.corpoceleste.eu").replace(/\/$/, "");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wordmark for email header (hosted on the static site so Gmail can fetch it). */
export function emailLogoUrl() {
  return `${siteBase()}/brand/logo-scritta-sm.png`;
}

/** Star mark — same asset family as the site favicon. */
export function emailStarUrl() {
  return `${siteBase()}/brand/logo-stella-256.png`;
}

/** Wrap body HTML with Corpoceleste star + wordmark. */
export function wrapEmailHtml(innerHtml: string) {
  const star = emailStarUrl();
  const word = emailLogoUrl();
  return `<!DOCTYPE html>
<html lang="it">
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;color:#141414;">
    <p style="margin:0 0 28px;">
      <img src="${star}" alt="" width="48" height="48" style="display:block;width:48px;height:48px;border:0;" />
      <img src="${word}" alt="Corpoceleste" width="200" height="18" style="display:block;width:200px;max-width:60%;height:auto;border:0;margin-top:12px;" />
    </p>
    ${innerHtml}
  </div>
</body>
</html>`;
}

/** Plain text → HTML with logo (keeps links as plain text; clients still show the image). */
export function textToEmailHtml(text: string) {
  const body = escapeHtml(text.trim()).replace(/\r\n/g, "\n").replace(/\n/g, "<br>\n");
  return wrapEmailHtml(`<div>${body}</div>`);
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  /** Optional HTML; defaults to text + Corpoceleste logo header. */
  html?: string;
}): Promise<SendMailResult> {
  const key = (process.env.RESEND_API_KEY || "").trim();
  const from = fromAddress();
  const to = opts.to.trim();
  if (!key) {
    console.warn("sendMail skipped: missing RESEND_API_KEY");
    return { ok: false, error: "RESEND_API_KEY mancante su Vercel" };
  }
  if (!from) {
    console.warn("sendMail skipped: missing MAIL_FROM/SHOP_EMAIL");
    return { ok: false, error: "MAIL_FROM o SHOP_EMAIL mancante su Vercel" };
  }
  if (!to) {
    console.warn("sendMail skipped: missing recipient");
    return { ok: false, error: "Destinatario mancante" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html || textToEmailHtml(opts.text),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Resend failed", res.status, body);
      return {
        ok: false,
        error: `Resend ${res.status}: ${body.slice(0, 240) || res.statusText}`,
      };
    }
    console.info("sendMail ok →", to);
    return { ok: true };
  } catch (err) {
    console.error("Resend error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Errore di rete verso Resend",
    };
  }
}

/** True if env looks ready (does not prove domain is verified). */
export function mailConfigured() {
  return Boolean((process.env.RESEND_API_KEY || "").trim() && fromAddress());
}

export function nowRome(locale = "it-IT") {
  return new Date().toLocaleString(locale, { timeZone: "Europe/Rome" });
}
