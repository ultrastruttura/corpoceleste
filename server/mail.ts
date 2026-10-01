/** Transactional mail from Vercel (Resend). No FormSubmit. */

export type SendMailResult = { ok: true } | { ok: false; error: string };

function fromAddress() {
  const raw = (process.env.MAIL_FROM || process.env.SHOP_EMAIL || "").trim();
  if (!raw) return "";
  return raw.includes("<") ? raw : `Corpoceleste <${raw}>`;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
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

export function siteBase() {
  return (process.env.SITE_URL || "https://ultrastruttura.github.io/corpoceleste").replace(/\/$/, "");
}

export function nowRome(locale = "it-IT") {
  return new Date().toLocaleString(locale, { timeZone: "Europe/Rome" });
}
